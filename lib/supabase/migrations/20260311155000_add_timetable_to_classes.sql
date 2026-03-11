create type public.class_timetable as enum ('Sáng', 'Chiều', 'Tối');

alter table public.classes 
add column timetable public.class_timetable null;
