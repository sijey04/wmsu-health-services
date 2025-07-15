# Safe migration for index cleanup and field updates
# This migration handles existing indexes gracefully

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0047_update_dental_waiver_semester'),
    ]

    operations = [
        # Remove old index safely
        migrations.RunSQL(
            """
            -- Remove api_patient_user_id_b1c93a_idx if it exists
            SET @index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_id_b1c93a_idx'
            );
            
            SET @sql = IF(@index_exists > 0, 
                'DROP INDEX api_patient_user_id_b1c93a_idx ON api_patient', 
                'SELECT "Index api_patient_user_id_b1c93a_idx does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="-- Index will be recreated if needed"
        ),
        
        # Rename index safely
        migrations.RunSQL(
            """
            -- First check if old index exists and new one doesn't
            SET @old_index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_school_semester_idx'
            );
            
            SET @new_index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_id_5d3deb_idx'
            );
            
            -- Only proceed if old exists and new doesn't
            SET @sql = IF(@old_index_exists > 0 AND @new_index_exists = 0, 
                'ALTER TABLE api_patient RENAME INDEX api_patient_user_school_semester_idx TO api_patient_user_id_5d3deb_idx', 
                'SELECT "Index rename not needed or not possible" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="""
            -- Reverse the rename
            SET @new_index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_id_5d3deb_idx'
            );
            
            SET @old_index_exists = (
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND index_name = 'api_patient_user_school_semester_idx'
            );
            
            SET @sql = IF(@new_index_exists > 0 AND @old_index_exists = 0, 
                'ALTER TABLE api_patient RENAME INDEX api_patient_user_id_5d3deb_idx TO api_patient_user_school_semester_idx', 
                'SELECT "Index rename reverse not needed" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """
        ),
        
        # Remove parent_guardian_signature field from dentalwaiver if it exists
        migrations.RunSQL(
            """
            -- Remove field only if it exists
            SET @column_exists = (
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_dentalwaiver' 
                AND column_name = 'parent_guardian_signature'
            );
            
            SET @sql = IF(@column_exists > 0, 
                'ALTER TABLE api_dentalwaiver DROP COLUMN parent_guardian_signature', 
                'SELECT "Column parent_guardian_signature does not exist" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """,
            reverse_sql="""
            -- Add back the field if it doesn't exist
            SET @column_exists = (
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_dentalwaiver' 
                AND column_name = 'parent_guardian_signature'
            );
            
            SET @sql = IF(@column_exists = 0, 
                'ALTER TABLE api_dentalwaiver ADD COLUMN parent_guardian_signature VARCHAR(255) NULL', 
                'SELECT "Column parent_guardian_signature already exists" as message'
            );
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            """
        ),
        
        # Update AcademicSchoolYear fields - these should be safe field alterations
        migrations.AlterField(
            model_name='academicschoolyear',
            name='first_sem_end',
            field=models.DateField(blank=True, help_text='First semester end date', null=True),
        ),
        migrations.AlterField(
            model_name='academicschoolyear',
            name='first_sem_start',
            field=models.DateField(blank=True, help_text='First semester start date', null=True),
        ),
        migrations.AlterField(
            model_name='academicschoolyear',
            name='second_sem_end',
            field=models.DateField(blank=True, help_text='Second semester end date', null=True),
        ),
        migrations.AlterField(
            model_name='academicschoolyear',
            name='second_sem_start',
            field=models.DateField(blank=True, help_text='Second semester start date', null=True),
        ),
        migrations.AlterField(
            model_name='academicschoolyear',
            name='summer_end',
            field=models.DateField(blank=True, help_text='Summer semester end date', null=True),
        ),
        migrations.AlterField(
            model_name='academicschoolyear',
            name='summer_start',
            field=models.DateField(blank=True, help_text='Summer semester start date', null=True),
        ),
    ]
