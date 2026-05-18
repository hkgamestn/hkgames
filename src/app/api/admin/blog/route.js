import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req) {
  const supabase = await createAdminClient()
  const body = await req.json()
  // Sanitize: strip unknown keys
  const allowed = ['title','slug','excerpt','content','cover_image','tags','published','published_at']
  const payload = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
  const { data, error } = await supabase.from('blog_posts').insert([payload]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req) {
  const supabase = await createAdminClient()
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const allowed = ['title','slug','excerpt','content','cover_image','tags','published','published_at','updated_at']
  const payload = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)))
  const { error } = await supabase.from('blog_posts').update(payload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req) {
  const supabase = await createAdminClient()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
