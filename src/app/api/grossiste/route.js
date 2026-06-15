import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createAdminClient()
    const body     = await req.json()

    const allowed = [
      'company_name','contact_name','phone','email','city','address',
      'matricule_fiscal','estimated_qty','products_wanted','notes','request_type'
    ]
    const payload = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

    // Valider les champs obligatoires (matricule_fiscal non obligatoire pour échantillon)
    const isSample = payload.request_type === 'sample'
    if (!payload.contact_name || !payload.phone || !payload.city) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (!isSample && !payload.matricule_fiscal) {
      return NextResponse.json({ error: 'Matricule fiscal requis pour commande en gros' }, { status: 400 })
    }

    payload.request_type = payload.request_type || 'wholesale'
    payload.status       = 'new'

    const { data, error } = await supabase.from('wholesale_requests').insert([payload]).select().single()
    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    console.error('wholesale POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
