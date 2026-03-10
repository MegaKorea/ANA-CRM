create table public.courses (
  id uuid not null default gen_random_uuid (),
  code character varying(50) null,
  name character varying(255) not null,
  description text null,
  level public.course_level null,
  fee numeric(15, 2) not null default 0,
  expected_students integer null,
  expected_duration character varying(100) null,
  status public.course_status null default 'active'::course_status,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint courses_pkey primary key (id),
  constraint courses_code_key unique (code)
) TABLESPACE pg_default;

create trigger update_courses_updated_at BEFORE
update on courses for EACH row
execute FUNCTION update_courses_updated_at_column ();