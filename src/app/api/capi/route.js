import { sendCAPIEvent } from '@/lib/actions/fbcapi'

export async function POST(req) {
  try {
    const body = await req.json()
    const { eventName, eventId, userData, customData, sourceUrl } = body

    const allowed = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'PageView']
    if (!allowed.includes(eventName)) {
      return Response.json({ error: 'Event non autorisé' }, { status: 400 })
    }

    await sendCAPIEvent({ eventName, eventId, userData, customData, sourceUrl })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
