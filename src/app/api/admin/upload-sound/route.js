import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file')
    const soundKey = formData.get('soundKey')

    if (!file || !soundKey) {
      return Response.json({ error: 'file et soundKey requis' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const path   = `sounds/${soundKey}.mp3`

    const { error } = await supabase.storage
      .from('notification-sounds')
      .upload(path, buffer, { upsert: true, contentType: 'audio/mpeg' })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data: urlData } = supabase.storage
      .from('notification-sounds')
      .getPublicUrl(path)

    // Sauvegarder l'URL dans settings
    await supabase.from('settings').upsert(
      { key: soundKey, value: urlData.publicUrl },
      { onConflict: 'key' }
    )

    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
