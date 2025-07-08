# Patient Profile Autofill Implementation

## Overview
This implementation adds automatic field population (autofill) functionality to the patient profile system, automatically filling in email address, surname (last_name), first_name, and middle_name from the associated CustomUser record.

## Features Implemented

### 1. Patient Model Autofill
- **Location**: `api/models.py` - Patient model `save()` method
- **Fields Auto-filled**:
  - `email` from `user.email`
  - `name` from `user.last_name, user.first_name` (formatted)
  - `first_name` from `user.first_name`
  - `middle_name` from `user.middle_name`
  - `student_id` as `TEMP-{user.id}` (if not provided)

### 2. Dental Form Autofill
- **Location**: `api/models.py` - DentalFormData model `save()` method
- **Fields Auto-filled**:
  - `surname` from `patient.user.last_name`
  - `first_name` from `patient.first_name` or `patient.user.first_name`
  - `middle_name` from `patient.middle_name` or `patient.user.middle_name`
  - `age` from `patient.age` or calculated from `patient.date_of_birth`
  - `sex` from `patient.gender`

### 3. Medical Form Autofill
- **Location**: `api/models.py` - MedicalFormData model `save()` method
- **Fields Auto-filled**:
  - `surname` from `patient.user.last_name`
  - `first_name` from `patient.first_name` or `patient.user.first_name`
  - `middle_name` from `patient.middle_name` or `patient.user.middle_name`
  - `age` from `patient.age` or calculated from `patient.date_of_birth`
  - `sex` from `patient.gender`

### 4. API Endpoints Enhanced
- **Location**: `api/views.py` - PatientViewSet methods
- **Enhanced Methods**:
  - `create_my_profile()` - Auto-fills user data when creating profiles
  - `create_or_update_profile()` - Auto-fills user data for profile operations
  - `autofill_data()` - NEW endpoint to get user data for frontend autofill

### 5. User Model Enhancement
- **Location**: `api/models.py` - CustomUser model
- **Enhanced Method**: `get_or_create_patient_profile()` - Includes middle_name in defaults

## API Endpoints

### Get Autofill Data
```
GET /api/patients/autofill_data/
```
Returns user information for frontend autofill:
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Michael",
  "name": "Doe, John",
  "student_id": "TEMP-123",
  "has_existing_profile": false,
  "current_school_year": 1,
  "current_school_year_name": "2024-2025",
  "profile_completion_status": {
    "has_basic_info": true,
    "has_emergency_contact": false,
    "has_health_history": false,
    "has_family_history": false
  }
}
```

## Frontend Integration

### Usage in Patient Profile Setup
1. Call `/api/patients/autofill_data/` when component mounts
2. Pre-populate form fields with returned data
3. Allow users to modify pre-populated values if needed
4. Submit profile with auto-filled and user-entered data

### Example Frontend Code
```javascript
// In your React component
useEffect(() => {
  const fetchAutofillData = async () => {
    try {
      const response = await fetch('/api/patients/autofill_data/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      
      // Pre-populate form fields
      setFormData({
        email: data.email,
        first_name: data.first_name,
        middle_name: data.middle_name,
        // ... other fields
      });
      
      setIsAutoFilled(true);
      setAutoFilledFromYear(data.current_school_year_name);
    } catch (error) {
      console.error('Failed to fetch autofill data:', error);
    }
  };
  
  fetchAutofillData();
}, []);
```

## How It Works

### 1. Model-Level Autofill
- Triggered automatically when saving Patient, DentalFormData, or MedicalFormData instances
- Only fills empty fields (respects existing data)
- Cascades from User → Patient → Forms

### 2. API-Level Autofill
- Triggered when creating/updating profiles via API
- Merges user data with submitted form data
- Prioritizes explicitly provided data over auto-filled data

### 3. Priority Order
1. **Explicitly provided data** (highest priority)
2. **Patient model data** (if available)
3. **User model data** (fallback)
4. **Default values** (lowest priority)

## Testing

### Run Test Script
```bash
cd backend/django_api
python test_autofill.py
```

### Manual Testing
1. Create a user with complete name information
2. Create a patient profile - verify auto-fill works
3. Create dental/medical forms - verify cascading auto-fill
4. Test API endpoints with frontend integration

## Benefits

1. **Improved User Experience**: Users don't need to re-enter basic information
2. **Data Consistency**: Ensures consistency between user account and profile data
3. **Reduced Errors**: Less manual data entry reduces typos and omissions
4. **Time Savings**: Faster profile setup and form completion
5. **Backwards Compatible**: Works with existing data and doesn't break current functionality

## Notes

- Auto-fill only occurs for empty fields (won't overwrite existing data)
- Middle name is included in all auto-fill operations
- Student ID is temporarily assigned as "TEMP-{user_id}" until permanent ID is assigned
- All auto-fill operations respect data privacy and security requirements
