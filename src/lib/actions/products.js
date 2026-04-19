'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProducts(line) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('id, slug, name, description, line, price_dt, images, colors, bicolor_combos, is_active, position')
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (line) query = query.eq('line', line)

  const { data, error } = await query
  if (error) return []
  return data
}

export async function getProductBySlug(slug) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, description, line, price_dt, images, colors, bicolor_combos, is_active, position')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function upsertProduct(productData) {
  const supabase = await createClient()

  if (productData.id) {
    const { error } = await supabase
      .from('products')
      .update({ ...productData, updated_at: new Date().toISOString() })
      .eq('id', productData.id)
    if (error) return { error: 'Erreur mise à jour produit.' }
  } else {
    const { error } = await supabase.from('products').insert(productData)
    if (error) return { error: 'Erreur création produit.' }
  }

  revalidatePath('/shop')
  revalidatePath('/admin/produits')
  return { success: true }
}

export async function updateStock(productId, color, newStock) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('colors')
    .eq('id', productId)
    .single()

  if (!product) return { error: 'Produit introuvable.' }

  const updatedColors = product.colors.map((c) =>
    c.name === color ? { ...c, stock: newStock } : c
  )

  const { error } = await supabase
    .from('products')
    .update({ colors: updatedColors, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) return { error: 'Erreur mise à jour stock.' }

  revalidatePath('/shop')
  return { success: true }
}

export async function addToWaitlist({ productId, color, phone }) {
  const supabase = await createClient()
  await supabase.from('waitlist').insert({ product_id: productId, color, phone })
  return { success: true }
}
