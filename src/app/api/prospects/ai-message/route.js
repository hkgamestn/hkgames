import { NextResponse } from 'next/server'

// POST /api/prospects/ai-message
// body: { enseigne, segment, ville, gouvernorat, channel: 'email'|'whatsapp', lang: 'fr'|'derja' }
// -> { subject?, body }  (message personnalisé pour un grossiste)

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurée. Ajoute-la dans les variables d\'environnement.' },
      { status: 400 }
    )
  }

  let p
  try { p = await req.json() } catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }) }

  const { enseigne = '', segment = 'grossiste', ville = '', gouvernorat = '', channel = 'email', lang = 'fr' } = p
  if (!enseigne) return NextResponse.json({ error: 'enseigne requise' }, { status: 400 })

  const langLabel = lang === 'derja' ? 'arabe tunisien (derja)' : 'français'
  const channelLabel = channel === 'whatsapp' ? 'WhatsApp (court, chaleureux, 3-4 lignes max)' : 'e-mail B2B (concis, pro)'

  const prompt = `Tu es responsable développement B2B chez HK Games, fabricant TUNISIEN de slime premium (marque SLIMO). Gamme : Unicolore, Bicolore, Slime Buddies. Arguments : fabriqué en Tunisie (réassort rapide, pas d'import/douane), marges revendeur intéressantes, produit viral à forte rotation (les enfants adorent), support marketing. Ne JAMAIS vendre le COD ni la livraison rapide comme argument.

Rédige un message de prospection ${channelLabel} en ${langLabel}, personnalisé pour ce revendeur :
- Enseigne : ${enseigne}
- Type : ${segment}
- Ville : ${ville || 'non précisée'}, ${gouvernorat || ''}

Le message doit donner envie de demander le catalogue/échantillon. Pas de blabla, ton humain, une seule offre claire. ${channel === 'email' ? 'Inclus un objet court et accrocheur.' : ''}

Réponds UNIQUEMENT en JSON, sans markdown : ${channel === 'email' ? '{"subject":"...","body":"..."}' : '{"body":"..."}'}`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6', // ajustable via env
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!r.ok) {
      const t = await r.text()
      return NextResponse.json({ error: 'Anthropic: ' + t.slice(0, 200) }, { status: 502 })
    }

    const data = await r.json()
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
    const clean = text.replace(/```json|```/g, '').trim()

    let parsed
    try { parsed = JSON.parse(clean) } catch { parsed = { body: clean } }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 500 })
  }
}
