import { createClient } from '@supabase/supabase-js'
import { sendCAPIEvent } from '@/lib/actions/fbcapi'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Token de Recuperation (etat) — en env, jamais hardcode
const ETAT_TOKEN = process.env.NAVEX_TOKEN_ETAT
const ETAT_URL   = ETAT_TOKEN ? `https://app.navex.tn/api/${ETAT_TOKEN}/v1/post.php` : null

// Mapping etat Navex -> statut HK Games
function mapNavexStatus(raw) {
  if (!raw) return null
  const s = String(raw).toLowerCase().trim()
  if (s.includes('livr') || s.includes('remis') || s.includes('deliver')) return 'delivered'
  if (s.includes('retour') || s.includes('return') || s.includes('refus') || s.includes('echec') || s.includes('\u00e9chec')) return 'returned'
  if (s.includes('annul') || s.includes('cancel')) return 'cancelled'
  if (s.includes('cours') || s.includes('transit') || s.includes('ramass') || s.includes('expedi') || s.includes('exp\u00e9di')) return 'shipped'
  return null // "En attente" et inconnus -> pas de changement
}

// Recuperation Multiple : 1 seule requete POST pour N codes (param "codes")
async function fetchNavexStatuses(codes) {
  if (!ETAT_URL || !codes.length) return {}
  const body = 'codes=' + encodeURIComponent(codes.join(', '))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(ETAT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal:  controller.signal,
    })
    const data = await res.json().catch(() => ({}))
    const map = {}
    for (const r of (data.results || [])) {
      if (r && r.code && Number(r.status) === 1) map[r.code] = { etat: r.etat, motif: r.motif }
    }
    return map
  } catch (err) {
    console.error('[sync-navex] fetch error:', err?.name, err?.message)
    return {}
  } finally {
    clearTimeout(timer)
  }
}

// Envoie un event CAPI custom (Livraison / Retour) — non bloquant
async function feedMeta(eventName, prefix, order) {
  try {
    await sendCAPIEvent({
      eventName,
      eventId:    `${prefix}-${order.id}`,
      userData:   { phone: order.customer_phone, name: order.customer_name, city: order.customer_city },
      customData: { currency: 'TND', value: order.total_dt, order_id: order.id },
      sourceUrl:  'https://www.hap-p-kids.store',
    })
  } catch (e) {
    console.error(`[sync-navex] CAPI ${eventName}`, e?.message)
  }
}

async function runSync(orderIds) {
  const base = supabase
    .from('orders')
    .select('id, navex_tracking, status, total_dt, customer_name, customer_phone, customer_city')
    .not('navex_tracking', 'is', null)
    .neq('navex_tracking', '')

  const { data: orders, error } = orderIds?.length
    ? await base.in('id', orderIds)
    : await base.eq('status', 'shipped')

  if (error) throw new Error(error.message)
  if (!orders?.length) return { updated: 0, total: 0, results: [] }

  const codes     = orders.map((o) => o.navex_tracking)
  const statusMap = await fetchNavexStatuses(codes)

  const results = []
  for (const order of orders) {
    const found = statusMap[order.navex_tracking]
    if (!found) { results.push({ id: order.id, code: order.navex_tracking, status: 'no_response' }); continue }

    const newStatus = mapNavexStatus(found.etat)

    // On agit UNIQUEMENT sur la transition (newStatus different du status actuel).
    // Une fois passe en delivered/returned, l'ordre n'est plus "shipped" -> jamais re-traite -> pas de doublon Meta.
    if (newStatus && newStatus !== order.status) {
      await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', order.id)
      await supabase.from('order_logs').insert({
        order_id:  order.id,
        action:    'navex_sync',
        new_value: { etat: found.etat, motif: found.motif, new_status: newStatus },
      }).catch(() => {})

      if (newStatus === 'delivered') await feedMeta('Livraison', 'delivered', order) // vrai payeur COD
      if (newStatus === 'returned')  await feedMeta('Retour',    'returned',  order) // audience d'exclusion

      results.push({ id: order.id, code: order.navex_tracking, old: order.status, new: newStatus, etat: found.etat })
    } else {
      results.push({ id: order.id, code: order.navex_tracking, status: 'unchanged', etat: found.etat })
    }
  }

  const updated = results.filter((r) => r.new).length
  return { updated, total: orders.length, results }
}

// Manuel (bouton admin) — optionnel: { orderIds: [...] }
export async function POST(req) {
  try {
    const { orderIds } = await req.json().catch(() => ({}))
    return Response.json(await runSync(orderIds))
  } catch (err) {
    console.error('[sync-navex] fatal:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// Vercel Cron (GET). Securise par CRON_SECRET si defini.
export async function GET(req) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return Response.json(await runSync())
  } catch (err) {
    console.error('[sync-navex] cron fatal:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
