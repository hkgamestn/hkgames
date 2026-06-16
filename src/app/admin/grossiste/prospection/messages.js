// HK Games — Prospection : source unique des messages d'outreach.
// Politique : e-mails toujours en FR, messages WhatsApp toujours en derja.

export function fillVars(t, w = {}) {
  return (t || '')
    .split('{enseigne}').join(w.enseigne || w.contact_name || 'سلام')
    .split('{ville}').join(w.ville || w.gouvernorat || 'تونس')
}

// --- E-mails (FR) ---
export const EMAIL_SEQUENCE = [
  {
    key: 'mail1',
    label: 'E-mail #1 — Prise de contact',
    subject: 'Slime premium fabriqué en Tunisie — pour vos rayons',
    body: `Bonjour {enseigne},

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium.
Notre slime est un produit à très forte rotation chez les enfants.

Toutes les infos, gammes et prix sont sur notre site :
👉 https://www.hap-p-kids.store/grossiste

Je peux vous envoyer un échantillon gratuit pour tester la qualité sans engagement.
Vous seriez intéressé ?

[Prénom] — HK Games`,
  },
  {
    key: 'mail2',
    label: 'E-mail #2 — Relance',
    subject: 'Re: échantillon gratuit pour {enseigne}',
    body: `Bonjour {enseigne},

Petit rappel 🙂 Je peux vous envoyer un échantillon gratuit de nos slimes pour tester par vous-même.
Toutes les infos et images sont disponibles ici : https://www.hap-p-kids.store/grossiste

Intéressé ?

[Prénom] — HK Games`,
  },
]

export const EMAIL_BULK = {
  subject: 'Slime premium fabriqué en Tunisie — échantillon gratuit',
  body: `Bonjour,

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium.
Toutes nos gammes, images et prix grossiste sont sur : https://www.hap-p-kids.store/grossiste

Nous proposons un échantillon gratuit pour tester la qualité sans engagement.

[Prénom] — HK Games`,
}

// --- WhatsApp (derja) — simple, centré sur l'échantillon ---
export const WA_SEQUENCE = [
  {
    key: 'wa1',
    label: 'WhatsApp #1 — Accroche échantillon',
    body: `سلام {enseigne} 👋
أنا [الإسم] من HK Games، مصنع سلايم تونسي 🇹🇳

الأسعار والصور كاملة موجودة في موقعنا:
👉 https://www.hap-p-kids.store/grossiste

نقدر نبعثلك عيّنة مجانية باش تجرّب الجودة بعينك — بدون أي التزام 🎁
تحبّ نبعثهالك؟`,
  },
  {
    key: 'wa2',
    label: 'WhatsApp #2 — Relance',
    body: `أهلا مجدّدا {enseigne} 🙂
ما زلت نقدر نبعثلك عيّنة مجانية من السلايم باش تشوف الجودة بعينك.

الموقع: https://www.hap-p-kids.store/grossiste

جاوبني كي تحبّ 👍`,
  },
  {
    key: 'wa3',
    label: 'WhatsApp #3 — Dernière relance',
    body: `سلام {enseigne}، آخر مرة نوجد 😄
العيّنة المجانية ما زالت متاحة ليك.
كل التفاصيل: https://www.hap-p-kids.store/grossiste
قولي كي تكون مستعد 🙏`,
  },
]

export const WA_COUNT    = WA_SEQUENCE.length
export const EMAIL_COUNT = EMAIL_SEQUENCE.length
export const emailAt = (step) => EMAIL_SEQUENCE[Math.min(step, EMAIL_SEQUENCE.length - 1)]
export const waAt    = (step) => WA_SEQUENCE[Math.min(step, WA_SEQUENCE.length - 1)]
