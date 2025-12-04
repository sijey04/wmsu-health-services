@echo off
REM Start all services for WMSU Health Services project

echo Starting MySQL database service...
REM Add your MySQL start command here, e.g., net start MySQL80 or use XAMPP control panel

echo Starting Django API server...
start powershell -NoExit -Command "Set-Location -Path 'c:\xampp\htdocs\wmsu-health-services\backend\django_api'; python manage.py runserver"

echo Starting Frontend...
start powershell -NoExit -Command "Set-Location -Path 'c:\xampp\htdocs\wmsu-health-services\frontend'; npm run dev"

echo All services started!
echo Frontend: http://localhost:3000
echo Django API: http://localhost:8000
