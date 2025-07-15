# Appointment Semester Implementation

## Overview
The Appointment model has been enhanced to track which semester period each appointment belongs to, providing better organization and reporting capabilities for health services across the academic year.

## New Fields Added

### Appointment Model
- **`semester`**: CharField with choices for semester periods
  - `'1st_semester'` - First Semester
  - `'2nd_semester'` - Second Semester  
  - `'summer'` - Summer Semester
  - Can be `null` for appointments outside semester periods

## New Methods

### `determine_semester()`
Automatically determines which semester an appointment falls into based on:
- Appointment date
- Associated school year's semester periods
- Returns appropriate semester code or `None` if outside all periods

### `get_semester_display()`
Returns human-readable semester names:
- `'First Semester'`
- `'Second Semester'`
- `'Summer Semester'`
- `'Unassigned'` for null values

### Enhanced `save()` method
- Auto-assigns current school year if not set
- Auto-determines semester based on appointment date
- Maintains existing appointment data integrity

### Enhanced `__str__()` method
- Now includes semester information in string representation
- Format: "Patient's appointment on DATE at TIME (Semester)"

## Serializer Updates

### AppointmentSerializer
Added new read-only fields:
- `semester_display` - Human-readable semester name
- `school_year_display` - Academic year string

## Database Migration

**Migration file**: `0044_add_semester_to_appointment.py`
- Adds `semester` field with proper choices
- Allows null values for backward compatibility
- No data loss for existing appointments

## Management Commands

### `update_appointment_semesters`
Updates existing appointments with semester information:

```bash
# Dry run to see what would be updated
python manage.py update_appointment_semesters --dry-run

# Apply the updates
python manage.py update_appointment_semesters
```

## Usage Examples

### Creating Appointments with Auto-Semester Assignment

```python
from api.models import Appointment, Patient
from datetime import date, time

# Create appointment - semester will be auto-determined
appointment = Appointment.objects.create(
    patient=patient,
    appointment_date=date(2025, 9, 15),  # Falls in first semester
    appointment_time=time(10, 0),
    purpose="Regular checkup",
    type="medical"
)

print(appointment.semester)  # Output: '1st_semester'
print(appointment.get_semester_display())  # Output: 'First Semester'
```

### Querying Appointments by Semester

```python
# Get all first semester appointments
first_sem_appointments = Appointment.objects.filter(semester='1st_semester')

# Get appointments for current semester
current_year = AcademicSchoolYear.get_current_school_year()
if current_year:
    current_semester = current_year.get_current_semester()
    current_appointments = Appointment.objects.filter(
        school_year=current_year,
        semester=current_semester
    )
```

### API Response Example

```json
{
    "id": 1,
    "patient": 1,
    "patient_name": "Doe, John",
    "appointment_date": "2025-09-15",
    "appointment_time": "10:00:00",
    "purpose": "Regular checkup",
    "semester": "1st_semester",
    "semester_display": "First Semester",
    "school_year": 1,
    "school_year_display": "2025-2026",
    "status": "confirmed",
    "type": "medical",
    "campus": "a",
    "created_at": "2025-07-15T10:00:00Z"
}
```

## Statistics and Reporting

### Enhanced Database Clearing Script
The `clear_database.py` script now shows appointment distribution by semester:

```
📊 Current Database State:
   Appointments: 25
     📚 First Semester: 12
     📚 Second Semester: 8
     ☀️ Summer Semester: 3
     ❓ Unassigned: 2
```

### Testing Script
Use `test_appointment_semesters.py` to:
- Test semester determination logic
- View appointment statistics by semester
- Verify semester assignment accuracy

## Benefits

1. **Better Organization**: Appointments are now categorized by academic periods
2. **Improved Reporting**: Generate semester-specific reports and statistics
3. **Academic Planning**: Track health service usage patterns across semesters
4. **Data Integrity**: Automatic semester assignment ensures consistency
5. **Backward Compatibility**: Existing appointments remain functional

## Validation Rules

1. Semester is auto-determined when appointment is saved
2. Appointments outside semester periods remain unassigned (null)
3. School year assignment takes precedence for semester determination
4. Manual semester override is possible but discouraged

## Migration Notes

- **Safe Migration**: No data loss, existing appointments remain unchanged
- **Gradual Update**: Use management command to assign semesters to existing data
- **Rollback Support**: Can be reversed if needed
- **Performance**: Minimal impact on existing queries

## Future Enhancements

- Semester-based appointment limits
- Semester transition notifications
- Academic calendar integration
- Automated semester reporting
