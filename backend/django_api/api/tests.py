"""
Django test for user blocking functionality
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from api.models import CustomUser, AcademicSchoolYear

User = get_user_model()

class UserBlockingTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.admin_user = CustomUser.objects.create_user(
            username='test_admin',
            email='admin@test.com',
            password='testpass123',
            user_type='admin',
            first_name='Test',
            last_name='Admin',
            is_staff=True,
            is_email_verified=True
        )
        
        self.student_user = CustomUser.objects.create_user(
            username='test_student',
            email='student@test.com',
            password='testpass123',
            user_type='student',
            first_name='Test',
            last_name='Student',
            is_email_verified=True
        )
        
        self.school_year = AcademicSchoolYear.objects.create(
            academic_year='2024-2025',
            start_date='2024-08-01',
            end_date='2025-07-31',
            is_current=True,
            status='active'
        )
    
    def test_initial_user_state(self):
        """Test initial user state"""
        self.assertFalse(self.student_user.is_blocked)
        self.assertTrue(self.student_user.can_book_consultation())
    
    def test_block_user(self):
        """Test blocking a user"""
        self.student_user.block_user(blocked_by=self.admin_user, reason="Test blocking")
        self.student_user.refresh_from_db()
        
        self.assertTrue(self.student_user.is_blocked)
        self.assertFalse(self.student_user.can_book_consultation())
        self.assertEqual(self.student_user.block_reason, "Test blocking")
        self.assertEqual(self.student_user.blocked_by, self.admin_user)
    
    def test_unblock_user(self):
        """Test unblocking a user"""
        # First block the user
        self.student_user.block_user(blocked_by=self.admin_user, reason="Test blocking")
        self.student_user.refresh_from_db()
        self.assertTrue(self.student_user.is_blocked)
        
        # Then unblock
        self.student_user.unblock_user()
        self.student_user.refresh_from_db()
        
        self.assertFalse(self.student_user.is_blocked)
        self.assertTrue(self.student_user.can_book_consultation())
        self.assertEqual(self.student_user.block_reason, "")
        self.assertIsNone(self.student_user.blocked_by)
    
    def test_blocked_user_cannot_book_appointment(self):
        """Test that blocked users cannot book appointments"""
        # Create patient profile
        patient_profile, created = self.student_user.get_or_create_patient_profile(self.school_year)
        
        # Block the user
        self.student_user.block_user(blocked_by=self.admin_user, reason="Test blocking")
        
        # Try to create appointment via API
        client = APIClient()
        
        # Login as student
        response = client.post('/api/auth/login/', {
            'email': 'student@test.com',
            'password': 'testpass123'
        })
        
        if response.status_code == 200:
            token = response.data['access_token']
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            
            # Try to create appointment
            appointment_data = {
                'patient': patient_profile.id,
                'appointment_date': '2024-07-15',
                'appointment_time': '10:00',
                'purpose': 'Test appointment',
                'type': 'medical',
                'campus': 'a'
            }
            
            response = client.post('/api/appointments/', appointment_data)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Cleanup
        self.student_user.unblock_user()
    
    def test_admin_cannot_be_blocked(self):
        """Test that admin users cannot be blocked"""
        from api.serializers import UserBlockSerializer
        
        serializer = UserBlockSerializer(data={
            'user_id': self.admin_user.id,
            'action': 'block',
            'reason': 'Test'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('user_id', serializer.errors)
