ALTER TABLE class_students
ADD COLUMN paid_amount numeric DEFAULT 0,
ADD COLUMN debt_amount numeric DEFAULT 0,
ADD COLUMN images text[] DEFAULT ARRAY[]::text[];
