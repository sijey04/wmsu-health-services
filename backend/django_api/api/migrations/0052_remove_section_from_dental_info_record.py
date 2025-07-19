# Generated migration to remove section field from DentalInformationRecord

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0051_add_education_fields_to_dental_info_record'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dentalinformationrecord',
            name='section',
        ),
    ]
