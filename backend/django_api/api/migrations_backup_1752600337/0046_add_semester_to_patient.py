# Fixed migration for adding semester field to Patient model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_add_dental_waiver_model'),
    ]

    operations = [
        # First, check if semester column already exists before adding
        migrations.RunSQL(
            """
            SET @column_exists = (
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND column_name = 'semester'
            );
            
            SET @sql = IF(@column_exists = 0, 
                'ALTER TABLE api_patient ADD COLUMN semester VARCHAR(20) NULL DEFAULT NULL', 
                'SELECT "Column semester already exists" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="-- No reverse operation needed"
        ),
        
        # Add unique constraint if it doesn't exist
        migrations.RunSQL(
            """
            SET @constraint_exists = (
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name = 'unique_patient_user_semester'
            );
            
            SET @sql = IF(@constraint_exists = 0, 
                'ALTER TABLE api_patient ADD CONSTRAINT unique_patient_user_semester UNIQUE (user_id, school_year_id, semester)', 
                'SELECT "Unique constraint already exists" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="ALTER TABLE api_patient DROP CONSTRAINT IF EXISTS unique_patient_user_semester"
        ),
        
        # Safely remove old index if it exists
        migrations.RunSQL(
            """
            SET @index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_id_school_year_id_index'
            );
            
            SET @sql = IF(@index_exists > 0, 
                'DROP INDEX api_patient_user_id_school_year_id_index ON api_patient', 
                'SELECT "Index does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="-- Old index recreation not needed"
        ),
        
        # Create new index if it doesn't exist
        migrations.RunSQL(
            """
            SET @index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_semester_idx'
            );
            
            SET @sql = IF(@index_exists = 0, 
                'CREATE INDEX api_patient_user_semester_idx ON api_patient (user_id, school_year_id, semester)', 
                'SELECT "Index already exists" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="DROP INDEX IF EXISTS api_patient_user_semester_idx ON api_patient"
        ),
    ]
