# Enhanced Appointment Scheduling System

## Overview

The new appointment scheduling system (`views2.py`) implements a comprehensive booking system with strict limits and time management to ensure optimal healthcare service delivery.

## Key Features

### 📋 Appointment Limits
- **20 appointments per day maximum** per campus
- **20-minute time intervals** for all appointments
- Prevents overbooking and ensures adequate time for each patient

### 🕐 Working Hours
- **Operating Hours**: 8:00 AM - 5:00 PM (Monday to Friday)
- **Lunch Break**: 12:00 PM - 1:00 PM (no appointments)
- **Weekdays Only**: No weekend appointments
- **Future Dates Only**: Appointments must be scheduled at least 1 day in advance (max 30 days)

### 🎯 Time Slot Management
- Appointments start at 8:00 AM and continue in 20-minute intervals
- Valid time slots: 8:00, 8:20, 8:40, 9:00, 9:20, etc.
- Automatically excludes lunch break (12:00-1:00 PM)
- Last appointment slot: 4:40 PM

## API Endpoints

The new system is accessible via `/api/appointments-v2/` with the following endpoints:

### 1. Available Slots
```
GET /api/appointments-v2/available_slots/
```
**Parameters:**
- `date` (required): Date in YYYY-MM-DD format
- `campus` (optional): Campus code (a, b, c) - default: 'a'
- `type` (optional): Appointment type (medical, dental) - default: 'medical'

**Response:**
```json
{
    "date": "2025-07-17",
    "campus": "a",
    "available_slots": [
        {"time": "08:00", "display": "08:00 AM"},
        {"time": "08:20", "display": "08:20 AM"},
        {"time": "08:40", "display": "08:40 AM"}
    ],
    "total_slots": 25,
    "booked_slots": 3,
    "remaining_slots": 22,
    "daily_limit": 20
}
```

### 2. Daily Schedule
```
GET /api/appointments-v2/daily_schedule/
```
**Parameters:**
- `date` (required): Date in YYYY-MM-DD format
- `campus` (optional): Campus code - default: 'a'

**Response:**
```json
{
    "date": "2025-07-17",
    "campus": "a",
    "schedule": [
        {
            "time": "08:00",
            "display_time": "08:00 AM",
            "is_available": false,
            "appointment_id": 123,
            "patient_name": "John Doe",
            "type": "medical",
            "status": "confirmed",
            "purpose": "Regular checkup"
        },
        {
            "time": "08:20",
            "display_time": "08:20 AM",
            "is_available": true
        }
    ],
    "working_hours": {
        "start": "08:00",
        "end": "17:00",
        "lunch_break": "12:00 - 13:00"
    }
}
```

### 3. Booking Statistics
```
GET /api/appointments-v2/booking_stats/
```
**Parameters:**
- `campus` (optional): Campus code - default: 'a'
- `date_from` (optional): Start date for statistics
- `date_to` (optional): End date for statistics

**Response:**
```json
{
    "campus": "a",
    "total_appointments": 150,
    "daily_limit": 20,
    "status_breakdown": {
        "pending": 25,
        "confirmed": 100,
        "completed": 20,
        "cancelled": 5
    },
    "type_breakdown": {
        "medical": 120,
        "dental": 30
    },
    "daily_utilization": [
        {
            "date": "2025-07-16",
            "appointments": 18,
            "utilization_percentage": 90.0
        }
    ],
    "appointment_duration_minutes": 20
}
```

### 4. Create Appointment
```
POST /api/appointments-v2/
```
**Request Body:**
```json
{
    "appointment_date": "2025-07-17",
    "appointment_time": "09:00",
    "type": "medical",
    "campus": "a",
    "purpose": "Regular checkup"
}
```

### 5. Reschedule Appointment
```
POST /api/appointments-v2/{id}/reschedule/
```
**Request Body:**
```json
{
    "appointment_date": "2025-07-18",
    "appointment_time": "10:20",
    "reschedule_reason": "Patient requested different time"
}
```

## Validation Rules

### ✅ Date Validation
- Must be a future date (at least tomorrow)
- Maximum 30 days in advance
- Weekdays only (Monday-Friday)

### ✅ Time Validation
- Must be within working hours (8:00 AM - 5:00 PM)
- Must not be during lunch break (12:00-1:00 PM)
- Must be a valid 20-minute interval slot
- Time slot must not already be booked

### ✅ Capacity Validation
- Maximum 20 appointments per day per campus
- Each time slot can only have one appointment

## Error Responses

The system provides detailed error messages for validation failures:

```json
{
    "detail": "Appointments must be scheduled for future dates (at least tomorrow)."
}
```

```json
{
    "detail": "Maximum 20 appointments per day has been reached for 2025-07-17."
}
```

```json
{
    "detail": "Time slot 09:15 is already booked for 2025-07-17."
}
```

```json
{
    "detail": "Appointments must be scheduled in 20-minute intervals starting from 8:00 AM."
}
```

## Frontend Integration

To use this system in the frontend, update your API calls to use the new endpoints:

### JavaScript Example
```javascript
// Get available slots
const getAvailableSlots = async (date, campus = 'a') => {
    const response = await fetch(`/api/appointments-v2/available_slots/?date=${date}&campus=${campus}`);
    return response.json();
};

// Create appointment with validation
const createAppointment = async (appointmentData) => {
    const response = await fetch('/api/appointments-v2/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create appointment');
    }
    
    return response.json();
};
```

## Migration Path

### Current System → Enhanced System
1. **Backward Compatibility**: Old `/api/appointments/` endpoints remain functional
2. **Gradual Migration**: Use `/api/appointments-v2/` for new features
3. **Data Consistency**: Both systems work with the same database models

### Recommended Steps
1. Test the new system with `/api/appointments-v2/` endpoints
2. Update frontend components to use new validation rules
3. Implement time slot selection UI with 20-minute intervals
4. Add daily capacity indicators
5. Eventually migrate all frontend code to use v2 endpoints

## Benefits

### 🎯 For Patients
- Clear time slot availability
- Prevents double-booking conflicts
- Predictable appointment duration (20 minutes)
- Better scheduling transparency

### 🏥 For Healthcare Staff
- Optimal appointment distribution throughout the day
- Controlled daily workload (maximum 20 patients)
- Efficient time management with standardized intervals
- Comprehensive booking statistics and analytics

### 📊 For Administrators
- Real-time capacity monitoring
- Detailed utilization reports
- Flexible campus-based scheduling
- Robust validation preventing scheduling conflicts

## Testing

Use the provided test script to verify functionality:

```bash
python test_appointment_scheduling.py
```

This script tests:
- Available slot retrieval
- Daily schedule display
- Booking statistics
- Validation rules (future dates, weekdays, time intervals, capacity limits)

## Configuration

The system parameters can be adjusted in `views2.py`:

```python
class AppointmentSchedulingViewSet(viewsets.ModelViewSet):
    # Configuration constants
    MAX_APPOINTMENTS_PER_DAY = 20           # Daily appointment limit
    APPOINTMENT_DURATION_MINUTES = 20       # Time between appointments
    WORKING_HOURS_START = time(8, 0)        # 8:00 AM
    WORKING_HOURS_END = time(17, 0)         # 5:00 PM
    LUNCH_BREAK_START = time(12, 0)         # 12:00 PM
    LUNCH_BREAK_END = time(13, 0)           # 1:00 PM
```

## Support

For technical issues or questions about the enhanced appointment scheduling system, refer to:
- API documentation: `/api/appointments-v2/` endpoints
- Test script: `test_appointment_scheduling.py`
- Source code: `backend/django_api/api/views2.py`
