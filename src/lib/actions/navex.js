'use server'

export async function createNavexParcel(order) {
  const apiKey = process.env.NAVEX_API_KEY
  const apiUrl = process.env.NAVEX_API_URL || 'https://api.navex.tn/v1'

  if (!apiKey) return { error: 'Navex API key manquante.' }

  const weight = (order.items || []).reduce((acc, item) => acc + 170 * (item.qty || 1), 0)

  const body = {
    reference:  `HK-${order.id}`,
    recipient: {
      name:    order.customer_name,
      phone:   order.customer_phone,
      address: order.customer_address,
      city:    order.customer_city,
    },
    cod_amount: order.total_dt,
    weight:     weight,
  }

  try {
    const res = await fetch(`${apiUrl}/parcels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return { error: `Navex erreur: ${res.status}` }
    }

    const data = await res.json()

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase
      .from('orders')
      .update({
        navex_tracking:  data.tracking_number,
        navex_parcel_id: data.id,
        status:          'shipped',
        updated_at:      new Date().toISOString(),
      })
      .eq('id', order.id)

    return { success: true, tracking: data.tracking_number }
  } catch (err) {
    return { error: 'Navex API non joignable.' }
  }
}
