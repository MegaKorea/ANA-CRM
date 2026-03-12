DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE public.attendance_status AS ENUM (
      'arrived',
      'not_arrived',
      'no_show'
    );
  END IF;
END$$;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS attendance_status public.attendance_status DEFAULT 'not_arrived';
