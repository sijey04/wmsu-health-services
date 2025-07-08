# Patient Profile Duplication Fix

## Problem Description

Upon signing up, a patient profile was automatically created for new student users. However, when completing the profile setup after signup, the system was creating a **new** patient profile record instead of editing the existing one created during signup. Additionally, profile pictures and other data were not being properly carried over between the signup and profile setup processes.

## Root Cause

The issue was in both backend API logic and frontend handling:

1. **Backend**: During signup (`SignupSerializer.create()`), a Patient profile was created with `school_year=None` (no school year assigned), but during profile setup (`create_my_profile` endpoint), the system looked for existing profiles using `user.get_current_patient_profile()`, which only searches for profiles with the current school year
2. **Frontend**: The profile setup had logic that detected profiles without school years and forced creation of new profiles instead of letting the backend handle the update logic
3. **Serializer**: The profile endpoints were using the generic `PatientSerializer` instead of the specialized `PatientProfileUpdateSerializer` which has better handling for file uploads and profile-specific validations

## Solution Implemented

### Backend Changes

#### 1. Updated `create_my_profile` method in `views.py`
- Added logic to check for existing profiles without school year (created during signup)
- If found, assigns the current school year to the signup profile before updating it
- This ensures the signup profile is reused instead of creating a duplicate
- **Changed to use `PatientProfileUpdateSerializer`** for better file handling including profile pictures

#### 2. Updated `create_or_update_profile` method in `views.py`
- Applied the same logic for consistency across both endpoints
- **Changed to use `PatientProfileUpdateSerializer`** for consistent file handling

#### 3. Updated `update_my_profile` method in `views.py`
- **Changed to use `PatientProfileUpdateSerializer`** for consistent file handling

#### 4. Improved signup process in `serializers.py`
- Modified `SignupSerializer.create()` to automatically assign the current school year to new patient profiles
- This prevents the issue from occurring in future signups

### Frontend Changes

#### 1. Simplified profile setup logic in `profile-setup.tsx`
- Removed complex frontend logic that was determining whether to create vs update profiles
- **Now always uses the `create_my_profile` endpoint** which intelligently handles both create and update scenarios on the backend
- This ensures profile pictures and all other data are properly preserved when updating the signup profile

### Database Cleanup

#### Created a migration script: `fix_duplicate_patient_profiles.py`
- Identifies users with multiple patient profiles
- Merges data from duplicate profiles, keeping the most complete information including profile pictures
- Deletes duplicate profiles
- Ensures remaining profiles have the current school year assigned

## Files Modified

1. `backend/django_api/api/views.py`
   - `create_my_profile()` method - now uses `PatientProfileUpdateSerializer`
   - `create_or_update_profile()` method - now uses `PatientProfileUpdateSerializer`
   - `update_my_profile()` method - now uses `PatientProfileUpdateSerializer`

2. `backend/django_api/api/serializers.py`
   - `SignupSerializer.create()` method

3. `frontend/pages/patient/profile-setup.tsx`
   - `handleProfileSave()` method - simplified to always use backend create endpoint

4. `backend/django_api/fix_duplicate_patient_profiles.py` (new file)
   - Database cleanup script

## How to Apply the Fix

### 1. Backend Code Changes
The code changes have been applied to the Django API. No database migration is needed as this is a logic fix.

### 2. Fix Existing Data (Optional)
If there are already users with duplicate profiles in the database, run the cleanup script:

```bash
cd backend/django_api
python fix_duplicate_patient_profiles.py
```

### 3. Test the Fix
1. Create a new test user account
2. Complete the signup process
3. Upload a profile picture during profile setup
4. Complete the profile setup
5. Verify that only one patient profile exists for the user
6. Verify that the profile has the current school year assigned
7. **Verify that the profile picture is preserved in the final profile**

## Expected Behavior After Fix

- **New signups**: Patient profile created with current school year assigned
- **Profile setup**: Updates existing profile instead of creating duplicate
- **Profile pictures**: Properly carried over from signup profile to completed profile
- **All profile data**: Preserved when updating signup profile with complete information
- **Existing users**: Can use cleanup script to merge duplicate profiles

## Technical Details

### Key Logic Addition
```python
# Check for profiles without school year (created during signup)
if not current_patient_profile:
    signup_profile = user.patient_profiles.filter(school_year__isnull=True).first()
    if signup_profile:
        # Update the signup profile with current school year
        signup_profile.school_year = current_school_year
        signup_profile.save()
        current_patient_profile = signup_profile
```

### Serializer Change
```python
# Now using PatientProfileUpdateSerializer for better file handling
serializer = PatientProfileUpdateSerializer(current_patient_profile, data=data, partial=True, context={'request': request})
```

### Frontend Simplification
```typescript
// Always use the create endpoint which handles both create and update
await patientProfileAPI.create(formData);
```

This ensures backward compatibility while preventing future duplicates and properly preserving all profile data including photos.
