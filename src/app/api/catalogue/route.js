import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export const revalidate = 3600

export async function GET() {
  const supabase = createStaticClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, line, price_dt, description, colors, is_active')
    .eq('is_active', true)

  const items = []

  for (const product of (products || [])) {
    const colors = product.colors || []

    if (colors.length === 0) {
      items.push({
        id:                   product.slug,
        title:                product.name,
        description:          product.description || product.name,
        availability:         'in stock',
        condition:            'new',
        price:                parseFloat(product.price_dt).toFixed(2) + ' TND',
        link:                 'https://hap-p-kids.store/produit/' + product.slug,
        image_link:           'https://hap-p-kids.store/og/og-default.jpg',
        brand:                'HK Games',
        google_product_category: 'Toys & Games',
        item_group_id:        product.slug,
        color:                '',
        custom_label_0:       product.line,
        custom_label_1:       'in_stock',
      })
    } else {
      for (const color of colors) {
        const stock     = parseInt(color.stock || 0)
        const colorName = color.name || ''
        const colorSlug = colorName.toLowerCase().replace(/\s+/g, '-')
        const image     = color.image || 'https://hap-p-kids.store/og/og-default.jpg'

        items.push({
          id:                   product.slug + '-' + colorSlug,
          title:                product.name + ' - ' + colorName,
          description:          product.description || product.name + ' couleur ' + colorName,
          availability:         stock > 0 ? 'in stock' : 'out of stock',
          condition:            'new',
          price:                parseFloat(product.price_dt).toFixed(2) + ' TND',
          link:                 'https://hap-p-kids.store/produit/' + product.slug + '?color=' + colorSlug,
          image_link:           image,
          brand:                'HK Games',
          google_product_category: 'Toys & Games',
          item_group_id:        product.slug,
          color:                colorName,
          custom_label_0:       product.line,
          custom_label_1:       stock <= 5 ? 'low_stock' : 'in_stock',
        })
      }
    }
  }

  const cols = [
    'id', 'title', 'description', 'availability', 'condition',
    'price', 'link', 'image_link', 'brand', 'google_product_category',
    'item_group_id', 'color', 'custom_label_0', 'custom_label_1',
  ]

  const escape = (val) => '"' + String(val || '').replace(/"/g, '""') + '"'

  const rows = items.map((item) => cols.map((col) => escape(item[col])).join(','))
  const csv  = [cols.join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type':                'text/csv; charset=utf-8',
      'Cache-Control':               'public, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'Content-Disposition':         'inline; filename=catalogue.csv',
    },
  })
}
