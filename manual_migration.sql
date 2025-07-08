-- Manual SQL commands to add the academic_year_id column
-- Run these commands in your MySQL/MariaDB client

-- First, check if the column exists
SELECT COUNT(*) as column_exists
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'api_medicaldocument' 
AND column_name = 'academic_year_id';

-- If the above returns 0, run these commands:

-- 1. Add the academic_year_id column
ALTER TABLE api_medicaldocument 
ADD COLUMN academic_year_id INTEGER NULL;

-- 2. Add the foreign key constraint
ALTER TABLE api_medicaldocument 
ADD CONSTRAINT fk_medicaldocument_academic_year 
FOREIGN KEY (academic_year_id) 
REFERENCES api_academicschoolyear(id);

-- 3. Verify the column was added
DESCRIBE api_medicaldocument;

-- 4. Check if constraint was added
SHOW CREATE TABLE api_medicaldocument;

-- Optional: Update existing records to use current academic year
-- UPDATE api_medicaldocument 
-- SET academic_year_id = (
--     SELECT id FROM api_academicschoolyear 
--     WHERE is_current = 1 
--     LIMIT 1
-- )
-- WHERE academic_year_id IS NULL;
