# Dental Appointment Flow Documentation

## Overview
This document outlines the complete sequential flow for dental appointments in the WMSU Health Services system.

## Complete Flow Sequence

### 1. General Health Waiver (`/patient/waiver`)
- **Purpose**: Patient signs the general health waiver
- **Next Step**: Dental Informed Consent
- **Redirect Logic**: 
  - If `option=Book Dental Consultation`: Redirects to `/patient/dental-waiver`
  - Otherwise: Redirects to `/patient/profile-setup`
- **Files Modified**: `frontend/pages/patient/waiver.tsx`

### 2. Dental Informed Consent (`/patient/dental-waiver`)
- **Purpose**: Patient signs the dental-specific waiver
- **Next Step**: Profile Setup
- **Redirect Logic**: Always redirects to `/patient/profile-setup`
- **Files Modified**: `frontend/pages/patient/dental-waiver.tsx`

### 3. Patient Profile Setup (`/patient/profile-setup`)
- **Purpose**: Patient completes their profile information
- **Next Step**: Dental Information Record
- **Redirect Logic**:
  - If `option=Book Dental Consultation`: Redirects to `/patient/dental-information-record`
  - If `option=Book Medical Consultation`: Redirects to `/appointments/medical`
  - If `option=Request Medical Certificate`: Redirects to `/patient/upload-documents`
- **Files Modified**: `frontend/pages/patient/profile-setup.tsx`

### 4. Dental Information Record (`/patient/dental-information-record`)
- **Purpose**: Patient completes dental history and information
- **Next Step**: Dental Appointment Booking
- **Redirect Logic**: Always redirects to `/appointments/dental`
- **Files Modified**: `frontend/pages/patient/dental-information-record.tsx`

### 5. Dental Appointment Booking (`/appointments/dental`)
- **Purpose**: Patient books the actual dental appointment
- **Prerequisites**: All previous steps must be completed
- **Validation**: Checks all requirements before allowing appointment booking
- **Files Modified**: `frontend/pages/appointments/dental.tsx`

## Key Features

### Automatic Flow Management
- Each page automatically redirects to the next step upon completion
- The `option=Book Dental Consultation` parameter is preserved throughout the flow
- If requirements are not met, users are automatically redirected to the next required step

### Skip Logic for Completed Steps
- If a user has already completed a step, they are automatically forwarded to the next uncompleted step
- This prevents users from getting stuck on already-completed requirements
- **General Waiver**: Once signed, users skip this step in future flows
- **Dental Waiver**: Once signed, users skip this step in future flows  
- **Profile Setup**: If profile exists for current semester, users can update or skip
- **Dental Information Record**: If completed for current semester, users skip this step

### Requirement Checking
The dental appointment page includes comprehensive requirement checking:
- ✅ Authentication status
- ✅ General health waiver completion
- ✅ Dental waiver completion  
- ✅ Patient profile completion
- ✅ Dental information record completion

## Implementation Details

### Query Parameter Flow
Each redirect maintains the `option=Book Dental Consultation` parameter to ensure proper flow context:

```javascript
router.push({
  pathname: '/next-step',
  query: { ...router.query, option: 'Book Dental Consultation' }
});
```

### Conditional Redirects
Pages check the `option` parameter to determine the appropriate next step:

```javascript
const { option } = router.query;
if (option === 'Book Dental Consultation') {
  // Dental flow logic
} else {
  // Default flow logic
}
```

## Error Handling
- Network errors are handled gracefully
- Missing requirements trigger appropriate redirects
- User feedback is provided at each step
- Loading states prevent user confusion

## Testing Recommendations
1. Test the complete flow from start to finish
2. Test skipping already-completed steps
3. Test direct navigation to later steps (should redirect to first incomplete step)
4. Test with different `option` parameter values
5. Test error scenarios (network failures, invalid data)

## Files Modified
- `frontend/pages/patient/waiver.tsx`
- `frontend/pages/patient/dental-waiver.tsx`
- `frontend/pages/patient/profile-setup.tsx`
- `frontend/pages/patient/dental-information-record.tsx`
- `frontend/pages/appointments/dental.tsx`

## Flow Diagram
```
Start: User wants dental appointment
    ↓
1. Check General Health Waiver
    ↓ (if not completed)
   General Health Waiver Page
    ↓ (completed)
2. Check Dental Waiver
    ↓ (if not completed)
   Dental Waiver Page
    ↓ (completed)
3. Check Patient Profile
    ↓ (if not completed)
   Profile Setup Page
    ↓ (completed)
4. Check Dental Information Record
    ↓ (if not completed)
   Dental Information Record Page
    ↓ (completed)
5. Dental Appointment Booking
    ↓
   Appointment Successfully Booked
```

This implementation ensures a smooth, guided experience for users booking dental appointments while maintaining all necessary health and safety documentation requirements.
