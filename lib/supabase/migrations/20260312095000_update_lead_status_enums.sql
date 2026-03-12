-- Thêm trạng thái 'other' vào enum hiện tại để an toàn update data
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'other';

-- Cập nhật các bản ghi đang có trạng thái 'contacted' thành 'other' để tránh lỗi mất data khi xóa
UPDATE public.leads SET status = 'other' WHERE status = 'contacted';

-- Xóa giá trị 'contacted' khỏi TYPE thông qua việc recreate type
ALTER TYPE lead_status RENAME TO lead_status_old;

CREATE TYPE lead_status AS ENUM (
  'new', 
  'qualified', 
  'converted', 
  'nurturing', 
  'not_contacted', 
  'reject', 
  'interested', 
  'not_interested', 
  'other'
);

ALTER TABLE public.leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN status TYPE lead_status USING status::text::lead_status;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new'::lead_status;

DROP TYPE lead_status_old;
