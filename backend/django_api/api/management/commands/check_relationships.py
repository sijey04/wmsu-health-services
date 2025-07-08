from django.core.management.base import BaseCommand
from api.models import Appointment

class Command(BaseCommand):
    help = 'Check appointment patient relationships'

    def handle(self, *args, **options):
        print("=== APPOINTMENT RELATIONSHIPS CHECK ===")
        
        appointments = Appointment.objects.all()
        print(f"Total appointments: {appointments.count()}")
        
        for appointment in appointments:
            print(f"\nAppointment {appointment.id}:")
            print(f"  Patient: {appointment.patient}")
            print(f"  Patient ID: {appointment.patient_id}")
            print(f"  Patient exists: {appointment.patient is not None}")
            
            # Try to access patient name via the relationship
            try:
                patient_name = appointment.patient.name
                print(f"  Patient name: {patient_name}")
            except Exception as e:
                print(f"  ERROR accessing patient name: {e}")
                
            # Try to access doctor
            print(f"  Doctor: {appointment.doctor}")
            print(f"  Doctor ID: {appointment.doctor_id}")
        
        # Test the ordering that's used in the viewset
        print(f"\n=== TESTING ORDERING ===")
        
        try:
            ordered = appointments.order_by('-appointment_date', '-appointment_time')
            print(f"Default ordering count: {ordered.count()}")
            
            # Test specific orderings that might fail
            name_ordered = appointments.order_by('patient__name')
            print(f"Patient name ordering count: {name_ordered.count()}")
            
            time_ordered = appointments.order_by('appointment_date', 'appointment_time')
            print(f"Time ordering count: {time_ordered.count()}")
            
        except Exception as e:
            print(f"ORDERING ERROR: {e}")
        
        # Test select_related 
        print(f"\n=== TESTING SELECT_RELATED ===")
        
        try:
            related_queryset = Appointment.objects.select_related('patient', 'doctor').all()
            print(f"Select_related count: {related_queryset.count()}")
            
            for appointment in related_queryset:
                print(f"  {appointment.id}: patient={appointment.patient}, doctor={appointment.doctor}")
                
        except Exception as e:
            print(f"SELECT_RELATED ERROR: {e}")
