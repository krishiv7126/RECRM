'use server'

import { randomInt, randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  graph,
  listApprovedTemplates,
  normalizeWhatsAppNumber,
  requireEnv,
  sendWhatsAppMedia,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  type WhatsAppTemplate,
} from '@/lib/whatsapp/client'
import {
  findOrCreateWhatsAppConversation,
  getAccountById,
  getConnectedAccountForUser,
  getSender,
} from '@/lib/whatsapp/accounts'

type Result<T = object> = ({ ok: true; message?: string } & T) | { ok: false; message: string }

async function getCaller() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase
    .from('platform_users')
    .select('id, org_id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()
  if (!me?.org_id) return null
  return { supabase, me: me as typeof me & { org_id: string } }
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

// ---------------------------------------------------------------------------
// Connect / disconnect (Meta Embedded Signup)
// ---------------------------------------------------------------------------

/**
 * Finishes Embedded Signup for the signed-in user. The browser hands over the
 * one-time `code` from FB.login plus the WABA / phone number IDs from the
 * signup popup's message event; the code is swapped for a business token here
 * so the token never touches the browser.
 */
export async function completeWhatsAppSignup(input: {
  code: string
  wabaId: string
  phoneNumberId: string
  coexistence: boolean
}): Promise<Result<{ displayPhoneNumber: string | null }>> {
  const caller = await getCaller()
  if (!caller) return { ok: false, message: 'Not signed in.' }
  const { me } = caller
  if (me.role === 'receptionist') return { ok: false, message: 'Your role cannot connect WhatsApp.' }

  const admin = createAdminClient()

  try {
    const appId = requireEnv('NEXT_PUBLIC_META_APP_ID')
    const appSecret = requireEnv('META_APP_SECRET')

    const tokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?${new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code: input.code,
      })}`,
      { cache: 'no-store' },
    )
    const tokenData = await tokenRes.json().catch(() => null)
    if (!tokenRes.ok || !tokenData?.access_token) {
      throw new Error(tokenData?.error?.message ?? 'Meta did not return an access token.')
    }
    const accessToken: string = tokenData.access_token

    // Receive this WABA's messages/status webhooks on our app.
    await graph(`${input.wabaId}/subscribed_apps`, accessToken, { method: 'POST' })

    // A brand-new API number has to be registered before it can send. A
    // number onboarded from the WhatsApp Business app (coexistence) is
    // already live and must not be re-registered.
    let pin: string | null = null
    if (!input.coexistence) {
      pin = String(randomInt(100000, 1000000))
      try {
        await graph(`${input.phoneNumberId}/register`, accessToken, {
          method: 'POST',
          body: { messaging_product: 'whatsapp', pin },
        })
      } catch (err) {
        const msg = errorMessage(err, '')
        if (!/already registered/i.test(msg)) throw err
        pin = null
      }
    }

    const info = await graph<{ display_phone_number?: string; verified_name?: string; quality_rating?: string }>(
      `${input.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      accessToken,
    )

    // A number can only belong to one person; free this user's old slot first.
    await admin
      .from('whatsapp_accounts')
      .update({ status: 'disconnected' })
      .eq('platform_user_id', me.id)
      .eq('status', 'connected')
      .neq('phone_number_id', input.phoneNumberId)

    const { data: account, error } = await admin
      .from('whatsapp_accounts')
      .upsert(
        {
          org_id: me.org_id,
          platform_user_id: me.id,
          waba_id: input.wabaId,
          phone_number_id: input.phoneNumberId,
          display_phone_number: info.display_phone_number ?? null,
          verified_name: info.verified_name ?? null,
          quality_rating: info.quality_rating ?? null,
          is_coexistence: input.coexistence,
          status: 'connected',
          last_error: null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number_id' },
      )
      .select('id')
      .single()
    if (error || !account) throw new Error(error?.message ?? 'Could not save the WhatsApp account.')

    const { error: secretErr } = await admin
      .from('whatsapp_account_secrets')
      .upsert({ account_id: account.id, access_token: accessToken, registration_pin: pin, updated_at: new Date().toISOString() })
    if (secretErr) throw new Error(secretErr.message)

    revalidatePath('/settings')
    revalidatePath('/whatsapp')
    return {
      ok: true,
      displayPhoneNumber: info.display_phone_number ?? null,
      message: `Connected ${info.display_phone_number ?? 'your number'}${info.verified_name ? ` (${info.verified_name})` : ''}.`,
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err, 'Could not connect WhatsApp.') }
  }
}

/** Users disconnect their own number; admins can disconnect anyone's in the org. */
export async function disconnectWhatsAppAccount(accountId: string): Promise<Result> {
  const caller = await getCaller()
  if (!caller) return { ok: false, message: 'Not signed in.' }
  const { me } = caller

  const admin = createAdminClient()
  const account = await getAccountById(admin, accountId)
  if (!account || account.org_id !== me.org_id) return { ok: false, message: 'WhatsApp account not found.' }

  const isAdmin = me.role === 'admin' || me.role === 'super_admin'
  if (account.platform_user_id !== me.id && !isAdmin) {
    return { ok: false, message: 'Only an admin can disconnect someone else’s number.' }
  }

  const { error } = await admin.from('whatsapp_accounts').update({ status: 'disconnected' }).eq('id', accountId)
  if (error) return { ok: false, message: error.message }
  await admin.from('whatsapp_account_secrets').delete().eq('account_id', accountId)

  revalidatePath('/settings')
  revalidatePath('/whatsapp')
  return { ok: true, message: 'WhatsApp disconnected.' }
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

/**
 * Opens (or creates) the chat between the caller's connected number and a
 * phone number, e.g. from a lead or member page.
 */
export async function openWhatsAppChat(input: {
  phone: string
  leadId?: string | null
  customerId?: string | null
  name?: string | null
}): Promise<Result<{ conversationId: string }> | { ok: false; message: string; notConnected: true }> {
  const caller = await getCaller()
  if (!caller) return { ok: false, message: 'Not signed in.' }

  const admin = createAdminClient()
  const account = await getConnectedAccountForUser(admin, caller.me.id)
  if (!account) {
    return { ok: false, notConnected: true, message: 'Connect your WhatsApp number in Settings → WhatsApp first.' }
  }

  const phone = normalizeWhatsAppNumber(input.phone)
  if (phone.length < 10) return { ok: false, message: 'This phone number looks invalid.' }

  // The lead/member must be one the caller can see.
  if (input.leadId) {
    const { data } = await caller.supabase.from('leads').select('id').eq('id', input.leadId).maybeSingle()
    if (!data) return { ok: false, message: 'Lead not found.' }
  }
  if (input.customerId) {
    const { data } = await caller.supabase.from('customers').select('id').eq('id', input.customerId).maybeSingle()
    if (!data) return { ok: false, message: 'Member not found.' }
  }

  const conversationId = await findOrCreateWhatsAppConversation(admin, account, phone, {
    profileName: input.name,
    leadId: input.leadId,
    customerId: input.customerId,
  })
  if (!conversationId) return { ok: false, message: 'Could not open the chat.' }
  return { ok: true, conversationId }
}

/** Loads the conversation (RLS-checked for the caller) and the number it belongs to. */
async function loadChat(conversationId: string) {
  const caller = await getCaller()
  if (!caller) throw new Error('Not signed in.')

  const { data: convo } = await caller.supabase
    .from('conversations')
    .select('id, org_id, channel, external_identifier, whatsapp_account_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (!convo || convo.channel !== 'whatsapp' || !convo.external_identifier) throw new Error('Chat not found.')
  if (!convo.whatsapp_account_id) throw new Error('This chat is not linked to a WhatsApp number.')

  const admin = createAdminClient()
  const account = await getAccountById(admin, convo.whatsapp_account_id)
  if (!account || account.status !== 'connected') {
    throw new Error('The WhatsApp number for this chat is disconnected. Reconnect it in Settings → WhatsApp.')
  }
  const sender = await getSender(admin, account)
  return { caller, admin, convo: convo as typeof convo & { external_identifier: string }, sender }
}

async function recordOutbound(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    conversationId: string
    orgId: string
    senderId: string
    content: string | null
    mediaUrl?: string | null
    externalId: string | undefined
  },
) {
  const now = new Date().toISOString()
  const { data } = await admin
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      org_id: input.orgId,
      direction: 'outbound',
      channel: 'whatsapp',
      sender_platform_user_id: input.senderId,
      content: input.content,
      media_url: input.mediaUrl ?? null,
      external_message_id: input.externalId ?? null,
      status: 'sent',
    })
    .select('id, conversation_id, direction, content, media_url, status, created_at, sender_platform_user_id')
    .single()
  await admin.from('conversations').update({ last_message_at: now, status: 'open' }).eq('id', input.conversationId)
  return data
}

/** Free-form reply — only allowed inside the 24h customer service window. */
export async function sendWhatsAppChatMessage(conversationId: string, text: string) {
  const body = text.trim()
  if (!body) return { ok: false as const, message: 'Message is empty.' }
  try {
    const { caller, admin, convo, sender } = await loadChat(conversationId)
    const { messageId } = await sendWhatsAppText(sender, convo.external_identifier, body)
    const message = await recordOutbound(admin, {
      conversationId,
      orgId: convo.org_id,
      senderId: caller.me.id,
      content: body,
      externalId: messageId,
    })
    return { ok: true as const, message }
  } catch (err) {
    return { ok: false as const, message: errorMessage(err, 'Send failed.') }
  }
}

/**
 * Sends a file the browser already uploaded to the private documents bucket
 * (same place Inbox attachments live), so the message keeps a copy.
 */
export async function sendWhatsAppChatMedia(conversationId: string, storagePath: string, caption?: string) {
  try {
    const { caller, admin, convo, sender } = await loadChat(conversationId)
    if (!storagePath.startsWith(`${convo.org_id}/`)) throw new Error('Invalid attachment.')

    const { data: file, error } = await admin.storage.from('documents').download(storagePath)
    if (error || !file) throw new Error('Could not read the attachment.')
    const fileName = (storagePath.split('/').pop() ?? 'file').replace(/^[0-9a-f-]{36}-/, '')

    const { messageId } = await sendWhatsAppMedia(sender, convo.external_identifier, file, fileName, caption?.trim() || undefined)
    const message = await recordOutbound(admin, {
      conversationId,
      orgId: convo.org_id,
      senderId: caller.me.id,
      content: caption?.trim() || null,
      mediaUrl: storagePath,
      externalId: messageId,
    })
    return { ok: true as const, message }
  } catch (err) {
    return { ok: false as const, message: errorMessage(err, 'Send failed.') }
  }
}

/**
 * Approved template — the only way to message someone outside the 24h
 * window (or for the first time). Business-initiated, so it costs 1 credit.
 */
export async function sendWhatsAppChatTemplate(
  conversationId: string,
  template: { name: string; language: string; body: string; params: string[] },
) {
  try {
    const { caller, admin, convo, sender } = await loadChat(conversationId)

    // The reference ties a possible refund to exactly this charge.
    const chargeRef = randomUUID()
    const { error: chargeErr } = await caller.supabase.rpc('wallet_charge_whatsapp', { p_messages: 1, p_campaign_id: chargeRef })
    if (chargeErr) {
      throw new Error(
        chargeErr.message.includes('Not enough')
          ? 'Not enough WhatsApp credits. Ask your platform admin to top up the wallet.'
          : chargeErr.message,
      )
    }

    let messageId: string | undefined
    try {
      ;({ messageId } = await sendWhatsAppTemplate(sender, convo.external_identifier, template.name, template.language, template.params))
    } catch (err) {
      await caller.supabase.rpc('wallet_refund_whatsapp', { p_messages: 1, p_campaign_id: chargeRef })
      throw err
    }

    const rendered = template.params.reduce(
      (text, value, i) => text.replace(new RegExp(`\\{\\{\\s*${i + 1}\\s*\\}\\}`, 'g'), value),
      template.body || `[Template: ${template.name}]`,
    )
    const message = await recordOutbound(admin, {
      conversationId,
      orgId: convo.org_id,
      senderId: caller.me.id,
      content: rendered,
      externalId: messageId,
    })
    return { ok: true as const, message }
  } catch (err) {
    return { ok: false as const, message: errorMessage(err, 'Send failed.') }
  }
}

/** Approved templates on a chat's number, or on the caller's own number. */
export async function getWhatsAppTemplates(conversationId?: string): Promise<Result<{ templates: WhatsAppTemplate[] }>> {
  try {
    let sender
    if (conversationId) {
      ;({ sender } = await loadChat(conversationId))
    } else {
      const caller = await getCaller()
      if (!caller) throw new Error('Not signed in.')
      const admin = createAdminClient()
      const account = await getConnectedAccountForUser(admin, caller.me.id)
      if (!account) throw new Error('Connect your WhatsApp number in Settings → WhatsApp first.')
      sender = await getSender(admin, account)
    }
    return { ok: true, templates: await listApprovedTemplates(sender) }
  } catch (err) {
    return { ok: false, message: errorMessage(err, 'Could not load templates.') }
  }
}

// ---------------------------------------------------------------------------
// Broadcast campaigns
// ---------------------------------------------------------------------------

interface CampaignRecipient {
  id: string
  name: string
  phone: string | null
}

function personalize(message: string, name: string) {
  return message.replace(/\{\{\s*name\s*\}\}/gi, name)
}

/** Sends a saved campaign from the caller's own connected number. */
export async function sendCampaign(campaignId: string): Promise<{ ok: boolean; message: string }> {
  const caller = await getCaller()
  if (!caller) return { ok: false, message: 'Not signed in.' }
  const { supabase, me } = caller

  const { data: campaign, error: fetchErr } = await supabase
    .from('whatsapp_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()
  if (fetchErr || !campaign) return { ok: false, message: 'Campaign not found.' }
  if (campaign.status === 'sent') return { ok: false, message: 'This campaign was already sent.' }

  const admin = createAdminClient()
  const account = await getConnectedAccountForUser(admin, me.id)
  if (!account) return { ok: false, message: 'Connect your WhatsApp number in Settings → WhatsApp before sending.' }
  let sender
  try {
    sender = await getSender(admin, account)
  } catch (err) {
    return { ok: false, message: errorMessage(err, 'Reconnect your WhatsApp number.') }
  }

  const recipients = ((campaign.recipients as unknown as CampaignRecipient[]) ?? []).filter((r) => r.phone)
  if (recipients.length === 0) return { ok: false, message: 'No recipients with a phone number.' }

  // Reserve credits for every recipient up front; failed sends are refunded
  // below. The DB refuses the charge if the wallet can't cover it.
  const { error: chargeErr } = await supabase.rpc('wallet_charge_whatsapp', {
    p_messages: recipients.length,
    p_campaign_id: campaignId,
  })
  if (chargeErr) {
    return {
      ok: false,
      message: chargeErr.message.includes('Not enough')
        ? `Not enough WhatsApp credits for ${recipients.length} messages. Ask your platform admin to top up the wallet.`
        : chargeErr.message,
    }
  }

  const templateParams = (campaign.template_params as string[] | null) ?? []
  let sent = 0
  let failed = 0
  let lastError: string | null = null

  for (const r of recipients) {
    const phone = normalizeWhatsAppNumber(r.phone ?? '')
    if (phone.length < 10) {
      failed++
      continue
    }

    try {
      const params = templateParams.map((p) => personalize(p, r.name))
      const text = campaign.template_name
        ? params.reduce(
            (t, value, i) => t.replace(new RegExp(`\\{\\{\\s*${i + 1}\\s*\\}\\}`, 'g'), value),
            personalize(campaign.message, r.name),
          )
        : personalize(campaign.message, r.name)
      const result = campaign.template_name
        ? await sendWhatsAppTemplate(sender, phone, campaign.template_name, campaign.template_language ?? 'en_US', params)
        : await sendWhatsAppText(sender, phone, text)
      sent++

      // Log it in the sender's WhatsApp chats like any other message.
      const conversationId = await findOrCreateWhatsAppConversation(admin, account, phone, {
        profileName: r.name,
        leadId: campaign.audience_type === 'leads' ? r.id : null,
        customerId: campaign.audience_type === 'customers' ? r.id : null,
      })
      if (conversationId) {
        await recordOutbound(admin, {
          conversationId,
          orgId: campaign.org_id,
          senderId: me.id,
          content: text,
          externalId: result.messageId,
        })
      }
    } catch (err) {
      failed++
      lastError = errorMessage(err, 'Send failed.')
    }
  }

  if (failed > 0) {
    await supabase.rpc('wallet_refund_whatsapp', { p_messages: failed, p_campaign_id: campaignId })
  }

  const status = failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial'
  // whatsapp_campaigns has no client UPDATE policy; the row was RLS-checked above.
  await admin
    .from('whatsapp_campaigns')
    .update({
      status,
      sent_count: sent,
      failed_count: failed,
      last_error: lastError,
      sent_at: new Date().toISOString(),
      whatsapp_account_id: account.id,
    })
    .eq('id', campaignId)

  revalidatePath('/whatsapp-broadcast')

  if (sent === 0) return { ok: false, message: lastError ?? 'All sends failed.' }
  if (failed > 0) return { ok: true, message: `Sent to ${sent}, ${failed} failed. Last error: ${lastError}` }
  return { ok: true, message: `Sent to all ${sent} recipients.` }
}
