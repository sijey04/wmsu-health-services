# Safe migration for adding semester field to Patient model
# This migration handles existing columns and indexes gracefully

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_add_dental_waiver_model'),
    ]

    operations = [
        # Use RunSQL to safely add semester column
        migrations.RunSQL(
            """
            -- Add semester column only if it doesn't exist
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
            reverse_sql="""
            -- Remove semester column if it exists
            SET @column_exists = (
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND column_name = 'semester'
            );
            
            SET @sql = IF(@column_exists > 0, 
                'ALTER TABLE api_patient DROP COLUMN semester', 
                'SELECT "Column semester does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """
        ),
        
        # Remove old index safely
        migrations.RunSQL(
            """
            -- Drop old index only if it exists
            SET @index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_id_school_year_id_index'
            );
            
            SET @sql = IF(@index_exists > 0, 
                'DROP INDEX api_patient_user_id_school_year_id_index ON api_patient', 
                'SELECT "Index api_patient_user_id_school_year_id_index does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="-- Index will be recreated if needed"
        ),
        
        # Create new index safely
        migrations.RunSQL(
            """
            -- Create new index only if it doesn't exist
            SET @index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_school_semester_idx'
            );
            
            SET @sql = IF(@index_exists = 0, 
                'CREATE INDEX api_patient_user_school_semester_idx ON api_patient (user_id, school_year_id, semester)', 
                'SELECT "Index api_patient_user_school_semester_idx already exists" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="""
            -- Drop the index if it exists
            SET @index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_school_semester_idx'
            );
            
            SET @sql = IF(@index_exists > 0, 
                'DROP INDEX api_patient_user_school_semester_idx ON api_patient', 
                'SELECT "Index api_patient_user_school_semester_idx does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """
        ),
        
        # Update unique constraint safely
        migrations.RunSQL(
            """
            -- Remove old unique constraint if it exists
            SET @constraint_exists = (
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name = 'api_patient_user_id_school_year_id_uniq'
            );
            
            SET @sql = IF(@constraint_exists > 0, 
                'ALTER TABLE api_patient DROP CONSTRAINT api_patient_user_id_school_year_id_uniq', 
                'SELECT "Old constraint does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Add new unique constraint if it doesn't exist
            SET @new_constraint_exists = (
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name = 'unique_patient_user_school_semester'
            );
            
            SET @sql2 = IF(@new_constraint_exists = 0, 
                'ALTER TABLE api_patient ADD CONSTRAINT unique_patient_user_school_semester UNIQUE (user_id, school_year_id, semester)', 
                'SELECT "New constraint already exists" as message'
            );
            
            PREPARE stmt2 FROM @sql2;
            EXECUTE stmt2;
            DEALLOCATE PREPARE stmt2;
            """,
            reverse_sql="""
            -- Restore old unique constraint
            SET @new_constraint_exists = (
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name = 'unique_patient_user_school_semester'
            );
            
            SET @sql = IF(@new_constraint_exists > 0, 
                'ALTER TABLE api_patient DROP CONSTRAINT unique_patient_user_school_semester', 
                'SELECT "New constraint does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Restore old constraint
            SET @old_constraint_exists = (
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name = 'api_patient_user_id_school_year_id_uniq'
            );
            
            SET @sql2 = IF(@old_constraint_exists = 0, 
                'ALTER TABLE api_patient ADD CONSTRAINT api_patient_user_id_school_year_id_uniq UNIQUE (user_id, school_year_id)', 
                'SELECT "Old constraint already exists" as message'
            );
            
            PREPARE stmt2 FROM @sql2;
            EXECUTE stmt2;
            DEALLOCATE PREPARE stmt2;
            """
        ),
    ]
