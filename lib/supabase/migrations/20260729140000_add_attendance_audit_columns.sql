-- Bổ sung dấu vết cho điểm danh, phục vụ đối chiếu khi nghi ngờ gian lận.
--
-- Chủ ý KHÔNG dùng IP để chặn: cả lớp ngồi chung một mạng WiFi sẽ ra cùng một IP
-- công cộng, chặn theo IP là chặn nhầm người học thật. Ở đây chỉ LƯU LẠI để giáo
-- vụ tra cứu, còn việc chống điểm danh hộ dựa vào mã QR xoay vòng phía ứng dụng.

alter table public.session_attendances
  add column if not exists method text not null default 'manual',
  add column if not exists checked_in_at timestamp with time zone null,
  add column if not exists checked_in_ip text null,
  add column if not exists checked_in_user_agent text null;

-- 'manual' = giáo viên tự đánh dấu, 'qr' = học viên tự quét mã.
alter table public.session_attendances
  drop constraint if exists session_attendances_method_check;

alter table public.session_attendances
  add constraint session_attendances_method_check
  check (method in ('manual', 'qr'));

comment on column public.session_attendances.method is
  'Nguồn ghi nhận: manual (giáo viên) hoặc qr (học viên tự quét)';
comment on column public.session_attendances.checked_in_at is
  'Thời điểm học viên quét mã QR; null nếu do giáo viên đánh dấu tay';
comment on column public.session_attendances.checked_in_ip is
  'Chỉ để đối chiếu khi có tranh chấp — không dùng để chặn';

-- Tra cứu nhanh các lượt quét của một buổi theo thời gian.
create index if not exists idx_session_attendances_checked_in_at
  on public.session_attendances (session_id, checked_in_at desc)
  where checked_in_at is not null;
