from django.core.management.base import BaseCommand
from api.models import Appointment

class Command(BaseCommand):
    help = 'Debug appointment serializer issues'

    def handle(self, *args, **options):
        print("=== APPOINTMENT SERIALIZER DEBUG ===")
        
        appointments = Appointment.objects.all()
        print(f"Total appointments: {appointments.count()}")
        
        for appointment in appointments:
            print(f"\nAppointment ID: {appointment.id}")
            print(f"  Patient: {appointment.patient}")
            print(f"  Patient name: {appointment.patient.name if appointment.patient else 'None'}")
            print(f"  Doctor: {appointment.doctor}")
            print(f"  Doctor name: {appointment.doctor.get_full_name() if appointment.doctor else 'None'}")
            print(f"  Type: {appointment.type}")
            print(f"  Status: {appointment.status}")
            
        # Test serialization
        from api.serializers import AppointmentSerializer
        print(f"\n=== TESTING SERIALIZATION ===")
        
        try:
            serializer = AppointmentSerializer(appointments, many=True)
            data = serializer.data
            print(f"Serialization successful. Count: {len(data)}")
            
            if data:
                print(f"Sample serialized appointment: {data[0]}")
                
        except Exception as e:
            print(f"Serialization error: {e}")
            
            # Test individual appointments
            for appointment in appointments:
                try:
                    serializer = AppointmentSerializer(appointment)
                    data = serializer.data
                    print(f"  Appointment {appointment.id}: OK")
                except Exception as e:
                    print(f"  Appointment {appointment.id}: ERROR - {e}")
