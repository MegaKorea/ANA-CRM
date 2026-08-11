do $$
begin
  create type public.class_status as enum ('planned', 'ongoing', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.course_status as enum ('active', 'inactive', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.course_level as enum ('beginner', 'intermediate', 'advanced');
exception
  when duplicate_object then null;
end
$$;

CREATE OR REPLACE FUNCTION update_classes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_courses_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
