-- Planifier le séquenceur 1x/jour à 9h (UTC). Nécessite pg_cron + pg_net activés.
-- Remplace <PROJECT_REF> et <SERVICE_ROLE_KEY>.
select cron.schedule(
  'prospect-sequencer-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/prospect-sequencer',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>', 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
  $$
);
