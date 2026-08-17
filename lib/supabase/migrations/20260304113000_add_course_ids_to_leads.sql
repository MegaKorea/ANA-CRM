ALTER TABLE leads
ADD COLUMN course_ids uuid[] DEFAULT '{}';
