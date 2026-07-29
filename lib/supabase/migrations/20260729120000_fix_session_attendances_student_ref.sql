-- Điểm danh đang không lưu được vì 2 lỗi ở bảng session_attendances:
--
--  1. Thiếu UNIQUE(session_id, student_id) nên upsert với
--     `onConflict: 'session_id,student_id'` báo lỗi 42P10
--     "there is no unique or exclusion constraint matching the ON CONFLICT specification".
--
--  2. student_id là uuid tham chiếu users(id), nhưng học viên của lớp được lưu ở
--     class_students.student_id -> leads(id) (bigint). Modal điểm danh gửi lead id,
--     nên kể cả khi có UNIQUE thì insert vẫn vi phạm khoá ngoại.
--
-- Thống nhất về leads(id) — đúng với mô hình "học viên của lớp là lead".
-- Bảng session_attendances đang rỗng nên thay cột không mất dữ liệu.

-- Bảo đảm bảng tồn tại (bảng gốc được tạo tay trên Supabase, chưa từng có migration).
create table if not exists public.session_attendances (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null,
  status text not null default 'not_arrived',
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ─── 1. Chuyển student_id sang leads(id) ────────────────────────────────────
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'session_attendances'
      and column_name = 'student_id'
      and data_type = 'uuid'
  ) then
    if exists (select 1 from public.session_attendances) then
      raise exception 'session_attendances khong rong — dung lai de tranh mat du lieu diem danh';
    end if;

    alter table public.session_attendances
      drop constraint if exists session_attendances_student_id_fkey;

    alter table public.session_attendances drop column student_id;

    alter table public.session_attendances
      add column student_id bigint not null
      references public.leads (id) on delete cascade;
  end if;
end $$;

-- ─── 2. Ràng buộc UNIQUE cho upsert ─────────────────────────────────────────
alter table public.session_attendances
  drop constraint if exists session_attendances_session_id_student_id_key;

alter table public.session_attendances
  add constraint session_attendances_session_id_student_id_key
  unique (session_id, student_id);

create index if not exists idx_session_attendances_session_id
  on public.session_attendances (session_id);

create index if not exists idx_session_attendances_student_id
  on public.session_attendances (student_id);

-- ─── 3. Backfill users.lead_id ──────────────────────────────────────────────
-- Cột này có sẵn từ migration 20260312151001 nhưng chưa bao giờ được ghi, nên
-- hệ thống phải ghép tài khoản với học viên qua số điện thoại. Đường điểm danh
-- bằng QR cần map user đăng nhập -> lead, nên điền lại cho những trường hợp
-- khớp DUY NHẤT một lead (bỏ qua SĐT trùng để không gán nhầm người).
update public.users u
set lead_id = matched.lead_id
from (
  select l.phone_number, min(l.id) as lead_id
  from public.leads l
  where l.phone_number is not null and l.phone_number <> ''
  group by l.phone_number
  having count(*) = 1
) as matched
where u.lead_id is null
  and u.phone is not null
  and u.phone = matched.phone_number;
