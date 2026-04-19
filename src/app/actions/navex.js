'use server'

export async function envoyerNavex(order) {
  const NAVEX_URL = 'https://app.navex.tn/api/happkidsgame-VNZLZD2394IEZKLHF23O403IZKLDJAE23583FKDLJLJ34TD/v1/post.php'

  // Construire la désignation depuis les items
  const designation = (order.items || [])
    .map((i) => `${i.name} x${i.qty}`)
    .join(', ')

  const nb_article = (order.items || []).reduce((s, i) => s + (i.qty || 1), 0)

  const params = new URLSearchParams({
    prix:            String(order.total_dt || 0),
    nom:             order.customer_name  || '',
    gouvernerat:     order.customer_city  || 'Tunis',
    ville:           order.customer_city  || '',
    adresse:         order.customer_address || '',
    tel:             order.customer_phone || '',
    tel2:            '',
    designation:     designation,
    nb_article:      String(nb_article),
    msg:             order.notes || '',
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

  if (!res.ok || data.status === 'error') {
    throw new Error(data.status_message || 'Erreur Navex')
  }

  return data
}
