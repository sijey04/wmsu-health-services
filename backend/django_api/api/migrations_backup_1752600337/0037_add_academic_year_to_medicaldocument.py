# Generated to fix missing academic_year column in MedicalDocument

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_alter_dentalformdata_academic_year_and_more'),
    ]

    operations = [
        # Add the column without foreign key constraint for now
        migrations.RunSQL(
            "ALTER TABLE api_medicaldocument ADD COLUMN academic_year_id BIGINT NULL;",
            reverse_sql="ALTER TABLE api_medicaldocument DROP COLUMN academic_year_id;"
        ),
    ]
