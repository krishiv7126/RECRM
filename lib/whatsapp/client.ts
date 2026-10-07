import "server-only"

export const GRAPH_VERSION = "v23.0"
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

/** The credentials of one connected number (see whatsapp_accounts / whatsapp_account_secrets). */
export interface WhatsAppSender {
  phoneNumberId: string
  wabaId: string
  accessToken: string
}

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`WhatsApp is not configured — missing ${name}.`)
  return value
}

export async function graph<T = Record<string, unknown>>(
  path: string,
  accessToken: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body !== undefined && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    },
    body:
      init.body === undefined ? undefined : init.body instanceof FormData ? init.body : JSON.stringify(init.body),
    cache: "no-store",
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // Meta's error payload is the useful part (e.g. code 131047 — outside the
    // 24h customer session window, needs an approved template instead).
    const err = data?.error
    throw new Error(err?.error_user_msg ?? err?.message ?? `WhatsApp request failed (${res.status})`)
  }
  return data as T
}

async function callSendApi(sender: WhatsAppSender, payload: Record<string, unknown>) {
  const data = await graph<{ messages?: { id: string }[] }>(`${sender.phoneNumberId}/messages`, sender.accessToken, {
    method: "POST",
    body: { messaging_product: "whatsapp", recipient_type: "individual", ...payload },
  })
  return { messageId: data.messages?.[0]?.id }
}

/**
 * Plain text message. Meta only allows this within the 24h window after the
 * recipient last messaged the business number — outside that window it
 * rejects with error 131047 and an approved template must be used instead.
 */
export function sendWhatsAppText(sender: WhatsAppSender, to: string, body: string) {
  return callSendApi(sender, { to, type: "text", text: { body, preview_url: true } })
}

/**
 * Template message — required for first contact / cold outreach. The
 * template must already exist and be approved on the sender's WABA.
 * `bodyParams` fill {{1}}, {{2}}… in the template body, in order.
 */
export function sendWhatsAppTemplate(
  sender: WhatsAppSender,
  to: string,
  templateName: string,
  languageCode = "en_US",
  bodyParams: string[] = [],
) {
  return callSendApi(sender, {
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(bodyParams.length > 0
        ? { components: [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }] }
        : {}),
    },
  })
}

export type WhatsAppMediaKind = "image" | "video" | "audio" | "document"

export function mediaKindFor(mimeType: string): WhatsAppMediaKind {
  if (mimeType.startsWith("image/") && /jpe?g|png/.test(mimeType)) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

/** Uploads a file to Meta and sends it; `caption` isn't supported on audio. */
export async function sendWhatsAppMedia(
  sender: WhatsAppSender,
  to: string,
  file: Blob,
  fileName: string,
  caption?: string,
) {
  const form = new FormData()
  form.append("messaging_product", "whatsapp")
  form.append("type", file.type || "application/octet-stream")
  form.append("file", file, fileName)
  const { id } = await graph<{ id: string }>(`${sender.phoneNumberId}/media`, sender.accessToken, {
    method: "POST",
    body: form,
  })

  const kind = mediaKindFor(file.type)
  const media: Record<string, string> = { id }
  if (caption && kind !== "audio") media.caption = caption
  if (kind === "document") media.filename = fileName
  return callSendApi(sender, { to, type: kind, [kind]: media })
}

/** Downloads an inbound media item. Meta's URL needs the same bearer token. */
export async function downloadWhatsAppMedia(mediaId: string, accessToken: string) {
  const meta = await graph<{ url: string; mime_type: string }>(mediaId, accessToken)
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" })
  if (!res.ok) throw new Error(`Media download failed (${res.status})`)
  return { blob: await res.blob(), mimeType: meta.mime_type }
}

export interface WhatsAppTemplate {
  name: string
  language: string
  category: string
  body: string
  paramCount: number
}

export async function listApprovedTemplates(sender: Pick<WhatsAppSender, "wabaId" | "accessToken">) {
  const data = await graph<{
    data: { name: string; language: string; category: string; status: string; components?: { type: string; text?: string }[] }[]
  }>(`${sender.wabaId}/message_templates?fields=name,language,category,status,components&status=APPROVED&limit=200`, sender.accessToken)

  return data.data.map<WhatsAppTemplate>((t) => {
    const body = t.components?.find((c) => c.type === "BODY")?.text ?? ""
    const params = new Set(body.match(/\{\{\s*\d+\s*\}\}/g) ?? [])
    return { name: t.name, language: t.language, category: t.category, body, paramCount: params.size }
  })
}

/** Digits only, with a bare 10-digit Indian mobile number given its 91 prefix. */
export function normalizeWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "")
  return digits.length === 10 ? `91${digits}` : digits
}
