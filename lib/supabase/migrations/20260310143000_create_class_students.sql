do $$
begin
  create type public.enrollment_status as enum ('active', 'withdrawn', 'completed');
exception
  when duplicate_object then null;
end
$$;

create table public.class_students (
  id uuid not null default gen_random_uuid (),
  class_id uuid not null,
  student_id bigint not null,
  status public.enrollment_status null default 'active'::enrollment_status,
  enrollment_date date null default CURRENT_DATE,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint class_students_pkey primary key (id),
  constraint class_students_class_id_student_id_key unique (class_id, student_id),
  constraint class_students_class_id_fkey foreign KEY (class_id) references classes (id) on delete CASCADE,
  constraint class_students_student_id_fkey foreign KEY (student_id) references leads (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE OR REPLACE FUNCTION update_class_students_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

create trigger update_class_students_updated_at BEFORE
update on class_students for EACH row
execute FUNCTION update_class_students_updated_at_column ();