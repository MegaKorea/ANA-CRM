-- Update users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES public.leads(id) ON DELETE SET NULL;

-- Ensure STU role exists
INSERT INTO public.roles (name, code, description) 
VALUES ('Student', 'STU', 'Học viên')
ON CONFLICT (code) DO NOTHING;

-- Update trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id bigint;
  v_role_code text;
  v_lead_id int;
BEGIN
  v_role_code := coalesce(new.raw_user_meta_data->>'role', 'user');
  v_lead_id := (new.raw_user_meta_data->>'lead_id')::int;

  SELECT id INTO v_role_id FROM roles WHERE code = v_role_code LIMIT 1;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'user' LIMIT 1;
  END IF;

  INSERT INTO public.users (
    id,
    full_name,
    phone,
    email,
    role_id,
    lead_id
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    new.email,
    v_role_id,
    v_lead_id
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Migrate existing student_accounts to users (if not yet migrated)
INSERT INTO public.users (id, full_name, phone, email, role_id, lead_id)
SELECT 
  sa.auth_id, 
  l.full_name, 
  sa.phone_number, 
  sa.email,
  (SELECT id FROM roles WHERE code = 'STU' LIMIT 1),
  sa.lead_id
FROM public.student_accounts sa
JOIN public.leads l ON l.id = sa.lead_id
WHERE sa.auth_id IS NOT NULL 
ON CONFLICT (id) DO UPDATE SET 
  role_id = EXCLUDED.role_id,
  email = COALESCE(users.email, EXCLUDED.email),
  lead_id = EXCLUDED.lead_id;

-- Drop table
DROP TABLE IF EXISTS public.student_accounts CASCADE;
