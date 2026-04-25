'use server'

import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function createAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function envoyerNavex(order) {
  const NAVEX_URL = 'https://app.navex.tn/api/happkidsgame-VNZLZD2394IEZKLHF23O403IZKLDJAE23583FKDLJLJ34TD/v1/post.php'

  const designation = (order.items || [])
    .map((i) => `${i.name} x${i.qty}`)
    .join(', ')

  const nb_article = (order.items || []).reduce((s, i) => s + (i.qty || 1), 0)

  const params = new URLSearchParams({
    prix:            String(order.total_dt || 0),
    nom:             order.customer_name    || '',
    gouvernerat:     order.customer_city    || 'Tunis',
    ville:           order.customer_city    || '',
    adresse:         order.customer_address || '',
    tel:             order.customer_phone   || '',
    tel2:            '',
    designation:     designation,
    nb_article:      String(nb_article),
    msg:             order.customer_notes   || '',
    echange:         'Non',
    article:         '',
    nb_echange:      '',
    ouvrir:          'Non',
    sender_name:     'HK Games',
    sender_location: 'Tunis',
  })

  const res = await fetch(NAVEX_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })

  const data = await res.json().catch(() => ({}))

  // Log complet pour voir tous les champs retournés par Navex
  console.log('[Navex] Réponse complète:', JSON.stringify(data))

  if (!res.ok || data.status === 'error') {
    throw new Error(data.status_message || 'Erreur Navex')
  }

  // Chercher le vrai numéro de colis dans tous les champs possibles
  const trackingNumber =
    data.tracking_number ||
    data.colis_id        ||
    data.numero_colis    ||
    data.num_colis       ||
    data.barcode         ||
    data.reference       ||
    data.id              ||
    data.code            ||
    null

  console.log('[Navex] Tracking number extrait:', trackingNumber)
  console.log('[Navex] Tous les champs:', Object.keys(data))

  // Fallback sans préfixe si Navex ne retourne pas de numéro
  const trackingValue = trackingNumber ? String(trackingNumber) : null

  if (order.id) {
    const supabase = createAdminClient()
    await supabase
      .from('orders')
      .update({
        navex_tracking: trackingValue,
        navex_sent_at:  new Date().toISOString(),
        status:         'shipped',
      })
      .eq('id', order.id)
  }

  return { ...data, tracking_number: trackingValue }
}
