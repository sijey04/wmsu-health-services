@echo off
REM Start WMSU Health Services project with Django backend only

echo Starting WMSU Health Services...
echo.

echo Starting MySQL database service...
REM Add your MySQL start command here, e.g., net start MySQL80 or use XAMPP control panel
echo Make sure XAMPP MySQL is running
echo.

echo Starting Django API server...
start powershell -NoExit -Command "Set-Location -Path 'c:\xampp\htdocs\wmsu-health-services\backend\django_api'; python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend...
start powershell -NoExit -Command "Set-Location -Path 'c:\xampp\htdocs\wmsu-health-services\frontend'; npm run dev"

echo.
echo All services started!
echo.
echo Frontend: http://localhost:3000 (or http://localhost:3001 if 3000 is taken)
echo Django API: http://localhost:8000
echo.
echo Press any key to exit...
pause > nul
