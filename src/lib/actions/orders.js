'use server'
import { sendCAPIEvent } from '@/lib/actions/fbcapi'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
import { computeBundle } from '@/lib/utils/bundleRules'

const OrderSchema = z.object({
  firstName:   z.string().min(2, 'Prénom trop court'),
  lastName:    z.string().min(2, 'Nom trop court'),
  phone:       z.string().regex(/^(\+216|00216|0)(2[0-9]|[3-9][0-9])[0-9]{6}$/, 'Numéro invalide — format tunisien requis'),
  address:     z.string().min(10, 'Adresse trop courte (min 10 caractères)'),
  city:        z.string().min(2, 'Gouvernorat requis'),
  notes:       z.string().optional(),
})

async function getSettingValue(key) {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

async function sendPushNotification(orderId, type) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, type }),
    })
  } catch {}
}

export async function createPendingOrder({ phone, items, subtotalDt, giftMessage, giftRecipient }) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_phone: phone,
      status: 'pending',
      items: items,
      subtotal_dt: subtotalDt,
      total_dt: subtotalDt,
      gift_message:   giftMessage   ? String(giftMessage).slice(0, 200).trim()   : null,
      gift_recipient: giftRecipient ? String(giftRecipient).slice(0, 40).trim()  : null,
    })
    .select('id')
    .single()

  if (error) { console.error('NAVEX INSERT ERROR:', JSON.stringify(error)); return { error: 'Erreur: ' + error.message } }

  await sendPushNotification(data.id, 'pending')

  return { orderId: data.id }
}

export async function confirmOrder(formData, pendingOrderId) {
  const supabase = createAdminClient()

  const validated = OrderSchema.safeParse(formData)
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const { firstName, lastName, phone, address, city, notes } = validated.data
  const items = formData.items || []
  const giftMessage   = formData.giftMessage   ? String(formData.giftMessage).slice(0, 200).trim()   : null
  const giftRecipient = formData.giftRecipient ? String(formData.giftRecipient).slice(0, 40).trim()  : null
  const clientDiscounts = formData.discounts || {}

  // Vérification stock finale
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('colors, name')
      .eq('id', item.product_id)
      .single()

    if (!product) return { error: `Produit introuvable.` }

    const colorData = product.colors?.find((c) => c.name === item.color)
    if (!colorData || colorData.stock < item.qty) {
      return { error: `Stock insuffisant — ${product.name} ${item.color}` }
    }
  }

  // Calcul bundle
  const { discount, bundleType, savings } = computeBundle(items, clientDiscounts)
  const shippingDt    = parseFloat((await getSettingValue('shipping_price_dt')) || '8')
  const freeThreshold = parseFloat((await getSettingValue('free_shipping_threshold_dt')) || '50')

  const subtotal    = items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)
  const discountAmt = parseFloat((subtotal * (discount / 100)).toFixed(3))
  const shipping    = subtotal >= freeThreshold ? 0 : shippingDt
  const total       = parseFloat((subtotal - discountAmt + shipping).toFixed(3))

  // Numéro séquentiel 000001, 000002...
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
  const seq = String((count || 0) + 1).padStart(6, '0')
  const orderNumber = seq

  const upsertData = {
    order_number:     orderNumber,
    status:           'confirmed',
    customer_name:    `${firstName} ${lastName}`,
    customer_phone:   phone,
    customer_address: address,
    customer_city:    city,
    customer_notes:   notes || null,
    items,
    subtotal_dt:      subtotal,
    discount_dt:      discountAmt,
    shipping_dt:      shipping,
    total_dt:         total,
    bundle_type:      bundleType,
    gift_message:     giftMessage,
    gift_recipient:   giftRecipient,
    updated_at:       new Date().toISOString(),
  }

  let orderId = pendingOrderId

  if (pendingOrderId) {
    const { error } = await supabase
      .from('orders')
      .update(upsertData)
      .eq('id', pendingOrderId)
    if (error) { console.error('NAVEX UPDATE ERROR:', JSON.stringify(error)); return { error: 'Erreur: ' + error.message } }
  } else {
    const { data, error } = await supabase
      .from('orders')
      .insert(upsertData)
      .select('id')
      .single()
    if (error) { console.error('INSERT ERROR:', JSON.stringify(error)); return { error: 'Erreur: ' + error.message } }
    orderId = data.id
  }

  // Décrémentation stock atomique
  for (const item of items) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_color: item.color,
      p_qty: item.qty,
    })
    await supabase.from('inventory_logs').insert({
      product_id: item.product_id,
      color: item.color,
      delta: -item.qty,
      reason: 'order',
      order_id: orderId,
    })
  }

  await sendPushNotification(orderId, 'confirmed')

  // CAPI Purchase
  try {
    await sendCAPIEvent({
      eventName:  'Purchase',
      eventId:    'purchase-' + orderId,
      userData: {
        phone: phone,
        name:  `${firstName} ${lastName}`,
        city:  city,
      },
      customData: {
        currency:    'TND',
        value:       total,
        order_id:    orderId,
        num_items:   items.reduce((s, i) => s + i.qty, 0),
        contents:    items.map((i) => ({ id: i.product_id, quantity: i.qty, item_price: i.price_dt })),
      },
      sourceUrl: 'https://hap-p-kids.store/commander',
    })
  } catch (e) { console.error('[CAPI Purchase]', e) }

  return { success: true, orderId }
}

export async function updateOrderStatus(orderId, status, options = {}) {
  const supabase = await createClient()
  const { reason, adminNote } = options

  const updateData = {
    status,
    updated_at: new Date().toISOString(),
    ...(reason    && { cancellation_reason: reason }),
    ...(adminNote && { admin_notes: adminNote }),
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) return { error: 'Erreur mise à jour statut.' }

  await supabase.from('order_logs').insert({
    order_id: orderId,
    action: 'status_change',
    new_value: { status, reason, adminNote },
  })

  return { success: true }
}

export async function softDeleteOrder(orderId) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) return { error: 'Erreur suppression.' }
  await supabase.from('order_logs').insert({
    order_id: orderId,
    action: 'status_change',
    new_value: { status: 'deleted' },
  })
  return { success: true }
}

export async function updateOrderItems(orderId, updatedData) {
  const supabase = await createClient()
  const subtotal = updatedData.items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)
  const { error } = await supabase
    .from('orders')
    .update({ ...updatedData, subtotal_dt: subtotal, total_dt: subtotal, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) return { error: 'Erreur modification commande.' }
  await supabase.from('order_logs').insert({ order_id: orderId, action: 'field_updated', new_value: updatedData })
  return { success: true }
}

export async function acceptOTO(orderId, otoBuddyItem) {
  const supabase = await createClient()
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order) return { error: 'Commande introuvable.' }

  const otoPriceDt = parseFloat((await getSettingValue('oto_discount_dt')) || '6')
  const newItems   = [...(order.items || []), { ...otoBuddyItem, price_dt: otoBuddyItem.price_dt - otoPriceDt }]
  const newTotal   = parseFloat((order.total_dt + (otoBuddyItem.price_dt - otoPriceDt)).toFixed(3))

  await supabase.from('orders').update({
    items:      newItems,
    total_dt:   newTotal,
    oto_accepted: true,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)

  await supabase.from('upsell_events').insert({ order_id: orderId, type: 'oto_accepted', product_id: otoBuddyItem.product_id })

  await sendPushNotification(orderId, 'oto_accepted')

  return { success: true }
}

export async function restoreOrder(orderId) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: null, status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) return { error: 'Erreur restauration.' }
  return { success: true }
}

export async function hardDeleteOrders(orderIds) {
  const supabase = createAdminClient()
  if (!Array.isArray(orderIds) || orderIds.length === 0) return { error: 'Aucun ID.' }

  // Supprimer les dépendances d'abord (FK sans CASCADE)
  await supabase.from('inventory_logs').delete().in('order_id', orderIds)
  await supabase.from('upsell_events').delete().in('order_id', orderIds)

  const { error } = await supabase
    .from('orders')
    .delete()
    .in('id', orderIds)

  if (error) {
    console.error('[hardDeleteOrders]', error)
    return { error: 'Erreur suppression définitive: ' + error.message }
  }
  return { success: true }
}

// ─── App Badge : unseen count ─────────────────────────────────────────────────

export async function getUnseenCount() {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('is_seen', false)
    if (error) { console.error('[getUnseenCount]', error.message); return 0 }
    return count ?? 0
  } catch (err) {
    console.error('[getUnseenCount]', err)
    return 0
  }
}

export async function markOrdersSeen() {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('orders')
      .update({ is_seen: true })
      .eq('is_seen', false)
    if (error) { console.error('[markOrdersSeen]', error.message); return { success: false } }
    return { success: true }
  } catch (err) {
    console.error('[markOrdersSeen]', err)
    return { success: false }
  }
}
