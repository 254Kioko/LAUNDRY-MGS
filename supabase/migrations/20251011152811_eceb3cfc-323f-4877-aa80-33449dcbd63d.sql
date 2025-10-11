-- Fix search_path for the helper functions
CREATE OR REPLACE FUNCTION public.get_days_until_overdue(collection_date TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, EXTRACT(DAY FROM (collection_date + INTERVAL '3 months') - NOW())::INTEGER);
$$;

CREATE OR REPLACE FUNCTION public.get_overdue_date(collection_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE SQL
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT collection_date + INTERVAL '3 months';
$$;