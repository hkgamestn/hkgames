import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('videos').select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req) {
  const supabase = await createAdminClient()
  const payload  = await req.json()
  const { data, error } = await supabase.from('videos').insert([payload]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req) {
  const supabase = await createAdminClient()
  const { id, ...updates } = await req.json()
  const { error } = await supabase.from('videos').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req) {
  const supabase = await createAdminClient()
  const { id } = await req.json()
  const { error } = await supabase.from('videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
