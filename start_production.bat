@echo off
echo ======================================
echo WMSU Health Services - Starting...
echo ======================================

cd /d "%~dp0"

echo Building and starting services...
docker-compose down
docker-compose up --build -d

echo.
echo ======================================
echo Deployment complete!
echo ======================================
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo Admin Panel: http://localhost:8000/admin
echo.
echo Default Credentials:
echo Admin: admin@wmsu.edu.ph / admin123
echo Staff: doctor.main@wmsu.edu.ph / wmsu2024
echo ======================================

pause
