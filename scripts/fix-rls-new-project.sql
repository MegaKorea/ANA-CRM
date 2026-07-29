-- Khôi phục RLS policy cho luồng đăng nhập trên project Supabase MỚI.
-- Nguyên nhân: khi dựng lại schema, RLS được BẬT nhưng thiếu POLICY,
-- khiến client theo phiên người dùng không đọc được users/roles -> login fail.
-- Chạy trong Supabase Dashboard -> SQL Editor -> Run.

-- ============ USERS: bật RLS + cho user đọc/sửa hồ sơ của chính mình ============
alter table public.users enable row level security;

drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

drop policy if exists "No direct insert" on public.users;
create policy "No direct insert"
  on public.users for insert
  with check (false);

drop policy if exists "No direct delete" on public.users;
create policy "No direct delete"
  on public.users for delete
  using (false);

-- ============ ROLES: đúng như thiết kế gốc (không bật RLS -> đọc được) ============
alter table public.roles disable row level security;

-- Nạp lại schema cache để PostgREST áp dụng ngay
notify pgrst, 'reload schema';
