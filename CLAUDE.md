# CLAUDE.md — HK Games Slime Store

> Mémoire projet pour Claude Code. Projet **autonome** (son repo, son Vercel, son Supabase) —
> **aucune** dépendance au monorepo Walaup, et la loi/gouvernance Walaup ne s'applique PAS ici.
> La source de vérité produit/design est le PRD du repo ; ce fichier ne fait que l'orienter.

## Mémoire de session (fiable même sur le web)

La mémoire de continuité vit dans **`MEMORY.md`** (committé, importé ci-dessous → chargé à CHAQUE
session). Sur Claude Code web, l'auto-memory machine-locale ne survit PAS d'une session cloud à
l'autre : **seul ce qui est committé revient**. `MEMORY.md` est donc la vraie mémoire du projet.

@MEMORY.md

**Protocole de fin de session (obligatoire).** Dès qu'une session change quelque chose de durable
(décision, avancement, piège rencontré, prochaine étape), avant de terminer Claude doit :

1. Mettre à jour `MEMORY.md` — état courant, décisions, prochaines étapes, gotchas, + une ligne au
   journal. Rester concis (une ligne par entrée) ; si ça gonfle, créer un snapshot daté
   `memory_hkgames_AAAAMMJJ.md` via le skill `hk-commerce:memory-compress` et le référencer.
2. Committer et pousser : `git add MEMORY.md && git commit -m "chore(memory): maj session" && git push`.

## Le projet

**HK Games Slime Store v3** — e-commerce DTC de slime artisanal, Tunisie. Objectif : leader du
slime en Tunisie, expérience sensorielle premium (niveau Popmart / Gymshark) parlant à la famille
tunisienne (confiance, cadeau, **COD**, livraison à domicile).

- Repo : `github.com/hkgamestn/hkgames` · package `hk-games-slime-store`
- Prod : Vercel → **hkgames.tn** · Supabase : projet dédié « hkgames-slime » (mono-projet, pas de multitenant)
- Source de vérité : **`PRD_HKGames_SlimeStore_v3_FINAL.md`** (design system, KPIs, parcours). Y renvoyer, ne pas le paraphraser.
- Historique de contexte : `memory_hkgames_*.md` (issus du skill `hk-commerce:memory-compress`).

## Stack (imposée par le PRD)

Next.js 15 App Router · **JavaScript uniquement** (`.js`/`.jsx`, jamais TypeScript) · CSS Modules +
CSS custom properties · Supabase (`@supabase/ssr` + `supabase-js` v2, Realtime, Storage) ·
état panier avec **zustand** · formulaires `react-hook-form` + `zod` · `framer-motion` /
`react-spring` / `canvas-confetti` · HTML5 Canvas (Magic Mix, Buddy Builder) · `lucide-react`
(icônes — jamais d'emoji structurel) · `next/image` (WebP, lazy, dimensions explicites) ·
`web-push` (VAPID) · Vercel Edge. Scripts : `npm run dev | build | start | lint`.

## Design system (verrouillé — détail dans le PRD §2)

Claymorphism Gen-Z + base **dark** Aurora. Couleurs : primary `#a855f7`, secondary `#ec4899`,
accent `#06b6d4`, **CTA `#fbbf24`** (tous les boutons d'achat), success `#10b981`, fond
`#0f0a1e`/`#1a1030`. Typos : **Nunito** (titres) / **Inter** (body). À ÉVITER (règles du PRD) :
light mode, serif, animations > 500ms (3G tunisien), réductions en % (toujours en **DT économisés**),
checkout multi-pages, images non optimisées.

## Carte du code

- Boutique : `src/app/{shop,produit,panier,commander,merci,avis,blog,pack-ete,videos,slime-tunisie}`
- Grossiste (B2B) : `src/app/grossiste` · Admin : `src/app/admin` · API : `src/app/api` · Server actions : `src/app/actions`, `src/lib/actions`
- Composants : `src/components/{homepage,product,cart,checkout,confirmation,ui,layout,admin,grossiste}`
- Lib : `src/lib/{supabase,cart,push,utils}` · Base : `supabase/{migrations,functions}`

## Sécurité — clés & secrets (règle non négociable)

Secrets serveur **uniquement**, JAMAIS dans le frontend ni dans une variable `NEXT_PUBLIC_*`,
jamais renvoyés au client : `SUPABASE_SERVICE_ROLE_KEY`, `NAVEX_API_KEY`, `WA_API_TOKEN`,
`VAPID_PRIVATE_KEY`. Côté client, seuls les `NEXT_PUBLIC_*` publics par nature
(URL Supabase, clé **anon**, FB pixel, VAPID **public**). Les commandes COD contiennent des
données personnelles (nom, tél, adresse) → protéger par RLS Supabase, ne jamais logguer en clair.
Toute écriture privilégiée passe par une route/serveur action authentifiée.

## Skills disponibles (plugin `hk-commerce`)

- **`hk-commerce:slime-commerce`** — QG du business slime (catalogue, pages produit, conversion,
  contenu ASMR, offres, livraison, rétention). En session neuve : exécuter l'INTAKE §1 pour
  enrichir le bloc FAITS (le PRD couvre déjà une bonne partie).
- **`hk-commerce:meta-ads-engine`** — acquisition payante Meta/TikTok (cible PRD : ROAS ≥ 3,5x).
  Vidéo produit réelle reine, zéro créa générique.

## Standard

Anti-générique (test des 3 secondes) : cette marque est **sensorielle** — la texture filmée EST
le produit. Zéro template Shopify par défaut. Confiance parent = déverrouilleur d'achat.
Mobile-first absolu (85% du trafic). App complète, pas de placeholder.
