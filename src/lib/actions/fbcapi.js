'use server'

const PIXEL_ID     = process.env.NEXT_PUBLIC_FB_PIXEL_ID
const ACCESS_TOKEN = process.env.FB_CONVERSIONS_API_KEY
const API_VERSION  = 'v21.0'
const API_URL      = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`

function hashSHA256(str) {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(String(str).trim().toLowerCase()).digest('hex')
}

// Normalise un numéro tunisien au format E.164 sans '+' : 216XXXXXXXX
function normalizePhoneTN(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)                                // 00216... -> 216...
  if (d.length === 8) d = '216' + d                                     // 8 chiffres locaux -> +216
  else if (d.length === 9 && d.startsWith('0')) d = '216' + d.slice(1)  // 0XXXXXXXX -> 216XXXXXXXX
  return d
}

function buildUserData(userData = {}) {
  const out = {}
  const ph = normalizePhoneTN(userData.phone)
  if (ph) out.ph = [hashSHA256(ph)]
  if (userData.name) {
    const parts = String(userData.name).trim().split(/\s+/)
    if (parts[0]) out.fn = [hashSHA256(parts[0])]
    if (parts.length > 1) out.ln = [hashSHA256(parts.slice(1).join(' '))]
  }
  if (userData.city) out.ct = [hashSHA256(userData.city)]
  out.country = [hashSHA256('tn')]
  // Identifiants de clic — CRITIQUES pour l'attribution (NON hashés)
  if (userData.fbp)       out.fbp = String(userData.fbp)
  if (userData.fbc)       out.fbc = String(userData.fbc)
  if (userData.clientIp)  out.client_ip_address = String(userData.clientIp)
  if (userData.userAgent) out.client_user_agent = String(userData.userAgent)
  return out
}

export async function sendCAPIEvent({ eventName, eventId, userData = {}, customData = {}, sourceUrl }) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[CAPI] Cles manquantes (NEXT_PUBLIC_FB_PIXEL_ID / FB_CONVERSIONS_API_KEY)')
    return
  }

  const payload = {
    data: [{
      event_name:       eventName,
      event_time:       Math.floor(Date.now() / 1000),
      event_id:         eventId || `${eventName}-${Date.now()}`,
      event_source_url: sourceUrl || 'https://hap-p-kids.store',
      action_source:    'website',
      user_data:        buildUserData(userData),
      custom_data:      customData,
    }],
  }
  if (process.env.FB_TEST_EVENT_CODE) payload.test_event_code = process.env.FB_TEST_EVENT_CODE

  // Timeout sur l'appel externe
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      // token dans le body, jamais en query string ni loggue
      body:    JSON.stringify({ ...payload, access_token: ACCESS_TOKEN }),
      signal:  controller.signal,
    })
    const json = await res.json().catch(() => ({}))
    if (json.error) {
      console.error('[CAPI] Erreur FB:', { code: json.error.code, fbtrace_id: json.error.fbtrace_id })
    } else {
      console.log('[CAPI] Envoye:', eventName, '-> events_received:', json.events_received)
    }
    return json
  } catch (err) {
    console.error('[CAPI] Fetch error:', err?.name, err?.message)
  } finally {
    clearTimeout(timer)
  }
}
