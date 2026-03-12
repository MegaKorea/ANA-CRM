ALTER TABLE public.student_accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE public.student_accounts ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Password hash is no longer mandatory since we delegate to Supabase auth
ALTER TABLE public.student_accounts ALTER COLUMN password_hash DROP NOT NULL;
