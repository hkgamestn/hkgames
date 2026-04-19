# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📄 PRD — HK Games Slime Store v3
# E-Commerce DTC · Slime Artisanal · Tunisie
# Stack : Next.js 15 · JavaScript · Supabase · Vercel
# Version : FINALE — Production-Ready — Livraison complète J1
# Repo : github.com/[org]/hk-games-slime-store
# Vercel : hk-games-slime → hkgames.tn
# Supabase : Projet dédié "hkgames-slime"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 0. INFRASTRUCTURE STANDALONE

```
GitHub Repo    → github.com/[org]/hk-games-slime-store   (privé)
Vercel Project → hk-games-slime.vercel.app  →  hkgames.tn
Supabase       → Projet dédié "hkgames-slime" (pas de multi-tenant)
Domaine        → hkgames.tn  (à configurer dans Vercel DNS)
```

Ce projet est **entièrement autonome** : son propre repo GitHub, son propre projet Vercel,
son propre projet Supabase. Aucune dépendance à un monorepo tiers.

---

## 1. EXECUTIVE SUMMARY

HK Games Slime Store v3 est le **leader incontesté du slime artisanal en Tunisie**.
Ce n'est pas une boutique en ligne ordinaire — c'est un terrain de jeu sensoriel numérique
où chaque enfant et parent tunisien vit une expérience magique avant même de toucher le produit.

L'expérience d'achat rivalise avec les meilleurs DTC brands mondiaux (Popmart, Gymshark,
Liquid Death) tout en parlant le langage émotionnel de la famille tunisienne :
confiance, cadeau, livraison à domicile, paiement à la livraison.

Chaque décision de design est justifiée par la psychologie d'achat tunisienne :
- 85% du trafic est mobile → mobile-first absolu
- Méfiance du paiement en ligne → COD mis en avant dès le header
- Décision d'achat émotionnelle → animations, couleurs, social proof
- Besoin de réassurance → avis avec photos, compteur ventes, badge "Sérieux"

### KPIs Cibles (90 jours post-lancement)

| Métrique | Cible | Benchmark TN |
|----------|-------|--------------|
| CVR | ≥ 4% | 2,1% |
| AOV | ≥ 45 DT | 28 DT |
| Taux abandon panier | < 35% | 68% |
| Taux récupération abandon (appel) | ≥ 30% | — |
| Temps session moyen | > 3 min | 1,2 min |
| ROAS Facebook Ads | ≥ 3,5x | 2x |
| NPS Client | ≥ 65 | 40 |

---

## 2. DESIGN SYSTEM — CLAYMORPHISM GEN-Z

```
+------------------------------------------------------------------------+
|  TARGET: HK Games Slime Store v3 — DESIGN SYSTEM FINAL                |
+------------------------------------------------------------------------+
|  PATTERN: Immersive DTC E-Commerce — Dark Sensory                     |
|    Structure: Splash → Hero → Labo → Catalogue → Fiche →              |
|               Panier → Checkout → Confirmation                         |
|                                                                         |
|  STYLE: Claymorphism Gen-Z + Dark Base Aurora                          |
|    Keywords: Playful · Immersif · Sensoriel · Trustworthy · Vibrant    |
|    Best For: E-commerce enfants, jouets, collectibles, DTC             |
|    Performance: Good | Accessibility: WCAG AA                          |
|                                                                         |
|  COLORS:                                                                |
|    Primary:    #a855f7  (Violet Électrique)                            |
|    Secondary:  #ec4899  (Rose Bubblegum)                               |
|    Accent:     #06b6d4  (Teal Lumineux)                                |
|    CTA:        #fbbf24  (Jaune Solaire — tous boutons d'achat)         |
|    Success:    #10b981  (Vert Slime)                                   |
|    Danger:     #ef4444  (Rouge Alerte)                                 |
|    Background: #0f0a1e / #1a1030 (Dark Deep Purple)                   |
|    Text:       #f8f9ff  (Blanc Lavande)                                |
|    Text muted: #c4b5fd                                                 |
|                                                                         |
|  TYPOGRAPHY: Nunito (titres) / Inter (body)                            |
|    Nunito 700/800/900 → Titres, CTA, badges (énergie, arrondi)        |
|    Inter 400/500/600  → Prix, descriptions, formulaires (clarté)       |
|                                                                         |
|  KEY EFFECTS:                                                           |
|    Blob Morphing CSS lent en background                                |
|    Spring Physics (react-spring) pour toutes les interactions          |
|    Canvas API : Magic Mix + Buddy Builder                              |
|    canvas-confetti au AddToCart + Confirmation                         |
|    Glassmorphism cards : backdrop-filter blur(12px)                    |
|    border: 1px solid rgba(168,85,247,0.2)                              |
|    box-shadow layered pour depth 3D sur product cards                  |
|                                                                         |
|  AVOID:                                                                 |
|    Light mode (rompt l'immersion)                                      |
|    Serif fonts (trop formel)                                           |
|    Animations > 500ms (réseau 3G tunisien)                             |
|    Réductions en % → toujours en DT économisés                        |
|    Multi-pages au checkout                                              |
|    Images non-optimisées                                               |
|                                                                         |
|  STACK:                                                                 |
|    Next.js 15 App Router · JavaScript uniquement (.js/.jsx)            |
|    CSS Modules + CSS Custom Properties                                 |
|    Framer Motion + react-spring + canvas-confetti                      |
|    HTML5 Canvas API                                                    |
|    Lucide React (icons — jamais d'emojis structurels)                  |
|    next/image (WebP auto, lazy load, dimensions explicites)            |
|    Supabase JS SDK v2 + Realtime + Storage                             |
|    Vercel (Edge Functions)                                             |
+------------------------------------------------------------------------+
```

### CSS Custom Properties (globals.css)

```css
:root {
  --color-primary:        #a855f7;
  --color-primary-hover:  #9333ea;
  --color-secondary:      #ec4899;
  --color-accent:         #06b6d4;
  --color-cta:            #fbbf24;
  --color-cta-hover:      #f59e0b;
  --color-success:        #10b981;
  --color-danger:         #ef4444;

  --bg-base:              #0f0a1e;
  --bg-surface:           #1a1030;
  --bg-card:              rgba(26, 16, 48, 0.85);
  --bg-card-border:       rgba(168, 85, 247, 0.2);

  --text-primary:         #f8f9ff;
  --text-secondary:       #c4b5fd;
  --text-muted:           #7c6fa8;

  --space-1:4px;  --space-2:8px;   --space-3:12px;
  --space-4:16px; --space-6:24px;  --space-8:32px;
  --space-10:40px;--space-12:48px; --space-16:64px;

  --radius-sm:8px; --radius-md:16px; --radius-lg:24px; --radius-xl:32px;

  --shadow-card:   0 8px 32px rgba(168,85,247,0.15), 0 2px 8px rgba(0,0,0,0.3);
  --shadow-button: 0 4px 15px rgba(251,191,36,0.4);

  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. USER PERSONAS

### Persona 1 — "La Maman Connectée" (Décisionnaire principale)

**Profil :** Femme 28–45 ans · Tunis/Sousse/Sfax · Classe moyenne · 1-3 enfants  
**Appareils :** iPhone ou Android mid-range · 100% mobile  
**Canaux :** Instagram Stories · Facebook Marketplace · WhatsApp groupes mamans

**Jobs-To-Be-Done :**
- Trouver un cadeau original pour l'anniversaire de son enfant
- S'assurer que le produit est sûr (non-toxique)
- Éviter les arnaques — méfiance naturelle du paiement en ligne
- Recevoir le colis rapidement sans se déplacer

**Freins → Solutions :**
- "Je ne veux pas payer en ligne" → COD mis en avant dès le header avec badge vert
- "Est-ce que c'est sérieux ?" → Avis avec photos · compteur ventes · adresse physique
- "Combien coûte la livraison ?" → Livraison gratuite dès X DT visible dès l'arrivée
- "Ça va arriver quand ?" → Timer "Commandez avant 18h → Livraison demain à Tunis"

**Trigger principal :** Voir un avis avec photo d'un enfant qui sourit

---

### Persona 2 — "L'Enfant Prescripteur" (Influenceur interne)

**Profil :** Fille/Garçon 7–14 ans · Tablette ou smartphone de maman  
**Canaux :** TikTok · YouTube · Bouche à oreille école

**Jobs-To-Be-Done :**
- Avoir le slime que ses copains ont / quelque chose d'unique
- Personnaliser (couleur, nom, yeux) — "c'est MON slime"
- Montrer à ses copains sur TikTok/WhatsApp

**Trigger principal :** L'animation interactive — il joue avec avant d'acheter

---

### Persona 3 — "L'Acheteur Cadeau" (Papa/Tonton/Cousine)

**Profil :** Homme/Femme 25–55 ans · Toutes villes  
**Comportement :** Décision rapide · Budget limité · Veut pas se tromper

**Trigger principal :** Section "Packs Cadeaux" + badge "✅ Livraison demain à Tunis"

---

## 4. USER JOURNEY COMPLET

```
DISCOVERY
  Facebook/Instagram Ad → Landing Page
  TikTok → QR Code → Homepage
  Bouche à oreille → Homepage direct

  ↓

HOMEPAGE
  Splash animation blob → Logo révélé (1,5s · une seule fois par session)
  Hero cinématique : tagline + 3 produits hero
  Laboratoire du Slimeur (3 étapes gamifiées → AddToCart direct)
  Social Proof : compteur live · toasts achats · galerie UGC
  Catalogue preview 3 lignes
  Bundle Builder teaser

  ↓

CATALOGUE (/shop)
  Tabs : Tous | Unicolore | Bicolore | Buddies
  Color filter multi-select
  Cards avec hover 3D · badges stock live Supabase Realtime

  ↓

FICHE PRODUIT (/produit/[slug])
  Galerie photos swipeable
  Color Picker interactif (Unicolore) → fond page suit la couleur
  Animation Mélange Magique Canvas (Bicolore)
  Buddy Builder Canvas + générateur de nom (Buddies)
  Bloc urgence : stock · viewers · timer livraison
  Avis clients avec photos
  Cross-sell contextuel
  Bouton ATC → Confetti burst

  ↓

PANIER (/panier)
  Items · Bundle Builder dynamique · Cross-sell
  Barre progression livraison gratuite (animation liquide slime)
  CTA "Commander"

  ↓

CHECKOUT (/commander) — 1 PAGE
  ★ TRIGGER PENDING ORDER : dès que le téléphone est saisi et valide
    → INSERT orders (status: 'pending') dans Supabase
    → Web Push Notification envoyée à l'admin
      (barre système mobile + son "Commande en attente !")
    → Si le client quitte → ordre reste pending → admin voit dans dashboard
    → Si le client continue et valide → status passe à 'confirmed'

  Champs : Prénom · Nom · Téléphone · Adresse · Gouvernorat · Notes
  Sidebar sticky : résumé + total + badge COD
  Bouton "Confirmer ma commande" → Server Action

  ↓

CONFIRMATION (/merci?id=[order_id])
  Confetti grand format
  Numéro commande #HK-XXXX
  Résumé commande
  OTO : "Ajoute 1 Buddy pour +12 DT !"
  Partage WhatsApp (si Buddy dans commande)

  ↓

GESTION ADMIN (/admin)
  L'admin appelle le client pour confirmation
  Si joint + confirmé → status "confirmed" → Navex API déclenché
  Si injoignable ou annulé → status "cancelled" ou "on_hold"
    (bouton dans dashboard : Annuler · Mettre en attente · Supprimer · Modifier)
```

---

## 5. SITEMAP

```
hkgames.tn/
├── /                          Homepage
├── /shop                      Catalogue complet
│   ├── /shop/unicolore        Catalogue Unicolore
│   ├── /shop/bicolore         Catalogue Bicolore
│   └── /shop/buddies          Catalogue Buddies
├── /produit/[slug]            Fiche produit
├── /panier                    Panier
├── /commander                 Checkout COD 1-page
├── /merci                     Confirmation + OTO
├── /avis                      Galerie UGC + avis
└── /admin                     Dashboard Admin (auth)
    ├── /admin/commandes        Gestion commandes
    ├── /admin/produits         CRUD produits + stocks
    ├── /admin/analytics        Métriques
    └── /admin/parametres       Config générale
```

---

## 6. GAMME PRODUIT — SPÉCIFICATIONS COMPLÈTES

### LIGNE 1 — SLIME UNICOLORE

| Attribut | Valeur |
|----------|--------|
| Poids | 170g |
| Couleurs | Rouge #ef4444 · Bleu #3b82f6 · Jaune #eab308 · Vert #22c55e · Rose #ec4899 · Violet #a855f7 |
| Positionnement | "Mon slime, ma couleur" |
| Slug pattern | `unicolore-rouge`, `unicolore-bleu`, etc. |
| Cross-sell | → Slime Buddies même couleur |

**Color Picker :**
- 6 cercles cliquables (48px min touch target — WCAG)
- Clic → `--selected-color` CSS var → pot virtuel change couleur (CSS transition 250ms)
- Fond de page : gradient subtle vers la couleur sélectionnée
- Badge stock par couleur : vert (>10) · orange (≤5 "Plus que X !") · rouge (épuisé)
- Si épuisé : cercle grisé + "Me prévenir" → INSERT waitlist (téléphone)

---

### LIGNE 2 — SLIME BICOLORE

| Attribut | Valeur |
|----------|--------|
| Poids | 170g (2 couleurs dans 1 pot) |
| Combinaisons | Rose+Bleu → Violet · Rose+Jaune → Orangé · Bleu+Jaune → Vert |
| Positionnement | "Je crée ma couleur secrète" |

**Animation Mélange Magique — Canvas API :**

```
ÉTAPE 1 : Sélection combo
  3 cards cliquables (Rose+Bleu / Rose+Jaune / Bleu+Jaune)
  Sélection → 2 blobs colorés apparaissent sur le Canvas

ÉTAPE 2 : Interaction
  Desktop : drag les blobs l'un vers l'autre
  Mobile  : bouton "Mélanger !" → tap pour déclencher
  
ÉTAPE 3 : Tourbillon (1,2s · requestAnimationFrame · 60fps)
  Les 2 couleurs s'entremêlent en spirale
  
ÉTAPE 4 : Révélation
  Couleur résultante "éclate" au centre avec particules
  Texte : "Tu as créé le Violet ! 🎨"
  CTA s'allume : "Ajouter au panier"

TECHNIQUE :
  HTML5 Canvas API (pas WebGL — trop lourd mobile TN)
  Fallback CSS animation si Canvas non supporté
  Performance cible : < 5ms par frame sur Android mid-range
```

---

### LIGNE 3 — SLIME BUDDIES

| Attribut | Valeur |
|----------|--------|
| Produit | Slime Unicolore 170g + Yeux Mobiles inclus |
| Couleurs | Mêmes 6 couleurs |
| Positionnement | "Mon monstre, mon ami" |

**Buddy Builder — Canvas/SVG :**

```
INTERFACE :
  ┌────────────────────────────────────┐
  │  👾 TON BUDDY S'APPELLE           │
  │  [ SLIMZILLA LE VIOLET ]  [🎲]    │
  │                                    │
  │  Corps : ● ● ● ● ● ●              │
  │                                    │
  │  [  SVG animé du Buddy  ]          │
  │  Yeux suivent curseur/gyroscope    │
  │  Clignement auto toutes 4-6s       │
  │                                    │
  │  [🛒 ADOPTER MON BUDDY — 18 DT]  │
  └────────────────────────────────────┘

GÉNÉRATEUR DE NOMS (client-side) :
  const PREFIXES = ["Slimzilla","BloboBob","GlitchMon","PlopPop","ZorBlob","MutaGlob"]
  const SUFFIXES = ["le Violet","la Rose","le Teal","l'Électrique","le Bizarre","le Fou"]
  → Combinaison random + bouton 🎲 pour regenerate

YEUX MOBILES :
  Desktop : suivent le curseur (mousemove → calcul angle)
  Mobile  : gyroscope (DeviceOrientationEvent) ou animation bounce auto
  Clignement : setInterval random 4000–6000ms → CSS animation 150ms

SHARE WHATSAPP :
  canvas.toBlob() → génère image du Buddy
  URL : wa.me/?text=J'ai créé [NOM] ! Commande le tien sur hkgames.tn
```

---

## 7. FEATURES CORE — SPÉCIFICATIONS FONCTIONNELLES

### F1 — LABORATOIRE DU SLIMEUR (Homepage)

Flow 3 étapes entièrement client-side — zéro requête API jusqu'au AddToCart :

```
ÉTAPE 1 : "Quel type de Slime ?"
  3 cards animées : Unicolore | Bicolore | Buddy
  Sélection → spring animation (scale + glow)

ÉTAPE 2 : "Choisis ta couleur !"
  Color picker adapté au type choisi
  Preview 3D du pot mis à jour en temps réel

ÉTAPE 3 : "Donne-lui un nom !"
  Input optionnel ou générateur auto (Buddies)

RÉSULTAT :
  Animation "ton slime est prêt !" → confetti burst
  CTA "Ajouter au panier — X DT" (couleur du CTA = couleur choisie)
  Produit configuré → Zustand cart store
  Au clic CTA → vérification stock Supabase → si OK → cart + toast
```

---

### F2 — CATALOGUE (/shop)

**Mobile (375px) :** Grid 2 colonnes · Cards compactes  
**Desktop (1280px+) :** Grid 4 colonnes · Hover 3D depth (mousemove → perspective + rotateX/Y)

**Filtres :**
- Tabs : Tous | Unicolore | Bicolore | Buddies
- Color dots multi-select
- Sort : Popularité | Prix ↑ | Nouveautés

**Stock live :** Supabase Realtime channel → badge mis à jour sans rechargement  
Si stock ≤ 5 → badge orange "Plus que X !"  
Si stock = 0 → bouton grisé + "Me prévenir"

---

### F3 — FICHE PRODUIT (/produit/[slug])

**Structure Mobile :**
```
[Galerie swipeable WebP]
[Nom produit] [Badge ligne]
[Prix en DT]  [Stock badge]
[Color Picker | Magic Mix | Buddy Builder]
[Quantité]    [Bouton ATC → confetti]
[Urgency Block]
[Description + "Non-toxique · Certifié"]
[Cross-sell contextuel]
[Avis clients avec photos]
```

**Urgency Block :**
```
⚡ [X] personnes regardent ce produit
📦 Plus que [Y] pots en stock !
🚀 Commandez avant 18h → Livraison demain à Tunis
```
Viewers : calcul pseudo-aléatoire `Math.floor(Math.random() * 8) + 5` · refresh 45s  
Stock : Supabase Realtime (valeur réelle)  
Timer : heure limite configurable dans `settings` table

---

### F4 — PANIER (/panier)

**Bundle Builder — Règles métier :**

```javascript
PACK DÉCOUVERTE
  Condition : ≥ 3 Unicolores de couleurs différentes
  Réduction : -15%
  Badge : "🎁 Pack Découverte activé ! Tu économises X DT"
  Upsell si 2 unicolores : "Ajoute 1 unicolore → économise X DT !"

PACK ALCHIMISTE
  Condition : Les 3 Bicolores dans le panier
  Réduction : -20%
  Badge : "⚗️ Chimiste Expert !"

PACK FAMILLE MONSTRE
  Condition : ≥ 3 Buddies de couleurs différentes
  Réduction : -18%
  Badge : "👨‍👩‍👧 Famille Monstre !"
  Bonus : Certificat d'adoption PDF auto-généré (côté client)
```

**Cross-sell Contextuel :**
```
Unicolore dans panier → "Rends-le vivant ! Ajoute les yeux 👀" → Buddy même couleur
Bicolore dans panier  → "Garde la couleur secrète ! Ajoute l'Unicolore assorti"
≥ 2 articles          → Afficher barre progression bundle le plus proche
```

**Barre Livraison Gratuite :**
- SVG path animé style "liquide slime" se remplissant
- Seuil configurable dans `settings` (clé : `free_shipping_threshold_dt`)
- Texte : "Plus que X DT pour la livraison gratuite !"
- react-spring `useSpring` : tension 120 · friction 14

---

### F5 — CHECKOUT 1-PAGE (/commander)

**Philosophie :** Minimum de friction. Le COD tunisien n'a pas besoin de carte bancaire.

**Champs :**
```
[Prénom *]           [Nom *]
[Téléphone *]        (auto-format : +216 XX XXX XXX)
[Adresse complète *] (textarea · min 10 chars)
[Gouvernorat *]      (select · 24 gouvernorats tunisiens)
[Notes]              (optionnel : instructions livraison)
```

**Gouvernorats (liste complète) :**
Tunis · Ariana · Ben Arous · Manouba · Nabeul · Zaghouan · Bizerte · Béja ·
Jendouba · Kef · Siliana · Sousse · Monastir · Mahdia · Sfax · Kairouan ·
Kasserine · Sidi Bouzid · Gabès · Medenine · Tataouine · Gafsa · Tozeur · Kébili

**Sidebar Sticky (desktop) / Section fixe bas écran (mobile) :**
- Résumé produits avec miniatures
- Sous-total · Livraison · Réduction bundle · Total DT
- Badge "✅ Paiement à la livraison — Vous payez à la réception"

**Validation (Zod + React Hook Form) :**
```javascript
phone: z.string().regex(/^(\+216|00216|0)(2[0-9]|[3-9][0-9])[0-9]{6}$/)
// Feedback inline : "Numéro invalide — format tunisien requis"
```

---

### F6 — SYSTÈME PENDING ORDER + WEB PUSH NOTIFICATION

C'est la feature opérationnelle centrale. Voici le flow technique complet :

**TRIGGER : onBlur du champ téléphone (ou après 8 chiffres valides)**

```javascript
// Dans CheckoutForm.jsx
const handlePhoneBlur = async (phone) => {
  const isValid = tunisianPhoneRegex.test(phone)
  if (!isValid) return

  // 1. INSERT commande pending dans Supabase
  const { data: pendingOrder } = await supabase
    .from('orders')
    .insert({
      customer_phone: phone,
      status: 'pending',
      items: cartItems,          // snapshot panier à cet instant
      subtotal_dt: cartTotal,
      total_dt: cartTotal,
      source: document.referrer,
    })
    .select('id')
    .single()

  // 2. Stocker l'ID en state local pour mise à jour au submit
  setPendingOrderId(pendingOrder.id)

  // 3. Supabase Realtime → déclenche Web Push côté admin via Edge Function
}
```

**FLOW COMPLET PENDING → CONFIRMED :**
```
Client saisit téléphone valide
  → INSERT orders(status: 'pending')
  → Supabase Realtime broadcast channel 'new-order'
  → Edge Function "push-notification" appelée
  → Web Push envoyé à tous les abonnés admin

Client CONTINUE le formulaire et clique "Confirmer ma commande"
  → Server Action createOrder()
  → UPDATE orders SET status = 'confirmed', [tous les champs complets]
  → Navex API (création colis)
  → Notification admin mise à jour "Commande confirmée"

Client QUITTE sans commander
  → L'ordre reste status: 'pending' dans Supabase
  → Dashboard admin : colonne "En attente" avec badge rouge
  → L'admin appelle le client pour relance
```

---

### F7 — WEB PUSH NOTIFICATION ADMIN (Barre Système Mobile)

**Architecture :**
```
Admin ouvre /admin la première fois
  → Demande permission notifications (browser prompt natif)
  → Si accordée → navigator.serviceWorker.register('/sw.js')
  → pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC })
  → Subscription (endpoint + keys) stockée dans Supabase table 'push_subscriptions'

Nouvelle commande pending/confirmed dans Supabase
  → Supabase Realtime détecte INSERT/UPDATE orders
  → Déclenche Supabase Edge Function "send-push"
  → Edge Function boucle sur toutes les subscriptions admin
  → Envoie Web Push via web-push npm (VAPID)
  → Navigateur admin reçoit la notification (même téléphone fermé ou en veille)
  → Notification apparaît dans la barre système du téléphone avec son
```

**Payload Notification — Commande Pending :**
```json
{
  "title": "⏳ Commande en attente — HK Games",
  "body": "+216 XX XXX XXX — 42 DT — Tunis",
  "icon": "/icons/hk-logo-192.png",
  "badge": "/icons/badge-72.png",
  "sound": "/sounds/order-alert.mp3",
  "tag": "pending-order",
  "data": { "orderId": "uuid", "url": "/admin/commandes?id=uuid" },
  "actions": [
    { "action": "view", "title": "Voir la commande" },
    { "action": "call", "title": "Appeler le client" }
  ],
  "vibrate": [200, 100, 200],
  "requireInteraction": true
}
```

**Payload Notification — Commande Confirmée :**
```json
{
  "title": "✅ Nouvelle commande confirmée !",
  "body": "Mohamed · Tunis · 54 DT · Unicolore Rouge x2 + Buddies Rose",
  "tag": "confirmed-order",
  "data": { "orderId": "uuid", "url": "/admin/commandes?id=uuid" }
}
```

**Service Worker (/public/sw.js) :**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  // Son d'alerte
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:             data.body,
      icon:             data.icon,
      badge:            data.badge,
      tag:              data.tag,
      data:             data.data,
      actions:          data.actions,
      vibrate:          data.vibrate,
      requireInteraction: data.requireInteraction ?? false,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { url } = event.notification.data
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find(c => c.url.includes('/admin'))
        if (existing) { existing.focus(); existing.navigate(url) }
        else clients.openWindow(url)
      })
  )
})
```

**Son d'alerte :**
- Fichier audio : `/public/sounds/order-alert.mp3` (son court 1-2s · distinctif)
- Joué automatiquement via Audio API dans le dashboard si onglet ouvert :
  ```javascript
  // Dans le hook Supabase Realtime du dashboard
  const audio = new Audio('/sounds/order-alert.mp3')
  audio.play().catch(() => {}) // silencieux si autoplay bloqué
  ```
- Sur mobile via Web Push : le son est géré par le système d'exploitation
  (Android joue automatiquement le son de notification par défaut si non personnalisé)

**Edge Function Supabase (send-push) :**
```javascript
// supabase/functions/send-push/index.js
import webpush from 'npm:web-push'

Deno.serve(async (req) => {
  const { orderId, type } = await req.json()

  webpush.setVapidDetails(
    'mailto:admin@hkgames.tn',
    Deno.env.get('VAPID_PUBLIC_KEY'),
    Deno.env.get('VAPID_PRIVATE_KEY')
  )

  // Récupérer toutes les subscriptions admin actives
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('is_active', true)

  const payload = buildPayload(type, orderId)

  await Promise.allSettled(
    subs.map(({ subscription }) =>
      webpush.sendNotification(subscription, JSON.stringify(payload))
        .catch(async (err) => {
          if (err.statusCode === 410) { // Subscription expirée
            await supabaseAdmin.from('push_subscriptions')
              .delete().eq('subscription->endpoint', subscription.endpoint)
          }
        })
    )
  )

  return new Response('ok')
})
```

---

### F8 — GESTION COMMANDES ADMIN — STATUS & ACTIONS

**Statuts possibles d'une commande :**

| Status | Label UI | Couleur | Déclencheur |
|--------|----------|---------|-------------|
| `pending` | En attente | 🟡 Jaune | Téléphone saisi mais commande non soumise |
| `confirmed` | Confirmée | 🟢 Vert | Formulaire soumis + appel client OK |
| `on_hold` | En suspens | 🟠 Orange | Client injoignable (à rappeler) |
| `shipped` | Expédiée | 🔵 Bleu | Navex tracking créé |
| `delivered` | Livrée | ✅ Vert foncé | Confirmation livraison Navex |
| `cancelled` | Annulée | 🔴 Rouge | Client annulé ou refus à livraison |

**Actions disponibles depuis le dashboard sur chaque commande :**

```
ACTIONS RAPIDES (buttons dans la card commande) :
  [✅ Confirmer]    → status: 'confirmed' + déclenche Navex API
  [📞 Injoignable]  → status: 'on_hold'
  [❌ Annuler]      → modal confirmation → status: 'cancelled'
  [🗑️ Supprimer]   → modal confirmation double → DELETE from orders (soft delete)
  [✏️ Modifier]     → modal d'édition inline (nom, téléphone, adresse, ville, articles)

MODAL MODIFICATION :
  Tous les champs éditables sauf items (articles)
  Articles : possibilité d'ajouter/retirer des produits
  Recalcul automatique du total
  Bouton "Enregistrer" → PATCH orders + PATCH Navex si déjà expédié
  
MODAL ANNULATION :
  "Raison d'annulation" : select
    → Client injoignable
    → Client a refusé la livraison
    → Stock insuffisant
    → Double commande
    → Autre
  Champ notes libre
  Bouton "Confirmer l'annulation" → status: 'cancelled' + log dans order_logs

SOFT DELETE :
  Les commandes supprimées ne sont pas effacées de la DB
  Champ : deleted_at TIMESTAMPTZ (null = visible, non null = supprimé)
  Dashboard ne les affiche plus mais elles restent dans analytics
```

**Vue Dashboard Commandes (/admin/commandes) :**
```
FILTRES :
  Status (tabs) : Toutes | En attente | Confirmées | Expédiées | Livrées | Annulées
  Date : picker range
  Gouvernorat : select
  Montant : range slider
  Recherche : par nom, téléphone, numéro commande

COLONNES TABLE :
  # Commande | Client | Téléphone | Ville | Articles | Total | Status | Date | Actions

BADGE "EN ATTENTE" :
  Compteur rouge en temps réel dans la sidebar nav :
  "⏳ 3 en attente" → mis à jour via Supabase Realtime

NOTIFICATION SONORE IN-APP :
  Quand une nouvelle commande pending/confirmed arrive via Realtime
  → Son audio joué automatiquement si tab active
  → Toast en haut à droite avec détails de la commande
```

---

### F9 — SOCIAL PROOF ENGINE

**Compteur Live :**
```
🔥 1,248 slimes vendus ce mois-ci
```
SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= date_trunc('month', NOW())
Mis à jour toutes les 30 minutes (ISR Next.js revalidate: 1800)

**Toast Notifications (Achats Sociaux) :**
```javascript
const SOCIAL_EVENTS = [
  { name: "Amira",   city: "Sousse",   product: "Slime Buddies Rose",     time: "il y a 3 min" },
  { name: "Mohamed", city: "Tunis",    product: "Pack Alchimiste",        time: "il y a 7 min" },
  { name: "Safa",    city: "Sfax",     product: "Unicolore Violet",       time: "il y a 12 min" },
  { name: "Yassine", city: "Monastir", product: "Pack Découverte",        time: "il y a 2 min" },
  { name: "Rim",     city: "Bizerte",  product: "Slime Buddies Bleu",     time: "il y a 5 min" },
  { name: "Khalil",  city: "Nabeul",   product: "Unicolore Rouge x2",     time: "il y a 8 min" },
  { name: "Nesrine", city: "Ariana",   product: "Pack Famille Monstre",   time: "il y a 1 min" },
  // 20+ entrées
]
// Affichage : 1 toast toutes les 30-90s (intervalle random)
// Position : bottom-left mobile · bottom-right desktop
// Animation : slide-in depuis la gauche · disparaît après 4s
```

**Galerie UGC :**
- Grid masonry responsive (photos clients réelles)
- Stockées dans Supabase Storage (bucket `ugc-photos`)
- Upload depuis dashboard admin
- CTA : "Montre ton slime ! Envoie-nous ta photo 📸"

**Avis avec Photos :**
- Stars 1–5 + texte + photo obligatoire
- Modération admin avant affichage
- Affiché sur fiche produit ET homepage (featured)
- Données : prénom · ville · rating · texte · photo_url · product_id

---

### F10 — CONFIRMATION + OTO (/merci)

```
[confetti canvas-confetti plein écran · 3s]
[✅ Commande confirmée !]
[#HK-2024-XXXX]
[Résumé commande complet]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OFFRE LIMITÉE — UNE SEULE FOIS
Ajoutez 1 Buddy à votre commande pour seulement +12 DT
Livré avec votre colis !
[Choisir couleur Buddy] → [Ajouter pour +12 DT]  [Non merci]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[📱 Partage ton Buddy sur WhatsApp] ← si Buddy dans commande
```

**OTO Logic :**
- Affiché uniquement si aucun Buddy dans la commande
- Timer countdown 5 minutes → disparaît
- Si accepté → PATCH order (ajout item + recalcul total) + PATCH Navex + notification admin

---

### F11 — DASHBOARD ADMIN COMPLET (/admin)

**Auth :** Supabase Auth email/password · Middleware Next.js → redirect /admin/login si pas de session

**COMMANDES** (voir F8 — section détaillée ci-dessus)

**PRODUITS (/admin/produits) :**
- Liste tous les produits avec statut actif/inactif
- CRUD complet : créer · éditer · archiver
- Gestion stock par couleur : input numérique par couleur avec +/- rapides
- Upload images produit → Supabase Storage (bucket `product-images`)
- Alerte automatique si stock ≤ seuil configurable

**ANALYTICS (/admin/analytics) :**
```
Aujourd'hui : [X commandes] [X DT CA] [X DT panier moyen]
Cette semaine / Ce mois / Total

Graphiques :
  → Commandes par jour (7 jours) — line chart
  → CA par jour — bar chart
  → Top produits vendus — donut
  → Top gouvernorats — bar horizontal
  → Taux OTO accepté — gauge
  → Commandes pending vs confirmées vs annulées — donut
```

**AVIS & UGC (/admin/avis) :**
- File modération : avis en attente d'approbation
- Toggle approuver / refuser / mettre en featured
- Upload photos UGC depuis l'admin

**PARAMÈTRES (/admin/parametres) :**
```
Livraison :
  Seuil livraison gratuite : [50] DT
  Prix livraison standard  : [8] DT
  Heure limite J+1         : [18:00]

Notifications :
  Activer/désactiver push notifications
  [Tester la notification push]

OTO :
  Produit OTO : [select produit]
  Réduction OTO : [6] DT
  Activer OTO : [toggle]

Urgence :
  Seuil stock badge orange : [5] unités
  Activer viewer counter : [toggle]

Promotions :
  Activer bundle Découverte : [toggle]
  Activer bundle Alchimiste : [toggle]
  Activer bundle Famille    : [toggle]
```

---

### F12 — INTÉGRATIONS TIERCES

**Facebook Pixel :**
```javascript
// Tous les events dans layout.js + composants concernés
fbq('track', 'PageView')                           // layout.js
fbq('track', 'ViewContent', { content_ids, value, currency: 'TND' })  // fiche produit
fbq('track', 'AddToCart',   { value, currency: 'TND', num_items })    // add to cart
fbq('track', 'InitiateCheckout', { value, num_items })                 // /commander
fbq('track', 'Purchase', { value, currency: 'TND', order_id })        // /merci
```

**Microsoft Clarity :**
```javascript
// layout.js — next/script strategy="afterInteractive"
// Heatmaps + session recording pour optimisation continue
```

**Navex API (Livraison) :**
```javascript
// Déclenché uniquement quand admin clique "Confirmer" (pas automatiquement au checkout)
// Car l'admin appelle d'abord le client pour confirmer
POST https://api.navex.tn/v1/parcels
{
  reference:  `HK-${orderId}`,
  recipient:  { name, phone, address, city },
  cod_amount: totalDt,
  weight:     calculateWeight(items) // 170g * nbItems
}
// Réponse → tracking_number stocké dans orders.navex_tracking
// Statut orders → 'shipped'
```

**WhatsApp Business :**
- Canal : Maytapi ou WA Cloud API
- Notification admin (nouvelle commande confirmée) : voir template section 12
- Partage Buddy client : généré depuis bouton sur /merci (lien wa.me natif)
- PAS utilisé comme canal de paiement ni de validation de commande

---

## 8. SCHÉMA SUPABASE COMPLET

```sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- HK GAMES SLIME STORE — Database Schema
-- Supabase projet dédié "hkgames-slime"
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- PRODUCTS
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  line         TEXT NOT NULL CHECK (line IN ('unicolore','bicolore','buddies')),
  price_dt     NUMERIC(10,3) NOT NULL,
  images       TEXT[],
  colors       JSONB,
  -- [{ name: "Rouge", hex: "#ef4444", stock: 12 }]
  bicolor_combos JSONB,
  -- [{ color1: "Rose", color2: "Bleu", result: "Violet", result_hex: "#a855f7" }]
  is_active    BOOLEAN DEFAULT true,
  position     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE,           -- null si pending, généré au confirm
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','on_hold','shipped','delivered','cancelled')),

  customer_name    TEXT,
  customer_phone   TEXT NOT NULL,         -- seul champ requis au pending
  customer_address TEXT,
  customer_city    TEXT,
  customer_notes   TEXT,

  items            JSONB NOT NULL DEFAULT '[]',
  subtotal_dt      NUMERIC(10,3),
  shipping_dt      NUMERIC(10,3) DEFAULT 8,
  discount_dt      NUMERIC(10,3) DEFAULT 0,
  total_dt         NUMERIC(10,3),
  bundle_type      TEXT,

  navex_tracking   TEXT,
  navex_parcel_id  TEXT,

  oto_shown        BOOLEAN DEFAULT false,
  oto_accepted     BOOLEAN DEFAULT false,

  cancellation_reason TEXT,
  admin_notes      TEXT,

  source           TEXT,
  deleted_at       TIMESTAMPTZ,           -- soft delete

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER LOGS (audit trail)
CREATE TABLE order_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id),
  action      TEXT NOT NULL,
  -- 'status_change' | 'item_added' | 'item_removed' | 'field_updated' | 'navex_created'
  old_value   JSONB,
  new_value   JSONB,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY LOGS
CREATE TABLE inventory_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id),
  color       TEXT,
  delta       INTEGER NOT NULL,
  reason      TEXT CHECK (reason IN ('order','restock','manual','cancelled')),
  order_id    UUID REFERENCES orders(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TESTIMONIALS
CREATE TABLE testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_city TEXT,
  product_id    UUID REFERENCES products(id),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text   TEXT NOT NULL,
  photo_url     TEXT,
  is_approved   BOOLEAN DEFAULT false,
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- BUNDLES CONFIG
CREATE TABLE bundles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  conditions    JSONB NOT NULL,
  discount_pct  NUMERIC(5,2),
  badge_text    TEXT,
  is_active     BOOLEAN DEFAULT true
);

-- SETTINGS (clé-valeur admin)
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value, description) VALUES
  ('free_shipping_threshold_dt', '50',    'Seuil livraison gratuite en DT'),
  ('shipping_price_dt',          '8',     'Prix livraison standard'),
  ('shipping_timer_cutoff',      '18:00', 'Heure limite pour livraison J+1'),
  ('stock_alert_threshold',      '5',     'Stock min avant badge orange'),
  ('oto_product_id',             '',      'UUID produit proposé en OTO'),
  ('oto_discount_dt',            '6',     'Réduction OTO en DT'),
  ('oto_enabled',                'true',  'Activer/désactiver OTO'),
  ('bundle_decouverte_enabled',  'true',  ''),
  ('bundle_alchimiste_enabled',  'true',  ''),
  ('bundle_famille_enabled',     'true',  '');

-- PUSH SUBSCRIPTIONS (Web Push admin)
CREATE TABLE push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription JSONB NOT NULL,   -- { endpoint, keys: { p256dh, auth } }
  device_name  TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- UPSELL EVENTS (analytics OTO)
CREATE TABLE upsell_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id),
  type       TEXT NOT NULL CHECK (type IN ('oto_shown','oto_accepted','oto_declined')),
  product_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WAITLIST (stock épuisé)
CREATE TABLE waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  color      TEXT,
  phone      TEXT NOT NULL,
  notified   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- PRODUCTS : lecture publique, écriture admin
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_admin_all"   ON products FOR ALL USING (auth.role() = 'authenticated');

-- ORDERS : insert public (checkout), tout le reste admin
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_public_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_all"     ON orders FOR ALL  USING (auth.role() = 'authenticated');

-- TESTIMONIALS : select si approuvé, insert public, admin tout
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials_public_select" ON testimonials FOR SELECT USING (is_approved = true);
CREATE POLICY "testimonials_public_insert" ON testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "testimonials_admin_all"     ON testimonials FOR ALL USING (auth.role() = 'authenticated');

-- SETTINGS : select public, update admin
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_select" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update"  ON settings FOR ALL USING (auth.role() = 'authenticated');

-- PUSH SUBSCRIPTIONS : admin uniquement
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_admin_all" ON push_subscriptions FOR ALL USING (auth.role() = 'authenticated');

-- Realtime activé sur ces tables
ALTER TABLE orders   REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;

-- Function helper : décrémentation stock atomique
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_color TEXT, p_qty INTEGER)
RETURNS void AS $$
DECLARE
  v_colors JSONB;
  v_new_colors JSONB;
BEGIN
  SELECT colors INTO v_colors FROM products WHERE id = p_product_id FOR UPDATE;
  v_new_colors := (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'name' = p_color
        THEN jsonb_set(elem, '{stock}', ((elem->>'stock')::int - p_qty)::text::jsonb)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(v_colors) AS elem
  );
  UPDATE products SET colors = v_new_colors, updated_at = NOW() WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 9. STRUCTURE DU PROJET

```
hk-games-slime-store/
├── public/
│   ├── sw.js                        ← Service Worker (Web Push)
│   ├── sounds/
│   │   └── order-alert.mp3          ← Son notification commande
│   ├── icons/
│   │   ├── hk-logo-192.png
│   │   ├── hk-logo-512.png
│   │   └── badge-72.png
│   └── og/
│       └── og-default.jpg
│
├── src/
│   ├── app/
│   │   ├── layout.js                ← Fonts + Pixel + Clarity + SW register
│   │   ├── globals.css              ← Design tokens CSS
│   │   ├── page.js                  ← Homepage
│   │   ├── shop/
│   │   │   ├── page.js              ← Catalogue complet
│   │   │   └── [line]/page.js       ← Catalogue filtré
│   │   ├── produit/[slug]/page.js   ← Fiche produit (generateStaticParams)
│   │   ├── panier/page.js
│   │   ├── commander/page.js
│   │   ├── merci/page.js
│   │   ├── avis/page.js
│   │   └── admin/
│   │       ├── layout.js            ← Auth guard
│   │       ├── login/page.js
│   │       ├── page.js              ← Overview dashboard
│   │       ├── commandes/page.js
│   │       ├── produits/page.js
│   │       ├── analytics/page.js
│   │       └── parametres/page.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── homepage/
│   │   │   ├── SplashScreen.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── SlimeLab.jsx         ← Laboratoire du Slimeur
│   │   │   ├── SocialProof.jsx
│   │   │   └── CataloguePreview.jsx
│   │   ├── product/
│   │   │   ├── ColorPicker.jsx
│   │   │   ├── MagicMixCanvas.jsx
│   │   │   ├── BuddyBuilder.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGallery.jsx
│   │   │   └── UrgencyBlock.jsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.jsx
│   │   │   ├── BundleBuilder.jsx
│   │   │   ├── CrossSell.jsx
│   │   │   └── ShippingProgress.jsx
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.jsx     ← Trigger pending order au phone blur
│   │   │   └── OrderSummary.jsx
│   │   ├── confirmation/
│   │   │   ├── ConfettiBlast.jsx
│   │   │   └── OTOWidget.jsx
│   │   ├── admin/
│   │   │   ├── OrdersTable.jsx
│   │   │   ├── OrderModal.jsx       ← Edit/Cancel/Delete modal
│   │   │   ├── ProductForm.jsx
│   │   │   ├── AnalyticsCharts.jsx
│   │   │   ├── PushSetup.jsx        ← Subscribe to push notifications
│   │   │   └── AdminNotificationToast.jsx
│   │   └── ui/
│   │       ├── SlimeButton.jsx
│   │       ├── StockBadge.jsx
│   │       ├── SocialToast.jsx
│   │       └── StarRating.jsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.js
│   │   │   └── server.js
│   │   ├── actions/
│   │   │   ├── orders.js            ← createOrder · updateOrder · cancelOrder
│   │   │   ├── products.js
│   │   │   └── navex.js
│   │   ├── cart/
│   │   │   └── store.js             ← Zustand + persist
│   │   ├── push/
│   │   │   └── subscribe.js         ← pushManager.subscribe + save to Supabase
│   │   └── utils/
│   │       ├── buddyNames.js
│   │       ├── bundleRules.js
│   │       └── formatDT.js          ← (n) => `${n.toFixed(3)} DT`
│   │
│   └── middleware.js                ← Auth guard /admin/*
│
├── supabase/
│   ├── functions/
│   │   └── send-push/index.js       ← Edge Function Web Push
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── .env.local
├── next.config.js
├── package.json
└── vercel.json
```

---

## 10. SERVER ACTIONS — SPÉCIFICATIONS COMPLÈTES

### createPendingOrder (déclenché au phone blur)

```javascript
// lib/actions/orders.js
'use server'

export async function createPendingOrder({ phone, items, subtotalDt }) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_phone: phone,
      status: 'pending',
      items: items,
      subtotal_dt: subtotalDt,
      total_dt: subtotalDt,
    })
    .select('id')
    .single()

  if (error) return { error: 'Erreur création commande pending' }

  // Déclencher Edge Function send-push
  await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId: data.id, type: 'pending' }),
  })

  return { orderId: data.id }
}
```

### confirmOrder (déclenché au submit du formulaire)

```javascript
export async function confirmOrder(formData, pendingOrderId) {
  const supabase = await createServerClient()

  const validated = OrderSchema.safeParse(formData)
  if (!validated.success) return { error: validated.error.flatten() }

  const { firstName, lastName, phone, address, city, notes, items } = validated.data

  // Vérification stock finale (atomique)
  for (const item of items) {
    const { data: product } = await supabase
      .from('products').select('colors,name').eq('id', item.product_id).single()
    const colorData = product.colors.find(c => c.name === item.color)
    if (!colorData || colorData.stock < item.qty)
      return { error: `Stock insuffisant — ${product.name} ${item.color}` }
  }

  // Calcul bundle
  const { discount, bundleType } = computeBundle(items)
  const { value: shippingDt }   = await getSettingValue('shipping_price_dt')
  const { value: freeThreshold } = await getSettingValue('free_shipping_threshold_dt')
  const subtotal    = items.reduce((s, i) => s + i.price_dt * i.qty, 0)
  const discountAmt = subtotal * (discount / 100)
  const shipping    = subtotal >= Number(freeThreshold) ? 0 : Number(shippingDt)
  const total       = subtotal - discountAmt + shipping

  const orderNumber = `HK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  // UPDATE si pending existe, sinon INSERT
  const upsertData = {
    order_number:     orderNumber,
    status:           'confirmed',
    customer_name:    `${firstName} ${lastName}`,
    customer_phone:   phone,
    customer_address: address,
    customer_city:    city,
    customer_notes:   notes,
    items,
    subtotal_dt:      subtotal,
    discount_dt:      discountAmt,
    shipping_dt:      shipping,
    total_dt:         total,
    bundle_type:      bundleType,
  }

  let orderId = pendingOrderId
  if (pendingOrderId) {
    await supabase.from('orders').update(upsertData).eq('id', pendingOrderId)
  } else {
    const { data } = await supabase.from('orders').insert(upsertData).select('id').single()
    orderId = data.id
  }

  // Décrémenter stock (atomique via function PostgreSQL)
  for (const item of items) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_color: item.color,
      p_qty: item.qty,
    })
    // Log inventory
    await supabase.from('inventory_logs').insert({
      product_id: item.product_id,
      color: item.color,
      delta: -item.qty,
      reason: 'order',
      order_id: orderId,
    })
  }

  // Notification admin (commande confirmée)
  await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-push`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, type: 'confirmed' }),
  })

  return { success: true, orderId }
}
```

### updateOrder & cancelOrder (depuis dashboard admin)

```javascript
export async function updateOrderStatus(orderId, status, options = {}) {
  const supabase = await createServerClient()
  const { reason, adminNote, navexTrigger } = options

  const updateData = {
    status,
    updated_at: new Date().toISOString(),
    ...(reason    && { cancellation_reason: reason }),
    ...(adminNote && { admin_notes: adminNote }),
  }

  const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
  if (error) return { error }

  // Log audit
  await supabase.from('order_logs').insert({
    order_id: orderId,
    action: 'status_change',
    new_value: { status, reason },
  })

  // Si passage à 'confirmed' → déclencher Navex
  if (status === 'confirmed' && navexTrigger) {
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
    await createNavexParcel(order)
  }

  return { success: true }
}

export async function softDeleteOrder(orderId) {
  const supabase = await createServerClient()
  await supabase.from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', orderId)
  return { success: true }
}

export async function updateOrderItems(orderId, updatedData) {
  const supabase = await createServerClient()
  // Recalcul total avant update
  const subtotal = updatedData.items.reduce((s, i) => s + i.price_dt * i.qty, 0)
  await supabase.from('orders').update({
    ...updatedData,
    subtotal_dt: subtotal,
    total_dt: subtotal, // + shipping - discount
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)
  return { success: true }
}
```

---

## 11. MIDDLEWARE & AUTH ADMIN

```javascript
// middleware.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

## 12. ANIMATIONS — SPÉCIFICATIONS TECHNIQUES

### Splash Screen (une seule fois par session)

```
t=0ms    → Fond #0f0a1e · blob vert émerge du bas (scale 0 → 1.2)
t=800ms  → Blob "éclabousse" (scale 1.2 → 1.5 → 0 avec fade out)
t=1200ms → Logo HK Games fade in + slide up
t=1800ms → Hero content fade in
t=2000ms → Splash terminé
→ sessionStorage.setItem('splashSeen', 'true') — ne se rejoue pas dans la session
```

### Barre Livraison Gratuite

```javascript
// SVG path animé style slime liquide
// react-spring useSpring
const { progress } = useSpring({
  progress: Math.min((cartTotal / freeShippingThreshold) * 100, 100),
  config: { tension: 120, friction: 14 }
})
// La path SVG clipPath s'ajuste selon progress
```

### Add To Cart — Confetti

```javascript
import confetti from 'canvas-confetti'
confetti({
  particleCount: 80, spread: 70, origin: { y: 0.6 },
  colors: ['#a855f7','#ec4899','#06b6d4','#fbbf24','#10b981']
})
```

### Blob Background (CSS uniquement — performant)

```css
.blob {
  position: fixed; pointer-events: none; z-index: 0;
  border-radius: 50%; filter: blur(80px); opacity: 0.15;
  animation: blobMorph 20s ease-in-out infinite;
}
@keyframes blobMorph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
/* prefers-reduced-motion : animation none */
@media (prefers-reduced-motion: reduce) { .blob { animation: none; } }
```

---

## 13. PERFORMANCE & SEO

- **LCP < 2.5s** sur 4G mobile (Lighthouse ≥ 85)
- **CLS ≤ 0.1** — toutes les images avec width/height explicites via next/image
- **Canvas animations** : requestAnimationFrame uniquement · jamais setInterval
- **Supabase queries** : `.select('col1,col2')` · jamais `select('*')`
- **generateStaticParams** sur /produit/[slug] → pages pré-générées au build
- **ISR** sur catalogue : revalidate 300s (stocks mis à jour toutes les 5 min)
- **Realtime** : uniquement pour stock live sur fiche produit et dashboard admin
- **prefers-reduced-motion** : toutes les animations respectées
- **next/image** pour toutes les images (WebP auto · lazy load · responsive srcSet)
- **next/font** pour Nunito + Inter (pas de FOUT)

---

## 14. DÉPLOIEMENT & VARIABLES D'ENVIRONNEMENT

### .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

NEXT_PUBLIC_FB_PIXEL_ID=[pixel-id]

NAVEX_API_KEY=[navex-key]
NAVEX_API_URL=https://api.navex.tn/v1

WA_API_TOKEN=[whatsapp-token]
WA_ADMIN_NUMBER=+216XXXXXXXX

VAPID_PUBLIC_KEY=[generated-vapid-public]
VAPID_PRIVATE_KEY=[generated-vapid-private]
NEXT_PUBLIC_VAPID_PUBLIC_KEY=[generated-vapid-public]
```

### Générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

### vercel.json

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Service-Worker-Allowed", "value": "/" },
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 PROMPT DÉVELOPPEUR — HK Games Slime Store v3
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a senior full-stack developer building **HK Games Slime Store v3** — the #1 artisanal
slime DTC e-commerce in Tunisia. This is a standalone production project with its own GitHub
repo (`hk-games-slime-store`), its own Vercel project (`hk-games-slime`), and its own
dedicated Supabase project (`hkgames-slime`). Deliver everything complete and production-ready.
No placeholders. No TODOs. No demo data that needs replacement.

---

## IDENTITY

- Product: HK Games Slime Store v3
- Market: Tunisia — COD-only (Cash on Delivery), no payment gateway
- Currency: Tunisian Dinar (DT), format: `X,XXX DT`
- Language: French (primary)
- Traffic: 85% mobile → absolute mobile-first

---

## STACK — NON-NEGOTIABLE

```
Next.js 15 App Router — JavaScript only (.js / .jsx) — ZERO TypeScript
CSS Modules + CSS Custom Properties — no Tailwind, no styled-components
Framer Motion + react-spring — animations
HTML5 Canvas API — MagicMixCanvas + BuddyBuilder
Zustand + persist — cart state (localStorage)
React Hook Form + Zod — form validation
Supabase JS SDK v2 — database + realtime + storage
web-push (VAPID) — push notifications via Supabase Edge Functions
canvas-confetti — add to cart + confirmation
Lucide React — all icons (never emoji as structural UI)
next/image — all images (explicit dimensions, WebP)
Vercel — deployment (never Netlify)
```

---

## CRITICAL FLOWS TO IMPLEMENT EXACTLY

### 1. Pending Order Flow (most important operational feature)

When customer types a valid Tunisian phone number in /commander and the field loses focus (onBlur):
- INSERT into `orders` table with `status: 'pending'`, phone, cart items snapshot
- Store returned order ID in React state
- Call Supabase Edge Function `send-push` with `{ orderId, type: 'pending' }`
- Edge Function sends Web Push to all active admin subscriptions
- Push notification appears in admin's phone notification bar with sound
- Notification payload: title "⏳ Commande en attente", body with phone + amount, action buttons [Voir] [Appeler]
- If customer continues and submits form → UPDATE order status to 'confirmed' using stored pending ID
- If customer abandons → order stays 'pending' in database → visible in admin dashboard

### 2. Web Push — Service Worker

Implement a complete service worker at /public/sw.js:
- Handle 'push' events → show notification with all payload fields
- Handle 'notificationclick' → focus/open admin tab at the order URL
- Register service worker in app/layout.js (client-side, after mount)
- In /admin layout: request push permission, subscribe via pushManager, save subscription to Supabase `push_subscriptions` table

### 3. Order Status Management in Admin Dashboard

Admin calls customer to confirm. Dashboard actions per order:
- [✅ Confirmer] → status: 'confirmed' + trigger Navex API
- [📞 Injoignable] → status: 'on_hold'
- [❌ Annuler] → modal with reason select + status: 'cancelled' + INSERT order_logs
- [✏️ Modifier] → inline modal edit (name, phone, address, city, items, recalculate total)
- [🗑️ Supprimer] → soft delete (SET deleted_at = NOW()) — double confirmation modal
- All status changes INSERT into order_logs for audit trail

### 4. Interactive Product Experiences

**MagicMixCanvas (Bicolore):**
- Pure HTML5 Canvas (no WebGL)
- Two colored blobs animate into swirl, reveal result color
- Mobile: "Mélanger !" button; Desktop: drag blobs together
- 1.2s animation at 60fps via requestAnimationFrame
- CSS animation fallback if Canvas not supported

**BuddyBuilder (Buddies):**
- SVG slime blob with configurable color (CSS variable)
- Googly eyes follow cursor (mousemove) or device orientation (mobile)
- Auto-blink every 4-6 seconds (random interval)
- Name generator: random PREFIXES + SUFFIXES array, 🎲 regenerate button
- WhatsApp share: canvas.toBlob() + wa.me link

**ColorPicker (Unicolore):**
- 6 circular color swatches (48px minimum — WCAG)
- Click → CSS var --selected-color → instant pot color update
- Page background gradient transitions to match selected color (250ms)
- Real-time stock badge per color from Supabase

### 5. Bundle Builder (cart)

Implement bundleRules.js with three bundle configs. Compute active bundle client-side on every cart change. Show savings in DT (not %). Show upsell message when one item away from activating a bundle. Apply discount server-side in confirmOrder Server Action (never trust client-side discount).

---

## DATABASE

Implement the complete schema exactly as specified in the PRD. Key points:
- `orders` status enum: pending · confirmed · on_hold · shipped · delivered · cancelled
- `orders.deleted_at` for soft deletes (dashboard filters `WHERE deleted_at IS NULL`)
- `order_logs` for full audit trail of every admin action
- `push_subscriptions` table for storing Web Push VAPID subscription objects
- PostgreSQL function `decrement_stock()` for atomic stock decrement
- Supabase Realtime enabled on `orders` and `products` tables
- All RLS policies as specified

---

## ADMIN DASHBOARD

Build a production-ready dashboard at /admin with:
- Real-time orders table (Supabase Realtime subscription)
- Pending orders badge counter in sidebar nav (updates live)
- In-app notification toast + audio (`/sounds/order-alert.mp3`) when new order arrives
- Full CRUD for products with color/stock management per color
- Analytics: charts with real Supabase data (orders count, revenue, top products, top cities)
- Push notification setup page: request permission + test notification button
- Settings page: all configurable values from `settings` table

---

## DESIGN SYSTEM

Implement exactly the CSS Custom Properties defined in the PRD. Never hardcode colors in components — always use CSS variables. Claymorphism cards: backdrop-filter blur(12px), border rgba(168,85,247,0.2), box-shadow layered. All animations must respect prefers-reduced-motion. All interactive elements minimum 44px touch target.

---

## PERFORMANCE

- generateStaticParams for /produit/[slug]
- ISR revalidate: 300 on catalogue pages
- Supabase queries: never select('*'), always name specific columns
- Canvas: requestAnimationFrame only, never setInterval for animations
- All images: next/image with explicit width and height
- Fonts: next/font/google (no FOUT)
- Service worker: cache-control no-cache on sw.js (vercel.json header)

---

## ENVIRONMENT SETUP

Require these env vars (fail loudly at startup if missing):
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
NEXT_PUBLIC_FB_PIXEL_ID, NAVEX_API_KEY, WA_API_TOKEN, WA_ADMIN_NUMBER,
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY

Generate VAPID keys with: `npx web-push generate-vapid-keys`

---

## DELIVERABLE

A complete, deployable Next.js 15 application. Every route functional. Every component
implemented. Admin dashboard fully operational. Web Push working end-to-end.
Canvas animations smooth on mid-range Android. COD checkout submitting to Supabase.
Pending order system detecting abandonment at phone field blur.
Zero placeholder text. Zero hardcoded data. Zero incomplete features.

---

*PRD Version 3.0 FINALE — 17 Avril 2026*
*HK Games Slime Store — Le Slime N°1 de Tunisie*
