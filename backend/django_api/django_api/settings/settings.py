"""
Django settings for django_api project.
"""

import os
try:
    import dj_database_url
except ImportError:
    dj_database_url = None
from pathlib import Path
from dotenv import load_dotenv
import pymysql

# Use PyMySQL instead of mysqlclient for MariaDB 10.4.32 compatibility
pymysql.install_as_MySQLdb()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file
env_file = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_file, override=True)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-wmsu-health-services-secret-key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# ALLOWED_HOSTS cleanup and processing
raw_allowed_hosts = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
ALLOWED_HOSTS = []
for host in raw_allowed_hosts:
    # Clean up the host string (remove protocol and trailing slashes)
    clean_host = host.strip().replace('https://', '').replace('http://', '').split('/')[0]
    if clean_host:
        ALLOWED_HOSTS.append(clean_host)

if '*' not in ALLOWED_HOSTS and os.getenv('RAILWAY_STATIC_URL'):
    ALLOWED_HOSTS.append(os.getenv('RAILWAY_STATIC_URL'))

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_yasg',
    'corsheaders',
    'api',
    'django_extensions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'django_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_api.wsgi.application'

# Database - Support for TiDB, Railway MySQL, and DATABASE_URL
TIDB_HOST = os.getenv('TIDB_HOST')
RAILWAY_MYSQL_HOST = os.getenv('MYSQLHOST')
DATABASE_URL = os.getenv('DATABASE_URL')

if TIDB_HOST:
    DATABASES = {
        'default': {
            'ENGINE': 'django_api.db_backends.mysql_compat',
            'NAME': os.getenv('TIDB_DB_NAME', 'wmsu_health_db'),
            'USER': os.getenv('TIDB_USER', 'root'),
            'PASSWORD': os.getenv('TIDB_PASSWORD', ''),
            'HOST': TIDB_HOST,
            'PORT': os.getenv('TIDB_PORT', '4000'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'ssl': {'ca': os.getenv('CA_PATH')} if os.getenv('CA_PATH') else {},
            },
        }
    }
elif RAILWAY_MYSQL_HOST:
    DATABASES = {
        'default': {
            'ENGINE': 'django_api.db_backends.mysql_compat',
            'NAME': os.getenv('MYSQLDATABASE', 'railway'),
            'USER': os.getenv('MYSQLUSER', 'root'),
            'PASSWORD': os.getenv('MYSQLPASSWORD', ''),
            'HOST': RAILWAY_MYSQL_HOST,
            'PORT': os.getenv('MYSQLPORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
            },
        }
    }
elif DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            engine='django_api.db_backends.mysql_compat'
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django_api.db_backends.mysql_compat',
            'NAME': os.getenv('DATABASE_NAME', 'wmsu_health_db'),
            'USER': os.getenv('DATABASE_USER', 'root'),
            'PASSWORD': os.getenv('DATABASE_PASSWORD', ''),
            'HOST': os.getenv('DATABASE_HOST', 'localhost'),
            'PORT': os.getenv('DATABASE_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='TRADITIONAL'",
            },
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'api.CustomUser'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# Enable Whitenoise for static files if installed
try:
    import whitenoise
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
except ImportError:
    pass

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = Path(os.getenv('MEDIA_ROOT_PATH', str(BASE_DIR / 'media')))
SERVE_MEDIA = os.getenv('SERVE_MEDIA', 'False') == 'True'

try:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    (MEDIA_ROOT / 'patient_photos').mkdir(parents=True, exist_ok=True)
except OSError:
    pass

# Optional S3-compatible storage for media (AWS S3, Cloudflare R2, MinIO, etc.)
USE_S3 = os.getenv('USE_S3', 'False') == 'True'
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', '')

if USE_S3 and AWS_STORAGE_BUCKET_NAME:
    if 'storages' not in INSTALLED_APPS:
        INSTALLED_APPS.append('storages')

    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', '')
    AWS_S3_ENDPOINT_URL = os.getenv('AWS_S3_ENDPOINT_URL', '')
    AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN', '')
    AWS_S3_ADDRESSING_STYLE = os.getenv('AWS_S3_ADDRESSING_STYLE', '')
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False
    AWS_LOCATION = os.getenv('AWS_LOCATION', 'media')

    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/"
    elif AWS_S3_ENDPOINT_URL:
        MEDIA_URL = f"{AWS_S3_ENDPOINT_URL.rstrip('/')}/{AWS_STORAGE_BUCKET_NAME}/{AWS_LOCATION}/"
    else:
        if AWS_S3_REGION_NAME:
            MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/{AWS_LOCATION}/"
        else:
            MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{AWS_LOCATION}/"

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Frontend URL for verification links
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

# CORS settings
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://wmsuhealthservices.netlify.app",
]
env_cors = os.getenv('CORS_ALLOWED_ORIGINS')
if env_cors:
    CORS_ALLOWED_ORIGINS.extend([o.strip().rstrip('/') for o in env_cors.split(',') if o.strip()])

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "https://wmsuhealthservices.netlify.app",
    "https://gleaming-consideration-production-647d.up.railway.app",
]
env_csrf = os.getenv('CSRF_TRUSTED_ORIGINS')
if env_csrf:
    CSRF_TRUSTED_ORIGINS.extend([o.strip().rstrip('/') for o in env_csrf.split(',') if o.strip()])

# Security headers for production
if not DEBUG:
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SAMESITE = 'None'

CORS_ALLOW_CREDENTIALS = True

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Email Configuration
# For development: Use console backend to print emails to terminal
# For production: Use SMTP backend with proper credentials
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@wmsuhealthservices.com')

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
