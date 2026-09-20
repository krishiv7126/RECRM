import "server-only"

const GRAPH_VERSION = "v21.0"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`WhatsApp is not configured — missing ${name}.`)
  return value
}

interface SendResult {
  ok: true
  messageId: string | undefined
}

async function callSendApi(payload: Record<string, unknown>): Promise<SendResult> {
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID")
  const accessToken = requireEnv("WHATSAPP_ACCESS_TOKEN")

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // Meta's error payload is the useful part (e.g. code 131047 — outside the
    // 24h customer session window, needs an approved template instead).
    throw new Error(data?.error?.message ?? `WhatsApp send failed (${res.status})`)
  }
  return { ok: true, messageId: data?.messages?.[0]?.id }
}

/**
 * Plain text message. Meta only allows this within the 24h window after the
 * recipient last messaged the business number — outside that window it
 * rejects with error 131047 and an approved template must be used instead
 * (see sendWhatsAppTemplate).
 */
export function sendWhatsAppText(to: string, body: string) {
  return callSendApi({ to, type: "text", text: { body } })
}

/**
 * Template message — required for the first contact / cold outreach (e.g.
 * broadcast to leads who've never messaged in). The template name must
 * already exist and be approved in Meta Business Manager; this can't invent
 * one.
 */
export function sendWhatsAppTemplate(to: string, templateName: string, languageCode = "en_US") {
  return callSendApi({
    to,
    type: "template",
    template: { name: templateName, language: { code: languageCode } },
  })
}
