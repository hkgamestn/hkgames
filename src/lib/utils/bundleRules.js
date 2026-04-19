export function computeBundle(items, discounts = {}) {
  if (!items || items.length === 0) return { discount: 0, bundleType: null, savings: 0 }

  const unicolores = items.filter((i) => i.line === 'unicolore')
  const bicolores  = items.filter((i) => i.line === 'bicolore')
  const buddies    = items.filter((i) => i.line === 'buddies')

  const uniqueU = new Set(unicolores.map((i) => i.color))
  const uniqueB = new Set(buddies.map((i) => i.color))

  const subtotal = items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)

  if (uniqueB.size >= 3) {
    const pct = parseFloat(discounts.famille || 18)
    return { discount: pct, bundleType: 'famille_monstre', savings: parseFloat((subtotal * pct / 100).toFixed(3)) }
  }
  if (bicolores.length >= 3) {
    const pct = parseFloat(discounts.alchimiste || 20)
    return { discount: pct, bundleType: 'alchimiste', savings: parseFloat((subtotal * pct / 100).toFixed(3)) }
  }
  if (uniqueU.size >= 3) {
    const pct = parseFloat(discounts.decouverte || 15)
    return { discount: pct, bundleType: 'decouverte', savings: parseFloat((subtotal * pct / 100).toFixed(3)) }
  }

  return { discount: 0, bundleType: null, savings: 0 }
}

export function getBundleUpsell(items) {
  if (!items || items.length === 0) return null

  const unicolores = items.filter((i) => i.line === 'unicolore')
  const bicolores  = items.filter((i) => i.line === 'bicolore')
  const buddies    = items.filter((i) => i.line === 'buddies')

  const uniqueU = new Set(unicolores.map((i) => i.color))
  const uniqueB = new Set(buddies.map((i) => i.color))

  if (uniqueB.size === 2)
    return { message: "Ajoute 1 Buddy d'une autre couleur -> Pack Famille Monstre (-18%) !", type: 'buddies' }
  if (uniqueB.size === 1)
    return { message: "Ajoute 2 Buddies de couleurs differentes -> Pack Famille Monstre (-18%) !", type: 'buddies' }
  if (bicolores.length === 2)
    return { message: "Ajoute le 3eme Bicolore -> Pack Alchimiste (-20%) !", type: 'bicolore' }
  if (bicolores.length === 1)
    return { message: "Ajoute 2 Bicolores -> Pack Alchimiste (-20%) !", type: 'bicolore' }
  if (uniqueU.size === 2)
    return { message: "Ajoute 1 Unicolore d'une autre couleur -> Pack Decouverte (-15%) !", type: 'unicolore' }
  if (uniqueU.size === 1)
    return { message: "Ajoute 2 Unicolores de couleurs differentes -> Pack Decouverte (-15%) !", type: 'unicolore' }

  return null
}

export const BUNDLE_LABELS = {
  decouverte:      'Pack Decouverte active !',
  alchimiste:      'Pack Alchimiste active !',
  famille_monstre: 'Famille Monstre active !',
}

export function getBundleProgress(items, discounts = {}) {
  if (!items || items.length === 0) return []

  const unicolores = items.filter((i) => i.line === 'unicolore')
  const bicolores  = items.filter((i) => i.line === 'bicolore')
  const buddies    = items.filter((i) => i.line === 'buddies')

  const uniqueU = new Set(unicolores.map((i) => i.color))
  const uniqueB = new Set(buddies.map((i) => i.color))

  const subtotal = items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)
  const TARGET = 3

  const famillePct    = parseFloat(discounts.famille    || 18)
  const alchimistePct = parseFloat(discounts.alchimiste || 20)
  const decouvPct     = parseFloat(discounts.decouverte || 15)

  const estSavingsFamille    = parseFloat((subtotal * famillePct    / 100).toFixed(3))
  const estSavingsAlchimiste = parseFloat((subtotal * alchimistePct / 100).toFixed(3))
  const estSavingsDecouverte = parseFloat((subtotal * decouvPct     / 100).toFixed(3))

  const bundles = []

  if (buddies.length > 0) {
    const current = Math.min(uniqueB.size, TARGET)
    const done    = current >= TARGET
    bundles.push({
      id: 'famille_monstre', emoji: '', label: 'Pack Famille Monstre',
      pct: famillePct, shopPath: '/shop/buddies', shopLabel: 'Ajouter un Buddy',
      current, target: TARGET, done, remaining: Math.max(0, TARGET - current),
      estSavings: estSavingsFamille,
      circles: Array.from({ length: TARGET }, (_, i) => ({ filled: i < current, color: Array.from(uniqueB)[i] || null })),
      getMessage: () => {
        if (done) return 'Pack Famille Monstre active ! Tu economies ~' + estSavingsFamille.toFixed(1) + ' DT'
        if (current === 2) return 'Plus que 1 Buddy dune autre couleur !'
        if (current === 1) return 'Plus que 2 Buddies de couleurs differentes'
        return 'Ajoute 3 Buddies de couleurs differentes -> -' + famillePct + '%'
      },
    })
  }

  if (bicolores.length > 0) {
    const current = Math.min(bicolores.length, TARGET)
    const done    = current >= TARGET
    bundles.push({
      id: 'alchimiste', emoji: '', label: 'Pack Alchimiste',
      pct: alchimistePct, shopPath: '/shop/bicolore', shopLabel: 'Ajouter un Bicolore',
      current, target: TARGET, done, remaining: Math.max(0, TARGET - current),
      estSavings: estSavingsAlchimiste,
      circles: Array.from({ length: TARGET }, (_, i) => ({ filled: i < current, color: bicolores[i]?.color || null })),
      getMessage: () => {
        if (done) return 'Pack Alchimiste active ! Tu economies ~' + estSavingsAlchimiste.toFixed(1) + ' DT'
        if (current === 2) return 'Plus que 1 Bicolore !'
        if (current === 1) return 'Plus que 2 Bicolores'
        return 'Ajoute 3 Bicolores -> -' + alchimistePct + '%'
      },
    })
  }

  if (unicolores.length > 0) {
    const current = Math.min(uniqueU.size, TARGET)
    const done    = current >= TARGET
    bundles.push({
      id: 'decouverte', emoji: '', label: 'Pack Decouverte',
      pct: decouvPct, shopPath: '/shop/unicolore', shopLabel: 'Ajouter un Unicolore',
      current, target: TARGET, done, remaining: Math.max(0, TARGET - current),
      estSavings: estSavingsDecouverte,
      circles: Array.from({ length: TARGET }, (_, i) => ({ filled: i < current, color: Array.from(uniqueU)[i] || null })),
      getMessage: () => {
        if (done) return 'Pack Decouverte active ! Tu economies ~' + estSavingsDecouverte.toFixed(1) + ' DT'
        if (current === 2) return 'Plus que 1 Unicolore dune autre couleur !'
        if (current === 1) return 'Plus que 2 Unicolores de couleurs differentes'
        return 'Ajoute 3 Unicolores differents -> -' + decouvPct + '%'
      },
    })
  }

  bundles.sort((a, b) => {
    if (a.done && !b.done) return -1
    if (!a.done && b.done) return 1
    return b.current - a.current
  })

  return bundles
}
