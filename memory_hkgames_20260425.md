# 🧠 MÉMOIRE PROJET — HK Games / hap-p-kids.store
**Généré le :** 25 Avril 2026
**Session :** Session 3 — fixes admin + live dashboard
**Tokens économisés :** ~180 000

---

## 1. 🎯 IDENTITÉ DU PROJET

| Champ | Valeur |
|-------|--------|
| Nom | HK Games |
| Domaine | hap-p-kids.store |
| Description | Slime store e-commerce COD Tunisie — storefront Next.js + admin dashboard complet |
| GitHub | https://github.com/hkgamestn/hkgames.git |
| Déploiement | Vercel (auto-deploy sur push main) |
| Supabase | rsmebjtwmvwyeocvsowg.supabase.co |
| Stack | Next.js 14 App Router + JavaScript + CSS Modules + Supabase |

---

## 2. 🔧 STACK & CONFIGURATION

**Tech :** Next.js 14 App Router, JavaScript (.js/.jsx), CSS Modules, Supabase, Vercel
**Services :** Supabase (DB+Auth+Storage+Realtime), Navex delivery, Facebook Pixel+CAPI, Web Push (VAPID), PWA

### Workflow Git (TOUJOURS)
```bash
cd ~/hkgames-fresh
# Si pas cloné :
git clone https://TOKEN@github.com/hkgamestn/hkgames.git hkgames-fresh
git config user.email "hkgamestn@gmail.com" && git config user.name "HK Games"

# Modifier, puis :
git add -A && git commit -m "description"
git remote set-url origin https://TOKEN@github.com/hkgamestn/hkgames.git
git push
git remote set-url origin https://github.com/hkgamestn/hkgames.git
```
> TOKEN stocké dans memory Claude (memory_user_edits #1)

### Variables Vercel (déjà configurées)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
NEXT_PUBLIC_SITE_URL=https://hap-p-kids.store
```

### Design System
```css
--color-primary: #a855f7   /* violet */
--color-accent:  #ec4899   /* magenta */
--bg-base:       #0f0a1e   /* dark */
```
Fonts : Nunito (titles) + Inter (body)

---

## 3. ✅ ÉTAT ACTUEL — Ce qui fonctionne

### Storefront
- [x] Landing page + boutique + pages produit unicolore/bicolore/buddies
- [x] SlimeLab canvas animations (throttle 30fps bas de gamme)
- [x] Panier Zustand + free delivery progress
- [x] Checkout COD — commandes créées en `status: pending`
- [x] Anti-doublon — upsert par téléphone (24h) dans createPendingOrder
- [x] Page confirmation /merci + confetti + OTO Buddy
- [x] OTO prix dynamique depuis DB (line=buddies)
- [x] Social Proof Toast (masqué sur /admin)
- [x] StockBadge orange (seuil depuis DB settings)
- [x] Eye hint + overlay hover sur cartes produit
- [x] Facebook Pixel Purchase (bloqué localhost/vercel/test=1) + CAPI dedup eventID
- [x] Performance: preconnect Supabase, lazy sections, priority images, avif

### Admin
- [x] Auth Supabase guard
- [x] Dashboard KPIs avec Realtime
- [x] Commandes: filtres statut + date + recherche + select tous statuts
- [x] Flow: commande arrive en `pending` → admin confirme → stock décrémenté + push
- [x] Bouton Confirmer → updateOrderStatus('confirmed') → push notif + stock
- [x] Modifier commande (OrderEditPanel) — préserve shipping_dt + discount_dt
- [x] Créer commande manuelle (CreateOrderModal)
- [x] Numéro commande séquentiel (PostgreSQL séquence next_order_number())
- [x] Navex: envoi, tracking depuis status_message, print URL depuis lien, statut shipped sauvegardé
- [x] Bouton 🚚 masqué si navex_tracking présent en DB (persiste F5 + changement tab)
- [x] Export CSV (toutes colonnes, filtres respectés, UTF-8 BOM)
- [x] Badge commandes non-consultées (is_seen) + bordure violette
- [x] Suppression définitive disponible sur tous les onglets
- [x] Produits: stock éditable par couleur (+/- input)
- [x] Avis & UGC avec Realtime
- [x] Paramètres: sons uploadables (bucket: notification-sounds) via API route
- [x] Sons depuis DB dans OrderNotifier (plus hardcodé)
- [x] 🔴 Live: simulateur commandes pour Instagram/TikTok/Facebook

### Push Notifications
- [x] Service Worker v4 (skipWaiting, reg.update(), visibilitychange)
- [x] Route /api/admin/send-push (web-push npm, urgency:high, TTL:60)
- [x] Route /api/admin/test-push (teste tout le pipeline, désactive sub expirées)
- [x] Route /api/admin/upload-sound (service role, bypass RLS)
- [x] subscribe.js: upsert endpoint/p256dh/auth, force re-subscribe Android
- [x] App Badge API (setAppBadge dans SW, clearAppBadge au clic)
- [x] Colonne is_seen sur orders pour badge PWA

---

## 4. 🏗️ ARCHITECTURE

```
hkgames-fresh/
├── src/
│   ├── app/
│   │   ├── page.js                      ← Homepage (lazy imports sections)
│   │   ├── layout.js                    ← preconnect Supabase + SocialToast + SW register
│   │   ├── commander/CheckoutForm.jsx   ← Checkout COD + Pixel Purchase
│   │   ├── merci/ConfirmationContent.jsx← Confirmation + OTO
│   │   ├── shop/ + boutique/ + produit/ ← Catalogue
│   │   ├── api/admin/
│   │   │   ├── send-push/route.js       ← Push principal (pending+confirmed+oto)
│   │   │   ├── test-push/route.js       ← Test pipeline push
│   │   │   └── upload-sound/route.js    ← Upload son (service role)
│   │   └── admin/
│   │       ├── page.js                  ← Dashboard + Realtime
│   │       ├── AdminNav.jsx             ← Nav avec lien Live
│   │       ├── commandes/page.js        ← Commandes + filtres + export CSV
│   │       ├── produits/page.js         ← Produits + stock éditable
│   │       ├── avis/page.js             ← Avis + Realtime
│   │       ├── live/page.js             ← Simulateur Live Instagram/TikTok
│   │       └── parametres/page.js       ← Settings + upload sons
│   ├── components/
│   │   ├── homepage/
│   │   │   ├── HeroSection.jsx          ← priority images
│   │   │   ├── SlimeLab.jsx             ← canvas + IntersectionObserver
│   │   │   └── SocialToast.jsx          ← masqué /admin via usePathname
│   │   ├── product/ProductCard.jsx      ← eye hint + overlay + priority index<4
│   │   ├── admin/
│   │   │   ├── OrderEditPanel.jsx       ← édition commande (shipping+discount préservés)
│   │   │   ├── CreateOrderModal.jsx     ← création manuelle
│   │   │   └── OrderNotifier.jsx        ← son depuis DB settings
│   │   ├── confirmation/OTOWidget.jsx   ← prix DB dynamique + onAccepted callback
│   │   └── ui/StockBadge.jsx            ← seuil depuis DB (cache mémoire)
│   └── lib/
│       ├── actions/orders.js            ← toutes les server actions (createAdminClient)
│       ├── actions/fbcapi.js            ← CAPI Facebook
│       ├── cart/store.js                ← Zustand
│       └── push/subscribe.js            ← force re-subscribe + upsert endpoint
├── public/
│   └── sw.js                            ← SW v4 + Badge API + visibilitychange
├── supabase/functions/send-push/       ← PLUS UTILISÉ (remplacé par API route)
└── next.config.js                       ← avif+webp, cache, compress
```

---

## 5. 🧬 CODE CRITIQUE

### sendPushNotification (orders.js) — NE PAS TOUCHER
```javascript
async function sendPushNotification(orderId, type) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hap-p-kids.store'
    await fetch(`${baseUrl}/api/admin/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, type }),
    })
  } catch (err) { console.error('[sendPushNotification]', err) }
}
```

### createPendingOrder — anti-doublon téléphone
```javascript
// Cherche commande pending existante pour ce tel (24h)
const { data: existing } = await supabase
  .from('orders').select('id')
  .eq('customer_phone', phone).eq('status', 'pending')
  .gte('created_at', since24h).is('deleted_at', null)
  .order('created_at', { ascending: false }).limit(1).maybeSingle()
// Si trouvé → update, sinon → insert
```

### updateOrderStatus → confirm = stock + push
```javascript
if (status === 'confirmed') {
  // Décrémenter stock par item
  for (const item of order.items) {
    await supabase.rpc('decrement_stock', { p_product_id, p_color, p_qty })
    await supabase.from('inventory_logs').insert({ ... })
  }
  await sendPushNotification(orderId, 'confirmed')
}
```

### updateOrderItems — préserver shipping + discount
```javascript
const subtotal   = items.reduce((s, i) => s + i.price_dt * i.qty, 0)
const shipping   = parseFloat(updatedData.shipping_dt ?? 8)
const discount   = parseFloat(updatedData.discount_dt ?? 0)
const total      = parseFloat((subtotal + shipping - discount).toFixed(3))
```

### Navex — champs réponse API
```javascript
// Réponse Navex: { status:1, status_message:"122571184711", lien:"https://app.navex.tn/print/..." }
const trackingNumber = data.status_message || null  // ← numéro de colis
const printUrl       = data.lien           || null  // ← lien impression
```

### Bouton Navex — condition d'affichage
```jsx
// Masquer si déjà expédié OU tracking en DB
{order.status === 'confirmed' && order.status !== 'shipped' && !order.navex_tracking && !navexDone[order.id] && (
  <button>🚚</button>
)}
```

### Checkout — ordre correct (NE PAS INVERSER)
```javascript
router.push(`/merci?id=${result.orderId}`)  // AVANT
clearCart()                                  // APRÈS
if (items.length === 0 && !submitting) { router.replace('/panier'); return null }
```

### Live — scheduler aléatoire avec burst
```javascript
const delay = randDelay(800, 10000) // 0.8s → 10s
// 15% chance burst 2-3 commandes
const burst = Math.random() < 0.15 ? randInt(2, 3) : 1
for (let i = 0; i < burst; i++) {
  setTimeout(fireOrder, i * randInt(200, 600))
}
```

---

## 6. 🐛 BUGS RÉSOLUS — NE PAS RÉINTRODUIRE

| Bug | Cause | Solution |
|-----|-------|----------|
| "Produit introuvable" checkout | SlimeLab utilisait `lab-unicolore-Rose` comme ID | Fetch vrai ID depuis DB + fallback par `line` dans confirmOrder |
| duplicate order_number | COUNT+1 race condition | Séquence PostgreSQL `next_order_number()` RPC |
| Page confirmation non affichée | `clearCart()` avant `router.push` | `router.push` AVANT `clearCart()` + guard `!submitting` |
| OTO prix 12 vs 15 DT admin | BUDDY_PRICE hardcodé à 18 | Fetch prix réel depuis DB line=buddies |
| StockBadge ignore seuil admin | Seuil hardcodé à 5 | Lecture `stock_alert_threshold` depuis settings DB |
| Double notification push | Push pending ET confirmed | Supprimé push pending, seulement confirmed |
| Push Android délai 1 minute | FCM mode doze | `urgency:'high'` + `TTL:60` dans send-push route |
| SocialToast sur /admin | Pas de filtre pathname | `usePathname()` + return null si /admin |
| Bouton Navex réapparaît F5 | State React réinitialisé, tracking pas sauvé | Condition sur `order.navex_tracking` (DB) pas state local |
| Navex tracking_number null | Champ dans `status_message` pas `tracking_number` | `data.status_message` pour tracking, `data.lien` pour print |
| Total sans livraison après edit | updateOrderItems total=subtotal seul | `total = subtotal + shipping_dt - discount_dt` |
| Remise bundle perdue après edit | discount_dt pas transmis à updateOrderItems | OrderEditPanel lit `order.discount_dt` depuis DB et le transmet |
| Erreur Navex Server Component | `createClient()` utilise cookies() non dispo en Server Action | `createAdminClient()` (service role, sans cookies) |
| "auth column not found" push | Colonnes p256dh/auth manquantes en DB | SQL: ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS |
| Upload son RLS error | Client anon bloqué par RLS storage | Route API /api/admin/upload-sound avec service role |
| Son notification hardcodé | OrderNotifier utilisait /sounds/order-alert.mp3 | Lecture sound_new_order depuis settings DB |
| Commandes dupliquées | createPendingOrder toujours INSERT | Upsert par téléphone (24h) avant insert |
| updateOrderItems createClient cookies | await createClient() dans server action | createAdminClient() |

---

## 7. 🔄 EN COURS

**Dernière tâche :** Génération fichier mémoire + compression

**Derniers commits :**
- `7fb9196` — Live dashboard v2 analytics + toasts flottants + bursts
- `410303e` — Live page v1 + AdminNav
- `3d65758` — Anti-doublon commandes par téléphone
- `9bbf22f` — Fix remise bundle + livraison gratuite préservées

**Prochaine session :** Lire ce fichier + cloner le repo + demander quelle tâche du backlog attaquer

---

## 8. 📋 BACKLOG

### Priorité HAUTE
- [ ] Tester Live page en conditions réelles (Instagram/TikTok)
- [ ] Vérifier SQL migrations appliquées (navex_tracking, navex_print_url, is_seen)
- [ ] Mesurer score Clarity après déploiement perf (cible LCP<2.5s, INP<200ms)

### Priorité MOYENNE
- [ ] Option admin pour choisir le produit OTO (pas forcément Buddy)
- [ ] Upsell bicolore → buddy (pas seulement unicolore)
- [ ] Statistiques ventes par produit/couleur dans analytics admin
- [ ] Rapport commandes période (revenue par semaine/mois)
- [ ] SMS confirmation commande client

### Idées
- [ ] Filtre trafic Meta Pixel — Allow list hap-p-kids.store uniquement
- [ ] Tracking Navex temps réel (statut colis côté client)
- [ ] Live page: option pour afficher les VRAIES commandes récentes en parallèle

---

## 9. 📐 DÉCISIONS TECHNIQUES

| Décision | Raison |
|----------|--------|
| JavaScript pas TypeScript | Préférence explicite Croft |
| createAdminClient() dans server actions | service_role bypasse RLS, cookies() indispo en Server Action |
| maybeSingle() pas single() | single() crash si 0 résultat |
| Route API Next.js pour push (pas Edge Function) | Zéro cold start vs 2-5s pour Edge Function Supabase |
| router.push AVANT clearCart | Évite redirect /panier car items=0 avant navigation |
| push uniquement sur 'confirmed' | Évite double notif (pending + confirmed) |
| urgency:high + TTL:60 | FCM Android livre immédiatement |
| Upsert pending par téléphone (24h) | Évite doublons si client recommence |
| Tracking Navex depuis status_message | API Navex retourne le numéro là, pas dans tracking_number |

---

## 10. 🗄️ SUPABASE — Tables & SQL requis

### Tables principales
```
orders          — id, order_number, status, customer_*, items(jsonb), total_dt,
                  subtotal_dt, shipping_dt, discount_dt, is_seen, oto_accepted,
                  navex_tracking, navex_print_url, navex_sent_at, deleted_at
products        — id, name, line, price_dt, colors(jsonb: [{name,hex,stock}]), is_active
settings        — key, value
                  Clés: stock_alert_threshold, oto_discount_dt, oto_enabled,
                        shipping_price_dt, free_shipping_threshold_dt,
                        sound_new_order, sound_confirmed
push_subscriptions — id, endpoint(UNIQUE), p256dh, auth, subscription(jsonb),
                     is_active, device_name, updated_at
testimonials    — id, customer_name, customer_city, rating, review_text, is_approved
inventory_logs  — order_id, product_id, color, delta, reason
order_logs      — order_id, action, new_value
```

### SQL à appliquer si pas encore fait
```sql
-- Séquence numéro commande
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1 NO CYCLE;
SELECT setval('order_number_seq', COALESCE((SELECT MAX(CAST(order_number AS BIGINT)) FROM orders WHERE order_number ~ '^[0-9]+$'), 0));
CREATE OR REPLACE FUNCTION next_order_number() RETURNS BIGINT LANGUAGE SQL SECURITY DEFINER AS $$ SELECT nextval('order_number_seq'); $$;

-- Colonnes orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_seen BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS navex_tracking TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS navex_print_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS navex_sent_at TIMESTAMPTZ;

-- Colonnes push_subscriptions
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS endpoint TEXT UNIQUE;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS p256dh TEXT;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS auth TEXT;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrer données existantes
UPDATE push_subscriptions SET endpoint=subscription->>'endpoint', p256dh=subscription->'keys'->>'p256dh', auth=subscription->'keys'->>'auth' WHERE endpoint IS NULL AND subscription IS NOT NULL;

NOTIFY pgrst, 'reload schema';
```

---

## 🔁 INSTRUCTION POUR CLAUDE (session suivante)

Tu travailles sur **HK Games (hap-p-kids.store)** avec Croft.
Lis ce fichier entièrement puis :
1. Clone : `git clone https://[TOKEN]@github.com/hkgamestn/hkgames.git hkgames-fresh`
   → TOKEN dans ta mémoire (memory_user_edits #1)
2. `git config user.email "hkgamestn@gmail.com" && git config user.name "HK Games"`
3. Confirme en 5 bullets ce que tu as assimilé
4. Demande quelle tâche du backlog attaquer

**Règles absolues :**
- JAMAIS TypeScript
- JAMAIS toucher sw.js, subscribe.js, /api/admin/send-push, sendPushNotification dans orders.js sans raison explicite
- TOUJOURS router.push('/merci') AVANT clearCart()
- TOUJOURS maybeSingle() pas single()
- TOUJOURS createAdminClient() dans les server actions (pas createClient avec cookies)
- Navex tracking = data.status_message, print URL = data.lien
- Token push via remote URL temporaire, effacé après push
