CREATE TABLE IF NOT EXISTS public.student_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    lead_id INTEGER NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin full access to student_accounts" ON public.student_accounts
    FOR ALL
    USING (
        (auth.jwt() ->> 'role')::text = 'ADMIN'::text OR 
        (auth.jwt() ->> 'role')::text = 'AO'::text
    );

-- Allow students to read their own account info (Optional, depending on JWT setup)
CREATE POLICY "Students can view own account" ON public.student_accounts
    FOR SELECT
    USING (id::text = (auth.jwt() ->> 'sub')::text);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_student_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_accounts_timestamp
    BEFORE UPDATE ON public.student_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_student_accounts_updated_at();

-- Add index for faster login lookups
CREATE INDEX idx_student_accounts_phone ON public.student_accounts(phone_number);
CREATE INDEX idx_student_accounts_lead_id ON public.student_accounts(lead_id);
