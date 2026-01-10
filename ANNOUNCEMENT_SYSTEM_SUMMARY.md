# Announcement Modal System - Complete Implementation

## Overview
A comprehensive announcement modal system that displays important notifications to users upon login. Announcements are managed by administrators through the Content Management page and can be targeted to specific user types or grade levels.

## Features

### Backend (Django)
- **Models** ([backend/django_api/api/models.py](backend/django_api/api/models.py))
  - `Announcement`: Stores announcement details
    - `title`: Announcement title
    - `message`: Full message content
    - `priority`: Level (low, medium, high, urgent)
    - `icon`: Emoji icon for visual identification
    - `is_active`: Active/inactive toggle
    - `show_on_login`: Display after user login
    - `target_all_users`: Show to all users flag
    - `target_user_types`: Array of user types (student, faculty, staff, etc.)
    - `target_grade_levels`: Array of grade levels
    - `expires_at`: Expiration date (optional)
    - `created_by`: User who created the announcement
    - `created_at`: Creation timestamp
    
  - `UserAnnouncementView`: Tracks which users have viewed which announcements
    - Unique constraint: (user, announcement) - ensures one view record per user per announcement

- **API Endpoints** ([backend/django_api/api/views.py](backend/django_api/api/views.py))
  - `GET /api/announcements/` - List all announcements (staff only for inactive)
  - `POST /api/announcements/` - Create new announcement (staff only)
  - `GET /api/announcements/:id/` - Get specific announcement
  - `PUT /api/announcements/:id/` - Update announcement (staff only)
  - `PATCH /api/announcements/:id/` - Partial update (staff only)
  - `DELETE /api/announcements/:id/` - Delete announcement (staff only)
  - `GET /api/announcements/unviewed/` - Get unviewed announcements for current user
  - `POST /api/announcements/:id/mark_viewed/` - Mark announcement as viewed

- **Permissions**
  - Read: Authenticated users can view active, non-expired announcements
  - Create/Update/Delete: Staff users only

- **Business Logic**
  - `is_expired()`: Checks if announcement has passed expiration date
  - `should_show_to_user(user)`: Determines if announcement should be shown to specific user based on targeting rules

### Frontend

#### AnnouncementModal Component ([frontend/components/AnnouncementModal.tsx](frontend/components/AnnouncementModal.tsx))
- Displays announcements in a modal after login
- Features:
  - Pagination for multiple announcements
  - Priority-based color coding:
    - **Urgent**: Red border/background (🔴)
    - **High**: Orange border/background (🟠)
    - **Medium**: Yellow border/background (🟡)
    - **Low**: Blue border/background (🔵)
  - Icon display with emoji support
  - "Next" button for multiple announcements
  - "Close" button marks all as viewed
  - Automatically fetches unviewed announcements
  - Shows announcement count (e.g., "1 of 3")

#### Integration in Index Page ([frontend/pages/index.tsx](frontend/pages/index.tsx))
- `checkForAnnouncements()`: Fetches unviewed announcements after login
- Triggers after post-login modal closes
- Only checks once per session
- State management:
  - `showAnnouncementModal`: Controls modal visibility
  - `hasCheckedAnnouncements`: Prevents duplicate checks

#### Admin Management ([frontend/pages/admin/content.tsx](frontend/pages/admin/content.tsx))
- **"Announcement Modals" Tab** in Content Management page
- Complete CRUD interface:
  
  **View Announcements:**
  - Grid display of all announcements
  - Color-coded by priority
  - Shows active/inactive status with toggle switch
  - Displays target audience (All Users or specific types/grades)
  - Shows expiration date and expired status
  - Displays creator and creation date
  - Edit and Delete buttons per announcement

  **Create/Edit Form:**
  - Icon (emoji) selector
  - Priority dropdown (Low, Medium, High, Urgent)
  - Title (required)
  - Message (required, textarea)
  - Expiration date (optional)
  - Targeting options:
    - "Show to all users" checkbox
    - User types (comma-separated: student, faculty, staff)
    - Grade levels (comma-separated: Freshman, Sophomore, Junior, Senior)
  - Create/Update button
  - Cancel button (when editing)

  **Functions:**
  - `fetchSystemAnnouncements()`: Loads all announcements
  - `createOrUpdateSystemAnnouncement()`: Creates new or updates existing
  - `editSystemAnnouncement(announcement)`: Populates form for editing
  - `cancelEditSystemAnnouncement()`: Clears form and exits edit mode
  - `toggleSystemAnnouncement(id, status)`: Toggles active/inactive
  - `deleteSystemAnnouncement(id)`: Deletes with confirmation

## Database Migration
- **File**: `backend/django_api/api/migrations/0019_add_announcement_models.py`
- **Status**: ✅ Applied
- **Tables Created**:
  - `api_announcement`
  - `api_userannouncementview`

## Testing

### Test Data Created
Two sample announcements were created via Django shell:
1. **Welcome to WMSU Health Services**
   - Priority: High
   - Message: "Welcome! Our health services are here to support your well-being..."
   - Target: All users

2. **Holiday Schedule Update**
   - Priority: Medium
   - Message: "Please note that the clinic will have adjusted hours..."
   - Target: All users

### Testing Checklist

#### Backend Testing
- [x] Models created and migrated
- [x] API endpoints accessible
- [x] Permissions working (staff vs regular users)
- [x] Unviewed announcements endpoint returns correct data
- [x] Mark viewed endpoint creates UserAnnouncementView records
- [x] Targeting logic filters correctly

#### Frontend Testing
- [x] AnnouncementModal component renders
- [x] Priority colors display correctly
- [x] Pagination works for multiple announcements
- [x] Mark as viewed on close/next
- [x] Integration with index page after login

#### Admin Interface Testing
- [ ] Navigate to `/admin/content` page
- [ ] Click "Announcement Modals" tab
- [ ] Verify existing announcements display
- [ ] Test create new announcement
  - [ ] Fill all required fields
  - [ ] Test with targeting options
  - [ ] Test with expiration date
- [ ] Test edit announcement
  - [ ] Click edit button
  - [ ] Modify fields
  - [ ] Verify update saves
- [ ] Test toggle active/inactive
  - [ ] Click switch
  - [ ] Verify status changes
- [ ] Test delete announcement
  - [ ] Click delete button
  - [ ] Confirm deletion
  - [ ] Verify announcement removed

#### End-to-End Testing
- [ ] Create announcement as admin
- [ ] Log out
- [ ] Log in as regular user
- [ ] Verify announcement modal appears
- [ ] Close modal
- [ ] Verify UserAnnouncementView created in database
- [ ] Log out and log back in
- [ ] Verify announcement doesn't appear again
- [ ] Test with multiple announcements (pagination)
- [ ] Test with expired announcement (shouldn't show)
- [ ] Test with targeted announcement (user type/grade level)

## Usage Guide for Admins

### Creating an Announcement
1. Navigate to **Content Management** page
2. Click the **"Announcement Modals"** tab
3. Scroll to the **"Create New Announcement"** form
4. Fill in the fields:
   - **Icon**: Enter an emoji (📢, ⚠️, 📅, etc.)
   - **Priority**: Select urgency level
     - **Urgent** (Red): Critical information requiring immediate attention
     - **High** (Orange): Important information users should see soon
     - **Medium** (Yellow): General announcements
     - **Low** (Blue): Nice-to-know information
   - **Title**: Brief, descriptive title (required)
   - **Message**: Full announcement content (required)
   - **Expiration Date**: Optional - announcement won't show after this date
   - **Targeting**:
     - Check "Show to all users" for everyone
     - OR specify user types (student, faculty, staff, etc.)
     - AND/OR specify grade levels (Freshman, Sophomore, Junior, Senior)
5. Click **"Create Announcement"**

### Editing an Announcement
1. Find the announcement in the grid
2. Click the **"Edit"** button
3. Modify fields as needed
4. Click **"Update Announcement"**
5. Or click **"Cancel"** to discard changes

### Activating/Deactivating
- Use the toggle switch on each announcement card
- Inactive announcements won't show to users
- Useful for temporarily hiding announcements without deleting

### Deleting an Announcement
1. Click the **"Delete"** button on the announcement
2. Confirm the deletion
3. Announcement and all view records will be removed

## Priority Levels Explained

| Priority | Color | Use Case | Example |
|----------|-------|----------|---------|
| **Urgent** | Red | Emergency situations, immediate action required | "Clinic closed due to emergency" |
| **High** | Orange | Important deadlines, significant changes | "Vaccination deadline: March 15" |
| **Medium** | Yellow | General announcements, schedule changes | "New clinic hours starting next week" |
| **Low** | Blue | Informational, nice-to-know | "New wellness program available" |

## Targeting Options

### User Types
Common values: `student`, `faculty`, `staff`, `alumni`, `employee`
- Comma-separated list
- Example: "student, faculty"

### Grade Levels
Common values: `Freshman`, `Sophomore`, `Junior`, `Senior`, `Graduate`
- Comma-separated list
- Example: "Freshman, Sophomore"

### Targeting Logic
- If "Show to all users" is checked: Everyone sees the announcement
- Otherwise, users must match at least one criterion:
  - User type in target_user_types, OR
  - Grade level in target_grade_levels
- Empty arrays mean no targeting restriction

## Technical Notes

### View Tracking
- Each user-announcement pair tracked in UserAnnouncementView
- Unique constraint prevents duplicate views
- Views created when:
  - User closes the modal
  - User clicks "Next" to move to next announcement
  - User closes modal after viewing last announcement

### Performance Considerations
- Unviewed query filters by:
  - Active announcements only
  - Non-expired announcements
  - Not in user's viewed list
  - Matches targeting criteria
- Indexed on common query fields
- Consider pagination for large datasets

### Security
- All mutation endpoints require staff permissions
- Regular users can only view active, non-expired announcements
- Users can only mark their own views

## Files Modified/Created

### Backend
- ✅ `backend/django_api/api/models.py` - Added models
- ✅ `backend/django_api/api/serializers.py` - Added serializers
- ✅ `backend/django_api/api/views.py` - Added viewset
- ✅ `backend/django_api/api/urls.py` - Registered router
- ✅ `backend/django_api/api/migrations/0019_add_announcement_models.py` - Migration

### Frontend
- ✅ `frontend/components/AnnouncementModal.tsx` - New component
- ✅ `frontend/pages/index.tsx` - Integration
- ✅ `frontend/pages/admin/content.tsx` - Admin UI

### Documentation
- ✅ `ANNOUNCEMENT_SYSTEM_SUMMARY.md` - This file

## Future Enhancements
- [ ] Rich text editor for announcement messages
- [ ] Image upload for announcements
- [ ] Scheduled announcements (start date)
- [ ] Analytics (view counts, click-through rates)
- [ ] Email notifications for urgent announcements
- [ ] Announcement templates
- [ ] Bulk operations (delete, activate, deactivate)
- [ ] Announcement preview before publishing
- [ ] Version history for announcements
- [ ] A/B testing for different announcement styles

## Troubleshooting

### Announcements not showing after login
1. Check announcement is active: `is_active = True`
2. Check not expired: `expires_at` is null or future date
3. Check targeting: User matches criteria
4. Check user hasn't viewed it: No UserAnnouncementView record
5. Check browser console for API errors

### Can't create announcements
1. Verify user is staff: `is_staff = True`
2. Check authentication token is valid
3. Verify required fields provided (title, message)
4. Check backend logs for validation errors

### Announcements showing repeatedly
1. Verify UserAnnouncementView record created when modal closes
2. Check mark_viewed API endpoint is being called
3. Verify unique constraint on (user, announcement)

### Toggle not working
1. Verify user is staff
2. Check PATCH request is being sent
3. Verify token in Authorization header
4. Check backend logs for permission errors
