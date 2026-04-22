-- Check if realtime is enabled for catches table
SELECT schemaname, tablename, 
       'c' = ANY(string_to_array(relreplident, '')) as has_replica_identity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' AND tablename = 'catches';

-- Enable realtime for catches table if not already enabled
ALTER TABLE catches REPLICA IDENTITY FULL;

-- Also check and enable for competition_participants
ALTER TABLE competition_participants REPLICA IDENTITY FULL;