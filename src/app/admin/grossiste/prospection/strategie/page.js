'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Mail, MessageCircle, Phone, Clock, ShieldCheck, Target } from 'lucide-react'
import styles from './strategie.module.css'

// --- Principes ---
const PRINCIPES = [
  { t: 'WhatsApp = canal n°1', d: 'Envoi MANUEL, 1 clic, message pré-rempli. Jamais de blast automatique (bannissement). On personnalise l\'enseigne.' },
  { t: 'Le bon argument', d: 'Fabriqué en Tunisie + premium + marge revendeur + réassort rapide (pas d\'import/douane). NE JAMAIS vendre le COD ni la livraison rapide.' },
  { t: 'Texture toujours', d: 'Épais, élastique, opaque, brillant. Jamais liquide/coulant. Le produit est viral (ASMR) — on crée la demande via nos pubs, le revendeur encaisse.' },
  { t: 'Une seule offre claire', d: 'Un message = une demande (catalogue ? échantillon ?). On ne noie pas. On respecte STOP / opt-out immédiatement.' },
]

// --- Séquence ---
const SEQUENCE = [
  { jour: 'J0', canal: 'email', titre: 'E-mail #1 — Prise de contact', but: 'Présenter HK Games + l\'offre grossiste, proposer catalogue ou échantillon.' },
  { jour: 'J0-J1', canal: 'whatsapp', titre: 'WhatsApp #1 — Accroche', but: 'Si numéro mobile : message court en derja, chaleureux. Le canal qui convertit le mieux.' },
  { jour: 'J3', canal: 'email', titre: 'E-mail #2 — Relance', but: 'Rappel + proposition d\'échantillon gratuit. Court.' },
  { jour: 'J5', canal: 'whatsapp', titre: 'WhatsApp #2 — Relance', but: 'Relance derja + échantillon. Dernière relance douce.' },
  { jour: 'J8', canal: 'phone', titre: 'Appel téléphonique', but: 'Pour les numéros fixes (préfixe 7x) : appel direct, pitch 30s.' },
  { jour: 'Stop', canal: 'stop', titre: 'Fin de séquence', but: 'On arrête dès : réponse, opt-out, ou passage en client. Sinon → "inactif".' },
]

// --- Messages ---
const MESSAGES = [
  { id: 'mail1', canal: 'email', titre: 'E-mail #1 (FR)', sujet: 'Slime premium 🇹🇳 fabriqué en Tunisie — pour vos rayons',
    corps: `Bonjour {enseigne},

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium (marque SLIMO).
Notre slime — épais, élastique, ultra satisfaisant — est un produit à très forte rotation : les enfants adorent, c'est l'un des jouets les plus viraux du moment.

En tant que fabricant local, on vous offre :
• des marges revendeur intéressantes,
• un réassort rapide (pas d'import, pas de douane),
• une gamme complète : Unicolore, Bicolore, Slime Buddies,
• un support marketing : nos campagnes créent la demande, vous encaissez les ventes.

Je peux vous envoyer le catalogue + tarifs gros, ou un échantillon gratuit pour {ville}. Vous préférez quoi ?

[Prénom] — HK Games · [téléphone/WhatsApp]
(Pour ne plus recevoir nos e-mails pro, répondez STOP.)` },
  { id: 'wa1', canal: 'whatsapp', titre: 'WhatsApp #1 (derja)', sujet: null,
    corps: `سلام {enseigne} 👋 معاك [الإسم] من HK Games، مصنع سلايم تونسي بريميوم 🇹🇳
سلايم يتجبّد ويعمل الكيف، يمشي برشة مع الصغار 🔥 ونعطيو هامش ربح باهي للموزّعين + ريأسور سريع (صنع في تونس).
نبعثلك الكتالوڭ والأسعار بالجملة، ولا عيّنة باش تجرّب؟` },
  { id: 'mail2', canal: 'email', titre: 'E-mail #2 — Relance (FR)', sujet: 'Re: un échantillon pour {enseigne} ?',
    corps: `Bonjour {enseigne},

Petit rappel 🙂 Le slime SLIMO tourne très bien en rayon. Je peux vous envoyer un échantillon gratuit + la grille de prix gros, sans engagement.
Intéressé pour {ville} ?

[Prénom] — HK Games` },
  { id: 'wa2', canal: 'whatsapp', titre: 'WhatsApp #2 — Relance (derja)', sujet: null,
    corps: `أهلا مجددا 🙂 نجّم نبعثلك عيّنة مجانية باش تشوف الجودة بعينك + قائمة الأسعار بالجملة.
سلايمنا تونسي 100% والريأسور سريع. تحب نبعثلك؟` },
  { id: 'cata', canal: 'whatsapp', titre: 'Après intérêt — Envoi catalogue (derja/FR)', sujet: null,
    corps: `يعيشك! 🙌 هاو الكتالوڭ + الأسعار بالجملة 👇
[lien catalogue / PDF]
نبدا بكمية تجربة صغيرة باش تشوف كيفاش يمشي عندك. تحب نحضّرلك أول طلبية؟` },
  { id: 'devis', canal: 'email', titre: 'Relance devis (FR)', sujet: 'Votre commande {enseigne} — on la lance ?',
    corps: `Bonjour {enseigne},

Suite à notre échange, je vous ai préparé un devis pour démarrer. Je peux bloquer le stock et lancer la livraison dès votre validation.
Une question sur les quantités ou les prix ? Je suis dispo.

[Prénom] — HK Games` },
]

// --- Angles par segment ---
const SEGMENTS = [
  { s: 'Grossiste / distributeur', a: 'Volume + marge + exclusivité régionale possible. Mettre en avant le réassort 48h et l\'absence de rupture (fabrication locale).' },
  { s: 'Magasin / boutique jouets', a: 'Rotation rapide + produit viral. "On crée la demande avec nos pubs, vos clients viennent le chercher."' },
  { s: 'Papeterie / librairie', a: 'Achat d\'impulsion en caisse + pic de la rentrée scolaire. Petits lots, forte marge à l\'unité.' },
  { s: 'E-shop', a: 'Marge revendeur + on fournit les visuels/vidéos marketing. Idéal pour compléter le catalogue jouets.' },
  { s: 'Articles de fête', a: 'Pochettes-surprises, cadeaux d\'anniversaire, lots. Le slime = valeur sûre pour les kits enfants.' },
]

// --- Objections ---
const OBJECTIONS = [
  { o: '"C\'est cher"', r: 'La marge revendeur est confortable et le prix public est maîtrisé. C\'est un produit premium, pas un slime bas de gamme qui sèche en 2 jours.' },
  { o: '"J\'ai déjà un fournisseur"', r: 'Fabriqué en Tunisie = réassort en 48h, zéro rupture liée à l\'import. Vous pouvez tester en complément, sans exclusivité.' },
  { o: '"Est-ce que ça se vend ?"', r: 'C\'est l\'un des jouets les plus viraux (ASMR). On pousse la demande via nos campagnes Meta/TikTok — vos clients arrivent en connaissant déjà le produit.' },
  { o: '"La qualité ?"', r: 'Slime épais, élastique, satisfaisant, qui ne coule pas. Je vous envoie un échantillon gratuit, vous jugez par vous-même.' },
]

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) })
  }
  return (
    <button className={styles.copy} onClick={copy} type="button">
      {done ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
    </button>
  )
}

const ICON = { email: <Mail size={15} />, whatsapp: <MessageCircle size={15} />, phone: <Phone size={15} />, stop: <Clock size={15} /> }

export default function StrategiePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/grossiste/prospection" className={styles.back}><ArrowLeft size={15} /> Prospection</Link>
          <h1 className={styles.title}>Stratégie de prospection</h1>
          <p className={styles.sub}>Le playbook WhatsApp + e-mail que l'équipe suit pour démarcher les revendeurs.</p>
        </div>
      </header>

      {/* Principes */}
      <section className={styles.section}>
        <h2 className={styles.h2}><ShieldCheck size={18} /> Principes</h2>
        <div className={styles.grid2}>
          {PRINCIPES.map((p, i) => (
            <div key={i} className={styles.card}><p className={styles.cardT}>{p.t}</p><p className={styles.cardD}>{p.d}</p></div>
          ))}
        </div>
      </section>

      {/* Séquence */}
      <section className={styles.section}>
        <h2 className={styles.h2}><Clock size={18} /> La séquence (cadence)</h2>
        <div className={styles.timeline}>
          {SEQUENCE.map((s, i) => (
            <div key={i} className={`${styles.step} ${styles['ch_' + s.canal]}`}>
              <div className={styles.stepJour}>{s.jour}</div>
              <div className={styles.stepIcon}>{ICON[s.canal]}</div>
              <div className={styles.stepBody}><p className={styles.stepT}>{s.titre}</p><p className={styles.stepD}>{s.but}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Messages */}
      <section className={styles.section}>
        <h2 className={styles.h2}><MessageCircle size={18} /> Messages prêts à l'emploi</h2>
        <p className={styles.note}>Variables à remplacer : <code>{'{enseigne}'}</code>, <code>{'{ville}'}</code>, <code>[Prénom]</code>, <code>[lien catalogue]</code>.</p>
        <div className={styles.msgs}>
          {MESSAGES.map((m) => (
            <div key={m.id} className={`${styles.msg} ${styles['ch_' + m.canal]}`}>
              <div className={styles.msgHead}>
                <span className={styles.msgCanal}>{ICON[m.canal]} {m.titre}</span>
                <CopyBtn text={(m.sujet ? 'Objet : ' + m.sujet + '\n\n' : '') + m.corps} />
              </div>
              {m.sujet && <p className={styles.msgSujet}><strong>Objet :</strong> {m.sujet}</p>}
              <pre className={styles.msgCorps}>{m.corps}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* Angles segment */}
      <section className={styles.section}>
        <h2 className={styles.h2}><Target size={18} /> Angle par segment</h2>
        <div className={styles.grid2}>
          {SEGMENTS.map((x, i) => (
            <div key={i} className={styles.card}><p className={styles.cardT}>{x.s}</p><p className={styles.cardD}>{x.a}</p></div>
          ))}
        </div>
      </section>

      {/* Objections */}
      <section className={styles.section}>
        <h2 className={styles.h2}>Réponses aux objections</h2>
        <div className={styles.objs}>
          {OBJECTIONS.map((x, i) => (
            <div key={i} className={styles.obj}><p className={styles.objO}>{x.o}</p><p className={styles.objR}>{x.r}</p></div>
          ))}
        </div>
      </section>
    </div>
  )
}
