#!/usr/bin/env python
"""
Simple test script to check if the PDF generation works without Django models
"""
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from datetime import datetime

def test_generate_pdf():
    """Test PDF generation with mock data"""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                          rightMargin=60, leftMargin=60,
                          topMargin=30, bottomMargin=30)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Define custom styles
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
        fontSize=14,
        spaceAfter=8,
        spaceBefore=8,
        alignment=TA_CENTER,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        textColor=colors.black,
        leading=14
    )
    
    # Build the PDF content
    story = []
    
    # Header without logo for simplicity
    story.append(Paragraph("WESTERN MINDANAO STATE UNIVERSITY", header_style))
    story.append(Paragraph("ZAMBOANGA CITY", subheader_style))
    story.append(Paragraph("UNIVERSITY HEALTH SERVICES CENTER", department_style))
    
    # Add horizontal line
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.red))
    
    # Certificate title
    story.append(Paragraph("MEDICAL CERTIFICATE", cert_title_style))
    
    # Certificate content
    story.append(Paragraph("To Whom It May Concern:", body_style))
    
    patient_name = "John Doe"
    department = "Computer Science"
    
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
    
    # Date section
    now = datetime.now()
    day = now.day
    day_suffix = "st" if day == 1 else "nd" if day == 2 else "rd" if day == 3 else "th"
    month = now.strftime('%B')
    year = now.year
    
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        f"Given this {day}{day_suffix} day of {month}, {year} "
        "in the City of Zamboanga, Philippines.",
        body_style
    ))
    
    # Signature section
    story.append(Spacer(1, 16))
    
    staff_name = "FELICITAS ASUNCION C. ELAGO, M.D."
    staff_position = "MEDICAL OFFICER III"
    license_no = "0160267"
    ptr_no = "2795114"
    
    # Signature data
    signature_data = [
        ['', ''],  # Space for signature
        ['', '_______________________'],  # Signature line
        ['', staff_name],  # Staff name below the line
        ['', staff_position],
        ['', f'LICENSE NO. {license_no}'],
        ['', f'PTR NO. {ptr_no}']
    ]
    
    row_heights = [0.25*inch, 0.08*inch, 0.18*inch, 0.12*inch, 0.12*inch, 0.12*inch]
    
    signature_table = Table(signature_data, colWidths=[3.5*inch, 2*inch], rowHeights=row_heights)
    
    # Style the table
    table_style = [
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (1, 0), (1, -1), 'MIDDLE'),
        # Line style
        ('FONTSIZE', (1, 1), (1, 1), 10),
        ('FONTNAME', (1, 1), (1, 1), 'Helvetica'),
        # Staff name style (blue and bold)
        ('FONTSIZE', (1, 2), (1, 2), 9),
        ('FONTNAME', (1, 2), (1, 2), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.blue),
        # Details style
        ('FONTSIZE', (1, 3), (1, -1), 8),
        ('FONTNAME', (1, 3), (1, -1), 'Helvetica'),
    ]
    
    signature_table.setStyle(TableStyle(table_style))
    story.append(signature_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer

if __name__ == "__main__":
    try:
        print("Generating test PDF...")
        pdf_buffer = test_generate_pdf()
        
        # Save to file
        output_path = 'test_certificate_simple.pdf'
        with open(output_path, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"PDF generated successfully: {output_path}")
        print(f"PDF size: {len(pdf_buffer.getvalue())} bytes")
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
