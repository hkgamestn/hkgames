// HK Games — Prospection : source unique des messages d'outreach.
// Politique : e-mails toujours en FR, messages WhatsApp toujours en derja.
// La séquence pioche le message selon le nombre de fois déjà contacté (step).

export function fillVars(t, w = {}) {
  return (t || '')
    .split('{enseigne}').join(w.enseigne || 'votre enseigne')
    .split('{ville}').join(w.ville || w.gouvernorat || 'votre ville')
}

// --- E-mails (FR) — par prospect (personnalisés {enseigne}) ---
export const EMAIL_SEQUENCE = [
  {
    key: 'mail1',
    label: 'E-mail #1 — Prise de contact',
    subject: 'Slime premium fabriqué en Tunisie — pour vos rayons',
    body: `Bonjour {enseigne},

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium (marque SLIMO).
Notre slime — épais, élastique, ultra satisfaisant — est un produit à très forte rotation : les enfants adorent.

En tant que fabricant local, on vous offre :
• des marges revendeur intéressantes,
• un réassort rapide (pas d'import, pas de douane),
• une gamme complète : Unicolore, Bicolore, Slime Buddies,
• un support marketing : nos campagnes créent la demande, vous encaissez les ventes.

Offre grossistes : https://www.hap-p-kids.store/grossiste
Je peux vous envoyer le catalogue + tarifs gros, ou un échantillon. Vous préférez quoi ?

[Prénom] — HK Games
(Pour ne plus recevoir nos e-mails pro, répondez STOP.)`,
  },
  {
    key: 'mail2',
    label: 'E-mail #2 — Relance',
    subject: 'Re: un échantillon pour {enseigne} ?',
    body: `Bonjour {enseigne},

Petit rappel 🙂 Le slime SLIMO tourne très bien en rayon. Je peux vous envoyer un échantillon gratuit + la grille de prix gros, sans engagement.
Intéressé ?

[Prénom] — HK Games`,
  },
]

// --- E-mail groupé (FR) — plusieurs destinataires en copie cachée, pas de {enseigne} ---
export const EMAIL_BULK = {
  subject: 'Slime premium fabriqué en Tunisie — pour vos rayons',
  body: `Bonjour,

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium (marque SLIMO).
Notre slime — épais, élastique, ultra satisfaisant — est un produit à très forte rotation : les enfants adorent.

En tant que fabricant local, on vous offre :
• des marges revendeur intéressantes,
• un réassort rapide (pas d'import, pas de douane),
• une gamme complète : Unicolore, Bicolore, Slime Buddies,
• un support marketing : nos campagnes créent la demande, vous encaissez les ventes.

Offre grossistes : https://www.hap-p-kids.store/grossiste
Je peux vous envoyer le catalogue + tarifs gros, ou un échantillon. Vous préférez quoi ?

[Prénom] — HK Games
(Pour ne plus recevoir nos e-mails pro, répondez STOP.)`,
}

// --- WhatsApp (derja) — par prospect, 1 par 1 ---
export const WA_SEQUENCE = [
  {
    key: 'wa1',
    label: 'WhatsApp #1 — Accroche',
    body: `سلام {enseigne} 👋 أنا [الإسم] من HK Games، مصنع سلايم تونسي بريميوم 🇹🇳
سلايم يتجبّد ويعمل الكيف، يمشي برشة مع الصغار 🔥 + هامش ربح باهي للموزّعين وريأسور سريع (صنع في تونس).
نبعثلك الكتالوڭ والأسعار بالجملة، ولا عيّنة باش تجرّب؟`,
  },
  {
    key: 'wa2',
    label: 'WhatsApp #2 — Relance',
    body: `أهلا مجدّدا 🙂 نجّم نبعثلك عيّنة مجانية باش تشوف الجودة بعينك + قائمة الأسعار بالجملة.
سلايمنا تونسي 100% والريأسور سريع. تحبّ نبعثلك؟`,
  },
  {
    key: 'wa3',
    label: 'WhatsApp #3 — Envoi catalogue',
    body: `يعيشك! 🙌 هاو الكتالوڭ + الأسعار بالجملة 👇
https://www.hap-p-kids.store/grossiste
نبداو بكمية تجربة صغيرة باش تشوف كيفاش يمشي عندك. نحضّرلك أوّل طلبية؟`,
  },
]

export const emailAt = (step = 0) => EMAIL_SEQUENCE[Math.min(step, EMAIL_SEQUENCE.length - 1)]
export const waAt = (step = 0) => WA_SEQUENCE[Math.min(step, WA_SEQUENCE.length - 1)]
export const WA_COUNT = WA_SEQUENCE.length
export const EMAIL_COUNT = EMAIL_SEQUENCE.length
