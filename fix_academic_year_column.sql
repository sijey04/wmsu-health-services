-- Manual SQL to add missing academic_year_id column to api_medicaldocument table

-- Check if column exists first
SELECT COUNT(*) as column_exists
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'api_medicaldocument' 
AND column_name = 'academic_year_id';

-- If the above returns 0, run the following commands:

-- Add the academic_year_id column
ALTER TABLE api_medicaldocument 
ADD COLUMN academic_year_id INTEGER NULL;

-- Add the foreign key constraint
ALTER TABLE api_medicaldocument 
ADD CONSTRAINT api_medicaldocument_academic_year_id_fk 
FOREIGN KEY (academic_year_id) 
REFERENCES api_academicschoolyear(id);

-- Add the unique constraint
ALTER TABLE api_medicaldocument 
ADD CONSTRAINT unique_medical_document_per_patient_year 
UNIQUE (patient_id, academic_year_id);

-- Verify the column was added
DESCRIBE api_medicaldocument;
