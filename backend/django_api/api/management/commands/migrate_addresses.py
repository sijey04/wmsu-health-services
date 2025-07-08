from django.core.management.base import BaseCommand
from api.models import Patient


class Command(BaseCommand):
    help = 'Migrate existing address data to new address fields'

    def handle(self, *args, **options):
        patients = Patient.objects.filter(
            address__isnull=False
        ).exclude(address='')
        
        migrated_count = 0
        
        for patient in patients:
            # Skip if new fields already have data
            if patient.city_municipality or patient.barangay or patient.street:
                continue
                
            address = patient.address.strip()
            if not address:
                continue
                
            # Simple parsing logic for Philippine addresses
            # This assumes format like "Street, Barangay, City"
            parts = [part.strip() for part in address.split(',')]
            
            if len(parts) >= 3:
                patient.street = parts[0]
                patient.barangay = parts[1]
                patient.city_municipality = parts[2]
            elif len(parts) == 2:
                patient.barangay = parts[0]
                patient.city_municipality = parts[1]
            elif len(parts) == 1:
                # If only one part, assume it's the city
                patient.city_municipality = parts[0]
            
            patient.save(update_fields=['city_municipality', 'barangay', 'street'])
            migrated_count += 1
            
            self.stdout.write(
                f"Migrated address for {patient.name} (ID: {patient.id})"
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully migrated {migrated_count} patient addresses'
            )
        )
