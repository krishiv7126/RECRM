import { NextRequest } from 'next/server'

// Meta's verification handshake: it calls this once with hub.mode=subscribe
// and a token you chose when setting up the webhook in Meta's dashboard.
// WHATSAPP_VERIFY_TOKEN isn't set yet, so this correctly rejects every
// request until that env var is added on Vercel.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

// Meta POSTs message/status events here once the webhook is subscribed.
// Meta expects a fast 200 regardless of payload contents, or it will retry
// and eventually disable the webhook — so this just acknowledges for now.
// Actual event parsing, signature verification (X-Hub-Signature-256, needs
// WHATSAPP_APP_SECRET), and message handling land when Meta is connected.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  console.log('WhatsApp webhook event received:', JSON.stringify(body))

  return Response.json({ received: true })
}
