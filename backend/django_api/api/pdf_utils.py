"""
PDF generation utilities for medical certificates
"""

import io
import os
import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.colors import black, red, blue
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.graphics.shapes import Drawing, Line
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from django.core.files.base import ContentFile
from django.utils import timezone


def generate_dental_form_pdf(dental_form_data):
    """
    Generate a dental examination form PDF for the given dental form data.
    Returns a BytesIO buffer containing the PDF data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                          rightMargin=36, leftMargin=36,
                          topMargin=36, bottomMargin=36)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Define custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        spaceAfter=3,
        alignment=TA_CENTER,
        textColor=red,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=2,
        alignment=TA_CENTER,
        textColor=black,
        fontName='Helvetica'
    )
    
    form_title_style = ParagraphStyle(
        'FormTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=8,
        spaceBefore=8,
        alignment=TA_CENTER,
        textColor=black,
        fontName='Helvetica-Bold'
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=11,
        spaceAfter=4,
        spaceBefore=6,
        alignment=TA_LEFT,
        textColor=black,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=3,
        alignment=TA_LEFT,
        textColor=black,
        leading=10,
        fontName='Helvetica'
    )
    
    # Build the PDF content
    story = []
    
    # Header with line
    story.append(Paragraph("WESTERN MINDANAO STATE UNIVERSITY", title_style))
    story.append(Paragraph("ZAMBOANGA CITY", subtitle_style))
    story.append(Paragraph("<b>UNIVERSITY HEALTH SERVICES CENTER</b>", subtitle_style))
    
    # Add a line separator
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=black, spaceBefore=3, spaceAfter=3))
    
    story.append(Paragraph("DENTAL EXAMINATION FORM", form_title_style))
    
    # Create a comprehensive table layout for better space utilization
    # Patient Information and Assessment in one section
    combined_data = [
        # Header row
        [Paragraph('<b>PATIENT INFORMATION</b>', section_style), '', 
         Paragraph('<b>DENTAL ASSESSMENT</b>', section_style), ''],
        
        # Data rows
        ['File No:', dental_form_data.file_no or 'N/A',
         'Dentition:', dental_form_data.dentition or 'N/A'],
        
        ['Name:', f"{dental_form_data.surname or ''}, {dental_form_data.first_name or ''} {dental_form_data.middle_name or ''}".strip(),
         'Periodontal:', dental_form_data.periodontal or 'N/A'],
        
        ['Age:', str(dental_form_data.age) if dental_form_data.age else 'N/A',
         'Occlusion:', dental_form_data.occlusion or 'N/A'],
        
        ['Sex:', dental_form_data.sex or 'N/A',
         'Malocclusion Severity:', dental_form_data.malocclusion_severity or 'N/A'],
        
        ['Has Toothbrush:', dental_form_data.has_toothbrush or 'N/A',
         'Date of Examination:', dental_form_data.date.strftime('%B %d, %Y') if dental_form_data.date else 'N/A'],
    ]
    
    combined_table = Table(combined_data, colWidths=[1.2*inch, 2.3*inch, 1.2*inch, 2.3*inch])
    combined_table.setStyle(TableStyle([
        # Header styling
        ('SPAN', (0, 0), (1, 0)),  # Span patient info header
        ('SPAN', (2, 0), (3, 0)),  # Span assessment header
        ('BACKGROUND', (0, 0), (3, 0), '#f0f0f0'),
        ('ALIGN', (0, 0), (3, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (3, 0), 10),
        
        # Data styling
        ('ALIGN', (0, 1), (3, -1), 'LEFT'),
        ('VALIGN', (0, 0), (3, -1), 'TOP'),
        ('FONTSIZE', (0, 1), (3, -1), 9),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),  # Left column labels
        ('FONTNAME', (2, 1), (2, -1), 'Helvetica-Bold'),  # Right column labels
        ('BOTTOMPADDING', (0, 0), (3, -1), 3),
        ('TOPPADDING', (0, 0), (3, -1), 3),
        ('GRID', (0, 0), (3, -1), 0.5, black),
    ]))
    
    story.append(combined_table)
    story.append(Spacer(1, 8))
    
    # Dental Findings Section - Comprehensive layout
    story.append(Paragraph("<b>DENTAL FINDINGS</b>", section_style))
    
    findings_data = [
        ['Decayed Teeth:', dental_form_data.decayed_teeth or 'None',
         'Missing Teeth:', dental_form_data.missing_teeth or 'None'],
        ['Filled Teeth:', dental_form_data.filled_teeth or 'None',
         'Oral Hygiene:', dental_form_data.oral_hygiene or 'N/A'],
    ]
    
    findings_table = Table(findings_data, colWidths=[1.2*inch, 2.3*inch, 1.2*inch, 2.3*inch])
    findings_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (3, -1), 'LEFT'),
        ('VALIGN', (0, 0), (3, -1), 'TOP'),
        ('FONTSIZE', (0, 0), (3, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (3, -1), 3),
        ('TOPPADDING', (0, 0), (3, -1), 3),
        ('GRID', (0, 0), (3, -1), 0.5, black),
    ]))
    
    story.append(findings_table)
    story.append(Spacer(1, 8))
    
    # Teeth Status Section - User-friendly display
    if dental_form_data.permanent_teeth_status or dental_form_data.temporary_teeth_status:
        story.append(Paragraph("<b>TEETH STATUS</b>", section_style))
        
        # Process permanent teeth status
        if dental_form_data.permanent_teeth_status:
            permanent_data = []
            permanent_data.append([Paragraph('<b>Permanent Teeth:</b>', body_style), '', '', ''])
            
            # Convert JSON data to readable format
            try:
                import json
                if isinstance(dental_form_data.permanent_teeth_status, str):
                    permanent_teeth = json.loads(dental_form_data.permanent_teeth_status)
                else:
                    permanent_teeth = dental_form_data.permanent_teeth_status
                
                # Create rows for each tooth with data
                for tooth_num, tooth_data in permanent_teeth.items():
                    if tooth_data and (tooth_data.get('treatment') or tooth_data.get('status')):
                        treatment = tooth_data.get('treatment', 'N/A')
                        status = tooth_data.get('status', 'N/A')
                        permanent_data.append([
                            f'Tooth {tooth_num}:',
                            f'Treatment: {treatment}',
                            f'Status: {status}',
                            ''
                        ])
            except (json.JSONDecodeError, TypeError, AttributeError):
                permanent_data.append(['Invalid teeth status data', '', '', ''])
            
            if len(permanent_data) > 1:  # More than just the header
                permanent_table = Table(permanent_data, colWidths=[1.5*inch, 2.5*inch, 2*inch, 1*inch])
                permanent_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (3, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (3, -1), 'TOP'),
                    ('FONTSIZE', (0, 0), (3, -1), 8),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (3, -1), 2),
                    ('TOPPADDING', (0, 0), (3, -1), 2),
                    ('GRID', (0, 0), (3, -1), 0.5, black),
                ]))
                story.append(permanent_table)
        
        # Process temporary teeth status
        if dental_form_data.temporary_teeth_status:
            temporary_data = []
            temporary_data.append([Paragraph('<b>Temporary Teeth:</b>', body_style), '', '', ''])
            
            # Convert JSON data to readable format
            try:
                import json
                if isinstance(dental_form_data.temporary_teeth_status, str):
                    temporary_teeth = json.loads(dental_form_data.temporary_teeth_status)
                else:
                    temporary_teeth = dental_form_data.temporary_teeth_status
                
                # Create rows for each tooth with data
                for tooth_num, tooth_data in temporary_teeth.items():
                    if tooth_data and (tooth_data.get('treatment') or tooth_data.get('status')):
                        treatment = tooth_data.get('treatment', 'N/A')
                        status = tooth_data.get('status', 'N/A')
                        temporary_data.append([
                            f'Tooth {tooth_num}:',
                            f'Treatment: {treatment}',
                            f'Status: {status}',
                            ''
                        ])
            except (json.JSONDecodeError, TypeError, AttributeError):
                temporary_data.append(['Invalid teeth status data', '', '', ''])
            
            if len(temporary_data) > 1:  # More than just the header
                temporary_table = Table(temporary_data, colWidths=[1.5*inch, 2.5*inch, 2*inch, 1*inch])
                temporary_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (3, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (3, -1), 'TOP'),
                    ('FONTSIZE', (0, 0), (3, -1), 8),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (3, -1), 2),
                    ('TOPPADDING', (0, 0), (3, -1), 2),
                    ('GRID', (0, 0), (3, -1), 0.5, black),
                ]))
                story.append(temporary_table)
        
        story.append(Spacer(1, 8))
    
    # Medicine Used Section - User-friendly display
    if hasattr(dental_form_data, 'used_medicines') and dental_form_data.used_medicines:
        story.append(Paragraph("<b>MEDICINE USED</b>", section_style))
        
        # Handle JSON field for medicine usage
        try:
            import json
            if isinstance(dental_form_data.used_medicines, str):
                medicines_data = json.loads(dental_form_data.used_medicines)
            else:
                medicines_data = dental_form_data.used_medicines
            
            if isinstance(medicines_data, list) and len(medicines_data) > 0:
                medicine_table_data = []
                medicine_table_data.append(['Medicine Name', 'Quantity', 'Unit', 'Notes'])
                
                for medicine in medicines_data:
                    if isinstance(medicine, dict):
                        name = medicine.get('name', 'N/A')
                        quantity = str(medicine.get('quantity', medicine.get('quantity_used', 'N/A')))
                        unit = medicine.get('unit', 'N/A')
                        notes = medicine.get('notes', 'N/A')
                        medicine_table_data.append([name, quantity, unit, notes])
                
                medicine_table = Table(medicine_table_data, colWidths=[2.5*inch, 1*inch, 1*inch, 2.5*inch])
                medicine_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (3, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (3, -1), 'TOP'),
                    ('FONTSIZE', (0, 0), (3, -1), 9),
                    ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),  # Header row
                    ('BACKGROUND', (0, 0), (3, 0), '#f0f0f0'),
                    ('BOTTOMPADDING', (0, 0), (3, -1), 3),
                    ('TOPPADDING', (0, 0), (3, -1), 3),
                    ('GRID', (0, 0), (3, -1), 0.5, black),
                ]))
                story.append(medicine_table)
            else:
                # No medicines or invalid format
                no_medicine_table = Table([['No medicines used during this appointment']], colWidths=[7*inch])
                no_medicine_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                    ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
                    ('FONTSIZE', (0, 0), (0, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (0, 0), 3),
                    ('TOPPADDING', (0, 0), (0, 0), 3),
                    ('GRID', (0, 0), (0, 0), 0.5, black),
                ]))
                story.append(no_medicine_table)
                
        except (json.JSONDecodeError, TypeError, AttributeError):
            # Handle invalid JSON data
            error_table = Table([['Invalid medicine usage data']], colWidths=[7*inch])
            error_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
                ('FONTSIZE', (0, 0), (0, 0), 9),
                ('BOTTOMPADDING', (0, 0), (0, 0), 3),
                ('TOPPADDING', (0, 0), (0, 0), 3),
                ('GRID', (0, 0), (0, 0), 0.5, black),
            ]))
            story.append(error_table)
        
        story.append(Spacer(1, 8))
    
    # Treatment and Recommendations Section - Compact
    story.append(Paragraph("<b>TREATMENT AND RECOMMENDATIONS</b>", section_style))
    
    # Create a 2-column layout for treatments
    treatment_data = [
        [Paragraph('<b>Recommended Treatments:</b>', body_style),
         Paragraph('<b>Prevention Advice:</b>', body_style)],
        [Paragraph(dental_form_data.recommended_treatments or 'None specified', body_style),
         Paragraph(dental_form_data.prevention_advice or 'None specified', body_style)],
        [Paragraph('<b>Treatment Priority:</b>', body_style),
         Paragraph('<b>Next Appointment:</b>', body_style)],
        [Paragraph(dental_form_data.treatment_priority or 'None specified', body_style),
         Paragraph(dental_form_data.next_appointment or 'None scheduled', body_style)],
    ]
    
    treatment_table = Table(treatment_data, colWidths=[3.5*inch, 3.5*inch])
    treatment_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (1, -1), 3),
        ('TOPPADDING', (0, 0), (1, -1), 3),
        ('GRID', (0, 0), (1, -1), 0.5, black),
    ]))
    
    story.append(treatment_table)
    story.append(Spacer(1, 6))
    
    # Additional Remarks Section - only if there are remarks
    if dental_form_data.remarks:
        story.append(Paragraph("<b>ADDITIONAL REMARKS</b>", section_style))
        remarks_table = Table([[Paragraph(dental_form_data.remarks, body_style)]], colWidths=[7*inch])
        remarks_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('VALIGN', (0, 0), (0, 0), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (0, 0), 3),
            ('TOPPADDING', (0, 0), (0, 0), 3),
            ('GRID', (0, 0), (0, 0), 0.5, black),
        ]))
        story.append(remarks_table)
        story.append(Spacer(1, 6))
    
    # Examiner Information Section - Comprehensive Footer style
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=black))
    
    # Create comprehensive examiner information table
    examiner_data = [
        ['Examined By:', dental_form_data.examined_by or 'N/A',
         'Date:', dental_form_data.date.strftime('%B %d, %Y') if dental_form_data.date else 'N/A'],
    ]
    
    # Add additional examiner details if available
    if dental_form_data.examiner_position:
        examiner_data.append(['Position:', dental_form_data.examiner_position, '', ''])
    
    if dental_form_data.examiner_license:
        examiner_data.append(['License No.:', dental_form_data.examiner_license, '', ''])
    
    if dental_form_data.examiner_ptr:
        examiner_data.append(['PTR No.:', dental_form_data.examiner_ptr, '', ''])
    
    if dental_form_data.examiner_phone:
        examiner_data.append(['Contact:', dental_form_data.examiner_phone, '', ''])
    
    examiner_table = Table(examiner_data, colWidths=[1.2*inch, 2.8*inch, 1*inch, 2*inch])
    examiner_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (3, -1), 'LEFT'),
        ('VALIGN', (0, 0), (3, -1), 'TOP'),
        ('FONTSIZE', (0, 0), (3, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (3, -1), 3),
        ('TOPPADDING', (0, 0), (3, -1), 3),
    ]))
    
    story.append(examiner_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_medical_certificate_pdf(medical_document):
    """
    Generate a medical certificate PDF for the given medical document.
    Returns a BytesIO buffer containing the PDF data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                          rightMargin=72, leftMargin=72,
                          topMargin=50, bottomMargin=50)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Define custom styles to match the viewer exactly
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=2,
        spaceBefore=0,
        alignment=TA_CENTER,
        textColor=colors.red,
        fontName='Helvetica-Bold'
    )
    
    subheader_style = ParagraphStyle(
        'SubHeaderStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=2,
        spaceBefore=0,
        alignment=TA_CENTER,
        textColor=colors.black
    )
    
    department_style = ParagraphStyle(
        'DepartmentStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=4,
        spaceBefore=0,
        alignment=TA_CENTER,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    cert_title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=20,
        spaceBefore=16,
        alignment=TA_CENTER,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        textColor=colors.black,
        leading=18,
        leftIndent=0,
        rightIndent=0
    )
    
    signature_name_style = ParagraphStyle(
        'SignatureName',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.blue,
        fontName='Helvetica-Bold'
    )
    
    signature_details_style = ParagraphStyle(
        'SignatureDetails',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.black
    )
    
    # Special style for "To Whom It May Concern"
    opening_style = ParagraphStyle(
        'OpeningStyle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=16,
        alignment=TA_LEFT,
        textColor=colors.black,
        leading=18,
        fontName='Helvetica'
    )
    
    # Build the PDF content
    story = []
    
    # Header section with logo - matching the viewer layout exactly
    from reportlab.platypus import Image
    from reportlab.lib.utils import ImageReader
    from django.conf import settings
    
    # Try to find the logo file
    logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')
    
    if os.path.exists(logo_path):
        # Header with logo (side by side layout like in the image)
        logo_cell = Image(logo_path, width=1*inch, height=1*inch)
        
        # Create text cells in a nested table for better alignment
        text_cells = [
            [Paragraph("WESTERN MINDANAO STATE UNIVERSITY", header_style)],
            [Paragraph("ZAMBOANGA CITY", subheader_style)],
            [Paragraph("UNIVERSITY HEALTH SERVICES CENTER", department_style)]
        ]
        text_table = Table(text_cells, colWidths=[4.5*inch])
        text_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        header_table = Table(
            [[logo_cell, text_table]],
            colWidths=[1.2*inch, 4.5*inch],
            rowHeights=[1*inch]
        )
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'LEFT'),
            ('VALIGN', (1, 0), (1, 0), 'MIDDLE'),
        ]))
        story.append(header_table)
    else:
        # Header without logo (fallback)
        story.append(Paragraph("WESTERN MINDANAO STATE UNIVERSITY", header_style))
        story.append(Paragraph("ZAMBOANGA CITY", subheader_style))
        story.append(Paragraph("UNIVERSITY HEALTH SERVICES CENTER", department_style))
    
    # Add horizontal line (like in the viewer)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.red))
    
    # Certificate title
    story.append(Paragraph("MEDICAL CERTIFICATE", cert_title_style))
    
    # Certificate content - exactly matching the viewer
    story.append(Paragraph("To Whom It May Concern:", opening_style))
    
    patient_name = medical_document.patient.name
    department = medical_document.patient.department or 'student'
    
    # Format patient name with underline but without <b> tags
    story.append(Paragraph(
        f"This is to certify that <u>{patient_name}</u>, "
        f"a {department} student, has been officially examined by the "
        "University Health Services Center and was deemed physically fit for college activities.",
        body_style
    ))
    
    story.append(Paragraph(
        "The examinee is advised to observe the general precautions of healthy lifestyle and medicine. "
        "Medical instructions, if any, are to be followed explicitly as prescribed for controlled illnesses "
        "not any unmonitored medications. Hence, there are no contraindications for school-related activities.",
        body_style
    ))
    
    story.append(Paragraph(
        f"This certification is issued upon request of <u>{patient_name}</u> "
        "for whatever purpose it may serve him/her best.",
        body_style
    ))
    
    # Date section - matching the viewer format
    issued_date = medical_document.certificate_issued_at or timezone.now()
    day = issued_date.day
    day_suffix = "st" if day == 1 else "nd" if day == 2 else "rd" if day == 3 else "th"
    month = issued_date.strftime('%B')
    year = issued_date.year
    
    story.append(Spacer(1, 24))
    story.append(Paragraph(
        f"Given this {day}{day_suffix} day of {month}, {year} "
        "in the City of Zamboanga, Philippines.",
        body_style
    ))
    
    # Signature section - matching the viewer with signature directly above the line
    story.append(Spacer(1, 32))
    
    # Get staff details
    staff_name = "FELICITAS ASUNCION C. ELAGO, M.D."
    staff_position = "MEDICAL OFFICER III"
    license_no = "0160267"
    ptr_no = "2795114"
    
    # Try to get staff details from the user issuing the certificate
    staff_user = None
    if hasattr(medical_document, '_issuing_user'):
        staff_user = medical_document._issuing_user
    elif medical_document.reviewed_by:
        staff_user = medical_document.reviewed_by
    
    if staff_user:
        try:
            from .models import StaffDetails
            staff_details = StaffDetails.objects.filter(user=staff_user).first()
            if staff_details:
                staff_name = staff_details.full_name
                staff_position = staff_details.position
                license_no = staff_details.license_number or license_no
                ptr_no = staff_details.ptr_number or ptr_no
        except:
            pass
    
    # Try to load signature image if available
    signature_image = None
    if staff_user:
        try:
            from .models import StaffDetails
            staff_details = StaffDetails.objects.filter(user=staff_user).first()
            if staff_details and staff_details.signature:
                # Try to create signature image
                try:
                    signature_image = Image(staff_details.signature.path, width=1.5*inch, height=0.6*inch)
                except:
                    signature_image = None
        except:
            pass
    
    # Build signature section - exactly like the viewer
    signature_data = []
    
    if signature_image:
        # Signature image directly above the line (no spacing)
        signature_data.extend([
            ['', signature_image],  # Signature image
            ['', '_______________________'],  # Line immediately below
        ])
    else:
        # Space for handwritten signature, then line
        signature_data.extend([
            ['', ''],  # Space for signature
            ['', '_______________________'],  # Signature line
        ])
    
    # Add staff details below the line
    signature_data.extend([
        ['', staff_name],  # Staff name below the line
        ['', ''],  # Small spacing after name
        ['', staff_position],
        ['', f'LICENSE NO. {license_no}'],
        ['', f'PTR NO. {ptr_no}']
    ])
    
    # Compact row heights to fit on one page with professional spacing
    if signature_image:
        row_heights = [0.6*inch, 0.1*inch, 0.2*inch, 0.1*inch, 0.16*inch, 0.14*inch, 0.14*inch]
    else:
        row_heights = [0.3*inch, 0.1*inch, 0.2*inch, 0.1*inch, 0.16*inch, 0.14*inch, 0.14*inch]
    
    signature_table = Table(signature_data, colWidths=[3*inch, 2.5*inch], rowHeights=row_heights)
    
    # Style the table
    table_style = [
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (1, 0), (1, -1), 'MIDDLE'),
        # Line style
        ('FONTSIZE', (1, 1), (1, 1), 12),
        ('FONTNAME', (1, 1), (1, 1), 'Helvetica'),
        # Staff name style (blue and bold, like in viewer)
        ('FONTSIZE', (1, 2), (1, 2), 10),
        ('FONTNAME', (1, 2), (1, 2), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.blue),
        # Empty spacing row (row 3)
        # Position and details style (starting from row 4)
        ('FONTSIZE', (1, 4), (1, -1), 9),
        ('FONTNAME', (1, 4), (1, -1), 'Helvetica'),
    ]
    
    signature_table.setStyle(TableStyle(table_style))
    story.append(signature_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def save_medical_certificate_pdf(medical_document, save_to_model=True):
    """
    Generate and optionally save the medical certificate PDF to the model.
    Returns the PDF buffer.
    """
    pdf_buffer = generate_medical_certificate_pdf(medical_document)
    
    if save_to_model:
        # Save the PDF to the medical_certificate field
        filename = f"medical_certificate_{medical_document.patient.name.replace(' ', '_')}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        medical_document.medical_certificate.save(
            filename,
            ContentFile(pdf_buffer.getvalue()),
            save=True
        )
    
    return pdf_buffer


def generate_medical_form_pdf(medical_form_data):
    """
    Generate a medical examination form PDF for the given medical form data.
    Returns a BytesIO buffer containing the PDF data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                          rightMargin=36, leftMargin=36,
                          topMargin=36, bottomMargin=36)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Define custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        spaceAfter=3,
        alignment=TA_CENTER,
        textColor=red,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=2,
        alignment=TA_CENTER,
        textColor=black,
        fontName='Helvetica'
    )
    
    form_title_style = ParagraphStyle(
        'FormTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=8,
        spaceBefore=8,
        alignment=TA_CENTER,
        textColor=black,
        fontName='Helvetica-Bold'
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=11,
        spaceAfter=4,
        spaceBefore=6,
        alignment=TA_LEFT,
        textColor=black,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=3,
        alignment=TA_LEFT,
        textColor=black,
        leading=10,
        fontName='Helvetica'
    )
    
    # Build the PDF content
    story = []
    
    # Header with line
    story.append(Paragraph("WESTERN MINDANAO STATE UNIVERSITY", title_style))
    story.append(Paragraph("ZAMBOANGA CITY", subtitle_style))
    story.append(Paragraph("<b>UNIVERSITY HEALTH SERVICES CENTER</b>", subtitle_style))
    
    # Add a line separator
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=black, spaceBefore=3, spaceAfter=3))
    
    story.append(Paragraph("MEDICAL EXAMINATION FORM", form_title_style))
    
    # Patient Information and Vital Signs combined
    combined_data = [
        # Header row
        [Paragraph('<b>PATIENT INFORMATION</b>', section_style), '', 
         Paragraph('<b>VITAL SIGNS</b>', section_style), ''],
        
        # Data rows
        ['File No:', medical_form_data.file_no or 'N/A',
         'Blood Pressure:', medical_form_data.blood_pressure or 'N/A'],
        
        ['Name:', f"{medical_form_data.surname or ''}, {medical_form_data.first_name or ''} {medical_form_data.middle_name or ''}".strip(),
         'Pulse Rate:', medical_form_data.pulse_rate or 'N/A'],
        
        ['Age:', str(medical_form_data.age) if medical_form_data.age else 'N/A',
         'Temperature:', medical_form_data.temperature or 'N/A'],
        
        ['Sex:', medical_form_data.sex or 'N/A',
         'Respiratory Rate:', medical_form_data.respiratory_rate or 'N/A'],
        
        ['Date of Examination:', medical_form_data.date.strftime('%B %d, %Y') if medical_form_data.date else 'N/A',
         'Weight/Height:', f"{medical_form_data.weight or 'N/A'} / {medical_form_data.height or 'N/A'}"],
    ]
    
    combined_table = Table(combined_data, colWidths=[1.2*inch, 2.3*inch, 1.2*inch, 2.3*inch])
    combined_table.setStyle(TableStyle([
        # Header styling
        ('SPAN', (0, 0), (1, 0)),  # Span patient info header
        ('SPAN', (2, 0), (3, 0)),  # Span vital signs header
        ('BACKGROUND', (0, 0), (3, 0), '#f0f0f0'),
        ('ALIGN', (0, 0), (3, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (3, 0), 10),
        
        # Data styling
        ('ALIGN', (0, 1), (3, -1), 'LEFT'),
        ('VALIGN', (0, 0), (3, -1), 'TOP'),
        ('FONTSIZE', (0, 1), (3, -1), 9),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),  # Left column labels
        ('FONTNAME', (2, 1), (2, -1), 'Helvetica-Bold'),  # Right column labels
        ('BOTTOMPADDING', (0, 0), (3, -1), 3),
        ('TOPPADDING', (0, 0), (3, -1), 3),
        ('GRID', (0, 0), (3, -1), 0.5, black),
    ]))
    
    story.append(combined_table)
    story.append(Spacer(1, 6))
    
    # Medical History Section - Compact layout
    story.append(Paragraph("<b>MEDICAL HISTORY</b>", section_style))
    
    history_data = [
        [Paragraph('<b>Chief Complaint:</b>', body_style),
         Paragraph('<b>Present Illness:</b>', body_style)],
        [Paragraph(medical_form_data.chief_complaint or 'None specified', body_style),
         Paragraph(medical_form_data.present_illness or 'None specified', body_style)],
        [Paragraph('<b>Past Medical History:</b>', body_style),
         Paragraph('<b>Family History:</b>', body_style)],
        [Paragraph(medical_form_data.past_medical_history or 'None specified', body_style),
         Paragraph(medical_form_data.family_history or 'None specified', body_style)],
        [Paragraph('<b>Allergies:</b>', body_style),
         Paragraph('<b>Current Medications:</b>', body_style)],
        [Paragraph(medical_form_data.allergies or 'None specified', body_style),
         Paragraph(medical_form_data.medications or 'None specified', body_style)],
    ]
    
    history_table = Table(history_data, colWidths=[3.5*inch, 3.5*inch])
    history_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (1, -1), 3),
        ('TOPPADDING', (0, 0), (1, -1), 3),
        ('GRID', (0, 0), (1, -1), 0.5, black),
    ]))
    
    story.append(history_table)
    story.append(Spacer(1, 6))
    
    # Physical Examination Section - only show filled fields
    story.append(Paragraph("<b>PHYSICAL EXAMINATION</b>", section_style))
    
    exam_fields = [
        ('General Appearance', medical_form_data.general_appearance),
        ('HEENT', medical_form_data.heent),
        ('Cardiovascular', medical_form_data.cardiovascular),
        ('Respiratory', medical_form_data.respiratory),
        ('Gastrointestinal', medical_form_data.gastrointestinal),
        ('Genitourinary', medical_form_data.genitourinary),
        ('Neurological', medical_form_data.neurological),
        ('Musculoskeletal', medical_form_data.musculoskeletal),
        ('Integumentary', medical_form_data.integumentary),
    ]
    
    # Filter out empty fields
    filled_fields = [(name, value) for name, value in exam_fields if value]
    
    if filled_fields:
        # Create pairs for 2-column layout
        exam_data = []
        for i in range(0, len(filled_fields), 2):
            left = filled_fields[i]
            right = filled_fields[i + 1] if i + 1 < len(filled_fields) else ('', '')
            
            exam_data.append([
                Paragraph(f'<b>{left[0]}:</b>', body_style),
                Paragraph(f'<b>{right[0]}:</b>', body_style) if right[0] else ''
            ])
            exam_data.append([
                Paragraph(left[1], body_style),
                Paragraph(right[1], body_style) if right[1] else ''
            ])
        
        exam_table = Table(exam_data, colWidths=[3.5*inch, 3.5*inch])
        exam_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (1, -1), 3),
            ('TOPPADDING', (0, 0), (1, -1), 3),
            ('GRID', (0, 0), (1, -1), 0.5, black),
        ]))
        
        story.append(exam_table)
        story.append(Spacer(1, 6))
    
    # Assessment and Plan Section
    story.append(Paragraph("<b>ASSESSMENT AND PLAN</b>", section_style))
    
    assessment_data = [
        [Paragraph('<b>Diagnosis:</b>', body_style),
         Paragraph('<b>Treatment Plan:</b>', body_style)],
        [Paragraph(medical_form_data.diagnosis or 'None specified', body_style),
         Paragraph(medical_form_data.treatment_plan or 'None specified', body_style)],
        [Paragraph('<b>Recommendations:</b>', body_style),
         Paragraph('<b>Follow-up:</b>', body_style)],
        [Paragraph(medical_form_data.recommendations or 'None specified', body_style),
         Paragraph(medical_form_data.follow_up or 'None scheduled', body_style)],
    ]
    
    assessment_table = Table(assessment_data, colWidths=[3.5*inch, 3.5*inch])
    assessment_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (1, -1), 3),
        ('TOPPADDING', (0, 0), (1, -1), 3),
        ('GRID', (0, 0), (1, -1), 0.5, black),
    ]))
    
    story.append(assessment_table)
    story.append(Spacer(1, 6))
    
    # Examiner Information Section - Footer style
    story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=black))
    
    examiner_data = [
        ['Examined By:', medical_form_data.examined_by or 'N/A',
         'License Number:', medical_form_data.examiner_license or 'N/A',
         'Date:', medical_form_data.date.strftime('%B %d, %Y') if medical_form_data.date else 'N/A'],
    ]
    
    examiner_table = Table(examiner_data, colWidths=[1*inch, 2*inch, 1.2*inch, 1.8*inch, 1*inch])
    examiner_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (4, -1), 'LEFT'),
        ('VALIGN', (0, 0), (4, -1), 'TOP'),
        ('FONTSIZE', (0, 0), (4, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (4, 0), (4, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (4, -1), 3),
        ('TOPPADDING', (0, 0), (4, -1), 3),
    ]))
    
    story.append(examiner_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
