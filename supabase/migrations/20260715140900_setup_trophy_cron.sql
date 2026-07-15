-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to invoke the award-trophies Edge Function
CREATE OR REPLACE FUNCTION invoke_award_trophies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get Supabase project URL and service role key from vault or set them directly
  -- Replace YOUR_PROJECT_URL with your actual Supabase project URL
  project_url := 'https://clotvlthmjgyjdtqxrby.supabase.co';
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Make HTTP request to Edge Function
  PERFORM
    net.http_post(
      url := project_url || '/functions/v1/award-trophies',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    
  RAISE NOTICE 'Trophy award function invoked successfully';
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

-- Schedule monthly trophies (last day of every month at 23:55 UTC)
SELECT cron.schedule(
  'award-monthly-trophies',
  '55 23 L * *',
  $$SELECT invoke_award_trophies();$$
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

COMMENT ON VIEW trophy_cron_jobs IS 'View to monitor trophy award cron jobs';

-- Log successful setup
DO $$
BEGIN
  RAISE NOTICE '=== Trophy Cron System Setup Complete ===';
  RAISE NOTICE 'Weekly trophies: Every Sunday at 23:55 UTC';
  RAISE NOTICE 'Monthly trophies: Last day of month at 23:55 UTC';
  RAISE NOTICE 'Yearly trophies: December 31st at 23:55 UTC';
  RAISE NOTICE 'View jobs with: SELECT * FROM trophy_cron_jobs;';
END $$;