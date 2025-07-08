@echo off
echo Starting WMSU Health Services Backend...
echo.

cd /d "c:\xampp\htdocs\wmsuhealthservices\backend\django_api"

echo Checking for pending migrations...
python manage.py showmigrations --plan
echo.

echo Applying any pending migrations...
python manage.py migrate
echo.

echo Starting Django development server...
echo The server will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver
