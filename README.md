# WMSU Health Services

A full-stack web application for Western Mindanao State University Health Services department.

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Django, Express.js
- **Database**: MySQL

## Features

- **User Authentication**: Secure login and registration system
- **Patient Management**: Record and manage patient information
- **Appointment Scheduling**: Book, reschedule, and cancel appointments
- **Medical Records**: Maintain electronic health records
- **Inventory Management**: Track medical supplies and equipment
- **Staff Management**: Manage healthcare staff and their schedules
- **Dashboard**: Analytics and reporting features
- **Notifications**: Email and in-app notifications for appointments and results
- **Mobile Responsive**: Accessible on various devices

## Prerequisites

- Node.js (v18+)
- Python (v3.8+) with Django 
- MySQL Server

## Project Structure

```
wmsu-health-services/
├── frontend/                # Next.js frontend
│   ├── components/          # Reusable React components
│   ├── pages/               # Next.js pages
│   ├── public/              # Static assets
│   ├── styles/              # CSS and Tailwind styles
│   └── utils/               # Helper functions
├── backend/
│   ├── django_api/          # Django API
│   │   ├── api/             # API endpoints
│   │   ├── models/          # Database models
│   │   └── settings/        # Django settings
│   └── express_api/         # Express.js middleware API
│       ├── routes/          # API routes
│       ├── controllers/     # Request handlers
│       └── models/          # Data models
└── database/                # Database scripts and migrations
```

## Project Status

The WMSU Health Services system has been developed with the following features:

- ✅ Frontend with Next.js and Tailwind CSS
- ✅ Express API for backend functionality
- ✅ Django API for additional backend functionality
- ✅ MySQL database setup
- ✅ Patient management system
- ✅ Appointment scheduling system
- ✅ Dashboard with analytics
- ✅ Authentication system with email verification
- ✅ Email delivery system (Gmail SMTP)
- ✅ Docker containerization support

## Quick Start

You can start the project using the provided batch file:

```bash
start_dev.bat
```

This will start all the necessary services:
- Frontend on http://localhost:3000
- Express API on http://localhost:3001
- Django API on http://localhost:8000

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd wmsu-health-services
```

### 2. Set up the database
```bash
# Create a MySQL database
mysql -u root -p
```

```sql
CREATE DATABASE wmsu_health_db;
exit;
```

```bash
# Import the database schema
mysql -u root -p wmsu_health_db < database/setup.sql
```

### 3. Set up the Express.js backend
```bash
# Navigate to Express API directory
cd backend/express_api

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Set up the Django backend
```bash
# Navigate to Django API directory
cd backend/django_api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate
```

### 5. Set up the Next.js frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your API endpoints
```

### 6. Running the application

#### Start the Express API server
```bash
cd backend/express_api
npm run dev
```

#### Start the Django API server
```bash
cd backend/django_api
python manage.py runserver
```

#### Start the Next.js frontend
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Default Login Credentials

- **Admin**: 
  - Email: admin@wmsu.edu.ph
  - Password: admin123

## API Endpoints

- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Add new patient
- `PUT /api/patients/:id` - Update patient information
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/staff` - List all staff members
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Email Configuration

The system includes email verification for user registration. You can configure email delivery in two ways:

### For Development/Testing (Console Backend)
Emails are printed to the Django console instead of being sent:
```bash
# In backend/django_api/.env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### For Production (Gmail SMTP)
Real email delivery using Gmail SMTP:
```bash
# In backend/django_api/.env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Setup Gmail SMTP:**
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password at https://myaccount.google.com/security
3. Update .env with your credentials
4. Run: `setup_gmail_smtp.bat`

For detailed instructions, see `GMAIL_SMTP_SETUP.md`

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact the WMSU Health Services Department.
