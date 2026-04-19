'use server'

const PIXEL_ID   = process.env.NEXT_PUBLIC_FB_PIXEL_ID
const ACCESS_TOKEN = process.env.FB_CONVERSIONS_API_KEY
const API_URL    = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`

function hashSHA256(str) {
  // Node.js crypto
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex')
}

function buildUserData(userData = {}) {
  const out = {}
  if (userData.phone) out.ph = [hashSHA256(userData.phone.replace(/[^0-9]/g, ''))]
  if (userData.name) {
    const parts = userData.name.trim().split(' ')
    out.fn = [hashSHA256(parts[0] || '')]
    if (parts[1]) out.ln = [hashSHA256(parts[1])]
  }
  if (userData.city) out.ct = [hashSHA256(userData.city.toLowerCase())]
  out.country = [hashSHA256('tn')]
  return out
}

export async function sendCAPIEvent({
  eventName,
  eventId,
  userData = {},
  customData = {},
  sourceUrl,
}) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[CAPI] Clés manquantes')
    return
  }

  const payload = {
    data: [{
      event_name:  eventName,
      event_time:  Math.floor(Date.now() / 1000),
      event_id:    eventId || `${eventName}-${Date.now()}`,
      event_source_url: sourceUrl || 'https://hap-p-kids.store',
      action_source: 'website',
      user_data:   buildUserData(userData),
      custom_data: customData,
    }],
    test_event_code: process.env.FB_TEST_EVENT_CODE || undefined,
  }

  try {
    const res = await fetch(`${API_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.error) console.error('[CAPI] Erreur FB:', json.error)
    else console.log('[CAPI] Envoyé:', eventName, '→ events_received:', json.events_received)
    return json
  } catch (err) {
    console.error('[CAPI] Fetch error:', err)
  }
}
