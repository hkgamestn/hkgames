'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Mail, MessageCircle, Phone, Clock, ShieldCheck, Target } from 'lucide-react'
import styles from './strategie.module.css'

// --- Principes ---
const PRINCIPES = [
  { t: 'WhatsApp = canal n°1', d: 'Envoi MANUEL, 1 clic, message pré-rempli. Jamais de blast automatique (bannissement). On personnalise l\'enseigne.' },
  { t: 'Le bon argument', d: 'Fabriqué en Tunisie + premium + marge revendeur + réassort rapide (pas d\'import/douane). NE JAMAIS vendre le COD ni la livraison rapide.' },
  { t: 'Texture toujours', d: 'Épais, élastique, opaque, brillant. Jamais liquide/coulant. Produit viral (ASMR) — on crée la demande via nos pubs, le revendeur encaisse.' },
  { t: 'Une seule offre claire', d: 'Un message = une demande (catalogue ? échantillon ?). On respecte STOP / opt-out immédiatement.' },
]

// --- Séquence ---
const SEQUENCE = [
  { jour: 'J0', canal: 'email', titre: 'E-mail #1 — Prise de contact', but: 'Présenter HK Games + l\'offre grossiste, proposer catalogue ou échantillon.' },
  { jour: 'J0-J1', canal: 'whatsapp', titre: 'WhatsApp #1 — Accroche', but: 'Si numéro mobile : message court, chaleureux. Le canal qui convertit le mieux.' },
  { jour: 'J3', canal: 'email', titre: 'E-mail #2 — Relance', but: 'Rappel + proposition d\'échantillon gratuit. Court.' },
  { jour: 'J5', canal: 'whatsapp', titre: 'WhatsApp #2 — Relance', but: 'Relance + échantillon. Dernière relance douce.' },
  { jour: 'J8', canal: 'phone', titre: 'Appel téléphonique', but: 'Pour les numéros fixes (préfixe 7x) : appel direct, pitch 30s.' },
  { jour: 'Stop', canal: 'stop', titre: 'Fin de séquence', but: 'On arrête dès : réponse, opt-out, ou passage en client. Sinon → "inactif".' },
]

// --- Messages (FR + Derja) ---
const MESSAGES = [
  { id: 'mail1', canal: 'email', titre: 'E-mail #1 — Prise de contact',
    fr: { sujet: 'Slime premium 🇹🇳 fabriqué en Tunisie — pour vos rayons',
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
    dj: { sujet: 'سلايم تونسي بريميوم 🇹🇳 — للبيع في محلكم',
      corps: `سلام {enseigne}،

أنا [الإسم] من HK Games، مصنع سلايم تونسي بريميوم (ماركة SLIMO).
السلايم متاعنا يتجبّد، إيلاستيك، يعمل الكيف — يمشي برشة مع الصغار وهو من أكثر الألعاب الـviral توا.

بما إنّنا مصنع محلّي، نوفّرولكم:
• هامش ربح باهي للموزّع،
• ريأسور سريع (بلا توريد، بلا ديوانة)،
• ڭامة كاملة: Unicolore، Bicolore، Slime Buddies،
• دعم ماركتينڨ: إحنا نعملو الطلب بالإشهارات، إنتو تبيعو.

نجّم نبعثلك الكتالوڭ + الأسعار بالجملة، ولا عيّنة مجانية لـ{ville}. شنوّا تحبّ؟

[الإسم] — HK Games · [الهاتف/واتساب]
(باش ما تعودش تجيك إيميلات، جاوب STOP.)` } },

  { id: 'wa1', canal: 'whatsapp', titre: 'WhatsApp #1 — Accroche',
    fr: { sujet: null,
      corps: `Bonjour {enseigne} 👋 [Prénom] de HK Games, fabricant tunisien de slime premium 🇹🇳
Slime épais et satisfaisant, qui tourne très bien avec les enfants 🔥 + bonne marge revendeur et réassort rapide (fabriqué en Tunisie).
Je vous envoie le catalogue et les prix gros, ou un échantillon à tester ?` },
    dj: { sujet: null,
      corps: `سلام {enseigne} 👋 معاك [الإسم] من HK Games، مصنع سلايم تونسي بريميوم 🇹🇳
سلايم يتجبّد ويعمل الكيف، يمشي برشة مع الصغار 🔥 + هامش ربح باهي للموزّع وريأسور سريع (صنع في تونس).
نبعثلك الكتالوڭ والأسعار بالجملة، ولا عيّنة باش تجرّب؟` } },

  { id: 'mail2', canal: 'email', titre: 'E-mail #2 — Relance',
    fr: { sujet: 'Re: un échantillon pour {enseigne} ?',
      corps: `Bonjour {enseigne},

Petit rappel 🙂 Le slime SLIMO tourne très bien en rayon. Je peux vous envoyer un échantillon gratuit + la grille de prix gros, sans engagement.
Intéressé pour {ville} ?

[Prénom] — HK Games` },
    dj: { sujet: 'تذكير: عيّنة لـ{enseigne} ؟',
      corps: `سلام {enseigne}،

تذكير صغير 🙂 سلايم SLIMO يمشي برشة في الرّفّ. نجّم نبعثلك عيّنة مجانية + قائمة الأسعار بالجملة، بلا أي التزام.
يهمّك لـ{ville} ؟

[الإسم] — HK Games` } },

  { id: 'wa2', canal: 'whatsapp', titre: 'WhatsApp #2 — Relance',
    fr: { sujet: null,
      corps: `Rebonjour 🙂 Je peux vous envoyer un échantillon gratuit pour juger la qualité + la liste des prix gros.
C'est du slime 100% tunisien avec un réassort rapide. Je vous l'envoie ?` },
    dj: { sujet: null,
      corps: `أهلا مجدّدا 🙂 نجّم نبعثلك عيّنة مجانية باش تشوف الجودة بعينك + قائمة الأسعار بالجملة.
سلايمنا تونسي 100% والريأسور سريع. تحبّ نبعثلك؟` } },

  { id: 'cata', canal: 'whatsapp', titre: 'Après intérêt — Envoi catalogue',
    fr: { sujet: null,
      corps: `Super ! 🙌 Voici le catalogue + les prix gros 👇
[lien catalogue / PDF]
On peut commencer par une petite quantité de test pour voir comment ça tourne chez vous. Je vous prépare une première commande ?` },
    dj: { sujet: null,
      corps: `يعيشك! 🙌 هاو الكتالوڭ + الأسعار بالجملة 👇
[lien catalogue / PDF]
نبداو بكمية تجربة صغيرة باش تشوف كيفاش يمشي عندك. نحضّرلك أوّل طلبية؟` } },

  { id: 'devis', canal: 'email', titre: 'Relance devis',
    fr: { sujet: 'Votre commande {enseigne} — on la lance ?',
      corps: `Bonjour {enseigne},

Suite à notre échange, je vous ai préparé un devis pour démarrer. Je peux bloquer le stock et lancer la livraison dès votre validation.
Une question sur les quantités ou les prix ? Je suis dispo.

[Prénom] — HK Games` },
    dj: { sujet: 'الطلبية متاع {enseigne} — نلانسيوها؟',
      corps: `سلام {enseigne}،

بعد الحديث متاعنا، حضّرتلك devis باش نبداو. نجّم نحجزلك الستوك ونلانسي التوصيل كيف تأكّد.
عندك سؤال على الكميات ولا الأسعار؟ أنا موجود.

[الإسم] — HK Games` } },
]

// --- Angles segment ---
const SEGMENTS = [
  { s: 'Grossiste / distributeur', a: 'Volume + marge + exclusivité régionale possible. Réassort 48h, zéro rupture (fabrication locale).' },
  { s: 'Magasin / boutique jouets', a: 'Rotation rapide + produit viral. "On crée la demande avec nos pubs, vos clients viennent le chercher."' },
  { s: 'Papeterie / librairie', a: 'Achat d\'impulsion en caisse + pic de la rentrée scolaire. Petits lots, forte marge à l\'unité.' },
  { s: 'E-shop', a: 'Marge revendeur + on fournit les visuels/vidéos marketing. Complète le catalogue jouets.' },
  { s: 'Articles de fête', a: 'Pochettes-surprises, cadeaux d\'anniversaire, lots. Le slime = valeur sûre pour les kits enfants.' },
]

// --- Objections (FR + Derja) ---
const OBJECTIONS = [
  { o: '"C\'est cher"', fr: 'La marge revendeur est confortable et le prix public est maîtrisé. C\'est du premium, pas un slime bas de gamme qui sèche en 2 jours.', dj: 'الهامش متاع الموزّع مريّح والسوم للعموم مظبوط. هاذا بريميوم، موش سلايم رخيص يتيبّس في يومين.' },
  { o: '"J\'ai déjà un fournisseur"', fr: 'Fabriqué en Tunisie = réassort en 48h, zéro rupture d\'import. Testez en complément, sans exclusivité.', dj: 'صنع في تونس = ريأسور في 48 ساعة، بلا انقطاع متاع التوريد. جرّب معانا زيادة، بلا إكسكلوزيفيتي.' },
  { o: '"Est-ce que ça se vend ?"', fr: 'C\'est l\'un des jouets les plus viraux (ASMR). On pousse la demande via nos pubs — vos clients arrivent en connaissant déjà le produit.', dj: 'من أكثر الألعاب الـviral (ASMR). إحنا نزيدو في الطلب بالإشهارات — الكليان يجي وهو يعرف المنتوج.' },
  { o: '"La qualité ?"', fr: 'Slime épais, élastique, satisfaisant, qui ne coule pas. Je vous envoie un échantillon gratuit, vous jugez.', dj: 'سلايم يتجبّد، إيلاستيك، يعمل الكيف وما يسيلش. نبعثلك عيّنة مجانية وتحكم بروحك.' },
]

function CopyBtn({ text, label = 'Copier' }) {
  const [done, setDone] = useState(false)
  function copy() { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) }) }
  return <button className={styles.copy} onClick={copy} type="button">{done ? <><Check size={13} /> Copié</> : <><Copy size={13} /> {label}</>}</button>
}

const ICON = { email: <Mail size={15} />, whatsapp: <MessageCircle size={15} />, phone: <Phone size={15} />, stop: <Clock size={15} /> }

function MessageCard({ m }) {
  const [lang, setLang] = useState(m.canal === 'whatsapp' ? 'dj' : 'fr')
  const v = m[lang]
  return (
    <div className={`${styles.msg} ${styles['ch_' + m.canal]}`}>
      <div className={styles.msgHead}>
        <span className={styles.msgCanal}>{ICON[m.canal]} {m.titre}</span>
        <div className={styles.langTabs}>
          <button className={lang === 'fr' ? styles.langOn : ''} onClick={() => setLang('fr')} type="button">FR</button>
          <button className={lang === 'dj' ? styles.langOn : ''} onClick={() => setLang('dj')} type="button">Derja</button>
        </div>
      </div>
      {v.sujet && <p className={styles.msgSujet}><strong>Objet :</strong> {v.sujet}</p>}
      <pre className={`${styles.msgCorps} ${lang === 'dj' ? styles.rtl : ''}`}>{v.corps}</pre>
      <div className={styles.msgFoot}>
        <CopyBtn text={(v.sujet ? (lang === 'fr' ? 'Objet : ' : '') + v.sujet + '\n\n' : '') + v.corps} label={`Copier ${lang === 'fr' ? 'FR' : 'Derja'}`} />
      </div>
    </div>
  )
}

export default function StrategiePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/admin/grossiste/prospection" className={styles.back}><ArrowLeft size={15} /> Prospection</Link>
        <h1 className={styles.title}>Stratégie de prospection</h1>
        <p className={styles.sub}>Le playbook WhatsApp + e-mail (FR & derja) que l'équipe suit pour démarcher les revendeurs.</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.h2}><ShieldCheck size={18} /> Principes</h2>
        <div className={styles.grid2}>{PRINCIPES.map((p, i) => <div key={i} className={styles.card}><p className={styles.cardT}>{p.t}</p><p className={styles.cardD}>{p.d}</p></div>)}</div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}><Clock size={18} /> La séquence (cadence)</h2>
        <div className={styles.timeline}>
          {SEQUENCE.map((s, i) => (
            <div key={i} className={`${styles.step} ${styles['ch_' + s.canal]}`}>
              <div className={styles.stepJour}>{s.jour}</div><div className={styles.stepIcon}>{ICON[s.canal]}</div>
              <div className={styles.stepBody}><p className={styles.stepT}>{s.titre}</p><p className={styles.stepD}>{s.but}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}><MessageCircle size={18} /> Messages prêts (FR + Derja)</h2>
        <p className={styles.note}>Bascule <strong>FR / Derja</strong> sur chaque message. Variables : <code>{'{enseigne}'}</code>, <code>{'{ville}'}</code>, <code>[Prénom]</code>, <code>[lien catalogue]</code>.</p>
        <div className={styles.msgs}>{MESSAGES.map((m) => <MessageCard key={m.id} m={m} />)}</div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}><Target size={18} /> Angle par segment</h2>
        <div className={styles.grid2}>{SEGMENTS.map((x, i) => <div key={i} className={styles.card}><p className={styles.cardT}>{x.s}</p><p className={styles.cardD}>{x.a}</p></div>)}</div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Réponses aux objections (FR + Derja)</h2>
        <div className={styles.objs}>
          {OBJECTIONS.map((x, i) => (
            <div key={i} className={styles.obj}>
              <p className={styles.objO}>{x.o}</p>
              <p className={styles.objR}><span className={styles.objLang}>FR</span> {x.fr}</p>
              <p className={`${styles.objR} ${styles.rtl}`}><span className={styles.objLang}>درجة</span> {x.dj}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
