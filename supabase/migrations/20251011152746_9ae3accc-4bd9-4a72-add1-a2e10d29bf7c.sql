-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (if needed in future)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the update_overdue_orders function to run daily at midnight
SELECT cron.schedule(
  'update-overdue-orders-daily',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT public.update_overdue_orders();
  $$
);

-- Also create a computed view helper for displaying overdue information
CREATE OR REPLACE FUNCTION public.get_days_until_overdue(collection_date TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT GREATEST(0, EXTRACT(DAY FROM (collection_date + INTERVAL '3 months') - NOW())::INTEGER);
$$;

-- Function to get the overdue date
CREATE OR REPLACE FUNCTION public.get_overdue_date(collection_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT collection_date + INTERVAL '3 months';
$$;