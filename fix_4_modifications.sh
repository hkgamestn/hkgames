#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  HK Games — 4 Modifications (méthode heredoc propre)
#  Lance avec : bash fix_4_modifications.sh
# ═══════════════════════════════════════════════════════════════

set -e
PROJECT_DIR="$HOME/hkgames-fresh"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   HK Games — 4 Modifications en cours...        ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ ! -d "$PROJECT_DIR" ]; then echo -e "${RED}❌ $PROJECT_DIR introuvable.${NC}"; exit 1; fi
cd "$PROJECT_DIR"
echo -e "${GREEN}✅ Dossier : $PROJECT_DIR${NC}"

# ═══════════════════════════════════════════════════════════════
# FIX 1 — SlimeLab : yeux Buddy EN HAUT
# sed ciblé — canvas height 48% + coordonnées Y ajustées
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}👁️  FIX 1 — Yeux Buddy en haut...${NC}"

sed -i "s/position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2/position: 'absolute', top: 0, left: 0, width: '100%', height: '48%', pointerEvents: 'none', zIndex: 2/g" \
  src/components/homepage/SlimeLab.jsx

sed -i "s/y: h \* 0\.45/y: h * 0.68/g" src/components/homepage/SlimeLab.jsx
sed -i "s/y: h \* 0\.42/y: h * 0.65/g" src/components/homepage/SlimeLab.jsx
sed -i "s/y: h \* 0\.40/y: h * 0.65/g" src/components/homepage/SlimeLab.jsx
sed -i "s/y: h \* 0\.44/y: h * 0.68/g" src/components/homepage/SlimeLab.jsx
sed -i "s/y: h \* 0\.50/y: h * 0.70/g" src/components/homepage/SlimeLab.jsx

echo -e "${GREEN}✅ Fix 1 terminé${NC}"

# ═══════════════════════════════════════════════════════════════
# FIX 2 — Panier web : padding carte résumé desktop
# Réécriture complète du module CSS
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}🛒 FIX 2 — Panier web padding résumé desktop...${NC}"

cat > src/app/panier/CartContent.module.css << 'ENDOFFILE'
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.title {
  font-family: var(--font-title);
  font-weight: 900;
  font-size: 2rem;
  margin-bottom: var(--space-8);
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 768px) {
  .layout { grid-template-columns: 1fr 420px; gap: var(--space-8); }
}

.itemsList { display: flex; flex-direction: column; gap: var(--space-4); }

.bundleBadge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  background: rgba(16,185,129,0.1);
  border: 1.5px solid rgba(16,185,129,0.35);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.88rem;
  color: #10b981;
}
.bundleSavings { font-size: 0.82rem; color: #10b981; font-weight: 600; }

.upsellBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  background: rgba(251,191,36,0.08);
  border: 1.5px solid rgba(251,191,36,0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-5);
  font-size: 0.85rem;
  color: var(--color-cta);
  font-weight: 600;
}
.upsellLink {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--color-cta);
  text-decoration: underline;
  white-space: nowrap;
}

.item {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: var(--space-4);
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--bg-card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: border-color var(--transition-fast);
}
.item:hover { border-color: rgba(168,85,247,0.35); }

.itemImage {
  width: 72px; height: 72px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  background: var(--bg-surface);
  flex-shrink: 0;
}
.itemColorDot { width: 100%; height: 100%; border-radius: var(--radius-sm); }

.itemInfo { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.itemName  { font-family: var(--font-title); font-weight: 700; font-size: 0.9rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.itemSub   { font-size: 0.78rem; color: var(--color-primary); font-style: italic; }
.itemColor { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--text-muted); }
.colorDot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.itemPrice { font-family: var(--font-title); font-weight: 800; font-size: 0.88rem; color: var(--color-cta); margin-top: 2px; }
.itemTotal { font-family: var(--font-title); font-weight: 800; color: var(--color-cta); font-size: 0.9rem; }

.itemActions { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }

.qtyControl, .qtyControls {
  display: flex; align-items: center; gap: var(--space-2);
  background: var(--bg-surface);
  border: 1px solid var(--bg-card-border);
  border-radius: var(--radius-xl);
  padding: 2px var(--space-2);
}
.qtyControl button, .qtyBtn {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 700;
  color: var(--text-primary);
  background: none; border: none; cursor: pointer;
  border-radius: 50%;
  transition: background var(--transition-fast);
}
.qtyControl button:hover, .qtyBtn:hover { background: rgba(168,85,247,0.15); }
.qtyControl span, .qty { min-width: 20px; text-align: center; font-weight: 700; font-size: 0.88rem; }

.removeBtn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
  background: none; border: none; cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}
.removeBtn:hover { color: var(--color-danger); background: rgba(239,68,68,0.1); }

/* ── Summary card — DESKTOP AMÉLIORÉ ── */
.summary { width: 100%; }

.summaryCard {
  background: var(--bg-card);
  border: 1.5px solid var(--bg-card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: 0 8px 32px rgba(168,85,247,0.12), 0 2px 8px rgba(0,0,0,0.2);
  backdrop-filter: blur(12px);
}

@media (min-width: 768px) {
  .summaryCard {
    position: sticky;
    top: 88px;
    padding: var(--space-7) var(--space-7);
  }
}

.summaryTitle {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--text-primary);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--bg-card-border);
}

.summaryRows { display: flex; flex-direction: column; gap: var(--space-3); }

.summaryRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  color: var(--text-secondary);
}
.summaryDiscount, .discount { color: var(--color-success); }

.totalRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-4);
  border-top: 1px solid var(--bg-card-border);
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1rem;
  color: var(--text-primary);
}
.totalAmount { font-size: 1.4rem; color: var(--color-cta); }

.codBadge, .codNotice {
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-size: 0.8rem;
  color: var(--color-success);
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
}

.checkoutBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: var(--color-cta);
  color: #0f0a1e;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1rem;
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-button);
  text-decoration: none;
  transition: background var(--transition-fast), transform var(--transition-spring);
  min-height: 52px;
  margin-top: var(--space-2);
}
.checkoutBtn:hover { background: var(--color-cta-hover); transform: scale(1.02); }

.clearBtn {
  background: none; border: none;
  color: var(--text-muted); font-size: 0.8rem;
  cursor: pointer; text-align: center;
  text-decoration: underline; padding: var(--space-2);
  transition: color var(--transition-fast);
}
.clearBtn:hover { color: var(--color-danger); }

.continueLink {
  text-align: center; font-size: 0.85rem;
  color: var(--text-muted); text-decoration: underline;
  transition: color var(--transition-fast);
}
.continueLink:hover { color: var(--color-primary); }

.empty, .emptyState {
  min-height: 60vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-4); padding: var(--space-16) var(--space-4); text-align: center;
}
.emptyIcon { color: var(--text-muted); margin-bottom: var(--space-4); }
.emptyText { color: var(--text-secondary); font-size: 1rem; }
.empty h2  { font-family: var(--font-title); font-weight: 900; font-size: 1.6rem; }
.empty p   { color: var(--text-secondary); font-size: 0.95rem; }

.shopBtn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  background: var(--color-cta); color: #0f0a1e;
  font-family: var(--font-title); font-weight: 800;
  padding: var(--space-3) var(--space-8); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-button); min-height: 48px;
  text-decoration: none;
  transition: background var(--transition-fast);
}
.shopBtn:hover { background: var(--color-cta-hover); }

@media (max-width: 767px) {
  .container  { padding: var(--space-4); }
  .title      { font-size: 1.5rem; margin-bottom: var(--space-5); }
  .item       { grid-template-columns: 60px 1fr auto; gap: var(--space-3); padding: var(--space-3); }
  .itemImage  { width: 60px; height: 60px; }
  .summaryCard { padding: var(--space-5); }
  .totalRow   { font-size: 0.9rem; }
  .totalAmount { font-size: 1.15rem; }
  .checkoutBtn { font-size: 0.95rem; padding: var(--space-3) var(--space-4); }
}
ENDOFFILE

echo -e "${GREEN}✅ Fix 2 terminé${NC}"

# ═══════════════════════════════════════════════════════════════
# FIX 3 — Admin global padding/overflow
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}🔧 FIX 3 — Admin global padding/overflow...${NC}"

cat > src/app/admin/admin.css << 'ENDOFFILE'
.adminShell {
  display: flex;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.adminMain {
  flex: 1;
  padding: var(--space-8) var(--space-8);
  overflow-x: hidden;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .adminShell { flex-direction: column; }
  .adminMain  { padding: var(--space-5) var(--space-5); }
}
ENDOFFILE

echo -e "${GREEN}✅ admin.css écrit${NC}"

sed -i 's/min-width: 900px;/min-width: 860px; box-sizing: border-box;/g' \
  src/app/admin/commandes/commandes.module.css 2>/dev/null || true

grep -q 'overflow-x: auto' src/app/admin/commandes/commandes.module.css 2>/dev/null || \
  sed -i 's/\.table {/\.table {\n  overflow-x: auto;/' \
    src/app/admin/commandes/commandes.module.css 2>/dev/null || true

grep -q 'overflow: hidden' src/app/admin/produits/produits.module.css 2>/dev/null || \
  sed -i 's/\.row {/\.row {\n  overflow: hidden;/' \
    src/app/admin/produits/produits.module.css 2>/dev/null || true

for f in src/app/admin/analytics/analytics.module.css src/app/admin/parametres/parametres.module.css; do
  [ -f "$f" ] && grep -q 'overflow-x: hidden' "$f" || \
    { [ -f "$f" ] && sed -i 's/\.page {/\.page {\n  overflow-x: hidden;/' "$f" 2>/dev/null || true; }
done

echo -e "${GREEN}✅ Fix 3 terminé${NC}"

# ═══════════════════════════════════════════════════════════════
# FIX 4 — Notifications : sw.js v2 + send-push avec WhatsApp
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}🔔 FIX 4 — Notifications WhatsApp + Web Push...${NC}"

cat > public/sw.js << 'ENDOFFILE'
// HK Games Service Worker v2 — Web Push + WhatsApp

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() }
  catch { data = { title: 'HK Games', body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title || 'HK Games', {
      body:    data.body    || '',
      icon:    data.icon    || '/icons/hk-logo-192.png',
      badge:   data.badge   || '/icons/badge-72.png',
      tag:     data.tag     || 'hkgames-notif',
      data:    data.data    || {},
      vibrate: data.vibrate || [200, 100, 200],
      requireInteraction: data.requireInteraction ?? true,
      actions: data.actions || [],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const d = event.notification.data || {}

  if (event.action === 'whatsapp' && d.phone) {
    const num = String(d.phone).replace(/[^0-9]/g, '').replace(/^0/, '216')
    const msg = encodeURIComponent('Bonjour, je vous contacte pour votre commande HK Games.')
    event.waitUntil(clients.openWindow('https://wa.me/' + num + '?text=' + msg))
    return
  }

  const target = d.url || ('/admin/commandes' + (d.orderId ? '?id=' + d.orderId : ''))
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes('/admin'))
      if (existing) { existing.focus(); existing.navigate(target) }
      else clients.openWindow(target)
    })
  )
})
ENDOFFILE

echo -e "${GREEN}✅ sw.js v2 écrit${NC}"

if [ -f supabase/functions/send-push/index.js ]; then
cat > supabase/functions/send-push/index.js << 'ENDOFFILE'
// HK Games — Edge Function: send-push v2 (WhatsApp actions)
import webpush from 'npm:web-push'
import { createClient } from 'npm:@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

function buildPayload(type, orderId, orderData) {
  const phone = orderData?.customer_phone || ''
  const name  = orderData?.customer_name  || ''
  const city  = orderData?.customer_city  || ''
  const total = orderData?.total_dt       || 0

  if (type === 'pending') {
    return {
      title: 'Commande en attente',
      body:  (name || phone) + ' - ' + city + ' - ' + total + ' DT',
      icon:  '/icons/hk-logo-192.png',
      badge: '/icons/badge-72.png',
      tag:   'pending-order',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { orderId, url: '/admin/commandes?id=' + orderId, phone },
      actions: [
        { action: 'view',     title: 'Voir' },
        { action: 'whatsapp', title: 'WhatsApp' },
      ],
    }
  }

  if (type === 'confirmed') {
    return {
      title: 'Commande confirmee',
      body:  name + ' - ' + city + ' - ' + total + ' DT',
      icon:  '/icons/hk-logo-192.png',
      badge: '/icons/badge-72.png',
      tag:   'confirmed-order',
      data:  { orderId, url: '/admin/commandes?id=' + orderId },
      vibrate: [100, 50, 100],
      actions: [{ action: 'view', title: 'Voir' }],
    }
  }

  return {
    title: 'HK Games',
    body:  'Commande ' + String(orderId).slice(0, 8).toUpperCase() + ' mise a jour',
    data:  { orderId, url: '/admin/commandes' },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    })
  }

  try {
    const { orderId, type } = await req.json()
    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
    if (!vapidPublic || !vapidPrivate) return new Response('VAPID keys manquantes', { status: 500 })

    webpush.setVapidDetails('mailto:admin@hkgames.tn', vapidPublic, vapidPrivate)

    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .select('customer_phone, customer_name, customer_city, total_dt')
      .eq('id', orderId)
      .single()

    const payload = buildPayload(type, orderId, orderData)

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('is_active', true)

    if (!subs || subs.length === 0) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

    const results = await Promise.allSettled(
      subs.map(async ({ id, subscription }) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload))
          await supabaseAdmin.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', id)
        } catch (err) {
          if (err.statusCode === 410) {
            await supabaseAdmin.from('push_subscriptions').update({ is_active: false }).eq('id', id)
          }
          throw err
        }
      })
    )

    return new Response(JSON.stringify({
      sent:   results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
ENDOFFILE
  echo -e "${GREEN}✅ send-push/index.js v2 écrit${NC}"
fi

# Style waBtn dans commandes.module.css
cat >> src/app/admin/commandes/commandes.module.css << 'ENDOFFILE'

.waBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  margin-left: 2px;
  vertical-align: middle;
}
.waBtn:hover { background: rgba(37,211,102,0.15); }
ENDOFFILE

echo -e "${GREEN}✅ Fix 4 terminé${NC}"

# ═══════════════════════════════════════════════════════════════
# BUILD + GIT
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}🔨 Build Next.js...${NC}"

[ ! -d "node_modules" ] && { echo -e "${YELLOW}📦 npm install...${NC}"; npm install; }

npx next build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build échoué — copie l'erreur et envoie-la moi.${NC}"
  exit 1
fi

echo ""
git add .
git commit -m "fix: yeux Buddy en haut + panier web padding + admin overflow + WhatsApp push"
git push || (git pull origin main --rebase && git push)

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ 4 modifications déployées !                 ║"
echo "║                                                  ║"
echo "║   ✅ Yeux Buddy en haut de la carte             ║"
echo "║   ✅ Panier web — résumé bien paddé             ║"
echo "║   ✅ Admin — padding/overflow global            ║"
echo "║   ✅ Push WA — bouton WhatsApp dans notif       ║"
echo "║                                                  ║"
echo "║   npm run dev → http://localhost:3000            ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
