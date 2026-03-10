create table public.classes (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  code character varying(50) null,
  name character varying(255) not null,
  start_date date null,
  end_date date null,
  schedule text null,
  capacity integer null,
  status public.class_status null default 'planned'::class_status,
  teacher_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint classes_pkey primary key (id),
  constraint classes_code_key unique (code),
  constraint classes_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint classes_teacher_id_fkey foreign KEY (teacher_id) references users (id) on delete set null
) TABLESPACE pg_default;

create trigger update_classes_updated_at BEFORE
update on classes for EACH row
execute FUNCTION update_classes_updated_at_column ();


