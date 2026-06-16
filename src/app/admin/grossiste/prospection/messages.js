// HK Games — Prospection messages — FR uniquement

export function fillVars(t, w = {}) {
  return (t || '')
    .split('{enseigne}').join(w.enseigne || w.contact_name || 'Bonjour')
    .split('{ville}').join(w.ville || w.gouvernorat || 'votre région')
}

// ─── Signature brand ─────────────────────────────────────────
const SIGNATURE = `
──────────────────────────────
🟣 HK Games — Slime Premium Tunisie
📍 Route Tunis km 4, Sfax
🌐 https://www.hap-p-kids.store
📱 WhatsApp : +216 21 660 303
──────────────────────────────`

// ─── E-mails (FR) ────────────────────────────────────────────

export const EMAIL_SEQUENCE = [
  {
    key: 'mail1',
    label: 'E-mail #1 — Prise de contact',
    subject: 'Slime premium fabriqué en Tunisie — pour vos rayons',
    body: `Bonjour {enseigne},

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium.
Notre slime est un produit à très forte rotation chez les enfants.

Toutes nos gammes et informations sont disponibles sur notre site :
👉 https://www.hap-p-kids.store/grossiste

Je peux vous faire parvenir un échantillon gratuit pour tester la qualité par vous-même, sans aucun engagement.

Seriez-vous intéressé ?

Cordialement,
[Prénom]${SIGNATURE}`,
  },
  {
    key: 'mail2',
    label: 'E-mail #2 — Relance',
    subject: 'Re : échantillon gratuit pour {enseigne}',
    body: `Bonjour {enseigne},

Je me permets de revenir vers vous au sujet de notre slime premium HK Games.

Je peux vous envoyer un échantillon gratuit pour juger de la qualité par vous-même.
Toutes les informations et images sont sur : https://www.hap-p-kids.store/grossiste

N'hésitez pas à me répondre.

Cordialement,
[Prénom]${SIGNATURE}`,
  },
  {
    key: 'mail3',
    label: 'E-mail #3 — Dernière relance',
    subject: 'Dernière relance — HK Games',
    body: `Bonjour {enseigne},

Je ne voudrais pas vous importuner davantage. Je reste disponible si vous souhaitez recevoir un échantillon gratuit de nos slimes ou consulter notre offre grossiste.

👉 https://www.hap-p-kids.store/grossiste

Bonne continuation,
[Prénom]${SIGNATURE}`,
  },
]

export const EMAIL_BULK = {
  subject: 'Slime premium fabriqué en Tunisie — échantillon gratuit',
  body: `Bonjour,

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium.
Nos gammes et informations sont disponibles sur : https://www.hap-p-kids.store/grossiste

Nous proposons un échantillon gratuit pour tester la qualité sans engagement.

Cordialement,
[Prénom]${SIGNATURE}`,
}

// ─── WhatsApp (FR) ───────────────────────────────────────────

const WA_SIG = `
— HK Games 🟣
🌐 hap-p-kids.store/grossiste
📍 Route Tunis km 4, Sfax`

export const WA_SEQUENCE = [
  {
    key: 'wa1',
    label: 'WhatsApp #1 — Premier contact',
    body: `Bonjour {enseigne} 👋

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium 🇹🇳

Toutes nos gammes et informations sont sur notre site :
👉 https://www.hap-p-kids.store/grossiste

Je peux vous envoyer un échantillon gratuit pour tester la qualité sans aucun engagement 🎁

Ça vous intéresse ?${WA_SIG}`,
  },
  {
    key: 'wa2',
    label: 'WhatsApp #2 — Relance',
    body: `Bonjour {enseigne} 🙂

Je reviens vers vous au sujet de nos slimes HK Games.
Je peux vous faire parvenir un échantillon gratuit pour juger par vous-même.

Notre site : https://www.hap-p-kids.store/grossiste

N'hésitez pas à me répondre 👍${WA_SIG}`,
  },
  {
    key: 'wa3',
    label: 'WhatsApp #3 — Dernière relance',
    body: `Bonjour {enseigne},

Dernière relance de ma part 😊
Notre offre d'échantillon gratuit est toujours disponible.

Toutes les infos : https://www.hap-p-kids.store/grossiste

Bonne journée !${WA_SIG}`,
  },
]

export const WA_COUNT    = WA_SEQUENCE.length
export const EMAIL_COUNT = EMAIL_SEQUENCE.length
export const emailAt = (step) => EMAIL_SEQUENCE[Math.min(step, EMAIL_SEQUENCE.length - 1)]
export const waAt    = (step) => WA_SEQUENCE[Math.min(step, WA_SEQUENCE.length - 1)]
