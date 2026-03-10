create table public.subject_teachers (
  id uuid primary key default gen_random_uuid(),

  class_id uuid not null,
  teacher_id uuid not null,

  subject varchar(100) null,

  created_at timestamptz default now(),

  constraint fk_class
    foreign key (class_id) references classes(id) on delete cascade,

  constraint fk_teacher
    foreign key (teacher_id) references users(id) on delete cascade
);