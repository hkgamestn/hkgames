// Supabase Edge Function — prospect-sequencer
// Fait avancer les séquences de prospection. À planifier (cron) 1x/jour.
// ENV requis : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ENV optionnels : RESEND_API_KEY + FROM_EMAIL (sinon les emails passent en "manual_pending")
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const fill = (tpl, p) =>
  (tpl || '')
    .replaceAll('{enseigne}', p.enseigne || '')
    .replaceAll('{ville}', p.ville || '')
    .replaceAll('{gouvernorat}', p.gouvernorat || '')

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  )
  const RESEND = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('FROM_EMAIL') || 'HK Games <pro@hap-p-kids.store>'
  const now = new Date().toISOString()
  const MAX_PER_RUN = 40 // throttle anti-spam

  // étapes de séquence (ordonnées)
  const { data: steps } = await supabase
    .from('prospect_sequence_steps').select('*').eq('active', true).order('step_order')

  // prospects dûs
  const { data: due } = await supabase
    .from('wholesale_prospects')
    .select('*')
    .eq('sequence_active', true).eq('opt_out', false)
    .is('replied_at', null)
    .not('stage', 'in', '("client","inactif")')
    .lte('next_action_at', now)
    .limit(MAX_PER_RUN)

  let processed = 0, emailed = 0, manual = 0

  for (const p of due || []) {
    const idx = p.sequence_step || 0
    const step = steps?.[idx]
    if (!step) { // séquence terminée
      await supabase.from('wholesale_prospects').update({ sequence_active: false }).eq('id', p.id)
      continue
    }

    const subject = fill(step.subject, p)
    const body = fill(step.body, p)
    let status = 'manual_pending'

    if (step.channel === 'email' && RESEND && p.email) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM, to: p.email, subject, text: body }),
        })
        status = r.ok ? 'sent' : 'failed'
        if (r.ok) emailed++
      } catch { status = 'failed' }
    } else {
      // whatsapp = toujours manuel (anti-ban) ; email sans provider = manuel aussi
      manual++
    }

    await supabase.from('prospect_messages').insert({
      prospect_id: p.id, channel: step.channel, step: idx, subject, body,
      status, sent_at: status === 'sent' ? now : null,
    })

    // planifier l'étape suivante
    const next = steps?.[idx + 1]
    const update = { sequence_step: idx + 1 }
    if (next) {
      const d = new Date(); d.setDate(d.getDate() + (next.delay_days || 0))
      update.next_action_at = d.toISOString()
    } else {
      update.sequence_active = false
    }
    if (status === 'sent' && p.stage === 'a_contacter') update.stage = 'contacte'
    await supabase.from('wholesale_prospects').update(update).eq('id', p.id)
    processed++
  }

  return new Response(JSON.stringify({ processed, emailed, manual }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
