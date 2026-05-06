#!/bin/bash
# Exit on error
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Running full database seeder..."
# This will populate the database with your required baseline data and test users
python manage.py seed_full_database --reset-users

echo "Starting Gunicorn..."
gunicorn django_api.wsgi:application --bind 0.0.0.0:$PORT
