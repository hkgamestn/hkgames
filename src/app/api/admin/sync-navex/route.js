import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const NAVEX_KEY = 'happkidsgame-VNZLZD2394IEZKLHF23O403IZKLDJAE23583FKDLJLJ34TD'
const NAVEX_BASE = `https://app.navex.tn/api/${NAVEX_KEY}/v1/post.php`

// Extraire l'ID Navex interne depuis l'URL d'impression
// ex: https://app.navex.tn/print/imprimer.php?id=814&code=122571184711 → 814
function extractNavexId(printUrl) {
  if (!printUrl) return null
  try {
    const url    = new URL(printUrl)
    const id     = url.searchParams.get('id')
    return id || null
  } catch { return null }
}

// Mapping statuts Navex → statuts HK Games
function mapNavexStatus(raw) {
  if (!raw) return null
  const s = String(raw).toLowerCase().trim()
  if (s.includes('livr') || s.includes('delivered') || s.includes('remis')) return 'delivered'
  if (s.includes('retour') || s.includes('return') || s.includes('refus') || s.includes('échec')) return 'returned'
  if (s.includes('annul') || s.includes('cancel')) return 'cancelled'
  if (s.includes('expédi') || s.includes('transit') || s.includes('en cours') || s.includes('ramassé')) return 'shipped'
  return null
}

async function fetchNavexStatus(tracking, navexId) {
  // On essaie plusieurs formats d'endpoint connus de Navex
  const endpoints = [
    // Format 1 : suivi par code colis
    { url: `${NAVEX_BASE}?action=suivi&code=${tracking}`, method: 'GET' },
    // Format 2 : suivi par ID interne
    ...(navexId ? [{ url: `${NAVEX_BASE}?action=suivi&id=${navexId}`, method: 'GET' }] : []),
    // Format 3 : track
    { url: `${NAVEX_BASE}?action=track&colis=${tracking}`, method: 'GET' },
    // Format 4 : POST avec paramètres
    {
      url:    NAVEX_BASE,
      method: 'POST',
      body:   new URLSearchParams({ action: 'suivi', code: tracking }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method:  ep.method || 'GET',
        headers: ep.headers || { Accept: 'application/json' },
        ...(ep.body ? { body: ep.body } : {}),
      })
      const text = await res.text()
      console.log(`[sync-navex] ${ep.url} → ${text.slice(0, 300)}`)

      if (!text || text.trim() === '' || text.trim() === 'null') continue

      let data
      try { data = JSON.parse(text) } catch { continue }

      // Chercher le statut dans tous les champs possibles
      const raw = data.status_message || data.statut || data.etat || data.libelle || data.description || data.message || null
      if (raw && raw !== tracking) return { raw, data, endpoint: ep.url }
    } catch (err) {
      console.warn(`[sync-navex] endpoint failed: ${ep.url}`, err.message)
    }
  }
  return null
}

export async function POST(req) {
  try {
    const { orderIds } = await req.json()

    const query = supabase
      .from('orders')
      .select('id, navex_tracking, navex_print_url, status')
      .not('navex_tracking', 'is', null)
      .neq('navex_tracking', '')

    const { data: orders, error: dbErr } = orderIds?.length
      ? await query.in('id', orderIds)
      : await query.eq('status', 'shipped')

    if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
    if (!orders?.length) return Response.json({ updated: 0, total: 0, message: 'Aucune commande shipped avec tracking' })

    const results = []

    for (const order of orders) {
      const navexId = extractNavexId(order.navex_print_url)
      const result  = await fetchNavexStatus(order.navex_tracking, navexId)

      if (!result) {
        results.push({ id: order.id, tracking: order.navex_tracking, status: 'no_response' })
        continue
      }

      const newStatus = mapNavexStatus(result.raw)
      console.log(`[sync-navex] ${order.navex_tracking} → raw="${result.raw}" → status=${newStatus}`)

      if (newStatus && newStatus !== order.status) {
        await supabase.from('orders').update({
          status:     newStatus,
          updated_at: new Date().toISOString(),
        }).eq('id', order.id)

        await supabase.from('order_logs').insert({
          order_id:  order.id,
          action:    'navex_sync',
          new_value: { raw: result.raw, new_status: newStatus, endpoint: result.endpoint },
        }).catch(() => {})

        results.push({ id: order.id, tracking: order.navex_tracking, old: order.status, new: newStatus, raw: result.raw })
      } else {
        results.push({ id: order.id, tracking: order.navex_tracking, status: 'unchanged', raw: result.raw, mapped: newStatus })
      }
    }

    const updated = results.filter((r) => r.new).length
    return Response.json({ updated, total: orders.length, results })
  } catch (err) {
    console.error('[sync-navex] fatal:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
