# MEMORY — HK Games Slime Store

> **Mémoire de continuité committée.** Importée par `CLAUDE.md`, donc chargée à CHAQUE session
> (y compris sur Claude Code web, où l'auto-memory machine-locale ne survit pas). C'est LE fichier
> que Claude lit pour reprendre, et qu'il met à jour + commite en fin de session. Garder CONCIS :
> une ligne par entrée, déplacer le détail dans un snapshot `memory_hkgames_AAAAMMJJ.md` si ça gonfle.
>
> Dernière mise à jour : 2026-07-23.

## État courant

- Setup Claude Code posé : `CLAUDE.md`, plugin `hk-commerce` (skills `slime-commerce` +
  `meta-ads-engine`), `.claude/settings.json` (auto-load du plugin). Commit `8b0c299`.
- Le site est développé (Next.js 15 App Router, JS, Supabase, zustand). Routes boutique en place
  (produit, panier, commander, grossiste, blog, avis, pack-ete…).
- Chantier en cours : **performance** — attaque LCP ~4,4 s / INP ~1176 ms (diagnostic Microsoft
  Clarity, 1–10 juillet). Voir commit `8af0775`.
- **Fidélité + blocage client** livré sur la branche `claude/package-status-loyalty-sync-qhv4b8`
  (migration `002_customer_reputation.sql` **déjà appliquée** au projet Supabase hk-games). À merger
  dans `main` pour déployer.

## Décisions durables

- Projet **autonome** : repo `hkgamestn/hkgames`, Vercel → hkgames.tn, Supabase dédié. Pas de
  gouvernance Walaup. Source de vérité produit/design = `PRD_HKGames_SlimeStore_v3_FINAL.md`.
- Secrets serveur-only (jamais frontend / `NEXT_PUBLIC_*`) : `SUPABASE_SERVICE_ROLE_KEY`,
  `NAVEX_API_KEY`, `WA_API_TOKEN`, `VAPID_PRIVATE_KEY`.
- **Réputation client** = clé téléphone normalisé 8 chiffres (`hk_normalize_phone`). Fidèle = ≥1
  commande livrée ; **bloqué** = `navex_etat = 'Retour recu'` OU `status = 'on_hold'` (injoignable)
  OU `status = 'cancelled'` (sauf raisons internes « Stock insuffisant »/« Double commande »).
  Blocage enforced serveur + override manuel `customer_flags` (`force_allow` prioritaire). Migration `003`.
- Contact régularisation client bloqué : **+216 21 660 303** (appel + WhatsApp), fenêtre FR/AR.

## Prochaines étapes

- [ ] **Merger `claude/package-status-loyalty-sync-qhv4b8` → `main`** pour déployer fidélité/blocage.
- [ ] Révoquer le PAT GitHub partagé en session (usage ponctuel, jamais stocké).
- [ ] Continuer l'optimisation perf (LCP/INP) : images `next/image`, lazy, réduire le JS bloquant.

## Pièges / gotchas

- Animations > 500 ms interdites (réseau 3G tunisien). Réductions toujours en **DT économisés**, jamais en %.
- COD = données perso client (nom, tél, adresse) → protéger par RLS, ne jamais logguer en clair.
- **Vercel Hobby** : cron 1×/jour max (`0 18 * * *`). Un schedule `*/15` (Pro) fait échouer le déploiement.
- `orders_status_check` inclut désormais `'returned'` (avant : UPDATE retour en échec silencieux, statut coincé en `shipped`).
- **2 projets Supabase distincts** dans le compte MCP : hk-games (`rsmebjtwmvwyeocvsowg`) ≠ Walaup multi-tenant. Toujours viser hk-games.

## Archives détaillées (snapshots memory-compress)

- `memory_hkgames_20260425.md` · `memory_hkgames_20260424.md`

## Journal de session (le plus récent en haut)

- **2026-07-23** — Badge ⭐ par COMMANDE (pas par client) : seules les commandes créées APRÈS la
  1ère livraison du même téléphone le portent (5 commandes en live vs 148 avant). Migration `004`
  (`first_delivered_at` dans la vue). Note checkout inchangée (déjà correcte).
- **2026-07-23** — Élargi le blocage : + `on_hold` (injoignable) + `cancelled` (hors « Stock
  insuffisant »/« Double commande »). Migration `003`, vue/RPC màj, modale FR/AR généralisée.
  24 bloqués en live (11 retour + 6 injoignable + 8 annulé, dédup). Mergé dans `main`.
- **2026-07-23** — Feature fidélité/blocage/sync colis : migration `002` appliquée (fonctions +
  vue + `customer_flags` + contrainte `returned`), badges ⭐/⛔ admin, fenêtre FR/AR checkout +
  Pack Été, sync de fond. Poussé sur `claude/package-status-loyalty-sync-qhv4b8`. Cron remis à
  `0 18 * * *` (échec déploiement Hobby avec `*/15`).
- **2026-07-23** — Setup Claude Code (CLAUDE.md + plugin hk-commerce + auto-load) + convention MEMORY.md.
