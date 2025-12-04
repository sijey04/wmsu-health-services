from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .semester_views import (
    AcademicSemesterViewSet,
    StudentSemesterProfileViewSet,
    SemesterHealthRequirementViewSet,
    StudentRequirementStatusViewSet,
    SemesterDashboardViewSet
)

# Create router for semester tracking API
router = DefaultRouter()
router.register(r'semesters', AcademicSemesterViewSet)
router.register(r'student-profiles', StudentSemesterProfileViewSet)
router.register(r'requirements', SemesterHealthRequirementViewSet)
router.register(r'requirement-status', StudentRequirementStatusViewSet)
router.register(r'dashboard', SemesterDashboardViewSet, basename='dashboard')

# URL patterns for semester tracking
semester_urlpatterns = [
    # Main semester tracking API
    path('api/semester-tracking/', include(router.urls)),
    
    # Additional convenience endpoints
    path('api/current-semester/', AcademicSemesterViewSet.as_view({'get': 'current'}), name='current-semester'),
    path('api/my-semester-profile/', StudentSemesterProfileViewSet.as_view({'get': 'list'}), name='my-semester-profile'),
    path('api/my-requirements/', StudentRequirementStatusViewSet.as_view({'get': 'list'}), name='my-requirements'),
    path('api/semester-dashboard/', SemesterDashboardViewSet.as_view({'get': 'list'}), name='semester-dashboard'),
]
