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

## Décisions durables

- Projet **autonome** : repo `hkgamestn/hkgames`, Vercel → hkgames.tn, Supabase dédié. Pas de
  gouvernance Walaup. Source de vérité produit/design = `PRD_HKGames_SlimeStore_v3_FINAL.md`.
- Secrets serveur-only (jamais frontend / `NEXT_PUBLIC_*`) : `SUPABASE_SERVICE_ROLE_KEY`,
  `NAVEX_API_KEY`, `WA_API_TOKEN`, `VAPID_PRIVATE_KEY`.

## Prochaines étapes

- [ ] Continuer l'optimisation perf (LCP/INP) : images `next/image`, lazy, réduire le JS bloquant.
- [ ] (À définir en session) — mettre à jour cette liste au fil de l'eau.

## Pièges / gotchas

- Animations > 500 ms interdites (réseau 3G tunisien). Réductions toujours en **DT économisés**, jamais en %.
- COD = données perso client (nom, tél, adresse) → protéger par RLS, ne jamais logguer en clair.

## Archives détaillées (snapshots memory-compress)

- `memory_hkgames_20260425.md` · `memory_hkgames_20260424.md`

## Journal de session (le plus récent en haut)

- **2026-07-23** — Setup Claude Code (CLAUDE.md + plugin hk-commerce + auto-load) + convention MEMORY.md.
