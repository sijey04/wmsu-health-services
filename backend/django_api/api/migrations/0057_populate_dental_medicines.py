# Generated migration to add sample dental medicines and supplies

from django.db import migrations

def populate_dental_medicines(apps, schema_editor):
    DentalMedicineSupply = apps.get_model('api', 'DentalMedicineSupply')
    
    sample_items = [
        # Anesthetics
        {'name': 'Lidocaine 2%', 'type': 'anesthetic', 'description': 'Local anesthetic for dental procedures', 'unit': 'ml'},
        {'name': 'Articaine 4%', 'type': 'anesthetic', 'description': 'Local anesthetic with epinephrine', 'unit': 'ml'},
        {'name': 'Benzocaine gel', 'type': 'anesthetic', 'description': 'Topical anesthetic gel', 'unit': 'g'},
        
        # Antibiotics
        {'name': 'Amoxicillin 500mg', 'type': 'antibiotic', 'description': 'Antibiotic for dental infections', 'unit': 'capsule'},
        {'name': 'Clindamycin 300mg', 'type': 'antibiotic', 'description': 'Alternative antibiotic for penicillin-allergic patients', 'unit': 'capsule'},
        {'name': 'Metronidazole 400mg', 'type': 'antibiotic', 'description': 'Antibiotic for anaerobic infections', 'unit': 'tablet'},
        
        # Pain medications
        {'name': 'Ibuprofen 400mg', 'type': 'medicine', 'description': 'Anti-inflammatory pain reliever', 'unit': 'tablet'},
        {'name': 'Paracetamol 500mg', 'type': 'medicine', 'description': 'Pain reliever and fever reducer', 'unit': 'tablet'},
        {'name': 'Mefenamic acid 250mg', 'type': 'medicine', 'description': 'NSAID for pain relief', 'unit': 'capsule'},
        
        # Dental supplies
        {'name': 'Composite resin', 'type': 'dental_supply', 'description': 'Tooth-colored filling material', 'unit': 'syringe'},
        {'name': 'Dental amalgam', 'type': 'dental_supply', 'description': 'Silver filling material', 'unit': 'capsule'},
        {'name': 'Fluoride varnish', 'type': 'dental_supply', 'description': 'Topical fluoride treatment', 'unit': 'ml'},
        {'name': 'Dental cement', 'type': 'dental_supply', 'description': 'Temporary filling material', 'unit': 'g'},
        
        # Materials
        {'name': 'Cotton rolls', 'type': 'material', 'description': 'Absorbent cotton for isolation', 'unit': 'pcs'},
        {'name': 'Gauze pads', 'type': 'material', 'description': 'Sterile gauze for bleeding control', 'unit': 'pcs'},
        {'name': 'Disposable gloves', 'type': 'material', 'description': 'Latex-free examination gloves', 'unit': 'pair'},
        {'name': 'Dental floss', 'type': 'material', 'description': 'Waxed dental floss', 'unit': 'pack'},
        
        # Equipment/Instruments
        {'name': 'Dental probe', 'type': 'equipment', 'description': 'Periodontal probe for examination', 'unit': 'pcs'},
        {'name': 'Dental mirror', 'type': 'equipment', 'description': 'Mouth mirror for examination', 'unit': 'pcs'},
        {'name': 'Dental scaler', 'type': 'equipment', 'description': 'Hand scaler for cleaning', 'unit': 'pcs'},
    ]
    
    for item_data in sample_items:
        # Check if item already exists to avoid duplicates
        if not DentalMedicineSupply.objects.filter(name=item_data['name'], type=item_data['type']).exists():
            DentalMedicineSupply.objects.create(**item_data)

def reverse_populate_dental_medicines(apps, schema_editor):
    DentalMedicineSupply = apps.get_model('api', 'DentalMedicineSupply')
    DentalMedicineSupply.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0056_dentalmedicinesupply'),  # Updated to use the model creation migration
    ]

    operations = [
        migrations.RunPython(populate_dental_medicines, reverse_populate_dental_medicines),
    ]
