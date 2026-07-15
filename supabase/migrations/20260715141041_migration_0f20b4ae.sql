-- Fix SECURITY DEFINER warning on trophy_cron_jobs view
-- Change to SECURITY INVOKER so it runs with querying user's permissions

DROP VIEW IF EXISTS trophy_cron_jobs;

CREATE VIEW trophy_cron_jobs
WITH (security_invoker = true)
AS
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname LIKE 'award-%trophies';

COMMENT ON VIEW trophy_cron_jobs IS 'View to monitor trophy award cron jobs (read-only, security invoker)';

-- Grant SELECT to authenticated users (admins can see cron jobs)
GRANT SELECT ON trophy_cron_jobs TO authenticated;
GRANT SELECT ON trophy_cron_jobs TO service_role;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Trophy cron jobs view updated to use SECURITY INVOKER';
  RAISE NOTICE 'View is now accessible with querying user permissions';
END $$;