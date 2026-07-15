-- Run the migration to set up trophy cron system
-- This will enable pg_cron, pg_net and create the scheduled jobs

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to invoke the award-trophies Edge Function
CREATE OR REPLACE FUNCTION invoke_award_trophies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  response_id BIGINT;
BEGIN
  -- Your actual Supabase project URL
  project_url := 'https://ugbfeqfnzegnevxcxxuq.supabase.co';
  
  -- Make HTTP request to Edge Function using pg_net
  SELECT net.http_post(
    url := project_url || '/functions/v1/award-trophies',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO response_id;
    
  RAISE NOTICE 'Trophy award function invoked successfully. Request ID: %', response_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error invoking trophy award function: %', SQLERRM;
END;
$$;

-- Grant execute permission to postgres role
GRANT EXECUTE ON FUNCTION invoke_award_trophies() TO postgres;

-- Schedule weekly trophies (every Sunday at 23:55 UTC)
SELECT cron.schedule(
  'award-weekly-trophies',
  '55 23 * * 0',
  $$SELECT invoke_award_trophies();$$
);

-- Schedule monthly trophies - wrapper function
CREATE OR REPLACE FUNCTION award_monthly_if_last_day()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXTRACT(DAY FROM CURRENT_DATE) = EXTRACT(DAY FROM (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '1 MONTH - 1 DAY')) THEN
    PERFORM invoke_award_trophies();
    RAISE NOTICE 'Monthly trophies awarded on last day of month';
  END IF;
END;
$$;

-- Run monthly check every day at 23:55 on days 28-31
SELECT cron.schedule(
  'award-monthly-trophies',
  '55 23 28-31 * *',
  $$SELECT award_monthly_if_last_day();$$
);

-- Schedule yearly trophies (December 31st at 23:55 UTC)
SELECT cron.schedule(
  'award-yearly-trophies',
  '55 23 31 12 *',
  $$SELECT invoke_award_trophies();$$
);

-- Create a view to check scheduled jobs
CREATE OR REPLACE VIEW trophy_cron_jobs AS
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

-- Verify the jobs were created
SELECT * FROM trophy_cron_jobs;