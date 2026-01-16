# Staff Scheduling System - Testing Guide

## Overview
The appointment system has been updated to use dynamic staff schedules with blocked dates and daily appointment limits instead of hardcoded schedules.

## Test Users
Two users have been preserved for testing:
1. **Admin Account**: `admin@wmsu.edu.ph`
2. **Test Account**: `faminianochristianjude@gmail.com`

## System Changes Summary

### 1. Data Source
- **Old**: `/admin-controls/dentist_schedules/` and `/admin-controls/medical_staff_schedules/`
- **New**: `/staff-details/` (unified endpoint for all staff)

### 2. Key Features
- **Blocked Dates**: Staff can block specific dates when unavailable
- **Daily Appointment Limit**: Each staff member has a configurable limit (default: 10)
- **Real-time Availability**: System checks blocked dates and counts existing appointments
- **Staff Assignment**: Appointments are assigned to specific staff members

### 3. Files Modified
- ✅ `frontend/pages/admin/controls.tsx` - Updated to load staff from `/staff-details/`
- ✅ `frontend/pages/appointments/medical.tsx` - Dynamic medical staff scheduling
- ✅ `frontend/pages/appointments/dental.tsx` - Dynamic dentist scheduling
- ✅ `frontend/pages/admin/account-settings.tsx` - Staff can manage blocked dates

## Testing Steps

### Step 1: Configure Staff Account
1. Login as staff (either admin or test account)
2. Go to **Account Settings** (top-right menu)
3. Navigate to **Staff Details** tab
4. Fill in staff information:
   - First Name, Last Name
   - Position (Doctor, Nurse, Medical Staff, Dentist, etc.)
   - Campus (A, B, or C)
   - Contact information
5. Click **Save Staff Details**

### Step 2: Configure Working Schedule
1. In Account Settings, go to **Working Schedule** tab
2. Set **Daily Appointment Limit** (e.g., 5 or 10)
3. Click on calendar dates to block them (dates you're unavailable)
4. Click **Save Working Schedule**
5. Verify blocked dates show in red on calendar

### Step 3: View in Controls Page
1. Go to **Admin Controls** page
2. Scroll to **Medical Staff Schedules** or **Dentist Schedules** section
3. Verify your staff information appears:
   - Name and Position
   - Campus
   - Daily Appointment Limit
   - Blocked Dates (if any)

### Step 4: Test Appointment Booking (as Patient)
1. Logout and login as a patient account
2. Complete all prerequisites:
   - General Health Waiver
   - Dental Waiver (for dental appointments)
   - Patient Profile Setup
   - Dental Information Record (for dental appointments)
3. Navigate to appointment booking page
4. Select campus matching staff configuration
5. Select a date:
   - **Blocked dates** should show error: "No staff available"
   - **Available dates** should show: "X staff member(s) available"
6. **Staff is auto-assigned** - No manual selection needed!
7. Select time and fill reason/concern
8. Submit appointment

### Step 5: Test Appointment Limits
1. Create multiple appointments for the same date
2. After reaching daily limit (e.g., 5 appointments), next attempt should fail
3. Error message: "No staff available on selected date (limit reached)"

### Step 6: Verify Staff Assignment
1. Login as admin/staff
2. Check appointments list
3. Verify `assigned_staff` field contains correct staff ID
4. Each appointment should be linked to the staff member

## Expected Behaviors

### ✅ Blocked Dates
- Dates blocked by ALL staff should be unavailable
- Error shown: "No staff available on selected date (blocked or limit reached)"
- Calendar should prevent booking on these dates

### ✅ Appointment Limits
- Count only 'pending' and 'confirmed' appointments
- When limit reached, no more bookings allowed for that date
- Different staff members have independent limits

### ✅ Staff Selection
- Only staff available on selected date appear in dropdown
- Shows: "Name - Position"
- Auto-selects first available if only one option
- **NEW**: Staff is automatically assigned (no manual selection required)

### ✅ Campus-Specific
- Medical staff: All campuses (A, B, C)
- Dentists: Campus A only
- Staff only shown for matching campus

### ✅ Real-time Updates
- Changing date updates available staff list
- Availability checked on each submission
- Prevents double-booking

## Validation Scenarios

### Scenario 1: No Staff Configured
- **Expected**: "No medical staff available" or "No dentists available" message
- **Action**: At least one staff member must configure their profile

### Scenario 2: All Staff Blocked
- **Expected**: Date selection shows error after choosing blocked date
- **UI**: Red text showing no availability

### Scenario 3: Mixed Availability
- **Expected**: Only available staff appear in dropdown
- **Example**: 3 staff total, 1 blocked, 1 at limit → Shows 1 available

### Scenario 4: Appointment at Limit
- **Expected**: Booking rejected with clear error message
- **Database**: No appointment created

### Scenario 5: Past Date Selection
- **Expected**: Date input prevents selection (HTML5 validation)
- **Min date**: Today

### Scenario 6: Future Limit (3 months medical, 2 months dental)
- **Expected**: Max date enforced in date picker
- **Medical**: 90 days from today
- **Dental**: 61 days from today

## Troubleshooting

### Issue: "No staff available" even with configured staff
**Check**:
1. Staff position matches appointment type
   - Medical: Doctor, Nurse, Medical Staff, Administrator
   - Dental: Dentist, Dental Staff
2. Staff campus matches selected campus
3. Selected date not in blocked dates list
4. Daily limit not reached for that date

### Issue: Staff not appearing in Controls page
**Check**:
1. Staff Details tab completed and saved
2. Position field filled correctly
3. Campus field matches filter
4. Refresh page to reload data

### Issue: Appointments not counting toward limit
**Check**:
1. Appointment status is 'pending' or 'confirmed'
2. Appointment has `assigned_staff` field set
3. Appointment date matches
4. Appointment type matches (medical/dental)

### Issue: Blocked dates not working
**Check**:
1. Working Schedule saved successfully
2. Dates saved as YYYY-MM-DD format
3. `blocked_dates` array in database
4. Backend API returning blocked dates

## API Endpoints Reference

### Staff Details
```
GET /staff-details/
```
Returns all staff with their schedules, blocked dates, and limits.

### Appointments
```
GET /appointments/?appointment_date=YYYY-MM-DD&type=medical
POST /appointments/
```
Query and create appointments with staff assignment.

### Campus Schedules
```
GET /admin-controls/campus_schedules/
```
Get operating hours for each campus (admin-managed).

## Database Fields

### Staff Details (StaffDetail model)
- `user` - Foreign key to User
- `position` - Staff position/role
- `campus` - Campus assignment (A/B/C)
- `blocked_dates` - JSON array of date strings
- `daily_appointment_limit` - Integer (default: 10)

### Appointments
- `patient` - Foreign key to Patient
- `assigned_staff` - Foreign key to User (staff member)
- `appointment_date` - Date field
- `appointment_time` - Time field
- `type` - 'medical' or 'dental'
- `status` - 'pending', 'confirmed', 'cancelled', etc.

## Notes
- Campus Schedules define operating hours (admin only)
- Staff schedules define personal availability (staff managed)
- Both systems work independently
- Appointment limits apply per staff member per day
- Blocked dates override all other availability
