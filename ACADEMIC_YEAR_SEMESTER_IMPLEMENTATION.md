# Academic School Year Semester Implementation

## Overview
The Academic School Year model has been enhanced to support three distinct semester periods:
1. **First Semester** (1st sem)
2. **Second Semester** (2nd sem) 
3. **Summer Semester** (summer)

## New Model Fields

The `AcademicSchoolYear` model now includes the following additional fields:

```python
# Semester periods
first_sem_start = models.DateField(help_text='First semester start date', null=True, blank=True)
first_sem_end = models.DateField(help_text='First semester end date', null=True, blank=True)
second_sem_start = models.DateField(help_text='Second semester start date', null=True, blank=True)
second_sem_end = models.DateField(help_text='Second semester end date', null=True, blank=True)
summer_start = models.DateField(help_text='Summer semester start date', null=True, blank=True)
summer_end = models.DateField(help_text='Summer semester end date', null=True, blank=True)
```

## New Methods

### get_current_semester()
Returns the current semester code based on today's date:
- `'1st_semester'` - Currently in first semester
- `'2nd_semester'` - Currently in second semester  
- `'summer'` - Currently in summer semester
- `None` - Not in any semester period or dates not configured

### get_semester_display()
Returns a human-readable semester name:
- `'First Semester'`
- `'Second Semester'`
- `'Summer Semester'`
- `'Not in session'` or `'Semester dates not configured'`

### get_semester_dates(semester)
Returns start and end dates for a specific semester:
```python
start, end = school_year.get_semester_dates('1st_semester')
```

## Serializer Updates

The `AcademicSchoolYearSerializer` now includes:
- All semester date fields
- `current_semester` - Current semester code
- `current_semester_display` - Human-readable current semester
- Enhanced validation for semester date sequences

## Example Usage

### Creating an Academic Year with Semesters

```python
from api.models import AcademicSchoolYear
from datetime import date

# Create academic year with semester periods
school_year = AcademicSchoolYear.objects.create(
    academic_year="2025-2026",
    first_sem_start=date(2025, 8, 15),
    first_sem_end=date(2025, 12, 20),
    second_sem_start=date(2026, 1, 15),
    second_sem_end=date(2026, 5, 15),
    summer_start=date(2026, 6, 1),
    summer_end=date(2026, 7, 31),
    is_current=True,
    status='active'
)

# Check current semester
current = school_year.get_current_semester()
display = school_year.get_semester_display()
print(f"Current semester: {display}")
```

### Using the Management Command

```bash
# Create academic year with all semester dates
python manage.py setup_academic_year 2025-2026 \
    --first-sem-start 2025-08-15 \
    --first-sem-end 2025-12-20 \
    --second-sem-start 2026-01-15 \
    --second-sem-end 2026-05-15 \
    --summer-start 2026-06-01 \
    --summer-end 2026-07-31 \
    --set-current
```

## Database Migration

A migration file has been created to add the new semester fields:
- `0043_add_semester_fields_to_academic_year.py`

Run the migration with:
```bash
python manage.py migrate
```

## API Response Example

```json
{
    "id": 1,
    "academic_year": "2025-2026",
    "start_date": "2025-08-15",
    "end_date": "2026-07-31",
    "first_sem_start": "2025-08-15",
    "first_sem_end": "2025-12-20",
    "second_sem_start": "2026-01-15",
    "second_sem_end": "2026-05-15",
    "summer_start": "2026-06-01",
    "summer_end": "2026-07-31",
    "is_current": true,
    "status": "active",
    "current_semester": "1st_semester",
    "current_semester_display": "First Semester",
    "created_at": "2025-07-15T10:00:00Z",
    "updated_at": "2025-07-15T10:00:00Z"
}
```

## Validation Rules

1. Each semester's start date must be before its end date
2. First semester must end before second semester starts
3. Second semester must end before summer semester starts
4. Overall `start_date` is automatically set to `first_sem_start`
5. Overall `end_date` is automatically set to `summer_end`

## Backward Compatibility

- Existing academic year records will have `null` semester dates initially
- The system gracefully handles missing semester dates
- Current semester methods return `None` when semester dates are not configured
