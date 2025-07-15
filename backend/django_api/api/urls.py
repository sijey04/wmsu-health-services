from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, UserViewSet, UserManagementViewSet, StaffManagementViewSet, 
    MedicalRecordViewSet, AppointmentViewSet, AcademicSchoolYearViewSet,
    InventoryViewSet, WaiverViewSet, DentalWaiverViewSet, DentalFormDataViewSet, 
    MedicalDocumentViewSet, StaffDetailsViewSet,
    ComorbidIllnessViewSet, VaccinationViewSet, PastMedicalHistoryItemViewSet,
    FamilyMedicalHistoryItemViewSet, SystemConfigurationViewSet,
    ProfileRequirementViewSet, DocumentRequirementViewSet, CampusScheduleViewSet,
    DentistScheduleViewSet, PatientViewSet as ProfilePatientViewSet
)
from .views1 import MedicalFormDataViewSet, PatientViewSet as GeneralPatientViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'staff-management', StaffManagementViewSet, basename='staff-management')
router.register(r'patients', GeneralPatientViewSet)  # General patient endpoints use views1
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'academic-school-years', AcademicSchoolYearViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'waivers', WaiverViewSet)
router.register(r'dental-waivers', DentalWaiverViewSet)
router.register(r'dental-forms', DentalFormDataViewSet)
router.register(r'medical-forms', MedicalFormDataViewSet)
router.register(r'medical-documents', MedicalDocumentViewSet)
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
    # Profile setup specific endpoints that use views.py for better autofill and previous year fetching
    path('patients/my_profile/', ProfilePatientViewSet.as_view({'get': 'my_profile'}), name='profile-setup-my-profile'),
    path('patients/my_profiles/', ProfilePatientViewSet.as_view({'get': 'my_profiles'}), name='profile-setup-my-profiles'),
    path('patients/autofill_data/', ProfilePatientViewSet.as_view({'get': 'autofill_data'}), name='profile-setup-autofill-data'),
    path('patients/create_my_profile/', ProfilePatientViewSet.as_view({'post': 'create_my_profile'}), name='profile-setup-create-my-profile'),
    path('patients/update_my_profile/', ProfilePatientViewSet.as_view({'put': 'update_my_profile', 'patch': 'update_my_profile'}), name='profile-setup-update-my-profile'),
    path('patients/create_or_update_profile/', ProfilePatientViewSet.as_view({'post': 'create_or_update_profile'}), name='profile-setup-create-or-update-profile'),
    
    # General routes (must come after specific ones)
    path('', include(router.urls)),
    path('', include(user_mgmt_router.urls)),
    path('', include(admin_controls_router.urls)),
    path('', include(auth_router.urls)),
]
