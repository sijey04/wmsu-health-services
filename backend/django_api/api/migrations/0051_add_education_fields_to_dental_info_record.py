# Generated migration for education fields in DentalInformationRecord

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_dentalwaiver_school_year'),
    ]

    operations = [
        migrations.AddField(
            model_name='dentalinformationrecord',
            name='education_level',
            field=models.CharField(
                blank=True,
                choices=[
                    ('preschool', 'Preschool'),
                    ('elementary', 'Elementary'),
                    ('high_school', 'High School'),
                    ('senior_high', 'Senior High School'),
                    ('college', 'College')
                ],
                max_length=50,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='dentalinformationrecord',
            name='year_level',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='dentalinformationrecord',
            name='section',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='dentalinformationrecord',
            name='course',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='dentalinformationrecord',
            name='year_section',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
