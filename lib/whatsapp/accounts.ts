import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeWhatsAppNumber, type WhatsAppSender } from "@/lib/whatsapp/client"

type Admin = ReturnType<typeof createAdminClient>

export interface ConnectedAccount {
  id: string
  org_id: string
  platform_user_id: string
  waba_id: string
  phone_number_id: string
  display_phone_number: string | null
}

const ACCOUNT_COLUMNS = "id, org_id, platform_user_id, waba_id, phone_number_id, display_phone_number"

export async function getConnectedAccountForUser(admin: Admin, platformUserId: string) {
  const { data } = await admin
    .from("whatsapp_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("platform_user_id", platformUserId)
    .eq("status", "connected")
    .maybeSingle()
  return data as ConnectedAccount | null
}

export async function getAccountById(admin: Admin, accountId: string) {
  const { data } = await admin
    .from("whatsapp_accounts")
    .select(`${ACCOUNT_COLUMNS}, status`)
    .eq("id", accountId)
    .maybeSingle()
  return data as (ConnectedAccount & { status: string }) | null
}

export async function getAccountByPhoneNumberId(admin: Admin, phoneNumberId: string) {
  const { data } = await admin
    .from("whatsapp_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("phone_number_id", phoneNumberId)
    .eq("status", "connected")
    .maybeSingle()
  return data as ConnectedAccount | null
}

export async function getSender(admin: Admin, account: ConnectedAccount): Promise<WhatsAppSender> {
  const { data } = await admin
    .from("whatsapp_account_secrets")
    .select("access_token")
    .eq("account_id", account.id)
    .maybeSingle()
  if (!data?.access_token) throw new Error("This WhatsApp number needs to be reconnected.")
  return { phoneNumberId: account.phone_number_id, wabaId: account.waba_id, accessToken: data.access_token }
}

/**
 * The thread between one connected number and one customer number. Created on
 * first contact and linked to the matching lead/member; an unknown inbound
 * number becomes a new lead owned by whoever's number it messaged.
 */
export async function findOrCreateWhatsAppConversation(
  admin: Admin,
  account: ConnectedAccount,
  rawPhone: string,
  opts: { profileName?: string | null; leadId?: string | null; customerId?: string | null; createLeadIfUnknown?: boolean } = {},
) {
  const phone = normalizeWhatsAppNumber(rawPhone)

  const { data: existing } = await admin
    .from("conversations")
    .select("id, lead_id, customer_id")
    .eq("whatsapp_account_id", account.id)
    .eq("channel", "whatsapp")
    .eq("external_identifier", phone)
    .maybeSingle()
  if (existing) {
    // Backfill a link made later from a lead/member page.
    if ((opts.leadId && !existing.lead_id) || (opts.customerId && !existing.customer_id)) {
      await admin
        .from("conversations")
        .update({ lead_id: existing.lead_id ?? opts.leadId ?? null, customer_id: existing.customer_id ?? opts.customerId ?? null })
        .eq("id", existing.id)
    }
    return existing.id
  }

  let leadId = opts.leadId ?? null
  let customerId = opts.customerId ?? null
  let name = opts.profileName ?? null
  if (!leadId && !customerId) {
    const { data: match } = await admin.rpc("whatsapp_match_contact", { p_org_id: account.org_id, p_phone: phone })
    const m = match?.[0]
    leadId = m?.lead_id ?? null
    customerId = m?.customer_id ?? null
    name = m?.customer_name ?? m?.lead_name ?? name
  }

  if (!leadId && !customerId && opts.createLeadIfUnknown) {
    const { data: lead } = await admin
      .from("leads")
      .insert({
        org_id: account.org_id,
        owner_id: account.platform_user_id,
        full_name: opts.profileName?.trim() || `+${phone}`,
        phone: `+${phone}`,
        source: "WhatsApp",
      })
      .select("id")
      .single()
    leadId = lead?.id ?? null
  }

  const { data: created, error } = await admin
    .from("conversations")
    .insert({
      org_id: account.org_id,
      owner_id: account.platform_user_id,
      channel: "whatsapp",
      whatsapp_account_id: account.id,
      external_identifier: phone,
      lead_id: leadId,
      customer_id: customerId,
      subject: name,
    })
    .select("id")
    .single()

  if (error) {
    // Lost a race with a concurrent webhook delivery — the thread exists now.
    const { data: again } = await admin
      .from("conversations")
      .select("id")
      .eq("whatsapp_account_id", account.id)
      .eq("channel", "whatsapp")
      .eq("external_identifier", phone)
      .maybeSingle()
    return again?.id ?? null
  }
  return created.id
}

/** Logs a message we sent and bumps the thread. */
export async function recordOutbound(
  admin: Admin,
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
