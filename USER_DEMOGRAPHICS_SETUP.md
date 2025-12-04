# User Demographics Setup Instructions

This document explains how to set up proper user type tracking in the patient database for the WMSU Health Services dashboard demographics.

## Overview

The dashboard displays user demographics breakdown by user types:
- College
- High School 
- Senior High School
- Elementary
- Employee

## Backend Changes Made

### 1. Enhanced Dashboard Statistics API

The `dashboard_statistics` endpoint in `api/views.py` has been updated to include:
- `user_type_breakdown`: Statistics grouped by user type (College, High School, etc.)
- `monthly_trends`: Monthly data for charts
- `completion_rates`: Calculated completion rates for all services

### 2. Patient Model User Type Tracking

The `Patient` model already has a `user_type` field for tracking user demographics. This field should be populated with one of:
- "College" 
- "High School"
- "Senior High School"
- "Elementary"
- "Employee"

### 3. Management Commands

Created management commands to populate user types:

#### Populate User Types
```bash
python manage.py populate_user_types
```
This command:
- Maps existing `CustomUser.education_level` to proper user types
- Updates `Patient.user_type` field based on user data
- Creates demo data if no patients exist (with --create-samples flag)

#### Create Sample Data
```bash
python manage.py populate_user_types --create-samples
python manage.py create_sample_data --appointments 50 --documents 30
```

## Frontend Changes Made

### 1. Enhanced Error Handling
- Better chart data validation
- Debug information for troubleshooting
- Proper fallback to demo data when API fails

### 2. Improved Chart Rendering
- Added proper array and data validation for monthly trends
- Enhanced user type activity display
- Better error messages and loading states

## Setup Steps

### For Existing Data:

1. **Update Backend API**: The enhanced `dashboard_statistics` view is already implemented
2. **Populate User Types**: Run the management command to populate existing patient records:
   ```bash
   cd backend/django_api
   python manage.py populate_user_types
   ```
3. **Create Sample Appointments/Documents** (if needed for testing):
   ```bash
   python manage.py create_sample_data --appointments 50 --documents 30
   ```

### For New Installations:

1. **Create Sample Data**: If starting fresh, create sample users and patients:
   ```bash
   cd backend/django_api
   python manage.py populate_user_types --create-samples
   python manage.py create_sample_data --appointments 100 --documents 50
   ```

### Patient Registration Process:

When new patients register, ensure the `user_type` field is populated based on:
1. User's education level during signup
2. Grade level information
3. Employee status
4. Department/college information

Example mapping logic:
```python
def determine_user_type(user):
    if user.employee_position or user.user_type == 'staff':
        return 'Employee'
    elif user.education_level:
        level = user.education_level.lower()
        if 'college' in level or 'undergraduate' in level:
            return 'College'
        elif 'senior high' in level or 'grade 11' in level or 'grade 12' in level:
            return 'Senior High School'
        elif 'high school' in level or any(f'grade {i}' in level for i in [7,8,9,10]):
            return 'High School'
        elif 'elementary' in level or any(f'grade {i}' in level for i in [1,2,3,4,5,6]):
            return 'Elementary'
    return 'College'  # Default
```

## Verification

After setup, verify the dashboard works by:

1. **Check API Response**: Visit the dashboard statistics endpoint:
   ```
   GET /api/admin-controls/system_configuration/dashboard_statistics/
   ```

2. **Verify Response Structure**: Should include:
   ```json
   {
     "user_type_breakdown": {
       "College": {
         "medical": {"total": X, "completed": Y, ...},
         "dental": {...},
         "documents": {...},
         "patients": {...}
       },
       "High School": {...},
       ...
     },
     "monthly_trends": [...],
     "completion_rates": {...}
   }
   ```

3. **Check Dashboard Charts**: The frontend should now display:
   - Monthly Activity Trends (bar chart)
   - User Type Activity (activity feed)
   - Service Distribution (doughnut chart)
   - User demographics in PDF exports

## Troubleshooting

### Charts Not Showing:
1. Check if API is returning proper data structure
2. Verify user_type field is populated in Patient records
3. Check browser console for JavaScript errors
4. Ensure Chart.js dependencies are installed

### Missing User Types:
1. Run `python manage.py populate_user_types` again
2. Check CustomUser.education_level values
3. Manually update Patient.user_type for specific records

### API Errors:
1. Check Django logs for database errors
2. Verify all required models exist
3. Ensure proper user permissions for admin dashboard

## Database Schema

Key fields for demographics tracking:

### CustomUser Model:
- `education_level`: String field for user's education level
- `user_type`: Choice field (student, staff, admin)
- `grade_level`: Additional grade information
- `employee_position`: For employee identification

### Patient Model:
- `user_type`: String field for demographic categorization
- `user`: ForeignKey to CustomUser
- `course`, `year_level`: Additional classification data
