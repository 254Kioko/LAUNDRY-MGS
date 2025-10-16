-- Add cashier to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'cashier' 
    AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'cashier';
  END IF;
END $$;

-- Add new order statuses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'in_progress' 
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'in_progress';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'delayed' 
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'delayed';
  END IF;
END $$;