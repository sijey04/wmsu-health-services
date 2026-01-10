# Announcements System Implementation Summary

## Overview
Implemented a comprehensive announcements modal system that displays important announcements to users after they log in. The system tracks which announcements users have viewed to ensure they only see each announcement once.

## Backend Implementation

### Models (backend/django_api/api/models.py)
Added two new models:

1. **Announcement Model**
   - Fields:
     - `title`: CharField - Announcement title
     - `message`: TextField - Announcement message content
     - `priority`: CharField - Priority level (low, medium, high, urgent)
     - `icon`: CharField - Emoji icon for visual representation
     - `is_active`: BooleanField - Toggle announcement on/off
     - `show_on_login`: BooleanField - Show modal after user login
     - `target_all_users`: BooleanField - Target all users
     - `target_user_types`: JSONField - Array of specific user types to target
     - `target_grade_levels`: JSONField - Array of specific grade levels to target
     - `expires_at`: DateTimeField - Optional expiration date
     - `created_by`: ForeignKey to CustomUser
     - `created_at`, `updated_at`: Auto timestamps
   
   - Methods:
     - `is_expired()`: Checks if announcement has expired
     - `should_show_to_user(user)`: Validates if announcement should show to specific user based on targeting rules

2. **UserAnnouncementView Model**
   - Fields:
     - `user`: ForeignKey to CustomUser
     - `announcement`: ForeignKey to Announcement
     - `viewed_at`: DateTimeField - Auto timestamp when viewed
   - Meta:
     - `unique_together`: Ensures each user can only view each announcement once

### Serializers (backend/django_api/api/serializers.py)
Added two serializers:

1. **AnnouncementSerializer**
   - Includes all announcement fields
   - `created_by_name`: Read-only field showing creator's full name
   - `is_expired`: Read-only computed field
   - Automatically sets `created_by` to current user on creation

2. **UserAnnouncementViewSerializer**
   - Tracks user views with announcement title reference

### Views (backend/django_api/api/views.py)
Added **AnnouncementViewSet** with:
- Standard CRUD operations (create, read, update, delete)
- Permission control:
  - Staff/admin: Full access to all operations
  - Regular users: Can only view active, non-expired announcements targeted to them
  
- Custom Actions:
  - `unviewed()` (GET /api/announcements/unviewed/):
    - Returns all unviewed announcements for current user
    - Filters by `show_on_login=True`
    - Checks targeting rules and expiration
    - Excludes already viewed announcements
  
  - `mark_viewed()` (POST /api/announcements/{id}/mark_viewed/):
    - Marks announcement as viewed by current user
    - Creates UserAnnouncementView record
    - Returns 201 if newly created, 200 if already viewed

### URL Routing (backend/django_api/api/urls.py)
- Registered `AnnouncementViewSet` at `/api/announcements/`
- Available endpoints:
  - GET /api/announcements/ - List all announcements (filtered by permissions)
  - POST /api/announcements/ - Create new announcement (staff only)
  - GET /api/announcements/{id}/ - Get specific announcement
  - PUT/PATCH /api/announcements/{id}/ - Update announcement (staff only)
  - DELETE /api/announcements/{id}/ - Delete announcement (staff only)
  - GET /api/announcements/unviewed/ - Get unviewed announcements
  - POST /api/announcements/{id}/mark_viewed/ - Mark as viewed

### Migration
- Created migration `0019_add_announcement_models`
- Successfully applied to database

## Frontend Implementation

### AnnouncementModal Component (frontend/components/AnnouncementModal.tsx)
Created a new modal component with features:

- **Announcement Display**:
  - Shows announcement icon, title, and message
  - Priority badge (color-coded by priority level)
  - Supports multi-line messages with whitespace preservation

- **Multiple Announcements Support**:
  - Pagination through multiple announcements
  - Shows "Announcement X of Y" counter
  - "Next" button for navigation
  - "Got it" button on last announcement

- **API Integration**:
  - Fetches unviewed announcements on modal open
  - Marks announcements as viewed when:
    - User clicks "Next" to move to next announcement
    - User closes modal
    - User clicks "Got it" on last announcement

- **Priority Styling**:
  - Urgent: Red background with red border
  - High: Orange background with orange border
  - Medium: Yellow background with yellow border
  - Low: Blue background with blue border

- **User Experience**:
  - Clean, professional design matching app theme
  - Smooth transitions
  - Responsive layout
  - Proper loading states

### Index Page Integration (frontend/pages/index.tsx)
Integrated announcement modal into landing page:

- **State Management**:
  - `showAnnouncementModal`: Controls modal visibility
  - `hasCheckedAnnouncements`: Ensures announcements only checked once per session

- **Announcement Check Logic**:
  - Checks for announcements after user logs in
  - Only checks after post-login modal is closed (so it doesn't interfere)
  - Uses `useCallback` to optimize the check function
  - Automatically shows modal if unviewed announcements exist

- **Flow**:
  1. User logs in successfully
  2. Post-login options modal shows (if applicable)
  3. After post-login modal is closed
  4. System checks for unviewed announcements
  5. If announcements exist, announcement modal shows
  6. User views and dismisses announcements
  7. Announcements marked as viewed in database

## Features

### Targeting
- Target all users or specific user types (student, staff, faculty, etc.)
- Target specific grade levels (Freshman, Sophomore, etc.)
- Flexible targeting allows precise announcement distribution

### Priority Levels
- **Urgent**: Critical system announcements (red)
- **High**: Important updates (orange)
- **Medium**: General information (yellow)
- **Low**: Informational messages (blue)

### Expiration
- Optional expiration date
- Expired announcements automatically hidden
- Active/inactive toggle for manual control

### View Tracking
- Each user-announcement pair tracked uniquely
- Prevents duplicate views
- Timestamp of when announcement was viewed
- Announcements show only once per user

### Permission System
- Staff/admin can create, edit, and delete announcements
- Regular users only see announcements targeted to them
- Active, non-expired announcements only
- Respects targeting rules

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/announcements/` | GET | Required | List announcements (filtered) |
| `/api/announcements/` | POST | Staff | Create announcement |
| `/api/announcements/{id}/` | GET | Required | Get specific announcement |
| `/api/announcements/{id}/` | PUT/PATCH | Staff | Update announcement |
| `/api/announcements/{id}/` | DELETE | Staff | Delete announcement |
| `/api/announcements/unviewed/` | GET | Required | Get unviewed login announcements |
| `/api/announcements/{id}/mark_viewed/` | POST | Required | Mark announcement as viewed |

## Database Schema

### Announcement Table
```
- id (AutoField, PK)
- title (VARCHAR)
- message (TEXT)
- priority (VARCHAR: 'low', 'medium', 'high', 'urgent')
- icon (VARCHAR)
- is_active (BOOLEAN)
- show_on_login (BOOLEAN)
- target_all_users (BOOLEAN)
- target_user_types (JSON)
- target_grade_levels (JSON)
- expires_at (DATETIME, nullable)
- created_by (FK -> CustomUser)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### UserAnnouncementView Table
```
- id (AutoField, PK)
- user (FK -> CustomUser)
- announcement (FK -> Announcement)
- viewed_at (DATETIME)
- UNIQUE(user, announcement)
```

## Usage Example

### Creating an Announcement (Staff/Admin)
```python
announcement = Announcement.objects.create(
    title="System Maintenance",
    message="The health services system will undergo maintenance on Saturday, 2AM-6AM.",
    priority="high",
    icon="🔧",
    is_active=True,
    show_on_login=True,
    target_all_users=True,
    expires_at=datetime(2024, 12, 15),
    created_by=request.user
)
```

### Frontend API Call
```typescript
// Fetch unviewed announcements
const response = await fetch('http://localhost:8000/api/announcements/unviewed/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const announcements = await response.json();

// Mark as viewed
await fetch(`http://localhost:8000/api/announcements/${id}/mark_viewed/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Testing Checklist

- [ ] Staff can create announcements via admin panel
- [ ] Announcements show after user login
- [ ] Announcements only show once per user
- [ ] Multiple announcements paginate correctly
- [ ] Priority colors display properly
- [ ] Expired announcements don't show
- [ ] Targeting works for user types
- [ ] Targeting works for grade levels
- [ ] Mark viewed API works correctly
- [ ] Modal closes properly
- [ ] No interference with post-login modal

## Future Enhancements

Possible future improvements:
- Rich text editor for announcement messages
- Image attachments
- Schedule announcements for future dates
- Analytics dashboard for announcement views
- Email notifications for urgent announcements
- Admin panel for managing announcements
- Draft/publish workflow
- Announcement categories
- Search and filter in admin view
