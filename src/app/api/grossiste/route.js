import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createAdminClient()
    const body = await req.json()

    // Sanitize
    const allowed = ['company_name','contact_name','phone','email','city','address','matricule_fiscal','estimated_qty','products_wanted','notes']
    const payload = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

    // Basic validation
    if (!payload.company_name || !payload.contact_name || !payload.phone || !payload.matricule_fiscal) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data, error } = await supabase.from('wholesale_requests').insert([payload]).select().single()
    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    console.error('wholesale POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
