@echo off
echo =====================================================
echo WMSU Health Services - Migration Fix Batch Script
echo =====================================================
echo.

cd /d "c:\xampp\htdocs\wmsuhealthservices\backend\django_api"

echo Step 1: Checking current migration status...
python manage.py showmigrations api
echo.

echo Step 2: Faking problematic migration 0046...
python manage.py migrate api 0046 --fake
echo.

echo Step 3: Faking problematic migration 0048...
python manage.py migrate api 0048 --fake
echo.

echo Step 4: Applying remaining migrations...
python manage.py migrate
echo.

echo Step 5: Final migration status check...
python manage.py showmigrations api
echo.

echo =====================================================
echo Migration fix completed!
echo =====================================================
pause
