import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const NAVEX_API = 'https://app.navex.tn/api/happkidsgame-VNZLZD2394IEZKLHF23O403IZKLDJAE23583FKDLJLJ34TD/v1'

// Mapping statuts Navex → statuts HK Games
function mapNavexStatus(navexStatus) {
  if (!navexStatus) return null
  const s = String(navexStatus).toLowerCase().trim()

  if (s.includes('livr') || s.includes('déliv') || s.includes('delivered'))  return 'delivered'
  if (s.includes('retour') || s.includes('return') || s.includes('refus'))   return 'returned'
  if (s.includes('expédi') || s.includes('transit') || s.includes('cours'))  return 'shipped'
  if (s.includes('annul') || s.includes('cancel'))                            return 'cancelled'
  if (s.includes('attente') || s.includes('pending') || s.includes('dépôt')) return 'shipped'
  return null // Statut inconnu — ne pas changer
}

export async function POST(req) {
  try {
    const { orderIds } = await req.json()

    // Récupérer les commandes avec navex_tracking
    const query = supabase
      .from('orders')
      .select('id, navex_tracking, status')
      .not('navex_tracking', 'is', null)
      .neq('navex_tracking', '')

    const { data: orders, error: dbErr } = orderIds?.length
      ? await query.in('id', orderIds)
      : await query.eq('status', 'shipped')

    if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
    if (!orders?.length) return Response.json({ updated: 0, message: 'Aucune commande à synchroniser' })

    const results = []

    for (const order of orders) {
      try {
        // Appel API Navex pour récupérer le statut
        const res = await fetch(`${NAVEX_API}/track.php?colis=${order.navex_tracking}`, {
          method:  'GET',
          headers: { 'Accept': 'application/json' },
        })

        if (!res.ok) {
          results.push({ id: order.id, status: 'api_error', code: res.status })
          continue
        }

        const text = await res.text()
        let data
        try { data = JSON.parse(text) } catch { data = null }

        console.log(`[sync-navex] ${order.navex_tracking}:`, text.slice(0, 200))

        if (!data) {
          results.push({ id: order.id, status: 'parse_error' })
          continue
        }

        // Chercher le statut dans la réponse
        const rawStatus = data.status_message || data.statut || data.status || data.etat || null
        const newStatus = mapNavexStatus(rawStatus)

        if (newStatus && newStatus !== order.status) {
          await supabase.from('orders').update({
            status:     newStatus,
            updated_at: new Date().toISOString(),
          }).eq('id', order.id)

          await supabase.from('order_logs').insert({
            order_id:  order.id,
            action:    'navex_sync',
            new_value: { navex_raw: rawStatus, new_status: newStatus },
          }).catch(() => {})

          results.push({ id: order.id, tracking: order.navex_tracking, old: order.status, new: newStatus, raw: rawStatus })
        } else {
          results.push({ id: order.id, tracking: order.navex_tracking, status: 'unchanged', raw: rawStatus })
        }
      } catch (err) {
        results.push({ id: order.id, status: 'fetch_error', error: err.message })
      }
    }

    const updated = results.filter((r) => r.new).length
    return Response.json({ updated, total: orders.length, results })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
