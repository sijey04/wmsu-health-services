from django.core.management.base import BaseCommand
from api.models import Patient


class Command(BaseCommand):
    help = 'Migrate existing emergency contact address data to new barangay and street fields'

    def handle(self, *args, **options):
        patients = Patient.objects.filter(
            emergency_contact_address__isnull=False
        ).exclude(emergency_contact_address='')
        
        migrated_count = 0
        
        for patient in patients:
            # Skip if new fields already have data
            if patient.emergency_contact_barangay or patient.emergency_contact_street:
                continue
                
            address = patient.emergency_contact_address.strip()
            if not address:
                continue
                
            # Remove "Zamboanga City" from the end if present
            if address.lower().endswith(', zamboanga city'):
                address = address[:-15].strip()
            elif address.lower().endswith('zamboanga city'):
                address = address[:-13].strip()
                
            # Simple parsing logic for address within Zamboanga City
            # This assumes format like "Street, Barangay"
            parts = [part.strip() for part in address.split(',')]
            
            if len(parts) >= 2:
                patient.emergency_contact_street = parts[0]
                patient.emergency_contact_barangay = parts[1]
            elif len(parts) == 1:
                # If only one part, assume it's the barangay
                patient.emergency_contact_barangay = parts[0]
            
            patient.save(update_fields=['emergency_contact_barangay', 'emergency_contact_street'])
            migrated_count += 1
            
            self.stdout.write(
                f"Migrated emergency contact address for {patient.name} (ID: {patient.id})"
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully migrated {migrated_count} emergency contact addresses'
            )
        )
