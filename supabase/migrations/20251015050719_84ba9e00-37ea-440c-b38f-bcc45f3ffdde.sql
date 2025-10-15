-- Update admin user password to L@undry!2025@admin
-- First, ensure the admin user exists with email admin@system.local
DO $$
BEGIN
  -- Update the password for the admin user
  UPDATE auth.users
  SET 
    encrypted_password = crypt('L@undry!2025@admin', gen_salt('bf')),
    updated_at = now()
  WHERE email = 'admin@system.local';
  
  -- If user doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@system.local',
      crypt('L@undry!2025@admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      ''
    );
  END IF;
END $$;