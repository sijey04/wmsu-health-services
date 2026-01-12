from django.core.management.base import BaseCommand
from api.models import DocumentRequirement


class Command(BaseCommand):
    help = 'Populate initial document requirements'

    def handle(self, *args, **options):
        """Populate default document requirements"""
        
        requirements = [
            {
                'field_name': 'chest_xray',
                'display_name': 'Chest X-ray Results',
                'description': 'results valid for 6 months',
                'is_required': True,
                'validity_period_months': 6,
                'specific_courses': [],
                'is_active': True
            },
            {
                'field_name': 'cbc',
                'display_name': 'Complete Blood Count Results',
                'description': 'PDF, DOCX, JPG, JPEG, PNG, Max 50MB',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': [],
                'is_active': True
            },
            {
                'field_name': 'blood_typing',
                'display_name': 'Blood Typing Results',
                'description': 'PDF, DOCX, JPG, JPEG, PNG, Max 50MB',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': [],
                'is_active': True
            },
            {
                'field_name': 'urinalysis',
                'display_name': 'Urinalysis Results',
                'description': 'PDF, DOCX, JPG, JPEG, PNG, Max 50MB',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': [],
                'is_active': True
            },
            {
                'field_name': 'drug_test',
                'display_name': 'Drug Test Results',
                'description': 'results valid for 1 year',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': [],
                'is_active': True
            },
            {
                'field_name': 'hepa_b',
                'display_name': 'Hepatitis B Surface Antigen Test',
                'description': 'Required for students of BSN, BS Biology, BS Food Technology',
                'is_required': False,
                'validity_period_months': 12,
                'specific_courses': ['BSN (Bachelor of Science in Nursing)', 'BSBIO (Bachelor of Science in Biology)', 'BSFT (Bachelor of Science in Food Technology)'],
                'is_active': True
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for req_data in requirements:
            req, created = DocumentRequirement.objects.update_or_create(
                field_name=req_data['field_name'],
                defaults={
                    'display_name': req_data['display_name'],
                    'description': req_data['description'],
                    'is_required': req_data['is_required'],
                    'validity_period_months': req_data['validity_period_months'],
                    'specific_courses': req_data['specific_courses'],
                    'is_active': req_data['is_active']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created: {req.display_name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'  → Updated: {req.display_name}'))
        
        total_count = DocumentRequirement.objects.count()
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Document requirements populated successfully!'))
        self.stdout.write(self.style.SUCCESS(f'   Created: {created_count}'))
        self.stdout.write(self.style.SUCCESS(f'   Updated: {updated_count}'))
        self.stdout.write(self.style.SUCCESS(f'   Total: {total_count}'))
