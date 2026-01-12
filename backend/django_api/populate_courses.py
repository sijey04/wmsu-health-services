"""
Script to populate initial courses in the database
Run this after migrating the Course model
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import Course

def populate_courses():
    """Populate initial courses in the database"""
    
    courses_data = [
        {'name': 'BS Computer Science', 'code': 'BSCS', 'college': 'College of Science and Mathematics', 'department': 'Computer Science', 'is_active': True},
        {'name': 'BS Information Technology', 'code': 'BSIT', 'college': 'College of Science and Mathematics', 'department': 'Information Technology', 'is_active': True},
        {'name': 'BS Nursing', 'code': 'BSN', 'college': 'College of Nursing', 'department': 'Nursing', 'is_active': True},
        {'name': 'BS Business Administration', 'code': 'BSBA', 'college': 'College of Business Administration', 'department': 'Business', 'is_active': True},
        {'name': 'BS Education', 'code': 'BSED', 'college': 'College of Education', 'department': 'Education', 'is_active': True},
        {'name': 'BS Engineering', 'code': 'BSE', 'college': 'College of Engineering', 'department': 'Engineering', 'is_active': True},
        {'name': 'BS Psychology', 'code': 'BSPSY', 'college': 'College of Liberal Arts', 'department': 'Psychology', 'is_active': True},
        {'name': 'BA Communication', 'code': 'BACOMM', 'college': 'College of Liberal Arts', 'department': 'Communication', 'is_active': True},
        {'name': 'BS Biology', 'code': 'BSBIO', 'college': 'College of Science and Mathematics', 'department': 'Biology', 'is_active': True},
        {'name': 'BS Food Technology', 'code': 'BSFT', 'college': 'College of Home Economics', 'department': 'Food Technology', 'is_active': True},
    ]
    
    created_count = 0
    updated_count = 0
    
    for course_data in courses_data:
        course, created = Course.objects.get_or_create(
            code=course_data['code'],
            defaults=course_data
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {course.name} ({course.code})")
        else:
            # Update existing course
            course.name = course_data['name']
            course.college = course_data['college']
            course.department = course_data['department']
            course.is_active = course_data['is_active']
            course.save()
            updated_count += 1
            print(f"♻️  Updated: {course.name} ({course.code})")
    
    print(f"\n✅ Courses populated successfully!")
    print(f"   Created: {created_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Total: {Course.objects.count()}")

if __name__ == '__main__':
    print("🔄 Starting course population...")
    populate_courses()
