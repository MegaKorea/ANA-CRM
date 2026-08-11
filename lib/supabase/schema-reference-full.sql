-- =====================================================================================
-- FULL CONSOLIDATED SCHEMA — quan hệ đầy đủ cho các bảng đứng sau bảng "Kế toán"
-- Gồm: roles, users, courses, classes, leads, enrollments, payment_tickets
-- Dựng lại từ toàn bộ migration hiện có trong lib/supabase/migrations/, phản ánh
-- ĐÚNG trạng thái hiện tại của production (không phải chuỗi lịch sử migration).
-- Thứ tự tạo bảng tuân theo phụ thuộc FK; 2 cặp phụ thuộc vòng (users<->leads)
-- được xử lý bằng ALTER TABLE ADD CONSTRAINT ở cuối.
--
-- LƯU Ý: đây là file THAM KHẢO (reconstruct để đọc/hiểu schema), KHÔNG PHẢI migration
-- thật — không đặt trong thư mục migrations/ để tránh bị chạy nhầm.
-- =====================================================================================

-- =====================================================================
-- 0. ENUM TYPES
-- =====================================================================
DO $$ BEGIN CREATE TYPE public.user_status        AS ENUM ('active', 'banned', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_status      AS ENUM ('active', 'inactive', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_level       AS ENUM ('beginner', 'intermediate', 'advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.class_status       AS ENUM ('planned', 'ongoing', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.lead_status        AS ENUM (
  'new', 'qualified', 'converted', 'nurturing', 'not_contacted',
  'reject', 'interested', 'not_interested', 'other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- 'qualified' không còn dùng ở tầng app (constants/enums/lead.enum.ts) nhưng
-- Postgres không cho DROP VALUE khỏi enum nên vẫn còn ở DB.
DO $$ BEGIN CREATE TYPE public.attendance_status  AS ENUM ('arrived', 'not_arrived', 'no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.education_level    AS ENUM (
  'primary', 'secondary', 'high_school', 'intermediate',
  'college', 'university', 'postgraduate', 'other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ticket_status      AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method     AS ENUM ('cash', 'bank_personal', 'bank_company'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 1. roles (bảng nền cho users.role_id — không có migration riêng, dựng tối
--    thiểu từ lib/supabase/types/tables/roles.ts để FK hợp lệ)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         text NOT NULL,
  code         text NOT NULL UNIQUE,
  description  text NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. users  (id = auth.users.id; users.lead_id -> leads.id thêm bằng ALTER
--    ở cuối file vì leads chưa tồn tại tại đây — phụ thuộc vòng)
-- =====================================================================
CREATE TABLE public.users (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text,
  email        text,
  phone        text,
  avatar       text,
  status       public.user_status NOT NULL DEFAULT 'active',
  sex          text,
  age          integer,
  address      jsonb,                 -- text -> jsonb (20260808030000)
  birth_day    date,
  role_id      bigint NOT NULL REFERENCES public.roles(id),
  lead_id      integer NULL,          -- FK -> leads(id) added below (vòng lặp)
  last_login   timestamptz,
  updated_at   timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX users_email_unique ON public.users(email) WHERE email IS NOT NULL;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "No direct insert" ON public.users FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct delete" ON public.users FOR DELETE USING (false);

-- Trigger: tự tạo public.users khi có auth.users mới (sau khi merge student_accounts)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role_id bigint;
  v_role_code text;
  v_lead_id int;
BEGIN
  v_role_code := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  v_lead_id := (NEW.raw_user_meta_data->>'lead_id')::int;

  SELECT id INTO v_role_id FROM roles WHERE code = v_role_code LIMIT 1;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'user' LIMIT 1;
  END IF;

  INSERT INTO public.users (id, full_name, phone, email, role_id, lead_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.phone, NEW.email, v_role_id, v_lead_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 3. courses
-- =====================================================================
CREATE TABLE public.courses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                varchar(50) UNIQUE,
  name                varchar(255) NOT NULL,
  description         text,
  level               public.course_level,
  fee                 numeric(15, 2) NOT NULL DEFAULT 0,
  expected_students   integer,
  expected_duration   varchar(100),
  status              public.course_status DEFAULT 'active',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_courses_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION update_courses_updated_at_column();

-- =====================================================================
-- 4. classes  (-> courses, -> users)
-- =====================================================================
CREATE TABLE public.classes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code                  varchar(50) UNIQUE,
  name                  varchar(255) NOT NULL,
  start_date            date,
  end_date              date,
  schedule              text,
  timetable             jsonb,                 -- enum -> jsonb (20260311160000)
  capacity              integer,
  status                public.class_status DEFAULT 'planned',
  homeroom_teacher_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_classes_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION update_classes_updated_at_column();

-- =====================================================================
-- 5. leads  (-> users qua telesales_id)
-- =====================================================================
CREATE TABLE public.leads (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email                 text,
  phone_number          text,
  full_name             text NOT NULL,
  date_of_birth         text,
  place_of_birth        jsonb,
  place_of_origin       jsonb,
  current_address       jsonb,
  current_address_temp  jsonb DEFAULT NULL,   -- provinces.open-api.vn codes: { provinceCode, districtCode, wardCode, province, district, ward, provinceId, districtId, wardId }
  citizen_id            text,
  nationality           text,
  ethnicity             text,
  meta_data             jsonb DEFAULT '{}'::jsonb,
  source                text,
  telesales_id          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status                public.lead_status NOT NULL DEFAULT 'new',
  note                  jsonb DEFAULT '[]'::jsonb,
  course_ids            uuid[] DEFAULT '{}',
  appointment_date      timestamptz,
  attendance_status     public.attendance_status DEFAULT 'not_arrived',
  images                text[],
  facebook_url          text,
  conversation          text,
  tuition_fee           bigint DEFAULT 0,
  pid_zalo              varchar,
  smax_log              jsonb,
  rate                  smallint NOT NULL DEFAULT 0 CHECK (rate >= 0 AND rate <= 5),
  education_level       public.education_level,
  education_detail      jsonb,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_leads_email        ON public.leads(email);
CREATE INDEX idx_leads_phone_number ON public.leads(phone_number);
CREATE INDEX idx_leads_telesales_id ON public.leads(telesales_id);
CREATE INDEX idx_leads_status       ON public.leads(status);
CREATE INDEX idx_leads_created_at   ON public.leads(created_at);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all leads"   ON public.leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads"     ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update leads"     ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Users can delete leads"     ON public.leads FOR DELETE USING (true);

-- Đóng vòng lặp users.lead_id <-> leads.id, giờ leads đã tồn tại
ALTER TABLE public.users
  ADD CONSTRAINT users_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- =====================================================================
-- 6. enrollments  (-> leads, courses, classes)
-- =====================================================================
CREATE TABLE public.enrollments (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  lead_id                bigint REFERENCES public.leads(id) ON DELETE RESTRICT,
  course_id              uuid REFERENCES public.courses(id) ON DELETE RESTRICT,
  class_id               uuid REFERENCES public.classes(id) ON DELETE SET NULL,

  category               varchar(20) NOT NULL DEFAULT 'khóa học'
                           CHECK (category IN ('khóa học', 'vật tư', 'chứng chỉ')),
  item_name              text,

  enrollment_date        date NOT NULL DEFAULT CURRENT_DATE,
  sales_month            varchar(7) NOT NULL,
  source                 varchar(50),

  expected_study_month   text,

  tuition_fee            bigint NOT NULL DEFAULT 0,
  deposit_amount         bigint NOT NULL DEFAULT 0,
  paid_amount            bigint NOT NULL DEFAULT 0,
  debt_amount            bigint GENERATED ALWAYS AS (tuition_fee - paid_amount) STORED,
  debt_note              text,

  status                 varchar(20) NOT NULL DEFAULT 'cọc'
                           CHECK (status IN ('cọc', 'đang học', 'hoàn thành', 'hủy')),

  note                   text,

  -- dữ liệu import thô (dữ liệu cũ trước khi có course_id/class_id chuẩn hoá)
  student_name           text,
  phone                  text,
  course_name_raw        text,
  course_name_normalized text,
  course_key             text,
  advisor_name           text,

  created_by             text,   -- đã bỏ FK tới users, đổi kiểu uuid -> text

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT enrollments_category_consistency CHECK (
    (category = 'khóa học' AND course_id IS NOT NULL AND item_name IS NULL)
    OR
    (category <> 'khóa học' AND course_id IS NULL AND class_id IS NULL AND item_name IS NOT NULL)
  )
);

CREATE INDEX idx_enrollments_lead_id         ON public.enrollments(lead_id);
CREATE INDEX idx_enrollments_course_id       ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_class_id        ON public.enrollments(class_id);
CREATE INDEX idx_enrollments_sales_month     ON public.enrollments(sales_month);
CREATE INDEX idx_enrollments_status          ON public.enrollments(status);
CREATE INDEX idx_enrollments_enrollment_date ON public.enrollments(enrollment_date);
CREATE INDEX idx_enrollments_source          ON public.enrollments(source);
CREATE INDEX idx_enrollments_category        ON public.enrollments(category);

CREATE OR REPLACE FUNCTION update_enrollments_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION update_enrollments_updated_at_column();

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all enrollments"   ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Users can insert enrollments"     ON public.enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update enrollments"     ON public.enrollments FOR UPDATE USING (true);
CREATE POLICY "Users can delete enrollments"     ON public.enrollments FOR DELETE USING (true);

-- =====================================================================
-- 7. payment_tickets  (-> leads, enrollments, courses, users)
-- =====================================================================
CREATE TABLE public.payment_tickets (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  lead_id           bigint NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  enrollment_id     bigint REFERENCES public.enrollments(id) ON DELETE SET NULL,
  course_id         uuid REFERENCES public.courses(id) ON DELETE SET NULL,

  amount            bigint NOT NULL,
  payment_method    public.payment_method NOT NULL DEFAULT 'cash',
  payment_date      timestamptz NOT NULL DEFAULT now(),
  recipient_account text,

  images            text[] DEFAULT '{}',
  note              text,

  status            public.ticket_status NOT NULL DEFAULT 'pending',

  created_by        text,               -- đã bỏ FK tới users, đổi kiểu uuid -> text
  reviewed_by       uuid REFERENCES public.users(id),
  reviewed_at       timestamptz,
  reject_reason     text,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_tickets_lead_id       ON public.payment_tickets(lead_id);
CREATE INDEX idx_payment_tickets_enrollment_id ON public.payment_tickets(enrollment_id);
CREATE INDEX idx_payment_tickets_course_id     ON public.payment_tickets(course_id);
CREATE INDEX idx_payment_tickets_status        ON public.payment_tickets(status);
CREATE INDEX idx_payment_tickets_payment_date  ON public.payment_tickets(payment_date);
CREATE INDEX idx_payment_tickets_created_by    ON public.payment_tickets(created_by);

ALTER TABLE public.payment_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all payment_tickets"   ON public.payment_tickets FOR SELECT USING (true);
CREATE POLICY "Users can insert payment_tickets"     ON public.payment_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update payment_tickets"     ON public.payment_tickets FOR UPDATE USING (true);
CREATE POLICY "Users can delete payment_tickets"     ON public.payment_tickets FOR DELETE USING (true);

-- Trigger: đồng bộ enrollments.paid_amount mỗi khi payment_tickets thay đổi (approved)
CREATE OR REPLACE FUNCTION public.recalc_enrollment_paid_amount(p_enrollment_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE public.enrollments e
  SET paid_amount = COALESCE((
        SELECT SUM(pt.amount) FROM public.payment_tickets pt
        WHERE pt.enrollment_id = p_enrollment_id AND pt.status = 'approved'
      ), 0),
      updated_at = now()
  WHERE e.id = p_enrollment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_enrollment_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.enrollment_id IS DISTINCT FROM NEW.enrollment_id
     AND OLD.enrollment_id IS NOT NULL THEN
    PERFORM recalc_enrollment_paid_amount(OLD.enrollment_id);
  END IF;
  IF COALESCE(NEW.enrollment_id, OLD.enrollment_id) IS NOT NULL THEN
    PERFORM recalc_enrollment_paid_amount(COALESCE(NEW.enrollment_id, OLD.enrollment_id));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enrollments_sync_paid
AFTER INSERT OR UPDATE OF amount, status, enrollment_id OR DELETE ON public.payment_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_paid_amount();
