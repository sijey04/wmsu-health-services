#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.models import DentalMedicineSupply

def populate_dental_medicines():
    """Populate dental medicines and supplies"""
    medicines_data = [
        # Anesthetics
        {'name': 'Lidocaine HCl 2%', 'type': 'anesthetic', 'description': 'Local anesthetic for dental procedures', 'unit': 'cartridge'},
        {'name': 'Articaine HCl 4%', 'type': 'anesthetic', 'description': 'Long-acting local anesthetic', 'unit': 'cartridge'},
        {'name': 'Benzocaine 20%', 'type': 'anesthetic', 'description': 'Topical anesthetic gel', 'unit': 'tube'},
        
        # Medicines
        {'name': 'Amoxicillin 500mg', 'type': 'medicine', 'description': 'Antibiotic for dental infections', 'unit': 'capsule'},
        {'name': 'Ibuprofen 400mg', 'type': 'medicine', 'description': 'Anti-inflammatory pain reliever', 'unit': 'tablet'},
        {'name': 'Paracetamol 500mg', 'type': 'medicine', 'description': 'Pain reliever and fever reducer', 'unit': 'tablet'},
        {'name': 'Chlorhexidine Mouthwash', 'type': 'medicine', 'description': 'Antiseptic mouth rinse', 'unit': 'bottle'},
        
        # Antibiotics
        {'name': 'Metronidazole 400mg', 'type': 'antibiotic', 'description': 'Antibiotic for anaerobic infections', 'unit': 'tablet'},
        {'name': 'Clindamycin 300mg', 'type': 'antibiotic', 'description': 'Antibiotic for serious dental infections', 'unit': 'capsule'},
        {'name': 'Azithromycin 250mg', 'type': 'antibiotic', 'description': 'Antibiotic for respiratory and dental infections', 'unit': 'tablet'},
        
        # Dental Supplies
        {'name': 'Composite Resin', 'type': 'dental_supply', 'description': 'Tooth-colored filling material', 'unit': 'syringe'},
        {'name': 'Glass Ionomer Cement', 'type': 'dental_supply', 'description': 'Fluoride-releasing filling material', 'unit': 'capsule'},
        {'name': 'Dental Floss', 'type': 'dental_supply', 'description': 'Oral hygiene tool', 'unit': 'roll'},
        {'name': 'Fluoride Varnish', 'type': 'dental_supply', 'description': 'Fluoride treatment for teeth', 'unit': 'tube'},
        {'name': 'Impression Material', 'type': 'dental_supply', 'description': 'Material for taking dental impressions', 'unit': 'cartridge'},
        
        # Equipment
        {'name': 'Disposable Gloves', 'type': 'equipment', 'description': 'Latex-free examination gloves', 'unit': 'box'},
        {'name': 'Face Masks', 'type': 'equipment', 'description': 'Surgical face masks', 'unit': 'box'},
        {'name': 'Dental Bib', 'type': 'equipment', 'description': 'Patient protection bib', 'unit': 'pack'},
        {'name': 'Gauze Pads', 'type': 'equipment', 'description': 'Sterile gauze for wound care', 'unit': 'pack'},
        
        # Materials
        {'name': 'Dental Wax', 'type': 'material', 'description': 'Wax for dental procedures', 'unit': 'stick'},
        {'name': 'Polishing Paste', 'type': 'material', 'description': 'Abrasive paste for tooth polishing', 'unit': 'tube'},
        {'name': 'Etching Gel', 'type': 'material', 'description': 'Acid gel for tooth preparation', 'unit': 'syringe'},
        {'name': 'Bonding Agent', 'type': 'material', 'description': 'Adhesive for dental restorations', 'unit': 'bottle'},
    ]
    
    created_count = 0
    for item_data in medicines_data:
        medicine, created = DentalMedicineSupply.objects.get_or_create(
            name=item_data['name'],
            type=item_data['type'],
            defaults={
                'description': item_data['description'],
                'unit': item_data['unit'],
                'is_active': True
            }
        )
        if created:
            created_count += 1
            print(f"Created: {medicine.name} ({medicine.get_type_display()})")
        else:
            print(f"Already exists: {medicine.name}")
    
    print(f"\nSummary: {created_count} new dental medicines/supplies created.")
    print(f"Total dental medicines/supplies in database: {DentalMedicineSupply.objects.count()}")

if __name__ == '__main__':
    populate_dental_medicines()
