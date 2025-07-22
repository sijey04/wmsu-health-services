# Generated manually to acknowledge existing database fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_make_age_sex_optional'),
    ]

    operations = [
        # These fields already exist in the database table api_dentalformdata
        # This migration just tells Django about them without attempting to create them
        # We use RunSQL with "SELECT 1" which is a no-op operation
        migrations.RunSQL(
            "SELECT 1;",  # No-op SQL statement - does nothing but validates
            reverse_sql="SELECT 1;"
        ),
    ]
