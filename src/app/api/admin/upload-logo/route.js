import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  // Uploader le logo depuis public/icons vers Supabase Storage
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hap-p-kids.store'
  
  try {
    const res    = await fetch(`${baseUrl}/icons/hk-logo-512.png`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const { error } = await supabase.storage
      .from('product-images')
      .upload('brand/hk-logo-512.png', buffer, {
        upsert:      true,
        contentType: 'image/png',
      })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl('brand/hk-logo-512.png')

    return Response.json({ url: data.publicUrl })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
