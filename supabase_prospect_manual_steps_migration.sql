-- HK Games — Prospection : compteurs manuels d'outreach
-- wa_step    = nombre de messages WhatsApp déjà envoyés manuellement (0 = jamais contacté)
-- email_step = nombre d'e-mails déjà envoyés (0 = jamais contacté par e-mail)
-- Indépendants de sequence_step (séquenceur automatique). Additif, idempotent.

ALTER TABLE wholesale_prospects
  ADD COLUMN IF NOT EXISTS wa_step    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_step INT NOT NULL DEFAULT 0;
