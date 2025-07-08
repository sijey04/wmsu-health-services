# Medical Documents API Endpoint Fix

## Issue Description
The frontend was attempting to call the endpoint `auto_issue_certificate` for issuing medical certificates, but this endpoint did not exist in the Django backend. The correct endpoint name is `issue_certificate`.

## Error Details
- **Frontend Error**: Failed to load resource: the server responded with a status of 404 (Not Found)
- **URL Attempted**: `http://localhost:8000/api/medical-documents/23/auto_issue_certificate/`
- **Correct URL**: `http://localhost:8000/api/medical-documents/23/issue_certificate/`

## Root Cause
The frontend API utility (`frontend/utils/api.ts`) was referencing an incorrect endpoint name that doesn't exist in the Django URL patterns.

## Fix Applied

### 1. Frontend API Update
**File**: `c:\xampp\htdocs\wmsuhealthservices\frontend\utils\api.ts`

**Before**:
```typescript
issueCertificate: (id: number) =>
  djangoApiClient.post(`/medical-documents/${id}/auto_issue_certificate/`, {}, {
    headers: { ...getAuthHeaders() },
  }),
```

**After**:
```typescript
issueCertificate: (id: number) =>
  djangoApiClient.post(`/medical-documents/${id}/issue_certificate/`, {}, {
    headers: { ...getAuthHeaders() },
  }),
```

### 2. Documentation Updates
**File**: `c:\xampp\htdocs\wmsuhealthservices\backend\django_api\MEDICAL_DOCUMENTS_API_COMPLETE.md`

**Before**:
```markdown
- **POST** `/api/medical-documents/{id}/auto_issue_certificate/` - Issue certificate (staff only)
```

**After**:
```markdown
- **POST** `/api/medical-documents/{id}/issue_certificate/` - Issue certificate (staff only)
```

### 3. Test File Updates
**Files**: 
- `c:\xampp\htdocs\wmsuhealthservices\backend\django_api\test_medical_complete.py`
- `c:\xampp\htdocs\wmsuhealthservices\backend\django_api\test_medical_endpoints.py`

Updated all references from `auto_issue_certificate` to `issue_certificate`.

## Verification

### Backend Endpoint Verification
The correct Django endpoint exists in `views.py`:
```python
@action(detail=True, methods=['post'])
def issue_certificate(self, request, pk=None):
    """Issue medical certificate (staff only)"""
    if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
        raise PermissionDenied("Only staff can issue medical certificates")
        
    doc = self.get_object()
    if doc.status != 'verified':
        return Response({
            'detail': 'Documents must be verified before certificate can be issued.'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    doc.status = 'issued'
    doc.certificate_issued_at = timezone.now()
    doc.save()
    
    # ... rest of the method
```

### URL Pattern Verification
The URL pattern exists in Django:
```
api/ ^medical-documents/(?P<pk>[^/.]+)/issue_certificate/$ [name='medicaldocument-issue-certificate']
```

## Current Status
✅ **FIXED**: The frontend now correctly calls the `issue_certificate` endpoint.

## Testing
1. **Frontend**: Running on http://localhost:3002
2. **Backend**: Running on http://127.0.0.1:8000
3. **Endpoint**: `POST /api/medical-documents/{id}/issue_certificate/`

The certificate issuance functionality should now work correctly when:
1. A document has been verified (status = 'verified')
2. A staff member attempts to issue a certificate
3. The document status will be updated to 'issued'
4. The `certificate_issued_at` timestamp will be set

## Related Functionality
The certificate issuance is part of the complete medical documents workflow:
1. Patient uploads documents → `status: 'pending'`
2. Staff verifies documents → `status: 'verified'`
3. Staff issues certificate → `status: 'issued'` + `certificate_issued_at`
4. Certificate can be emailed/downloaded

All workflow steps are now properly connected and functional.
