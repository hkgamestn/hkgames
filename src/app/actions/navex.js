'use server'

import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function createAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function envoyerNavex(order) {
  const TOKEN_ADD = process.env.NAVEX_TOKEN_ADD || 'happkidsgame-VNZLZD2394IEZKLHF23O403IZKLDJAE23583FKDLJLJ34TD'
  const NAVEX_URL = `https://app.navex.tn/api/${TOKEN_ADD}/v1/post.php`

  const designation = (order.items || [])
    .map((i) => `${i.name} x${i.qty}`)
    .join(', ')

  const nb_article = (order.items || []).reduce((s, i) => s + (i.qty || 1), 0)

  // total_dt inclut sous-total + livraison — c'est le montant COD à encaisser
  const totalCOD = parseFloat(order.total_dt || 0).toFixed(3)

  const params = new URLSearchParams({
    prix:            totalCOD,
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

  // Navex retourne: { status: 1, status_message: "122571184711", lien: "https://..." }
  const trackingNumber = data.status_message || null
  const printUrl       = data.lien           || null

  console.log('[Navex] Tracking:', trackingNumber, '| Lien:', printUrl)

  if (order.id) {
    const supabase = createAdminClient()
    await supabase
      .from('orders')
      .update({
        navex_tracking:   trackingNumber,
        navex_print_url:  printUrl,
        navex_sent_at:    new Date().toISOString(),
        status:           'shipped',
      })
      .eq('id', order.id)
  }

  return { ...data, tracking_number: trackingNumber, print_url: printUrl }
}

// Envoi Navex pour une demande grossiste (echantillon = 0 DT, commande gros = valeur reelle)
export async function envoyerNavexGrossiste({ request, codAmount }) {
  const TOKEN_ADD = process.env.NAVEX_TOKEN_ADD || 'happkidsgame-VNZLZD2394IEZKLHF23O403IZKLDJAE23583FKDLJLJ34TD'
  const NAVEX_URL = `https://app.navex.tn/api/${TOKEN_ADD}/v1/post.php`

  const isSample = request.request_type === 'sample'
  const prix = isSample ? '0.000' : parseFloat(codAmount || 0).toFixed(3)
  const designation = isSample
    ? 'Echantillon HK Games'
    : (request.products_wanted || 'Commande gros HK Games')

  const params = new URLSearchParams({
    prix,
    nom:             request.company_name || request.contact_name || '',
    gouvernerat:     request.city || 'Tunis',
    ville:           request.city || '',
    adresse:         request.address || '',
    tel:             request.phone || '',
    tel2:            '',
    designation:     designation,
    nb_article:      String(request.estimated_qty || 1),
    msg:             request.notes || (isSample ? 'Echantillon' : ''),
    echange:         'Non',
    article:         '',
    nb_echange:      '',
    ouvrir:          'Non',
    sender_name:     'HK Games',
    sender_location: 'Tunis',
  })

  const res  = await fetch(NAVEX_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.status === 'error') {
    throw new Error(data.status_message || 'Erreur Navex')
  }

  const trackingNumber = data.status_message || null
  const printUrl       = data.lien           || null

  if (request.id) {
    const supabase = createAdminClient()
    await supabase
      .from('wholesale_requests')
      .update({
        navex_tracking:  trackingNumber,
        navex_print_url: printUrl,
        navex_sent_at:   new Date().toISOString(),
      })
      .eq('id', request.id)
  }

  return { tracking_number: trackingNumber, print_url: printUrl }
}
