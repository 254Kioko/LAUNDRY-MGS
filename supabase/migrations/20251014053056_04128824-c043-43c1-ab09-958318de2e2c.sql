-- Allow public read access to orders and customers for tracking
-- This enables the public track order page to search and display orders

CREATE POLICY "Anyone can view orders for tracking"
ON public.orders
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anyone can view customers for tracking"
ON public.customers
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anyone can view order items for tracking"
ON public.order_items
FOR SELECT
TO anon
USING (true);