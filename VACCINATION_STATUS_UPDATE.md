# Vaccination Status Update

## Overview
Updated vaccination history status options from the old system to more accurate medical terminology.

## Changes Made

### Old Status Options (Removed):
- `received` → "Received"
- `not_received` → "Not Received"  
- `unknown` → "Unknown"

### New Status Options (Implemented):
- `fully_vaccinated` → "Fully Vaccinated" (Green indicator)
- `partially_vaccinated` → "Partially Vaccinated" (Yellow indicator)
- `unvaccinated` → "Unvaccinated" (Red indicator)
- `boosted` → "Boosted" (Blue indicator)
- `lapsed` → "Lapsed" (Gray indicator - default for new entries)

## Files Updated

### Frontend Changes:
1. **`frontend/pages/patient/profile-setup.tsx`**
   - Updated vaccination history radio button options
   - Added color-coded status indicators
   - Updated default selection logic

### Backend Changes:
1. **`backend/django_api/api/models.py`**
   - Updated `COVID_VAX_CHOICES` to match new vaccination status options
   - Maintains backward compatibility with existing data

## Color Coding System
- **Green**: Fully Vaccinated (complete protection)
- **Yellow**: Partially Vaccinated (incomplete series)
- **Red**: Unvaccinated (no vaccination)
- **Blue**: Boosted (additional doses beyond full vaccination)
- **Gray**: Lapsed (vaccination expired or unknown status)

## Default Behavior
- New vaccination entries default to "Lapsed" status
- Existing data remains unchanged and will display correctly
- Users can update their vaccination status using the new options

## Medical Accuracy
The new options provide more medically accurate terminology that aligns with current vaccination tracking standards and provides clearer information for healthcare providers.