DELETE FROM public.users 
WHERE id IN (
  SELECT auth_id 
  FROM public.student_accounts 
  WHERE auth_id IS NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'STU' THEN
    RETURN new;
  END IF;

  INSERT INTO public.users (
    id,
    full_name,
    phone,
    role_id
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    (SELECT id FROM roles WHERE name = 'user' LIMIT 1)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;
