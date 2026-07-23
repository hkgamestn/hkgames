---
name: meta-ads-engine
description: >
  LE MOTEUR D'ACQUISITION PAYANTE — planifie, structure et optimise les campagnes Meta
  (Facebook/Instagram) et TikTok des ventures du compte : slime d'abord, acquisition de clients
  Walaup ensuite. DÉCLENCHER pour : campagne, pub, ads, budget média, créa publicitaire, ciblage,
  pixel/CAPI, retargeting, CPA/ROAS, scaling. PREMIÈRE SESSION : INTAKE (§1) avant tout plan.
  Produit des artefacts : CampaignPlan, CreativeBrief (matrice hook×angle×format), TestReport.
  Standard : zéro créa générique d'IA — la vidéo produit réelle est reine. Ne PAS utiliser pour
  le contenu organique ou les fiches produit (→ slime-commerce) ni pour le SEO/site.
---

# Meta Ads Engine — v0.1 (seed : système durable + intake à remplir)

Règle d'or héritée de LINKOS : **instrumenter avant d'optimiser**. Aucun scaling, aucun verdict
créa sans tracking vérifié et sans volume minimal décidé À L'AVANCE.

## §1 · INTAKE première session

Business Manager + compte pub (état, historique, restrictions ?) · pixel installé ? CAPI ? événements
(Purchase/Lead) vérifiés ? · budget mensuel en DT et CPA/ROAS cible · offre & AOV (depuis
slime-commerce FAITS) · assets créa disponibles (vidéos produit, UGC) · zone (Grand Tunis ?
national ? livraison où ?) · historique : meilleures/pires campagnes si existantes.

```
## BLOC FAITS ADS (v0 — vide)
compte: ?  pixel/CAPI: ?  budget: ?  cible CPA/ROAS: ?  assets: ?  zone: ?  historique: ?
```

## §2 · Le système (durable)

**Fondations avant le premier dinar** — Pixel + CAPI actifs et testés (événement Purchase avec
valeur DT) ; UTM systématiques ; si COD : l'événement clé est la COMMANDE CONFIRMÉE (post-appel),
pas le clic — sinon on optimise sur du vent ; question de suivi post-achat (« comment nous
avez-vous connus ? ») pour recouper l'attribution.

**Structure de compte (simple > maligne)** —
1 campagne TEST (ABO, 3–5 adsets créa) · 1 campagne SCALE (CBO, on y déplace uniquement les
gagnantes) · 1 campagne RETARGETING (visiteurs/engagés 7–30j + clients pour les drops).
Interdits : 15 campagnes parallèles, toucher un adset avant son volume de décision, dupliquer
en panique.

**Créa = 80 % du résultat — matrice hook × angle × format** :
angles (slime) : satisfaction ASMR · cadeau parent serein (sécurité) · anti-ennui écrans ·
collection/drop · offre kit. Hooks : 3 premières secondes, texture plein cadre, son ON, darija
naturelle (« chouf el texture hédhi… ») vs FR selon audience. Formats : Reels 9:16 d'abord,
statique preuve sociale en second. Chaque CreativeBrief = tableau angle×hook×format avec
hypothèse à falsifier. La créa vient de VRAIES vidéos produit/UGC (slime-commerce) — jamais
d'images IA génériques (anti-generic-standard s'applique aux pubs).

**Protocole de test** — par vague : N créas, budget/créa fixé, KPI de coupe décidé AVANT
(ex. CPA confirmé > seuil après X conversions → coupe ; hook rate <25 % à 1000 imp. → coupe) ;
verdicts dans un TestReport (garder les chiffres, pas les impressions de mémoire) ; les gagnantes
montent en SCALE ; on itère sur l'ANGLE gagnant, pas sur 10 nouveaux angles.

**Lecture des chiffres** — regarder dans l'ordre : livraison → hook rate → CTR → coût/ajout
panier → CPA commande CONFIRMÉE → taux de retour COD par source. Un ROAS Meta sans le retour
COD est un mensonge comptable.

**Conformité** — pas d'allégations santé/sécurité non prouvées (« non toxique » seulement si
documenté), droits musique TikTok/Reels, mentions claires sur les drops (dates réelles).

## §3 · Artefacts produits
`CampaignPlan` (structure, budgets DT, événements, calendrier) · `CreativeBrief` (matrice +
scripts hooks) · `TestReport` (par vague : hypothèse, chiffres, verdict, next). Tous en fichiers,
datés, dans outputs — la mémoire du compte publicitaire, session après session.
