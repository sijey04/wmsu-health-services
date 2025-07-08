from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, UserViewSet, UserManagementViewSet, PatientViewSet, MedicalRecordViewSet, 
    AppointmentViewSet, AcademicSchoolYearViewSet,
    InventoryViewSet, WaiverViewSet, DentalFormDataViewSet, 
    MedicalFormDataViewSet, StaffDetailsViewSet,
    ComorbidIllnessViewSet, VaccinationViewSet, PastMedicalHistoryItemViewSet,
    FamilyMedicalHistoryItemViewSet, SystemConfigurationViewSet,
    ProfileRequirementViewSet, DocumentRequirementViewSet, CampusScheduleViewSet,
    DentistScheduleViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'academic-school-years', AcademicSchoolYearViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'waivers', WaiverViewSet)
router.register(r'dental-forms', DentalFormDataViewSet)
router.register(r'medical-forms', MedicalFormDataViewSet)
router.register(r'staff-details', StaffDetailsViewSet)
router.register(r'comorbid-illnesses', ComorbidIllnessViewSet)
router.register(r'vaccinations', VaccinationViewSet)
router.register(r'past-medical-histories', PastMedicalHistoryItemViewSet)
router.register(r'family-medical-histories', FamilyMedicalHistoryItemViewSet)

auth_router = DefaultRouter()
auth_router.register(r'auth', AuthViewSet, basename='auth')

# User management router - directly register the medical list ViewSets
user_mgmt_router = DefaultRouter()
user_mgmt_router.register(r'user-management', UserManagementViewSet, basename='user-management')
user_mgmt_router.register(r'user-management/comorbid_illnesses', ComorbidIllnessViewSet, basename='user-management-comorbid-illnesses')
user_mgmt_router.register(r'user-management/vaccinations', VaccinationViewSet, basename='user-management-vaccinations')
user_mgmt_router.register(r'user-management/past_medical_histories', PastMedicalHistoryItemViewSet, basename='user-management-past-medical-histories')
user_mgmt_router.register(r'user-management/family_medical_histories', FamilyMedicalHistoryItemViewSet, basename='user-management-family-medical-histories')

# Admin controls router - register the admin configuration ViewSets
admin_controls_router = DefaultRouter()
admin_controls_router.register(r'admin-controls/system_configuration', SystemConfigurationViewSet, basename='admin-controls-system-configuration')
admin_controls_router.register(r'admin-controls/profile_requirements', ProfileRequirementViewSet, basename='admin-controls-profile-requirements')
admin_controls_router.register(r'admin-controls/document_requirements', DocumentRequirementViewSet, basename='admin-controls-document-requirements')
admin_controls_router.register(r'admin-controls/campus_schedules', CampusScheduleViewSet, basename='admin-controls-campus-schedules')
admin_controls_router.register(r'admin-controls/dentist_schedules', DentistScheduleViewSet, basename='admin-controls-dentist-schedules')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(user_mgmt_router.urls)),
    path('', include(admin_controls_router.urls)),
    path('', include(auth_router.urls)),
]
