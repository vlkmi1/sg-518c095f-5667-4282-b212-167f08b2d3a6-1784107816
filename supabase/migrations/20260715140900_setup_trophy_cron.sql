-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create SQL function to award trophies directly in database
-- This replaces the need for HTTP calls to Edge Functions
CREATE OR REPLACE FUNCTION award_trophies_internal()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  is_end_of_week BOOLEAN;
  is_end_of_month BOOLEAN;
  is_end_of_year BOOLEAN;
  periods_to_process TEXT[] := '{}';
  species_list TEXT[];
  current_species TEXT;
  current_period TEXT;
  trophy_count INTEGER := 0;
  result_json jsonb;
BEGIN
  -- Determine which periods end today
  is_end_of_week := EXTRACT(DOW FROM today) = 0; -- Sunday
  is_end_of_month := today = DATE_TRUNC('MONTH', today + INTERVAL '1 MONTH') - INTERVAL '1 DAY';
  is_end_of_year := EXTRACT(MONTH FROM today) = 12 AND EXTRACT(DAY FROM today) = 31;

  -- Build list of periods to process
  IF is_end_of_week THEN
    periods_to_process := array_append(periods_to_process, 'weekly');
  END IF;
  IF is_end_of_month THEN
    periods_to_process := array_append(periods_to_process, 'monthly');
  END IF;
  IF is_end_of_year THEN
    periods_to_process := array_append(periods_to_process, 'yearly');
  END IF;

  -- If no periods end today, return early
  IF array_length(periods_to_process, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No periods ending today',
      'date', today,
      'trophies_awarded', 0
    );
  END IF;

  RAISE NOTICE 'Processing periods: %', periods_to_process;

  -- Get all unique fish species from catches
  SELECT array_agg(DISTINCT species) INTO species_list
  FROM catches
  WHERE species IS NOT NULL;

  RAISE NOTICE 'Found % unique species', array_length(species_list, 1);

  -- Loop through each period type
  FOREACH current_period IN ARRAY periods_to_process
  LOOP
    -- Loop through each species
    FOREACH current_species IN ARRAY species_list
    LOOP
      -- Award trophies for top 3 catches of this species
      WITH top_catches AS (
        SELECT 
          user_id,
          weight_kg,
          length_cm,
          ROW_NUMBER() OVER (ORDER BY weight_kg DESC NULLS LAST, length_cm DESC NULLS LAST) as position
        FROM catches
        WHERE species = current_species
          AND weight_kg IS NOT NULL
          AND length_cm IS NOT NULL
        LIMIT 3
      )
      INSERT INTO trophies (user_id, fish_species, period_type, period_end_date, weight_kg, length_cm, position)
      SELECT 
        user_id,
        current_species,
        current_period::VARCHAR,
        today,
        weight_kg,
        length_cm,
        position::INTEGER
      FROM top_catches
      ON CONFLICT (user_id, fish_species, period_type, period_end_date, position) 
      DO UPDATE SET
        weight_kg = EXCLUDED.weight_kg,
        length_cm = EXCLUDED.length_cm,
        updated_at = NOW();

      GET DIAGNOSTICS trophy_count = ROW_COUNT;
      RAISE NOTICE 'Awarded % trophies for % in % period', trophy_count, current_species, current_period;
    END LOOP;
  END LOOP;

  -- Create notifications for newly awarded trophies
  WITH new_trophy_notifications AS (
    INSERT INTO trophy_notifications (user_id, trophy_id, is_read)
    SELECT DISTINCT
      t.user_id,
      t.id,
      false
    FROM trophies t
    WHERE t.period_end_date = today
      AND NOT EXISTS (
        SELECT 1 FROM trophy_notifications tn 
        WHERE tn.trophy_id = t.id
      )
    RETURNING *
  )
  SELECT COUNT(*) INTO trophy_count FROM new_trophy_notifications;

  RAISE NOTICE 'Created % new notifications', trophy_count;

  -- Build result
  result_json := jsonb_build_object(
    'success', true,
    'date', today,
    'periods', periods_to_process,
    'trophies_awarded', trophy_count
  );

  RETURN result_json;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error awarding trophies: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'date', today
    );
END;
$$;

COMMENT ON FUNCTION award_trophies_internal() IS 'Awards trophies for top 3 catches per species. Runs automatically via pg_cron.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION award_trophies_internal() TO postgres;
GRANT EXECUTE ON FUNCTION award_trophies_internal() TO service_role;

-- Schedule weekly trophies (every Sunday at 23:55 UTC)
SELECT cron.schedule(
  'award-weekly-trophies',
  '55 23 * * 0',
  $$SELECT award_trophies_internal();$$
);

-- Monthly trophy check function
CREATE OR REPLACE FUNCTION award_monthly_if_last_day()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF CURRENT_DATE = DATE_TRUNC('MONTH', CURRENT_DATE + INTERVAL '1 MONTH') - INTERVAL '1 DAY' THEN
    PERFORM award_trophies_internal();
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
  $$SELECT award_trophies_internal();$$
);

-- Create view to monitor cron jobs
CREATE OR REPLACE VIEW trophy_cron_jobs
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

COMMENT ON VIEW trophy_cron_jobs IS 'View to monitor trophy award cron jobs';

-- Grant permissions
GRANT SELECT ON trophy_cron_jobs TO authenticated;
GRANT SELECT ON trophy_cron_jobs TO service_role;

-- Log successful setup
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Trophy Cron System Setup Complete ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Weekly trophies: Every Sunday at 23:55 UTC';
  RAISE NOTICE '✅ Monthly trophies: Last day of month at 23:55 UTC';
  RAISE NOTICE '✅ Yearly trophies: December 31st at 23:55 UTC';
  RAISE NOTICE '';
  RAISE NOTICE '📊 View active jobs: SELECT * FROM trophy_cron_jobs;';
  RAISE NOTICE '🧪 Test manually: SELECT award_trophies_internal();';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 No additional configuration needed!';
END $$;