@echo off
echo Applying Django Migrations for WMSU Health Services
echo ====================================================
echo.

cd /d "c:\xampp\htdocs\wmsuhealthservices\backend\django_api"

echo Step 1: Checking current migration status...
python manage.py showmigrations --plan
echo.

echo Step 2: Creating new migrations if needed...
python manage.py makemigrations
echo.

echo Step 3: Applying all migrations...
python manage.py migrate
echo.

echo Step 4: Verifying database structure...
python -c "import os, sys, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings'); django.setup(); from django.db import connection; cursor = connection.cursor(); cursor.execute('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = \"api_medicaldocument\" AND column_name = \"academic_year_id\"'); result = cursor.fetchone(); print(f'academic_year_id column exists: {result[0] > 0}')"
echo.

echo Step 5: Testing ORM functionality...
python -c "import os, sys, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings'); django.setup(); from api.models import MedicalDocument; count = MedicalDocument.objects.count(); print(f'MedicalDocument count: {count}')"
echo.

echo Migration process completed!
echo.
echo If you see any errors above, please check the Django logs.
echo If migrations were successful, restart your Django server.
echo.
pause
