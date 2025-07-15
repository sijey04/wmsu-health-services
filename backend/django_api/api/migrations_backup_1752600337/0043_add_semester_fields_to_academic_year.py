# Generated manually for semester fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0042_dentalformdata_examiner_license_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='academicschoolyear',
            name='first_sem_start',
            field=models.DateField(help_text='First semester start date', null=True),
        ),
        migrations.AddField(
            model_name='academicschoolyear',
            name='first_sem_end',
            field=models.DateField(help_text='First semester end date', null=True),
        ),
        migrations.AddField(
            model_name='academicschoolyear',
            name='second_sem_start',
            field=models.DateField(help_text='Second semester start date', null=True),
        ),
        migrations.AddField(
            model_name='academicschoolyear',
            name='second_sem_end',
            field=models.DateField(help_text='Second semester end date', null=True),
        ),
        migrations.AddField(
            model_name='academicschoolyear',
            name='summer_start',
            field=models.DateField(help_text='Summer semester start date', null=True),
        ),
        migrations.AddField(
            model_name='academicschoolyear',
            name='summer_end',
            field=models.DateField(help_text='Summer semester end date', null=True),
        ),
    ]
