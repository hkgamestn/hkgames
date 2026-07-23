'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Numéro tunisien -> 8 chiffres locaux (identique à hk_normalize_phone en SQL)
// Non exporté : dans un fichier 'use server', tout export doit être async.
function normalizeTNPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  return d.slice(-8)
}

const SAFE_DEFAULT = {
  phone: null,
  isBlocked: false,
  isLoyal: false,
  totalOrders: 0,
  deliveredCount: 0,
  returnedReceivedCount: 0,
  lastDeliveredAt: null,
  lastReturnedAt: null,
}

// Réputation d'un client à partir de son téléphone (checkout + admin).
// Fail-open : en cas d'erreur DB, on NE bloque PAS (on ne perd pas une vente COD
// sur un incident transitoire) — le blocage définitif reste porté par la détection
// « Retour recu » côté sync, revérifiée à chaque nouvelle commande.
export async function getCustomerReputation(phone) {
  const local = normalizeTNPhone(phone)
  if (local.length < 8) return { ...SAFE_DEFAULT, phone: local || null }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('hk_customer_reputation', { p_phone: phone })
    if (error) {
      console.error('[getCustomerReputation] rpc error:', error.message)
      return { ...SAFE_DEFAULT, phone: local }
    }
    const r = data || {}
    return {
      phone:                 r.phone ?? local,
      isBlocked:             Boolean(r.is_blocked),
      isLoyal:               Boolean(r.is_loyal),
      totalOrders:           Number(r.total_orders || 0),
      deliveredCount:        Number(r.delivered_count || 0),
      returnedReceivedCount: Number(r.returned_received_count || 0),
      lastDeliveredAt:       r.last_delivered_at ?? null,
      lastReturnedAt:        r.last_returned_at ?? null,
    }
  } catch (err) {
    console.error('[getCustomerReputation] unexpected:', err?.message)
    return { ...SAFE_DEFAULT, phone: local }
  }
}

// ── Admin : garde d'authentification (session Supabase de l'admin) ──────────
async function requireAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return Boolean(user)
  } catch {
    return false
  }
}

async function upsertFlag(phone, patch) {
  if (!(await requireAdmin())) return { error: 'Non autorisé.' }
  const local = normalizeTNPhone(phone)
  if (local.length < 8) return { error: 'Téléphone invalide.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('customer_flags')
    .upsert(
      { phone: local, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'phone' }
    )
  if (error) {
    console.error('[customer_flags upsert] error:', error.message)
    return { error: 'Erreur mise à jour du statut client.' }
  }
  return { success: true, phone: local }
}

// Débloque un client (régularisation après appel au +216 21 660 303).
// force_allow prime sur la règle auto « Retour recu ».
export async function unblockCustomer(phone, note) {
  return upsertFlag(phone, {
    force_allow: true,
    force_block: false,
    note: note ? String(note).slice(0, 300) : 'Débloqué manuellement',
  })
}

// Bloque manuellement un client (sans attendre un « Retour recu »).
export async function blockCustomer(phone, note) {
  return upsertFlag(phone, {
    force_block: true,
    force_allow: false,
    note: note ? String(note).slice(0, 300) : 'Bloqué manuellement',
  })
}
