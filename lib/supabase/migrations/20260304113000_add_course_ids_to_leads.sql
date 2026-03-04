-- Add course_ids column to leads table
ALTER TABLE leads
ADD COLUMN course_ids uuid[] DEFAULT '{}';
