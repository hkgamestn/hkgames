# 🧠 MÉMOIRE PROJET — HK Games / hap-p-kids.store
**Généré le :** 24 Avril 2026
**Session :** Multi-sessions — développement complet storefront + admin
**Tokens économisés :** ~120 000

---

## 1. 🎯 IDENTITÉ DU PROJET

| Champ | Valeur |
|-------|--------|
| Nom | HK Games |
| Domaine | hap-p-kids.store |
| Description | Slime store e-commerce COD Tunisie — storefront + admin dashboard complet |
| GitHub | https://github.com/hkgamestn/hkgames.git |
| Déploiement | Vercel (auto-deploy sur push main) |
| Supabase Project | rsmebjtwmvwyeocvsowg.supabase.co |
| Stack | Next.js 14 App Router, JavaScript (pas TypeScript), Supabase, Vercel |

---

## 2. 🔧 STACK & CONFIGURATION

**Tech :** Next.js 14 App Router + JavaScript (.js/.jsx) + CSS Modules
**Services :** Supabase (DB + Auth + Storage + Realtime), Navex delivery API, Facebook Pixel, Web Push (VAPID), PWA

### Workflow Git (TOUJOURS faire ainsi)
```bash
cd ~/hkgames-fresh
# Si pas encore cloné :
git clone https://github.com/hkgamestn/hkgames.git hkgames-fresh

git config user.email "hkgamestn@gmail.com"
git config user.name "HK Games"

# Modifier les fichiers...

git add -A
git commit -m "description"
git remote set-url origin https://TOKEN@github.com/hkgamestn/hkgames.git
git push
git remote set-url origin https://github.com/hkgamestn/hkgames.git
```
> ⚠️ TOKEN = disponible dans la mémoire Claude (memory_user_edits #1)

### Variables d'environnement (.env.local — déjà configurées sur Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### Design System
```css
--color-primary: #a855f7   /* violet */
--color-accent:  #ec4899   /* magenta */
--color-cta:     #06b6d4   /* teal */
--bg-base:       #0f0a1e   /* dark */
```
**Fonts :** Nunito (titles) + Inter (body)
**Style :** Claymorphism Gen-Z dark

---

## 3. ✅ ÉTAT ACTUEL — Ce qui fonctionne

- [x] Storefront complet (landing, boutique, unicolore, bicolore, buddies)
- [x] Three.js hero + SlimeLab canvas animations
- [x] Panier sidebar + free delivery progress
- [x] Checkout COD + formulaire client
- [x] Page confirmation /merci avec confetti
- [x] OTO Buddy (prix DB dynamique, timer 5min)
- [x] Social Proof Toast (toutes pages sauf /admin)
- [x] Admin dashboard /admin (auth Supabase)
- [x] Admin: Overview KPIs
- [x] Admin: Produits CRUD + stock éditable par couleur
- [x] Admin: Commandes avec filtres + actions (confirmer/annuler/supprimer)
- [x] Admin: Modifier commande (panel latéral)
- [x] Admin: Créer commande manuelle
- [x] Admin: Numéro commande séquentiel (séquence PostgreSQL atomique)
- [x] Admin: Navex modal par commande
- [x] Admin: Paramètres (seuil stock, OTO discount, etc.)
- [x] Push notifications Web (VAPID) + guide Android/iOS
- [x] App Badge API (badge icône PWA)
- [x] Notifications urgency:high pour Android (FCM immédiat)
- [x] StockBadge orange (seuil depuis DB)
- [x] Facebook Pixel (bloqué sur localhost/vercel/test=1)
- [x] PWA manifest + Service Worker
- [x] Performance: lazy load sections, priority images, canvas throttle 30fps
- [x] Preconnect Supabase dans <head>

---

## 4. 🏗️ ARCHITECTURE

```
hkgames-fresh/
├── src/
│   ├── app/
│   │   ├── page.js                    ← Homepage (lazy imports)
│   │   ├── layout.js                  ← Global layout + SocialToast + preconnect
│   │   ├── boutique/                  ← Page boutique
│   │   ├── commander/
│   │   │   └── CheckoutForm.jsx       ← Formulaire commande COD
│   │   ├── merci/
│   │   │   └── ConfirmationContent.jsx← Page confirmation (OTO + récap)
│   │   ├── produit/[slug]/            ← Fiche produit
│   │   ├── shop/                      ← Catalogue
│   │   └── admin/
│   │       ├── layout.js              ← Auth guard admin
│   │       ├── commandes/page.js      ← Gestion commandes
│   │       ├── produits/page.js       ← Gestion produits + stock
│   │       └── parametres/page.js     ← Paramètres boutique
│   ├── components/
│   │   ├── homepage/
│   │   │   ├── HeroSection.jsx        ← Hero (images priority)
│   │   │   ├── SlimeLab.jsx           ← Labo canvas (IntersectionObserver)
│   │   │   └── SocialToast.jsx        ← Toast achats (masqué sur /admin)
│   │   ├── product/
│   │   │   ├── ProductCard.jsx        ← Carte produit (eye hint + overlay)
│   │   │   └── MagicMixCanvas.jsx     ← Animation bicolore
│   │   ├── admin/
│   │   │   ├── OrderEditPanel.jsx     ← Panel modification commande
│   │   │   └── CreateOrderModal.jsx   ← Modal création commande admin
│   │   ├── confirmation/
│   │   │   └── OTOWidget.jsx          ← OTO Buddy (prix DB dynamique)
│   │   └── ui/
│   │       └── StockBadge.jsx         ← Badge stock (seuil depuis DB)
│   └── lib/
│       ├── actions/
│       │   └── orders.js              ← Toutes les server actions commandes
│       ├── cart/store.js              ← Zustand cart store
│       └── push/subscribe.js          ← Push subscription (upsert endpoint)
├── public/
│   └── sw.js                          ← Service Worker (Badge API + push)
├── supabase/
│   ├── functions/send-push/index.js   ← Edge Function push (urgency:high)
│   └── migrations/                    ← SQL migrations
└── next.config.js                     ← avif+webp, cache, compress
```

---

## 5. 🧬 CODE CRITIQUE

### Server Action — createAdminOrder (orders.js)
```javascript
// Utilise RPC next_order_number() — séquence PostgreSQL atomique
const { data: seqData } = await supabase.rpc('next_order_number')
const orderNumber = String(seqData).padStart(6, '0')
```

### Push — urgency high (send-push/index.js)
```javascript
await webpush.sendNotification(pushSub, JSON.stringify(payload), {
  urgency: 'high',
  TTL: 60,
})
```

### App Badge (sw.js)
```javascript
self.addEventListener('push', (event) => {
  const unseen = typeof data.unseen_count === 'number' ? data.unseen_count : 1
  if ('setAppBadge' in self.registration) {
    self.registration.setAppBadge(unseen).catch(() => {})
  }
  // ...showNotification
})
```

### Checkout — ordre correct (CheckoutForm.jsx)
```javascript
// ⚠️ router.push AVANT clearCart — sinon redirect vers /panier
router.push(`/merci?id=${result.orderId}`)
clearCart()
// Guard:
if (items.length === 0 && !submitting) { router.replace('/panier'); return null }
```

### StockBadge — threshold depuis DB
```javascript
// Cache mémoire pour éviter N requêtes
let cachedThreshold = null
async function getThreshold() {
  if (cachedThreshold !== null) return cachedThreshold
  const { data } = await supabase.from('settings').select('value')
    .eq('key', 'stock_alert_threshold').maybeSingle()
  cachedThreshold = data?.value ? parseInt(data.value) : 5
  return cachedThreshold
}
```

### OTO — prix depuis DB (OTOWidget.jsx)
```javascript
useEffect(() => {
  const supabase = createClient()
  supabase.from('products').select('id, price_dt')
    .eq('line', 'buddies').eq('is_active', true).limit(1).maybeSingle()
    .then(({ data }) => {
      if (data?.price_dt) setBuddyPrice(data.price_dt)
      if (data?.id) setBuddyProductId(data.id)
    })
}, [])
```

### confirmOrder — stock check robuste
```javascript
// Fallback par line si product_id fictif
let { data: product } = await supabase.from('products')
  .select('colors, name, line').eq('id', item.product_id).maybeSingle()
if (!product && item.line) {
  const { data: byLine } = await supabase.from('products')
    .select('colors, name, line').eq('line', item.line).eq('is_active', true)
    .limit(1).maybeSingle()
  product = byLine
}
if (!product) { console.warn('[confirmOrder] skip:', item.product_id); continue }
```

---

## 6. 🐛 BUGS RÉSOLUS — NE PAS RÉINTRODUIRE

| Bug | Cause | Solution |
|-----|-------|----------|
| "Produit introuvable" au checkout | SlimeLab utilisait `lab-unicolore-Rose` comme ID fictif | Fetch vrai ID depuis DB + fallback par `line` dans confirmOrder |
| duplicate order_number | COUNT+1 race condition | Séquence PostgreSQL `next_order_number()` RPC |
| Page confirmation non affichée | `clearCart()` avant `router.push` → redirect /panier | `router.push` AVANT `clearCart()` + guard `!submitting` |
| OTO affiche 12 DT mais admin reçoit 15 DT | BUDDY_PRICE hardcodé à 18 DT | Fetch prix réel depuis DB `line=buddies` |
| StockBadge ignore seuil admin | Seuil hardcodé à 5 dans composant | Lecture `stock_alert_threshold` depuis settings DB |
| Double notification push | Push envoyé sur `pending` ET `confirmed` | Supprimé push `pending`, gardé seulement `confirmed` |
| Push Android délai 1 minute | FCM mode doze (priorité basse) | `urgency: 'high'` + `TTL: 60` dans send-push |
| SocialToast sur pages admin | Pas de filtre pathname | `usePathname()` + `return null` si `/admin` |
| Boutons actions trop petits | 30×30px sans label | 36px height + padding + border coloré par type |

---

## 7. 🔄 EN COURS — Session interrompue ici

**Dernière tâche accomplie :** Optimisations performance LCP + INP (score Clarity 46/100)

**Ce qui a été fait dans cette session :**
- preconnect Supabase + Google Fonts dans layout.js
- Lazy load SlimeLab, SocialProof, WhySlime, ReviewSection
- priority images sur HeroSection (toutes) + ProductCard (index < 4)
- canvas loops: document.visibilitychange + IntersectionObserver
- next.config: compress:true + cache headers icons/sounds
- Domaine corrigé hap-p-kids.store dans allowedOrigins

**Prochaine action immédiate :** Attendre 24-48h de trafic réel et relire Clarity pour mesurer l'impact

---

## 8. 📋 BACKLOG

### Priorité HAUTE
- [ ] Mesurer score Clarity après déploiement perf (cible LCP < 2.5s, INP < 200ms)
- [ ] Vérifier SQL migration `next_order_number` bien exécutée sur Supabase
- [ ] Vérifier `stock_alert_threshold` dans table settings Supabase

### Priorité MOYENNE
- [ ] Option admin pour choisir le produit OTO (pas forcément Buddy)
- [ ] Filtre trafic Meta Pixel (bloquer previews Vercel en Allow list)
- [ ] Rapport commandes (export CSV)
- [ ] Suivi Navex temps réel dans l'admin

### Idées / À explorer
- [ ] SMS confirmation commande client
- [ ] Statistiques ventes par produit/couleur
- [ ] Upsell bicolore → buddy (pas seulement unicolore)

---

## 9. 📐 DÉCISIONS TECHNIQUES

| Décision | Raison |
|----------|--------|
| JavaScript pas TypeScript | Préférence utilisateur explicite |
| Supabase pas Firebase | Projet HK Games séparé de Walaup (Firebase) |
| COD uniquement | Modèle business Tunisie |
| `createAdminClient()` dans server actions | Service Role Key — contourne RLS pour l'admin |
| `maybeSingle()` pas `single()` | `single()` crash si 0 résultat |
| OTO avant récap sur /merci | Client voit l'offre en premier, récap accessible en scrollant |
| Push `confirmed` seulement | Éviter double notification (pending + confirmed) |
| `urgency: high` sur push | FCM Android livre immédiatement sans délai doze |

---

## 10. 🗄️ SUPABASE — Tables principales

```
orders          — id, order_number, status, customer_*, items (jsonb), total_dt, is_seen, oto_accepted
products        — id, name, line, price_dt, colors (jsonb avec {name, hex, stock}), is_active
settings        — key, value (stock_alert_threshold, oto_discount_dt, oto_enabled, shipping_price_dt)
push_subscriptions — id, endpoint, p256dh, auth, is_active, device_name
testimonials    — id, content, author, is_approved
order_logs      — order_id, action, new_value
```

### SQL à exécuter si pas encore fait
```sql
-- Séquence numéro commande
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1 NO CYCLE;
SELECT setval('order_number_seq', COALESCE((SELECT MAX(CAST(order_number AS BIGINT)) FROM orders WHERE order_number ~ '^[0-9]+$'), 0));
CREATE OR REPLACE FUNCTION next_order_number() RETURNS BIGINT LANGUAGE SQL SECURITY DEFINER AS $$ SELECT nextval('order_number_seq'); $$;

-- is_seen pour badge PWA
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_seen BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_orders_is_seen ON orders (is_seen) WHERE is_seen = FALSE;
```

---

## 🔁 INSTRUCTION POUR CLAUDE (session suivante)

Tu travailles sur **HK Games (hap-p-kids.store)** avec Croft.
Lis ce fichier entièrement, puis :
1. Clone le repo : `git clone https://[TOKEN]@github.com/hkgamestn/hkgames.git hkgames-fresh`
   → TOKEN disponible dans ta mémoire (memory_user_edits)
2. Configure git : `git config user.email "hkgamestn@gmail.com" && git config user.name "HK Games"`
3. Confirme le contexte chargé en 5 bullets
4. Demande quelle tâche du backlog attaquer

**Règles absolues :**
- Jamais TypeScript
- Jamais Firebase (projet séparé de Walaup)
- Toujours `router.push('/merci')` AVANT `clearCart()`
- Toujours `maybeSingle()` pas `single()` sur les queries Supabase
- Push token dans remote URL, puis le retirer après push
- Livrer du code complet, production-ready, sans demi-mesures
