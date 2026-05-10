import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Shared helper to load an image into a data URL for jsPDF
 * Prevents redundant definitions and handles SSR/Browser environments safely
 */
const loadLogo = (src: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    // Only use anonymous for external domains to avoid CORS issues on same-origin
    if (src.startsWith('http') && !src.includes(window.location.host)) {
      img.crossOrigin = 'anonymous';
    }
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn(`Failed to process logo: ${src}`, e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn(`Failed to load logo: ${src}`);
      resolve(null);
    };
    // 5 second timeout for production reliability
    setTimeout(() => resolve(null), 5000);
  });
};

// Types for our report data - Updated to integrate with UserTypeInformation system
interface StatsData {
  medical: { total: number; completed: number; pending: number; rejected: number };
  dental: { total: number; completed: number; pending: number; rejected: number };
  documents: { total: number; issued: number; pending: number }; // Removed rejected to match existing interface
  patients: { total: number; verified: number; pending?: number; unverified?: number };
  monthly_trends?: Array<{
    month: string;
    medical?: number;
    dental?: number;
    documents?: number;
  }>;
  semester?: { id: number | null; name: string };
  user_type_breakdown?: any;
  clinicians?: Array<{
    id: number;
    name: string;
    medical_count?: number;
    dental_count?: number;
    document_count?: number;
    consultations: number;
  }>;
  medicine_usage?: Array<{
    name: string;
    quantity: number;
    unit: string;
    type: string;
  }>;
  medical_med_total_entries?: number;
  user_type_configurations?: Array<{
    id: number;
    name: string;
    enabled: boolean;
    description?: string;
    required_fields: string[];
    available_courses: string[];
    available_departments: string[];
    available_strands: string[];
    year_levels: string[];
    position_types: string[];
    created_at: string;
    updated_at: string;
  }>;
}

interface UserTypeData {
  userType: string;
  totalTransactions: number;
  completedTransactions: number;
  completionRate: number;
  medical: { total: number; completed: number; pending?: number; rejected?: number };
  dental: { total: number; completed: number; pending?: number; rejected?: number };
  documents: { total: number; completed: number; issued?: number; pending?: number; rejected?: number };
  // Enhanced with configuration data
  configuration?: {
    enabled: boolean;
    description?: string;
    required_fields: string[];
    available_options: {
      courses: string[];
      departments: string[];
      strands: string[];
      year_levels: string[];
      position_types: string[];
    };
  };
}

// Generate professional PDF report with charts and detailed demographics
/**
 * Generates a clean, minimalist PDF for a single medical or dental consultation form
 */
export const generateSingleFormPDF = async (
  formData: any,
  appointmentType: 'medical' | 'dental',
  patientName: string,
  teethChartImage?: string
): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const [wmsuLogo, healthLogo] = await Promise.all([
      loadLogo('/WMSU-Logo.jpg'),
      loadLogo('/WMSU-HealthLogo.png')
    ]);

    if (wmsuLogo) doc.addImage(wmsuLogo, 'PNG', 15, 12, 22, 22);
    if (healthLogo) doc.addImage(healthLogo, 'PNG', 173, 12, 22, 22);

    // University Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('WESTERN MINDANAO STATE UNIVERSITY', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('UNIVERSITY HEALTH SERVICES CENTER', pageWidth / 2, 26, { align: 'center' });
    doc.text('Zamboanga City, Philippines', pageWidth / 2, 31, { align: 'center' });

    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(1);
    doc.line(20, 36, 190, 36);

    // Report Title
    doc.setFillColor(139, 0, 0);
    doc.rect(20, 40, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${appointmentType.toUpperCase()} EXAMINATION RECORD`, pageWidth / 2, 46.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Patient Info
    autoTable(doc, {
      startY: 58,
      margin: { left: 20, right: 20 },
      head: [['PATIENT INFORMATION', '']],
      body: [
        ['Full Name', `${formData.first_name || ''} ${formData.middle_name || ''} ${formData.surname || ''}`.trim() || patientName],
        ['File Number', formData.file_no || 'N/A'],
        ['Age / Sex', `${formData.age || 'N/A'} / ${formData.sex || 'N/A'}`],
        ['Examination Date', formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 100;
    currentY += 6;

    // Clinical Details - SHOW ALL FIELDS
    const detailsBody: any[] = [];
    if (appointmentType === 'medical') {
      // Patient details
      if (formData.department) detailsBody.push(['Department', formData.department]);
      if (formData.contact) detailsBody.push(['Contact Number', formData.contact]);

      // Vital Signs
      detailsBody.push(['Blood Pressure', formData.blood_pressure || 'N/A']);
      detailsBody.push(['Temperature', formData.temperature ? `${formData.temperature}°C` : 'N/A']);
      detailsBody.push(['Pulse Rate', formData.pulse_rate || 'N/A']);
      detailsBody.push(['Respiratory Rate', formData.respiratory_rate || 'N/A']);
      detailsBody.push(['Weight / Height', `${formData.weight || 'N/A'}kg / ${formData.height || 'N/A'}cm`]);
      // BMI calculation
      const w = parseFloat(formData.weight || '');
      const h = parseFloat(formData.height || '') / 100;
      if (w > 0 && h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        let category = 'Obese';
        if (parseFloat(bmi) < 18.5) category = 'Underweight';
        else if (parseFloat(bmi) < 25) category = 'Normal';
        else if (parseFloat(bmi) < 30) category = 'Overweight';
        detailsBody.push(['BMI', `${bmi} (${category})`]);
      }

      // Chief Complaint & History
      detailsBody.push(['Chief Complaint', formData.chief_complaint || 'N/A']);
      detailsBody.push(['History of Present Illness', formData.present_illness || 'N/A']);

      // Past Medical History
      detailsBody.push(['Past Medical History', formData.past_medical_history || 'N/A']);
      if (formData.surgical_history) detailsBody.push(['Surgical History', formData.surgical_history]);
      detailsBody.push(['Family History', formData.family_history || 'N/A']);
      detailsBody.push(['Allergies', formData.allergies || 'N/A']);
      detailsBody.push(['Medications', formData.medications || 'N/A']);

      // Social History
      if (formData.smoking || formData.alcohol || formData.drugs) {
        detailsBody.push(['Smoking', formData.smoking || 'N/A']);
        detailsBody.push(['Alcohol', formData.alcohol || 'N/A']);
        detailsBody.push(['Drug Use', formData.drugs || 'N/A']);
      }

      // Physical Examination
      if (formData.general_appearance) detailsBody.push(['General Appearance', formData.general_appearance]);
      if (formData.heent) detailsBody.push(['HEENT', formData.heent]);
      if (formData.cardiovascular) detailsBody.push(['Cardiovascular', formData.cardiovascular]);
      if (formData.respiratory) detailsBody.push(['Respiratory', formData.respiratory]);
      if (formData.gastrointestinal) detailsBody.push(['Gastrointestinal', formData.gastrointestinal]);
      if (formData.genitourinary) detailsBody.push(['Genitourinary', formData.genitourinary]);
      if (formData.neurological) detailsBody.push(['Neurological', formData.neurological]);
      if (formData.musculoskeletal) detailsBody.push(['Musculoskeletal', formData.musculoskeletal]);
      if (formData.integumentary) detailsBody.push(['Integumentary (Skin)', formData.integumentary]);

      // Assessment & Plan
      detailsBody.push(['Diagnosis', formData.diagnosis || 'N/A']);
      detailsBody.push(['Treatment Plan', formData.treatment_plan || 'N/A']);
      if (formData.prescriptions) detailsBody.push(['Prescriptions', formData.prescriptions]);
      detailsBody.push(['Recommendations', formData.recommendations || 'N/A']);

      // Follow-up
      if (formData.follow_up) detailsBody.push(['Follow-Up Instructions', formData.follow_up]);
      if (formData.follow_up_date) detailsBody.push(['Follow-Up Date', new Date(formData.follow_up_date).toLocaleDateString()]);
    } else {
      // Dental form — existing dental fields
      if (formData.has_toothbrush) detailsBody.push(['Has Toothbrush', formData.has_toothbrush]);
      if (formData.dentition) detailsBody.push(['Dentition', formData.dentition]);
      if (formData.periodontal) detailsBody.push(['Periodontal', formData.periodontal]);
      if (formData.occlusion) detailsBody.push(['Occlusion', formData.occlusion]);
      if (formData.malocclusion_severity) detailsBody.push(['Malocclusion Severity', formData.malocclusion_severity]);
      if (formData.oral_hygiene) detailsBody.push(['Oral Hygiene', formData.oral_hygiene]);

      detailsBody.push(['Chief Concern', formData.chief_concern || 'N/A']);
      detailsBody.push(['History of Present Illness', formData.history_of_present_illness || 'N/A']);
      detailsBody.push(['Medical History', formData.medical_history || 'N/A']);
      if (formData.oral_hygiene_habits) detailsBody.push(['Oral Hygiene Habits', formData.oral_hygiene_habits]);
      if (formData.fluoride_exposure) detailsBody.push(['Fluoride Exposure', formData.fluoride_exposure]);
      detailsBody.push(['Extraoral Exam', formData.extraoral_examination || 'N/A']);
      detailsBody.push(['Intraoral Exam', formData.intraoral_examination || 'N/A']);
      detailsBody.push(['Periodontal Screening', formData.periodontal_screening || 'N/A']);
      if (formData.oral_pathology) detailsBody.push(['Oral Pathology', formData.oral_pathology]);
      detailsBody.push(['Diagnosis', formData.diagnosis_dental || 'N/A']);
      detailsBody.push(['Treatment Plan', formData.treatment_plan_dental || 'N/A']);
      if (formData.recommended_treatments) detailsBody.push(['Recommended Treatments', formData.recommended_treatments]);
      if (formData.prevention_advice) detailsBody.push(['Prevention Advice', formData.prevention_advice]);
      if (formData.treatment_priority) detailsBody.push(['Treatment Priority', formData.treatment_priority]);
      if (formData.next_appointment) detailsBody.push(['Next Appointment', formData.next_appointment]);

      // Teeth Status Counts
      detailsBody.push(['Teeth Count', `Decayed: ${formData.decayed_teeth || '0'}, Missing: ${formData.missing_teeth || '0'}, Filled: ${formData.filled_teeth || '0'}`]);

      // Detailed Tooth Status (Permanent)
      if (formData.permanent_teeth_status) {
        try {
          const rawData = formData.permanent_teeth_status;
          const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          if (data && typeof data === 'object') {
            const teeth = Object.entries(data)
              .filter(([_, t]: [string, any]) => t && (t.status || t.treatment))
              .map(([num, t]: [string, any]) => `${num}(${t.status || ''}${t.treatment ? '/' + t.treatment : ''})`)
              .join(', ');
            if (teeth) detailsBody.push(['Permanent Teeth Status', teeth]);
          }
        } catch (e) {
          console.warn('Error parsing permanent teeth status', e);
        }
      }

      // Detailed Tooth Status (Temporary)
      if (formData.temporary_teeth_status) {
        try {
          const rawData = formData.temporary_teeth_status;
          const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          if (data && typeof data === 'object') {
            const teeth = Object.entries(data)
              .filter(([_, t]: [string, any]) => t && (t.status || t.treatment))
              .map(([num, t]: [string, any]) => `${num}(${t.status || ''}${t.treatment ? '/' + t.treatment : ''})`)
              .join(', ');
            if (teeth) detailsBody.push(['Temporary Teeth Status', teeth]);
          }
        } catch (e) {
          console.warn('Error parsing temporary teeth status', e);
        }
      }
    }

    // Medicine Usage
    if (formData.used_medicines && Array.isArray(formData.used_medicines) && formData.used_medicines.length > 0) {
      const meds = formData.used_medicines.map((m: any) => `${m.item_name || m.name} (${m.quantity_used || m.quantity})`).join(', ');
      detailsBody.push(['Issued Medicines', meds]);
    }

    detailsBody.push(['Additional Remarks', formData.remarks || 'N/A']);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20, right: 20 },
      head: [['CLINICAL FINDINGS / DETAILS', '']],
      body: detailsBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 20);
    currentY += 6;

    // Signature
    const pageHeight = doc.internal.pageSize.getHeight();
    const clinicianName = formData.examined_by || formData.dentist_name || 'Attending Clinician';
    const signatureMeta: string[] = [];
    if (formData.examiner_position) signatureMeta.push(formData.examiner_position);
    const licenseValue = formData.examiner_license || formData.dentist_license;
    if (licenseValue) signatureMeta.push(`License: ${licenseValue}`);
    if (formData.examiner_ptr) signatureMeta.push(`PTR: ${formData.examiner_ptr}`);
    if (formData.examiner_phone) signatureMeta.push(`Contact: ${formData.examiner_phone}`);

    const signatureBlockHeight = 18 + signatureMeta.length * 4;
    if (currentY + signatureBlockHeight > pageHeight - 15) {
      doc.addPage();
      currentY = 40;
    }

    const sigX = 125;
    const sigWidth = 60;
    const sigLineY = currentY + 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Date of Examination: ${formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'}`,
      20,
      sigLineY - 2
    );

    doc.setDrawColor(0, 0, 0);
    doc.line(sigX, sigLineY, sigX + sigWidth, sigLineY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(clinicianName, sigX + sigWidth / 2, sigLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Signature over Printed Name', sigX + sigWidth / 2, sigLineY + 9, { align: 'center' });

    signatureMeta.forEach((line, index) => {
      doc.text(line, sigX + sigWidth / 2, sigLineY + 13 + index * 4, { align: 'center' });
    });

    // Dental Chart Image Page
    if (appointmentType === 'dental' && teethChartImage) {
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DENTAL CHART VISUAL', 105, 20, { align: 'center' });
      doc.addImage(teethChartImage, 'PNG', 15, 30, 180, 180);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Visual representation of current dental status.', 105, 220, { align: 'center' });
    }

    doc.save(`${appointmentType}_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generatePDFReport = async (
  stats: StatsData,
  userTypeData: UserTypeData[],
  reportType: 'weekly' | 'monthly' | 'yearly' = 'monthly'
): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 15;
    const rightMargin = 105; // Split layout: left side for details, right for charts

    const [wmsuLogo, healthLogo] = await Promise.all([
      loadLogo('/WMSU-Logo.jpg'),
      loadLogo('/WMSU-HealthLogo.png')
    ]);

    if (wmsuLogo) pdf.addImage(wmsuLogo, 'PNG', 20, 15, 20, 20);
    if (healthLogo) pdf.addImage(healthLogo, 'PNG', 170, 15, 20, 20);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WESTERN MINDANAO STATE UNIVERSITY', pageWidth / 2, 22, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('UNIVERSITY HEALTH SERVICES CENTER', pageWidth / 2, 28, { align: 'center' });
    pdf.text('Zamboanga City', pageWidth / 2, 33, { align: 'center' });

    pdf.setDrawColor(139, 0, 0); // Maroon color
    pdf.setLineWidth(1);
    pdf.line(20, 38, 190, 38);

    pdf.setFillColor(139, 0, 0);
    pdf.rect(20, 42, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${reportType.toUpperCase()} INSTITUTIONAL PERFORMANCE REPORT`, pageWidth / 2, 48.5, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    let currentY = 60;

    const totalServices = stats.medical.total + stats.dental.total + stats.documents.total;
    const totalCompleted = stats.medical.completed + stats.dental.completed + stats.documents.issued;
    const totalCompletionRate = totalServices > 0 ? (totalCompleted / totalServices) * 100 : 0;
    const itemsConsumed = stats.medicine_usage?.reduce((sum, i) => sum + i.quantity, 0) || 0;

    const sectionGap = 8;
    const tableGap = 6;

    // Summary Section (minimalist)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('EXECUTIVE SUMMARY', leftMargin, currentY);
    currentY += sectionGap;

    autoTable(pdf, {
      startY: currentY,
      margin: { left: leftMargin, right: leftMargin },
      head: [['Metric', 'Value', 'Details']],
      body: [
        ['Report Period', reportType.charAt(0).toUpperCase() + reportType.slice(1), `Generated on ${new Date().toLocaleDateString()}`],
        ['Total Services', totalServices.toString(), 'Combined Medical, Dental, and Documents'],
        ['Completion Rate', `${totalCompletionRate.toFixed(1)}%`, 'Successful consultation closures'],
        ['Active Clinicians', (stats.clinicians?.length || 0).toString(), 'Staff with recorded activity'],
        ['Items Consumed', itemsConsumed.toString(), 'Medical and dental supplies used']
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1, overflow: 'linebreak' },
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } }
    });

    currentY = (pdf as any).lastAutoTable?.finalY || (currentY + 12);
    currentY += tableGap;

    // Service Activity (minimalist)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SERVICE ACTIVITY BREAKDOWN', leftMargin, currentY);
    currentY += sectionGap;

    const medicalRate = stats.medical.total > 0 ? (stats.medical.completed / stats.medical.total) * 100 : 0;
    const dentalRate = stats.dental.total > 0 ? (stats.dental.completed / stats.dental.total) * 100 : 0;
    const documentRate = stats.documents.total > 0 ? (stats.documents.issued / stats.documents.total) * 100 : 0;

    autoTable(pdf, {
      startY: currentY,
      margin: { left: leftMargin, right: leftMargin },
      head: [['Service Category', 'Total Volume', 'Completed', 'Success Rate']],
      body: [
        ['Medical Consultations', stats.medical.total.toString(), stats.medical.completed.toString(), `${medicalRate.toFixed(1)}%`],
        ['Dental Examinations', stats.dental.total.toString(), stats.dental.completed.toString(), `${dentalRate.toFixed(1)}%`],
        ['Document Issuance', stats.documents.total.toString(), stats.documents.issued.toString(), `${documentRate.toFixed(1)}%`]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    });

    currentY = (pdf as any).lastAutoTable?.finalY || (currentY + 12);
    currentY += tableGap;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(80, 80, 80);
    pdf.text('Detailed staff and inventory breakdowns follow on the next pages.', leftMargin, currentY);

    // Page 2: User Type Breakdown
    if (userTypeData && userTypeData.length > 0) {
      pdf.addPage();
      addUserTypeBreakdownPage(pdf, userTypeData, pageWidth, pageHeight, leftMargin);
    }

    // Page 3: Staff Activity
    if (stats.clinicians && stats.clinicians.length > 0) {
      pdf.addPage();
      addClinicianPerformancePage(pdf, stats.clinicians, pageWidth, pageHeight, leftMargin);
    }

    // Page 4: Resource Utilization
    if (stats.medicine_usage && stats.medicine_usage.length > 0) {
      pdf.addPage();
      addMedicineUsagePage(pdf, stats.medicine_usage, stats.medical_med_total_entries || 0, pageWidth, pageHeight, leftMargin);
    }

    // Page footer for all pages
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`WMSU Health Services - Institutional Report | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`WMSU-Health-${reportType}-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report.');
  }
};

// Helper function to draw enhanced user type charts with line and bar graphs
function drawEnhancedUserTypeChart(pdf: any, userType: any, x: number, y: number, width: number, height: number) {
  // User type title with enhanced styling
  pdf.setFillColor(248, 250, 252); // Light blue-gray background
  pdf.rect(x, y - 3, width, 20, 'F');
  pdf.setDrawColor(99, 102, 241); // Indigo border
  pdf.setLineWidth(0.5);
  pdf.rect(x, y - 3, width, 20, 'S');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59); // Dark blue-gray
  pdf.text(userType.userType, x + 5, y + 8);

  // Performance badge
  const performance = userType.completionRate >= 80 ? 'Excellent' :
    userType.completionRate >= 60 ? 'Good' :
      userType.completionRate >= 40 ? 'Average' : 'Low';
  const badgeColor = userType.completionRate >= 80 ? [34, 197, 94] :
    userType.completionRate >= 60 ? [59, 130, 246] :
      userType.completionRate >= 40 ? [245, 158, 11] : [239, 68, 68];

  pdf.setFillColor(...badgeColor);
  pdf.rect(x + width - 35, y - 1, 30, 8, 'F');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(performance, x + width - 30, y + 3, { align: 'center' });

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // Statistics summary with better layout
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total Services: ${userType.totalTransactions}`, x + 5, y + 23);
  pdf.text(`Completed: ${userType.completedTransactions}`, x + width / 2, y + 23);
  pdf.text(`Success Rate: ${userType.completionRate.toFixed(1)}%`, x + 5, y + 28);

  // Service data for charts
  const services = [
    { name: 'Medical', value: userType.medical.total, completed: userType.medical.completed, color: [59, 130, 246] },
    { name: 'Dental', value: userType.dental.total, completed: userType.dental.completed, color: [16, 185, 129] },
    { name: 'Documents', value: userType.documents.total || 0, completed: userType.documents.completed || userType.documents.issued || 0, color: [245, 158, 11] }
  ];

  const maxValue = Math.max(...services.map(s => s.value), 1);

  // Enhanced Line Chart Area
  const lineChartStartY = y + 35;
  const lineChartHeight = 25;
  const lineChartWidth = width - 10;

  // Chart background with grid
  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(249, 250, 251);
  pdf.rect(x + 5, lineChartStartY, lineChartWidth, lineChartHeight, 'FD');

  // Draw subtle grid lines
  pdf.setDrawColor(243, 244, 246);
  for (let i = 1; i < 4; i++) {
    const gridY = lineChartStartY + (i * lineChartHeight / 4);
    pdf.line(x + 5, gridY, x + 5 + lineChartWidth, gridY);
  }

  // Vertical grid lines
  for (let i = 1; i < services.length; i++) {
    const gridX = x + 5 + (i * lineChartWidth / services.length);
    pdf.line(gridX, lineChartStartY, gridX, lineChartStartY + lineChartHeight);
  }

  // Draw enhanced line chart
  let previousPoint = null;
  const chartDataWidth = lineChartWidth / (services.length - 1 || 1);

  services.forEach((service, index) => {
    const pointX = x + 5 + (index * chartDataWidth);
    const pointHeight = (service.value / maxValue) * (lineChartHeight - 8);
    const pointY = lineChartStartY + lineChartHeight - 4 - pointHeight;

    // Draw connecting line with gradient effect
    if (previousPoint) {
      pdf.setDrawColor(79, 70, 229);
      pdf.setLineWidth(2);
      pdf.line(previousPoint.x, previousPoint.y, pointX, pointY);
    }

    // Draw data points with shadow effect
    pdf.setFillColor(200, 200, 200);
    pdf.circle(pointX + 0.5, pointY + 0.5, 2, 'F'); // Shadow
    pdf.setFillColor(...service.color);
    pdf.circle(pointX, pointY, 2, 'F');

    // Add value labels
    if (service.value > 0) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      pdf.text(service.value.toString(), pointX, pointY - 5, { align: 'center' });
    }

    previousPoint = { x: pointX, y: pointY };
  });

  // Enhanced Bar Chart Area
  const barChartStartY = lineChartStartY + lineChartHeight + 8;
  const barHeight = 20;
  const barWidth = lineChartWidth / services.length;

  // Section title
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.text('Service Distribution & Completion', x + 5, barChartStartY - 3);

  services.forEach((service, index) => {
    const barX = x + 5 + (index * barWidth);
    const totalBarHeight = (service.value / maxValue) * barHeight;
    const completedBarHeight = service.value > 0 ? (service.completed / service.value) * totalBarHeight : 0;
    const barY = barChartStartY + barHeight - totalBarHeight;

    // Draw background bar with rounded effect
    pdf.setFillColor(243, 244, 246);
    pdf.rect(barX + 2, barChartStartY, barWidth - 6, barHeight, 'F');

    // Draw total bar (lighter shade)
    const lightColor = service.color.map(c => Math.min(255, c + 80));
    pdf.setFillColor(...lightColor);
    pdf.rect(barX + 2, barY, barWidth - 6, totalBarHeight, 'F');

    // Draw completed bar (full color)
    if (completedBarHeight > 0) {
      pdf.setFillColor(...service.color);
      const completedBarY = barChartStartY + barHeight - completedBarHeight;
      pdf.rect(barX + 2, completedBarY, barWidth - 6, completedBarHeight, 'F');
    }

    // Add border
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.rect(barX + 2, barChartStartY, barWidth - 6, barHeight, 'S');

    // Service labels
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    const shortName = service.name.substring(0, 3);
    pdf.text(shortName, barX + barWidth / 2, barChartStartY + barHeight + 5, { align: 'center' });

    // Values with better formatting
    if (service.value > 0) {
      const completionRate = ((service.completed / service.value) * 100).toFixed(0);
      pdf.text(`${service.completed}/${service.value}`, barX + barWidth / 2, barChartStartY + barHeight + 9, { align: 'center' });
      pdf.text(`(${completionRate}%)`, barX + barWidth / 2, barChartStartY + barHeight + 13, { align: 'center' });
    }
  });
}

// Enhanced function to draw detailed user type charts with course, year, department breakdowns
function drawDetailedUserTypeChart(pdf: any, userType: any, x: number, y: number, width: number, height: number) {
  // User type title with enhanced styling and better spacing
  pdf.setFillColor(248, 250, 252);
  pdf.rect(x, y - 5, width, 28, 'F');
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.5);
  pdf.rect(x, y - 5, width, 28, 'S');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text(userType.userType, x + 8, y + 5);

  // Performance badge with better positioning
  const performance = userType.completionRate >= 80 ? 'Excellent' :
    userType.completionRate >= 60 ? 'Good' :
      userType.completionRate >= 40 ? 'Average' : 'Low';
  const badgeColor = userType.completionRate >= 80 ? [34, 197, 94] :
    userType.completionRate >= 60 ? [59, 130, 246] :
      userType.completionRate >= 40 ? [245, 158, 11] : [239, 68, 68];

  pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  pdf.rect(x + width - 38, y - 2, 33, 10, 'F');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(performance, x + width - 36, y + 4, { align: 'left' });

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // Statistics summary with improved spacing
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total: ${userType.totalTransactions} | Completed: ${userType.completedTransactions}`, x + 8, y + 15);
  pdf.text(`Success Rate: ${userType.completionRate.toFixed(1)}%`, x + 8, y + 21);

  // Demographics breakdown section with better spacing
  let currentY = y + 35;

  // Course/Year/Department breakdown (simulated for demonstration)
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);

  if (userType.userType.toLowerCase().includes('college')) {
    pdf.text('Top Courses/Years:', x + 8, currentY);
    currentY += 12;

    // Use actual configuration data if available
    const availableCourses = userType.configuration?.available_options?.courses ||
      ['BSIT', 'BSN', 'BSED', 'BSCE'];
    const availableYearLevels = userType.configuration?.available_options?.year_levels ||
      ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    // Enhanced course data breakdown with actual course names from configuration
    const courseBreakdown = availableCourses.slice(0, 4).map((course, index) => ({
      name: `${course}-${availableYearLevels[index] || '1st'}`,
      count: Math.floor(userType.totalTransactions * (0.25 + index * 0.05)),
      rate: `${85 + index * 2}%`
    }));

    drawMiniBarChart(pdf, courseBreakdown, x + 8, currentY, width - 16, 22);
    currentY += 35;

  } else if (userType.userType.toLowerCase().includes('employee')) {
    pdf.text('Department & Position Breakdown:', x + 8, currentY);
    currentY += 12;

    // Use actual configuration data if available
    const availableDepartments = userType.configuration?.available_options?.departments ||
      ['CCS', 'CED', 'Administration'];
    const availablePositions = userType.configuration?.available_options?.position_types ||
      ['Teaching', 'Non-Teaching'];

    const deptBreakdown = availableDepartments.slice(0, 3).map((dept, index) => ({
      name: `${dept}-${availablePositions[index % availablePositions.length] || 'Teaching'}`,
      count: Math.floor(userType.totalTransactions * (0.3 - index * 0.05)),
      rate: `${88 - index * 3}%`
    }));

    drawMiniBarChart(pdf, deptBreakdown, x + 8, currentY, width - 16, 22);
    currentY += 35;

  } else if (userType.userType.toLowerCase().includes('senior high')) {
    pdf.text('Grade/Strand Breakdown:', x + 8, currentY);
    currentY += 12;

    // Use actual configuration data if available
    const availableStrands = userType.configuration?.available_options?.strands ||
      ['STEM', 'ABM', 'HUMSS', 'TVL'];
    const availableYearLevels = userType.configuration?.available_options?.year_levels ||
      ['Grade 11', 'Grade 12'];

    const strandBreakdown = availableStrands.slice(0, 4).map((strand, index) => ({
      name: `${availableYearLevels[index % availableYearLevels.length]?.replace('Grade ', 'G') || 'G11'}-${strand}`,
      count: Math.floor(userType.totalTransactions * (0.3 - index * 0.025)),
      rate: `${80 + index * 2}%`
    }));

    drawMiniBarChart(pdf, strandBreakdown, x + 8, currentY, width - 16, 22);
    currentY += 35;

  } else if (userType.userType.toLowerCase().includes('high school')) {
    pdf.text('Grade Level Breakdown:', x + 8, currentY);
    currentY += 12;

    // Use actual configuration data if available
    const availableGrades = userType.configuration?.available_options?.year_levels ||
      ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];

    const hsGradeBreakdown = availableGrades.map((grade, index) => ({
      name: grade,
      count: Math.floor(userType.totalTransactions * 0.25),
      rate: `${78 + index * 2}%`
    }));

    drawMiniBarChart(pdf, hsGradeBreakdown, x + 8, currentY, width - 16, 22);
    currentY += 35;

  } else if (userType.userType.toLowerCase().includes('elementary')) {
    pdf.text('Grade Level Breakdown:', x + 8, currentY);
    currentY += 12;

    const elemGradeBreakdown = [
      { name: 'Lower (1-3)', count: Math.floor(userType.totalTransactions * 0.4), rate: '75%' },
      { name: 'Upper (4-6)', count: Math.floor(userType.totalTransactions * 0.6), rate: '82%' }
    ];

    drawMiniBarChart(pdf, elemGradeBreakdown, x + 8, currentY, width - 16, 22);
    currentY += 35;

  } else if (userType.userType.toLowerCase().includes('kindergarten')) {
    pdf.text('Section Distribution:', x + 8, currentY);
    currentY += 12;

    const sectionBreakdown = [
      { name: 'Kinder A', count: Math.floor(userType.totalTransactions * 0.5), rate: '78%' },
      { name: 'Kinder B', count: Math.floor(userType.totalTransactions * 0.5), rate: '83%' }
    ];

    drawMiniBarChart(pdf, sectionBreakdown, x + 8, currentY, width - 16, 22);
    currentY += 35;
  } else {
    // For user types without specific breakdowns, show general info
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text('No specific demographic breakdown available', x + 8, currentY);
    currentY += 15;
  }

  // Add extra spacing before service distribution section to prevent overlap
  currentY += 15;

  // Service distribution chart at the bottom with better spacing
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.text('Service Distribution & Completion by Type', x + 8, currentY);
  currentY += 8;

  const services = [
    { name: 'Med', value: userType.medical.total, completed: userType.medical.completed, color: [59, 130, 246] },
    { name: 'Den', value: userType.dental.total, completed: userType.dental.completed, color: [16, 185, 129] },
    { name: 'Doc', value: userType.documents.total || 0, completed: userType.documents.completed || userType.documents.issued || 0, color: [245, 158, 11] }
  ];

  drawServiceDistributionChart(pdf, services, x + 8, currentY, width - 16, 18);
}

// Helper function to draw mini bar charts for demographic breakdowns with improved spacing
function drawMiniBarChart(pdf: any, data: any[], x: number, y: number, width: number, height: number) {
  if (data.length === 0) return;

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const totalSpacing = width * 0.2; // 20% of width for spacing
  const availableWidth = width - totalSpacing;
  const barWidth = availableWidth / data.length;
  const barSpacing = totalSpacing / (data.length + 1); // Even spacing between bars

  data.forEach((item, index) => {
    const barX = x + barSpacing + (index * (barWidth + barSpacing / (data.length - 1 || 1)));
    const barHeight = Math.max((item.count / maxValue) * height, 2); // Minimum height of 2
    const barY = y + height - barHeight;

    // Enhanced background with better visual appeal
    pdf.setFillColor(248, 250, 252);
    pdf.rect(barX, y, barWidth, height, 'F');

    // Gradient-like effect: lighter base
    if (item.count > 0) {
      pdf.setFillColor(219, 234, 254); // Light blue
      pdf.rect(barX, barY, barWidth, barHeight, 'F');

      // Main bar with enhanced color
      pdf.setFillColor(59, 130, 246);
      pdf.rect(barX + 1, barY + 1, barWidth - 2, barHeight - 2, 'F');
    }

    // Add subtle border with rounded effect
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.rect(barX, y, barWidth, height, 'S');

    // Enhanced labels with better positioning and spacing
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(item.name, barX + barWidth / 2, y + height + 8, { align: 'center' });

    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${item.count}`, barX + barWidth / 2, y + height + 12, { align: 'center' });
    pdf.text(item.rate, barX + barWidth / 2, y + height + 16, { align: 'center' });
  });
}

// Helper function to draw service distribution charts with enhanced layout
function drawServiceDistributionChart(pdf: any, services: any[], x: number, y: number, width: number, height: number) {
  const maxValue = Math.max(...services.map(s => s.value), 1);
  const barWidth = width / services.length;
  const barSpacing = 3;
  const actualBarWidth = barWidth - barSpacing;

  services.forEach((service, index) => {
    const barX = x + (index * barWidth) + (barSpacing / 2);
    const totalBarHeight = (service.value / maxValue) * height;
    const completedBarHeight = service.value > 0 ? (service.completed / service.value) * totalBarHeight : 0;
    const barY = y + height - totalBarHeight;

    // Background with improved spacing
    pdf.setFillColor(243, 244, 246);
    pdf.rect(barX, y, actualBarWidth, height, 'F');

    // Total bar (light) with better color management
    const lightColor = service.color.map(c => Math.min(255, c + 80));
    pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    pdf.rect(barX, barY, actualBarWidth, totalBarHeight, 'F');

    // Completed bar with enhanced visibility
    if (completedBarHeight > 0) {
      pdf.setFillColor(service.color[0], service.color[1], service.color[2]);
      const completedBarY = y + height - completedBarHeight;
      pdf.rect(barX, completedBarY, actualBarWidth, completedBarHeight, 'F');
    }

    // Add subtle border for definition
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.rect(barX, y, actualBarWidth, height, 'S');

    // Labels with improved positioning and spacing
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(service.name, barX + actualBarWidth / 2, y + height + 8, { align: 'center' });

    if (service.value > 0) {
      const rate = ((service.completed / service.value) * 100).toFixed(0);
      pdf.text(`${service.completed}/${service.value}`, barX + actualBarWidth / 2, y + height + 13, { align: 'center' });
      pdf.text(`${rate}%`, barX + actualBarWidth / 2, y + height + 18, { align: 'center' });
    } else {
      pdf.text('0/0', barX + actualBarWidth / 2, y + height + 13, { align: 'center' });
      pdf.text('0%', barX + actualBarWidth / 2, y + height + 18, { align: 'center' });
    }
  });
}

// Helper function to add enhanced summary page
function addEnhancedSummaryPage(pdf: any, userTypeData: any[], stats: any, leftMargin: number, startY: number, pageWidth: number, pageHeight: number) {
  let yPos = startY;

  // Enhanced Summary Statistics Section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Comprehensive Performance Summary', leftMargin, yPos);
  yPos += 15;

  // Key Performance Indicators in cards
  const cardWidth = (pageWidth - 2 * leftMargin - 20) / 3;
  const cardHeight = 40;

  const kpis = [
    {
      title: 'Overall Completion',
      value: `${((stats.medical.completed + stats.dental.completed + stats.documents.issued) / (stats.medical.total + stats.dental.total + stats.documents.total) * 100).toFixed(1)}%`,
      color: [59, 130, 246],
      subtitle: 'Across All Services'
    },
    {
      title: 'All User Types',
      value: userTypeData.length.toString(),
      color: [16, 185, 129],
      subtitle: 'Total Categories'
    },
    {
      title: 'Total Services',
      value: (stats.medical.total + stats.dental.total + stats.documents.total).toString(),
      color: [245, 158, 11],
      subtitle: 'All Categories'
    }
  ];

  kpis.forEach((kpi, index) => {
    const cardX = leftMargin + index * (cardWidth + 10);

    // Card background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(cardX, yPos, cardWidth, cardHeight, 'F');

    // Card border
    pdf.setDrawColor(...kpi.color);
    pdf.setLineWidth(1);
    pdf.rect(cardX, yPos, cardWidth, cardHeight, 'S');

    // Accent bar
    pdf.setFillColor(...kpi.color);
    pdf.rect(cardX, yPos, cardWidth, 3, 'F');

    // KPI Title
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    pdf.text(kpi.title, cardX + cardWidth / 2, yPos + 12, { align: 'center' });

    // KPI Value
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...kpi.color);
    pdf.text(kpi.value, cardX + cardWidth / 2, yPos + 22, { align: 'center' });

    // KPI Subtitle
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(kpi.subtitle, cardX + cardWidth / 2, yPos + 30, { align: 'center' });
  });

  yPos += cardHeight + 20;

  // Service Performance Comparison Chart
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Service Performance Comparison', leftMargin, yPos);
  yPos += 15;

  const chartHeight = 45;
  const chartWidth = pageWidth - 2 * leftMargin;

  // Chart background
  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(249, 250, 251);
  pdf.rect(leftMargin, yPos, chartWidth, chartHeight, 'FD');

  const services = [
    { name: 'Medical Consultations', total: stats.medical.total, completed: stats.medical.completed, pending: stats.medical.pending, rejected: stats.medical.rejected, color: [59, 130, 246] },
    { name: 'Dental Consultations', total: stats.dental.total, completed: stats.dental.completed, pending: stats.dental.pending, rejected: stats.dental.rejected, color: [16, 185, 129] },
    { name: 'Medical Documents', total: stats.documents.total, completed: stats.documents.issued, pending: stats.documents.pending, rejected: 0, color: [245, 158, 11] }
  ];

  const maxServiceValue = Math.max(...services.map(s => s.total));

  services.forEach((service, index) => {
    const barY = yPos + 5 + index * 12;
    const barWidth = chartWidth - 40;
    const totalBarWidth = service.total > 0 ? (service.total / maxServiceValue) * barWidth : 0;
    const completedBarWidth = service.total > 0 ? (service.completed / service.total) * totalBarWidth : 0;

    // Service label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text(service.name, leftMargin + 5, barY + 4);

    // Background bar
    pdf.setFillColor(243, 244, 246);
    pdf.rect(leftMargin + 65, barY, barWidth, 8, 'F');

    // Total bar
    const lightColor = service.color.map(c => Math.min(255, c + 60));
    pdf.setFillColor(...lightColor);
    pdf.rect(leftMargin + 65, barY, totalBarWidth, 8, 'F');

    // Completed bar
    pdf.setFillColor(...service.color);
    pdf.rect(leftMargin + 65, barY, completedBarWidth, 8, 'F');

    // Statistics
    const rate = service.total > 0 ? ((service.completed / service.total) * 100).toFixed(1) : '0';
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${service.completed}/${service.total} (${rate}%)`, leftMargin + 70 + barWidth, barY + 4);
  });

  yPos += chartHeight + 20;

  // Top Performers Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Performing User Types', leftMargin, yPos);
  yPos += 12;

  const topUserTypes = userTypeData
    .filter(ut => ut.totalTransactions > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);

  // Create mini performance chart
  const performanceChartHeight = 35;
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(leftMargin, yPos, chartWidth, performanceChartHeight, 'S');

  topUserTypes.forEach((userType, index) => {
    const barWidth = chartWidth / topUserTypes.length;
    const barX = leftMargin + index * barWidth;
    const barHeight = (userType.completionRate / 100) * (performanceChartHeight - 15);
    const barY = yPos + performanceChartHeight - 5 - barHeight;

    // Performance color coding
    const color = userType.completionRate >= 80 ? [34, 197, 94] :
      userType.completionRate >= 60 ? [59, 130, 246] :
        userType.completionRate >= 40 ? [245, 158, 11] : [239, 68, 68];

    pdf.setFillColor(...color);
    pdf.rect(barX + 3, barY, barWidth - 6, barHeight, 'F');

    // Labels
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const shortName = userType.userType.length > 10 ? userType.userType.substring(0, 10) + '.' : userType.userType;
    pdf.text(shortName, barX + barWidth / 2, yPos + performanceChartHeight + 5, { align: 'center' });
    pdf.text(`${userType.completionRate.toFixed(1)}%`, barX + barWidth / 2, yPos + performanceChartHeight + 10, { align: 'center' });
  });
}

// Page 2+: User Type Distribution Analysis - One user type per page with comprehensive details
function addUserTypeDistributionPage(pdf: any, userTypeData: any[], pageWidth: number, pageHeight: number, leftMargin: number) {
  const allUserTypes = userTypeData; // Show ALL user types (including those with zero records)

  allUserTypes.forEach((userType, index) => {
    // Add new page for each user type (except the first one uses existing page)
    if (index > 0) {
      pdf.addPage();
    }

    // Enhanced Page Header for each user type
    pdf.setFillColor(128, 0, 0); // WMSU maroon color
    pdf.rect(0, 0, pageWidth, 40, 'F'); // Reduced from 55 to 40

    // Add subtle gradient effect for depth
    pdf.setFillColor(100, 0, 0); // Darker maroon
    pdf.rect(0, 35, pageWidth, 5, 'F'); // Adjusted positioning

    pdf.setFontSize(18); // Reduced from 24
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${userType.userType} Analysis`, pageWidth / 2, 15, { align: 'center' }); // Adjusted positioning

    pdf.setFontSize(10); // Reduced from 14
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Comprehensive Demographics & Service Utilization Report`, pageWidth / 2, 25, { align: 'center' }); // Adjusted positioning

    pdf.setFontSize(8); // Reduced from 12
    pdf.text(`Page ${index + 2} of ${allUserTypes.length + 2} | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' }); // Adjusted positioning

    // Reset text color and start content
    pdf.setTextColor(0, 0, 0);
    let yPos = 50; // Reduced from 75

    // User Type Overview Section with enhanced spacing
    pdf.setFillColor(248, 250, 252); // Light background
    pdf.rect(leftMargin, yPos, pageWidth - 2 * leftMargin, 45, 'F');
    pdf.setDrawColor(99, 102, 241); // Border
    pdf.setLineWidth(0.5);
    pdf.rect(leftMargin, yPos, pageWidth - 2 * leftMargin, 45, 'S');

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(`${userType.userType} Overview`, leftMargin + 10, yPos + 15);

    // Performance indicators
    const performanceColor = userType.completionRate >= 80 ? [34, 197, 94] :
      userType.completionRate >= 60 ? [59, 130, 246] :
        userType.completionRate >= 40 ? [245, 158, 11] : [239, 68, 68];
    const performanceText = userType.completionRate >= 80 ? 'Excellent' :
      userType.completionRate >= 60 ? 'Good' :
        userType.completionRate >= 40 ? 'Average' : 'Needs Improvement';

    pdf.setFillColor(performanceColor[0], performanceColor[1], performanceColor[2]);
    pdf.rect(pageWidth - leftMargin - 80, yPos + 5, 70, 12, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(performanceText, pageWidth - leftMargin - 45, yPos + 13, { align: 'center' });

    // Key statistics
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text(`Total Transactions: ${userType.totalTransactions}`, leftMargin + 10, yPos + 28);
    pdf.text(`Completed: ${userType.completedTransactions}`, leftMargin + 150, yPos + 28);
    pdf.text(`Success Rate: ${userType.completionRate.toFixed(1)}%`, leftMargin + 10, yPos + 38);
    pdf.text(`Priority Level: ${userType.totalTransactions > 100 ? 'High' : userType.totalTransactions > 50 ? 'Medium' : 'Low'}`, leftMargin + 150, yPos + 38);

    yPos += 65;

    // Service Distribution Section with enhanced charts
    pdf.setFontSize(14); // Reduced from 16
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Service Distribution & Performance', leftMargin, yPos);
    yPos += 12; // Reduced from 20

    // Service breakdown cards
    const services = [
      {
        name: 'Medical Consultations',
        total: userType.medical.total,
        completed: userType.medical.completed,
        pending: userType.medical.pending || 0,
        rejected: userType.medical.rejected || 0,
        color: [59, 130, 246]
      },
      {
        name: 'Dental Consultations',
        total: userType.dental.total,
        completed: userType.dental.completed,
        pending: userType.dental.pending || 0,
        rejected: userType.dental.rejected || 0,
        color: [16, 185, 129]
      },
      {
        name: 'Medical Documents',
        total: userType.documents.total || 0,
        completed: userType.documents.issued || 0,
        pending: userType.documents.pending || 0,
        rejected: 0,
        color: [245, 158, 11]
      }
    ];

    const cardWidth = (pageWidth - 2 * leftMargin - 20) / 3;
    const cardHeight = 50; // Reduced from 80

    services.forEach((service, serviceIndex) => {
      const cardX = leftMargin + serviceIndex * (cardWidth + 10);
      const completionRate = service.total > 0 ? ((service.completed / service.total) * 100).toFixed(1) : '0';

      // Service card background - WHITE BACKGROUND for visibility
      pdf.setFillColor(255, 255, 255); // White background
      pdf.rect(cardX, yPos, cardWidth, cardHeight, 'F');

      // Add subtle shadow for depth
      pdf.setFillColor(200, 200, 200); // Light gray shadow
      pdf.rect(cardX + 1, yPos + 1, cardWidth, cardHeight, 'F');

      // White card on top of shadow
      pdf.setFillColor(255, 255, 255); // White background
      pdf.rect(cardX, yPos, cardWidth, cardHeight, 'F');

      // Card border with service color
      pdf.setDrawColor(service.color[0], service.color[1], service.color[2]);
      pdf.setLineWidth(1.5); // Slightly thicker border for visibility
      pdf.rect(cardX, yPos, cardWidth, cardHeight, 'S');

      // Service title
      pdf.setFontSize(10); // Reduced from 11
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(service.color[0], service.color[1], service.color[2]);
      pdf.text(service.name, cardX + 5, yPos + 10); // Reduced positioning

      // Statistics
      pdf.setFontSize(8); // Reduced from 10
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0); // Black text for better visibility on white background
      pdf.text(`Total: ${service.total}`, cardX + 5, yPos + 20); // Reduced positioning
      pdf.text(`Completed: ${service.completed}`, cardX + 5, yPos + 27); // Reduced positioning
      pdf.text(`Pending: ${service.pending}`, cardX + 5, yPos + 34); // Reduced positioning
      if (service.rejected > 0) {
        pdf.text(`Rejected: ${service.rejected}`, cardX + 5, yPos + 41); // Reduced positioning
      }

      // Completion rate with progress bar
      pdf.setFontSize(9); // Reduced from 11
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(service.color[0], service.color[1], service.color[2]);
      pdf.text(`${completionRate}%`, cardX + 5, yPos + 47); // Reduced positioning

      // Progress bar
      const progressBarWidth = cardWidth - 40; // Reduced from 50
      const progressBarHeight = 3; // Reduced from 4
      const progressBarX = cardX + 35; // Reduced from 45
      const progressBarY = yPos + 44; // Reduced positioning

      // Background bar
      pdf.setFillColor(229, 231, 235);
      pdf.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 'F');

      // Progress fill
      const fillWidth = (progressBarWidth * parseFloat(completionRate)) / 100;
      pdf.setFillColor(service.color[0], service.color[1], service.color[2]);
      pdf.rect(progressBarX, progressBarY, fillWidth, progressBarHeight, 'F');
    });

    yPos += cardHeight + 15; // Reduced from 30

    // Recommendations Section (moved demographics to separate page)
    if (yPos < pageHeight - 100) {
      pdf.setFontSize(14); // Reduced font size
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Recommendations & Insights', leftMargin, yPos);
      yPos += 15; // Reduced spacing

      const recommendations = generateRecommendations(userType);
      pdf.setFontSize(10); // Reduced font size
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);

      recommendations.forEach((rec, recIndex) => {
        if (yPos < pageHeight - 25) { // More conservative margin check
          pdf.text(`• ${rec}`, leftMargin + 5, yPos);
          yPos += 10; // Reduced spacing between recommendations
        }
      });
    }

    // Page footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(`${userType.userType} Analysis - Page ${index + 2}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
  });
}

// Helper function to draw demographic sections as line charts with enhanced layout
function drawDemographicLineChart(pdf: any, title: string, primaryOptions: string[], secondaryOptions: string[], totalTransactions: number, x: number, y: number, width: number, height: number = 60) {
  // Section title
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.text(title, x, y);

  const chartY = y + 8;
  const chartHeight = height - 15;
  const chartWidth = width - 100;
  const chartStartX = x + 40;

  // Chart background - white with border
  pdf.setFillColor(255, 255, 255);
  pdf.rect(chartStartX, chartY, chartWidth, chartHeight, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(chartStartX, chartY, chartWidth, chartHeight, 'S');

  // Create detailed grid system
  const coursesToShow = primaryOptions.length > 0 ? primaryOptions.slice(0, 4) : ['Course 1', 'Course 2', 'Course 3', 'Course 4'];
  const yearLabels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  // Ensure we have at least 2 courses for proper grid calculation
  if (coursesToShow.length < 2) {
    coursesToShow.push('Additional Course');
  }

  // Y-axis percentages (0% to 100% with 10% increments)
  const yAxisLabels = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];
  const yStep = chartHeight / (yAxisLabels.length - 1);

  // Draw detailed horizontal grid lines and Y-axis labels
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);

  yAxisLabels.forEach((label, index) => {
    const gridY = chartY + chartHeight - (index * yStep);

    // Validate coordinates before drawing
    if (isNaN(gridY) || !isFinite(gridY)) return;

    // Y-axis label
    pdf.text(label, chartStartX - 20, gridY + 2);

    // Horizontal grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    if (index === 0 || index === yAxisLabels.length - 1) {
      pdf.setDrawColor(0, 0, 0); // Darker lines for top and bottom
      pdf.setLineWidth(0.5);
    }
    pdf.line(chartStartX, gridY, chartStartX + chartWidth, gridY);
  });

  // Draw detailed vertical grid lines and X-axis labels
  const xStep = chartWidth / Math.max(1, coursesToShow.length - 1);

  coursesToShow.forEach((course, index) => {
    const gridX = chartStartX + (index * xStep);

    // Validate coordinates before drawing
    if (isNaN(gridX) || !isFinite(gridX)) return;

    // Vertical grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    if (index === 0 || index === coursesToShow.length - 1) {
      pdf.setDrawColor(0, 0, 0); // Darker lines for left and right
      pdf.setLineWidth(0.5);
    }
    pdf.line(gridX, chartY, gridX, chartY + chartHeight);

    // X-axis labels
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    const shortCourse = course.length > 8 ? course.substring(0, 8) + '.' : course;
    pdf.text(shortCourse, gridX - 15, chartY + chartHeight + 8);
  });

  // Draw line chart - horizontal lines connecting same year levels across courses
  const colors = [
    [59, 130, 246],   // Blue for 1st Year
    [239, 68, 68],    // Red for 2nd Year  
    [16, 185, 129],   // Green for 3rd Year
    [245, 158, 11]    // Orange for 4th Year
  ];

  // Draw lines for each year level
  yearLabels.forEach((year, yearIndex) => {
    const color = colors[yearIndex % colors.length];
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(2);

    const dataPoints = [];

    // Create data points for this year level across all courses
    coursesToShow.forEach((course, courseIndex) => {
      const courseX = chartStartX + (courseIndex * xStep);

      // Validate coordinates
      if (isNaN(courseX) || !isFinite(courseX)) return;

      // Simulate percentage values (0-100%)
      let basePercentage;
      switch (yearIndex) {
        case 0: // 1st Year - higher enrollments
          basePercentage = 60 + (courseIndex * 10) + (Math.random() * 20 - 10);
          break;
        case 1: // 2nd Year - moderate enrollments
          basePercentage = 45 + (courseIndex * 8) + (Math.random() * 15 - 7);
          break;
        case 2: // 3rd Year - lower enrollments
          basePercentage = 35 + (courseIndex * 6) + (Math.random() * 12 - 6);
          break;
        case 3: // 4th Year - lowest enrollments
          basePercentage = 25 + (courseIndex * 5) + (Math.random() * 10 - 5);
          break;
        default:
          basePercentage = 50;
      }

      // Ensure percentage is within 0-100% range
      const percentage = Math.max(0, Math.min(100, basePercentage));

      // Calculate Y position based on percentage
      const pointY = chartY + chartHeight - (percentage / 100) * chartHeight;

      // Validate Y coordinate
      if (isNaN(pointY) || !isFinite(pointY)) return;

      dataPoints.push({
        x: courseX,
        y: pointY,
        percentage: Math.round(percentage)
      });
    });

    // Draw line connecting all courses for this year level (only if we have valid points)
    if (dataPoints.length >= 2) {
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const point1 = dataPoints[i];
        const point2 = dataPoints[i + 1];

        // Validate all coordinates before drawing line
        if (isNaN(point1.x) || isNaN(point1.y) || isNaN(point2.x) || isNaN(point2.y) ||
          !isFinite(point1.x) || !isFinite(point1.y) || !isFinite(point2.x) || !isFinite(point2.y)) {
          continue;
        }

        pdf.line(point1.x, point1.y, point2.x, point2.y);
      }
    }

    // Draw data points (squares like in the image)
    pdf.setFillColor(color[0], color[1], color[2]);
    dataPoints.forEach(point => {
      // Validate coordinates before drawing
      if (isNaN(point.x) || isNaN(point.y) || !isFinite(point.x) || !isFinite(point.y)) return;

      pdf.rect(point.x - 2, point.y - 2, 4, 4, 'F'); // Square markers

      // Show percentage values above points
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(`${point.percentage}%`, point.x - 5, point.y - 5);
    });
  });

  // Legend - positioned at bottom right
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);

  const legendStartX = chartStartX + chartWidth - 80;
  const legendStartY = chartY + chartHeight + 15;

  yearLabels.forEach((year, index) => {
    const color = colors[index % colors.length];
    const legendY = legendStartY + index * 8;

    // Legend square marker
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(legendStartX, legendY - 2, 4, 4, 'F');

    // Legend text
    pdf.setTextColor(0, 0, 0);
    pdf.text(year, legendStartX + 8, legendY + 1);
  });
}

// Helper function to generate recommendations based on user type data
function generateRecommendations(userType: any): string[] {
  const recommendations = [];

  // Performance-based recommendations
  if (userType.completionRate < 50) {
    recommendations.push(`${userType.userType} shows low completion rates. Consider follow-up procedures.`);
  } else if (userType.completionRate > 80) {
    recommendations.push(`${userType.userType} demonstrates excellent service utilization.`);
  }

  // Volume-based recommendations
  if (userType.totalTransactions > 100) {
    recommendations.push(`High volume user type. Consider dedicated service hours.`);
  } else if (userType.totalTransactions < 20) {
    recommendations.push(`Low utilization. Investigate potential barriers to service access.`);
  }

  // Service-specific recommendations
  if (userType.medical.pending > userType.medical.completed) {
    recommendations.push(`Medical consultations have high pending rates. Review processing workflow.`);
  }

  if (userType.dental.total > 0 && userType.dental.completed === 0) {
    recommendations.push(`No completed dental consultations. Check service availability.`);
  }

  // Configuration-based recommendations
  if (userType.configuration?.required_fields?.length > 5) {
    recommendations.push(`Complex profile requirements. Consider simplifying registration process.`);
  }

  // Default recommendation if none apply
  if (recommendations.length === 0) {
    recommendations.push(`${userType.userType} shows stable service utilization patterns.`);
    recommendations.push(`Monitor trends and maintain current service levels.`);
  }

  return recommendations.slice(0, 4); // Limit to 4 recommendations
}

// Demographics Breakdown Pages - One page per user type with detailed demographics
function addDemographicsBreakdownPages(pdf: any, userTypeData: any[], pageWidth: number, pageHeight: number, leftMargin: number) {
  const allUserTypes = userTypeData; // Show ALL user types (including those with zero records)

  allUserTypes.forEach((userType, index) => {
    // Add new page for each user type's demographics
    pdf.addPage();

    // Page Header
    pdf.setFillColor(128, 0, 0); // WMSU maroon color
    pdf.rect(0, 0, pageWidth, 35, 'F');

    // Add subtle gradient effect
    pdf.setFillColor(100, 0, 0); // Darker maroon
    pdf.rect(0, 30, pageWidth, 5, 'F');

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${userType.userType} Demographics`, pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Detailed Demographics & Configuration Analysis`, pageWidth / 2, 25, { align: 'center' });

    // Reset text color and start content
    pdf.setTextColor(0, 0, 0);
    let yPos = 50;

    // Demographics Summary Card
    pdf.setFillColor(248, 250, 252);
    pdf.rect(leftMargin, yPos, pageWidth - 2 * leftMargin, 40, 'F');
    pdf.setDrawColor(128, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(leftMargin, yPos, pageWidth - 2 * leftMargin, 40, 'S');

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(128, 0, 0);
    pdf.text('Demographics Overview', leftMargin + 10, yPos + 12);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Total Services: ${userType.totalTransactions}`, leftMargin + 10, yPos + 22);
    pdf.text(`Completion Rate: ${userType.completionRate.toFixed(1)}%`, leftMargin + 10, yPos + 30);

    const isEnabled = userType.configuration?.enabled !== false;
    pdf.text(`Configuration: ${isEnabled ? 'Active' : 'Disabled'}`, leftMargin + 120, yPos + 22);
    const reqFields = userType.configuration?.required_fields?.length || 0;
    pdf.text(`Required Fields: ${reqFields}`, leftMargin + 120, yPos + 30);

    yPos += 55;

    // Demographics Breakdown Section with smaller graphs
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Demographics Breakdown', leftMargin, yPos);
    yPos += 15;

    // Use configuration data for demographics with line charts
    if (userType.configuration?.available_options) {
      const config = userType.configuration.available_options;
      const chartHeight = 60; // Fixed height for both charts

      if (userType.userType.toLowerCase().includes('college')) {
        drawDemographicLineChart(pdf, 'Courses & Year Levels', config.courses, config.year_levels, userType.totalTransactions, leftMargin, yPos, pageWidth - 2 * leftMargin, chartHeight);
        yPos += chartHeight + 15; // Add spacing after demographics chart
      } else if (userType.userType.toLowerCase().includes('employee')) {
        drawDemographicLineChart(pdf, 'Departments & Positions', config.departments, config.position_types, userType.totalTransactions, leftMargin, yPos, pageWidth - 2 * leftMargin, chartHeight);
        yPos += chartHeight + 15;
      } else if (userType.userType.toLowerCase().includes('senior high')) {
        drawDemographicLineChart(pdf, 'Strands & Grade Levels', config.strands, config.year_levels, userType.totalTransactions, leftMargin, yPos, pageWidth - 2 * leftMargin, chartHeight);
        yPos += chartHeight + 15;
      } else if (userType.userType.toLowerCase().includes('high school')) {
        drawDemographicLineChart(pdf, 'Grade Levels', config.year_levels, [], userType.totalTransactions, leftMargin, yPos, pageWidth - 2 * leftMargin, chartHeight);
        yPos += chartHeight + 15;
      } else {
        drawDemographicLineChart(pdf, 'Available Options', config.year_levels, [], userType.totalTransactions, leftMargin, yPos, pageWidth - 2 * leftMargin, chartHeight);
        yPos += chartHeight + 15;
      }

      // Service Utilization Pattern - Same size as demographics chart
      if (yPos < pageHeight - 100) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Service Utilization Pattern', leftMargin, yPos);
        yPos += 12;

        // Create a chart with the same height as demographics
        const serviceChartHeight = chartHeight; // Same height as demographics chart
        const serviceChartWidth = pageWidth - 2 * leftMargin - 60;

        // Chart background
        pdf.setFillColor(249, 250, 251);
        pdf.rect(leftMargin, yPos, serviceChartWidth, serviceChartHeight - 15, 'F');
        pdf.setDrawColor(229, 231, 235);
        pdf.rect(leftMargin, yPos, serviceChartWidth, serviceChartHeight - 15, 'S');

        const serviceData = [
          { name: 'Medical', value: userType.medical.total, color: [59, 130, 246] },
          { name: 'Dental', value: userType.dental.total, color: [16, 185, 129] },
          { name: 'Documents', value: userType.documents.total, color: [245, 158, 11] }
        ];

        const maxValue = Math.max(...serviceData.map(s => s.value), 1);

        serviceData.forEach((service, sIndex) => {
          const barY = yPos + 8 + sIndex * 12;
          const barWidth = service.value > 0 ? (service.value / maxValue) * (serviceChartWidth - 80) : 5;

          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81);
          pdf.text(service.name, leftMargin + 5, barY + 6);

          // Background bar
          pdf.setFillColor(240, 240, 240);
          pdf.rect(leftMargin + 50, barY, serviceChartWidth - 130, 8, 'F');

          // Service bar
          pdf.setFillColor(service.color[0], service.color[1], service.color[2]);
          pdf.rect(leftMargin + 50, barY, barWidth, 8, 'F');

          // Value
          pdf.setFontSize(7);
          pdf.text(service.value.toString(), leftMargin + serviceChartWidth - 70, barY + 6);
        });
      }
    }

    // Page footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(`${userType.userType} Demographics - Page ${index + 1}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
  });
}

// Page 3+: Performance Analytics & Summary with enhanced layout
function addPerformanceSummaryPage(pdf: any, userTypeData: any[], stats: any, pageWidth: number, pageHeight: number, leftMargin: number, pageNumber: number = 3) {
  let yPos = 35;

  // Enhanced Page Header with improved spacing
  pdf.setFillColor(128, 0, 0); // WMSU maroon color
  pdf.rect(0, 0, pageWidth, 35, 'F'); // Reduced from 45 to 35

  // Add subtle gradient effect for depth
  pdf.setFillColor(100, 0, 0); // Darker maroon
  pdf.rect(0, 30, pageWidth, 5, 'F'); // Adjusted positioning

  pdf.setFontSize(16); // Reduced from 22
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Performance Analytics & Summary', pageWidth / 2, 15, { align: 'center' }); // Adjusted positioning

  pdf.setFontSize(9); // Reduced from 12
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Comprehensive Performance Metrics & Insights | Page ${pageNumber}`, pageWidth / 2, 25, { align: 'center' }); // Adjusted positioning

  // Reset text color
  pdf.setTextColor(0, 0, 0);
  yPos = 45; // Reduced from 60

  // Key Performance Indicators Section with enhanced spacing
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Performance Indicators', leftMargin, yPos);
  yPos += 18;

  // KPI Cards with enhanced design and improved spacing
  const cardSpacing = 10; // Reduced spacing to fit better
  const cardWidth = (pageWidth - 2 * leftMargin - 3 * cardSpacing) / 4;
  const cardHeight = 45; // Slightly reduced card height

  const kpis = [
    {
      title: 'Overall Success',
      value: `${((stats.medical.completed + stats.dental.completed + stats.documents.issued) / (stats.medical.total + stats.dental.total + stats.documents.total) * 100).toFixed(1)}%`,
      color: [59, 130, 246],
      subtitle: 'All Services'
    },
    {
      title: 'Active Types',
      value: userTypeData.filter(ut => ut.totalTransactions > 0).length.toString(),
      color: [16, 185, 129],
      subtitle: 'User Categories'
    },
    {
      title: 'Total Volume',
      value: (stats.medical.total + stats.dental.total + stats.documents.total).toString(),
      color: [245, 158, 11],
      subtitle: 'All Services'
    },
    {
      title: 'Peak Efficiency',
      value: `${Math.max(...userTypeData.map(ut => ut.completionRate)).toFixed(0)}%`,
      color: [34, 197, 94],
      subtitle: 'Best Performance'
    }
  ];

  kpis.forEach((kpi, index) => {
    const cardX = leftMargin + index * (cardWidth + cardSpacing);

    // Card with enhanced shadow effect
    pdf.setFillColor(235, 235, 235);
    pdf.rect(cardX + 2, yPos + 2, cardWidth, cardHeight, 'F'); // Enhanced shadow

    pdf.setFillColor(248, 250, 252);
    pdf.rect(cardX, yPos, cardWidth, cardHeight, 'F');

    // Enhanced color accent border
    pdf.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.setLineWidth(2.5);
    pdf.rect(cardX, yPos, cardWidth, cardHeight, 'S');

    // Enhanced top accent bar
    pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.rect(cardX, yPos, cardWidth, 5, 'F');

    // Title with improved typography
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    pdf.text(kpi.title, cardX + cardWidth / 2, yPos + 17, { align: 'center' });

    // Value with enhanced styling
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.text(kpi.value, cardX + cardWidth / 2, yPos + 30, { align: 'center' });

    // Subtitle with improved spacing
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(kpi.subtitle, cardX + cardWidth / 2, yPos + 41, { align: 'center' });
  });

  yPos += cardHeight + 25; // Reduced spacing

  // Service Performance Comparison with enhanced spacing
  pdf.setFontSize(16); // Reduced font size
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Service Performance Comparison', leftMargin, yPos);
  yPos += 18; // Reduced spacing

  const chartHeight = 50; // Reduced chart height
  const chartWidth = pageWidth - 2 * leftMargin;

  // Chart background with enhanced grid and styling
  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(249, 250, 251);
  pdf.rect(leftMargin, yPos, chartWidth, chartHeight, 'FD');

  // Add subtle grid lines for better readability
  pdf.setDrawColor(240, 242, 247);
  pdf.setLineWidth(0.3);
  for (let i = 1; i < 5; i++) {
    const gridY = yPos + (i * chartHeight / 5);
    pdf.line(leftMargin, gridY, leftMargin + chartWidth, gridY);
  }

  const services = [
    { name: 'Medical Consultations', total: stats.medical.total, completed: stats.medical.completed, color: [59, 130, 246] },
    { name: 'Dental Consultations', total: stats.dental.total, completed: stats.dental.completed, color: [16, 185, 129] },
    { name: 'Medical Documents', total: stats.documents.total, completed: stats.documents.issued, color: [245, 158, 11] }
  ];

  const maxServiceValue = Math.max(...services.map(s => s.total), 1); // Ensure minimum of 1

  services.forEach((service, index) => {
    const barY = yPos + 10 + index * 15; // Increased spacing between bars
    const barWidth = chartWidth - 90; // More space for labels
    const totalBarWidth = service.total > 0 ? (service.total / maxServiceValue) * barWidth : 0;
    const completedBarWidth = service.total > 0 ? (service.completed / service.total) * totalBarWidth : 0;

    // Service label with improved spacing
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text(service.name, leftMargin + 8, barY + 7);

    // Enhanced background bar
    pdf.setFillColor(243, 244, 246);
    pdf.rect(leftMargin + 80, barY, barWidth, 10, 'F');

    // Total bar (light shade)
    const lightColor = service.color.map(c => Math.min(255, c + 60));
    pdf.setFillColor(...lightColor);
    pdf.rect(leftMargin + 80, barY, totalBarWidth, 10, 'F');

    // Completed bar
    pdf.setFillColor(...service.color);
    pdf.rect(leftMargin + 80, barY, completedBarWidth, 10, 'F');

    // Statistics
    const rate = service.total > 0 ? ((service.completed / service.total) * 100).toFixed(1) : '0';
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${service.completed}/${service.total} (${rate}%)`, leftMargin + 85 + barWidth, barY + 6);
  });

  yPos += chartHeight + 18; // Reduced spacing

  // Top Performers Ranking
  pdf.setFontSize(14); // Reduced font size
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Performing User Types', leftMargin, yPos);
  yPos += 12; // Reduced spacing

  const topUserTypes = userTypeData
    .filter(ut => ut.totalTransactions > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 6);

  // Performance ranking chart
  const rankingChartHeight = 40;
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(leftMargin, yPos, chartWidth, rankingChartHeight, 'S');

  topUserTypes.forEach((userType, index) => {
    const barWidth = chartWidth / topUserTypes.length;
    const barX = leftMargin + index * barWidth;
    const barHeight = (userType.completionRate / 100) * (rankingChartHeight - 15);
    const barY = yPos + rankingChartHeight - 5 - barHeight;

    // Performance color coding
    const color = userType.completionRate >= 80 ? [34, 197, 94] :
      userType.completionRate >= 60 ? [59, 130, 246] :
        userType.completionRate >= 40 ? [245, 158, 11] : [239, 68, 68];

    // Bar with gradient effect
    const lightColor = color.map(c => Math.min(255, c + 40));
    pdf.setFillColor(...lightColor);
    pdf.rect(barX + 5, barY, barWidth - 10, barHeight, 'F');

    pdf.setFillColor(...color);
    pdf.rect(barX + 5, barY + barHeight - 5, barWidth - 10, 5, 'F');

    // Ranking number
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`#${index + 1}`, barX + barWidth / 2, barY + 5, { align: 'center' });

    // Labels
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const shortName = userType.userType.length > 12 ? userType.userType.substring(0, 12) + '...' : userType.userType;
    pdf.text(shortName, barX + barWidth / 2, yPos + rankingChartHeight + 8, { align: 'center' });
    pdf.text(`${userType.completionRate.toFixed(1)}%`, barX + barWidth / 2, yPos + rankingChartHeight + 14, { align: 'center' });
  });

  // Page footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Page ${pageNumber} - Performance Analytics & Summary`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

// Helper function to add clinician performance page
function addClinicianPerformancePage(pdf: any, clinicians: any[], pageWidth: number, pageHeight: number, leftMargin: number) {
  let yPos = 30;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('STAFF ACTIVITY & SERVICE DELIVERY', leftMargin, yPos);
  yPos += 12;

  autoTable(pdf, {
    startY: yPos,
    head: [['Service Provider', 'Medical', 'Dental', 'Docs', 'Total', 'Share']],
    body: clinicians.sort((a, b) => b.consultations - a.consultations).map(staff => {
      const total = clinicians.reduce((sum, c) => sum + c.consultations, 0);
      const share = total > 0 ? ((staff.consultations / total) * 100).toFixed(1) : '0';
      return [
        staff.name,
        (staff.medical_count || 0).toString(),
        (staff.dental_count || 0).toString(),
        (staff.document_count || 0).toString(),
        staff.consultations.toString(),
        `${share}%`
      ];
    }),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
  });

  const finalY = (pdf as any).lastAutoTable?.finalY || (yPos + 12);
  yPos = finalY;

  // Summary Insights
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Insights', leftMargin, yPos);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const totalConsultations = clinicians.reduce((sum, c) => sum + c.consultations, 0);
  const topClinician = [...clinicians].sort((a, b) => b.consultations - a.consultations)[0];
  const insights = [
    `Total active clinical staff recorded: ${clinicians.length}`,
    `Total completed consultations: ${totalConsultations}`,
    `Average consultations per staff member: ${clinicians.length > 0 ? (totalConsultations / clinicians.length).toFixed(1) : 0}`,
    `Lead clinician for the period: ${topClinician ? topClinician.name : 'N/A'} (${topClinician ? topClinician.consultations : 0} records)`
  ];

  insights.forEach(insight => {
    pdf.text(`• ${insight}`, leftMargin + 5, yPos);
    yPos += 6;
  });
}

// Helper function to add user type breakdown page
function addUserTypeBreakdownPage(pdf: any, userTypeData: UserTypeData[], pageWidth: number, pageHeight: number, leftMargin: number) {
  let yPos = 30;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('USER TYPE BREAKDOWN', leftMargin, yPos);
  yPos += 12;

  const rows = userTypeData.map(userType => {
    const medicalTotal = userType.medical?.total || 0;
    const dentalTotal = userType.dental?.total || 0;
    const documentsTotal = userType.documents?.total || 0;
    const documentsCompleted = (userType.documents as any)?.issued || (userType.documents as any)?.completed || 0;
    const total = medicalTotal + dentalTotal + documentsTotal;
    const completed = (userType.medical?.completed || 0) + (userType.dental?.completed || 0) + documentsCompleted;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

    return [
      userType.userType,
      medicalTotal.toString(),
      dentalTotal.toString(),
      documentsTotal.toString(),
      total.toString(),
      `${rate}%`
    ];
  });

  autoTable(pdf, {
    startY: yPos,
    head: [['User Type', 'Medical', 'Dental', 'Documents', 'Total', 'Success Rate']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
  });

  yPos = (pdf as any).lastAutoTable?.finalY || (yPos + 8);

  const totals = userTypeData.reduce(
    (acc, userType) => {
      const medicalTotal = userType.medical?.total || 0;
      const dentalTotal = userType.dental?.total || 0;
      const documentsTotal = userType.documents?.total || 0;
      const documentsCompleted = (userType.documents as any)?.issued || (userType.documents as any)?.completed || 0;
      acc.medical += medicalTotal;
      acc.dental += dentalTotal;
      acc.documents += documentsTotal;
      acc.completed += (userType.medical?.completed || 0) + (userType.dental?.completed || 0) + documentsCompleted;
      return acc;
    },
    { medical: 0, dental: 0, documents: 0, completed: 0 }
  );

  const grandTotal = totals.medical + totals.dental + totals.documents;
  const grandRate = grandTotal > 0 ? ((totals.completed / grandTotal) * 100).toFixed(1) : '0.0';

  autoTable(pdf, {
    startY: yPos,
    body: [[
      'TOTAL SYSTEM SUMMARY',
      totals.medical.toString(),
      totals.dental.toString(),
      totals.documents.toString(),
      grandTotal.toString(),
      `${grandRate}%`
    ]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, fontStyle: 'bold', fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });
}

// Generate service-specific PDF report with demographics
export const generateServiceSpecificPDFReport = async (
  stats: StatsData,
  userTypeData: UserTypeData[],
  serviceType: 'medical' | 'dental' | 'certificates',
  reportType: 'weekly' | 'monthly' | 'yearly' = 'monthly',
  medicalInventory?: Array<{
    item_name: string;
    quantity_used: number;
    unit: string;
    total_cost?: number;
    usage_date?: string;
  }>
): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 15;
    const rightMargin = 105;

    const [wmsuLogo, healthLogo] = await Promise.all([
      loadLogo('/WMSU-Logo.jpg'),
      loadLogo('/WMSU-HealthLogo.png')
    ]);

    if (wmsuLogo) pdf.addImage(wmsuLogo, 'PNG', 20, 15, 20, 20);
    if (healthLogo) pdf.addImage(healthLogo, 'PNG', 170, 15, 20, 20);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WESTERN MINDANAO STATE UNIVERSITY', pageWidth / 2, 22, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('UNIVERSITY HEALTH SERVICES CENTER', pageWidth / 2, 28, { align: 'center' });
    pdf.text('Zamboanga City', pageWidth / 2, 33, { align: 'center' });

    pdf.setDrawColor(139, 0, 0); // Maroon color
    pdf.setLineWidth(1);
    pdf.line(20, 38, 190, 38);

    pdf.setFillColor(139, 0, 0);
    pdf.rect(20, 42, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const titleText = `${serviceType.toUpperCase()} SERVICES ${reportType.toUpperCase()} REPORT`;
    pdf.text(titleText, pageWidth / 2, 48.5, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    let yPosition = 60;

    // Service statistics definition
    let serviceStats;
    if (serviceType === 'medical') {
      serviceStats = stats.medical;
    } else if (serviceType === 'dental') {
      serviceStats = stats.dental;
    } else {
      serviceStats = stats.documents;
    }

    // Main Table - Professional structure
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service Report Details`, leftMargin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(leftMargin, yPosition, pageWidth - 2 * leftMargin, 8, 'F');

    pdf.text('User Type', leftMargin + 2, yPosition + 6);
    pdf.text('Total', leftMargin + 60, yPosition + 6);
    pdf.text('Completed', leftMargin + 90, yPosition + 6);
    pdf.text('Pending', leftMargin + 120, yPosition + 6);
    pdf.text('Success Rate', leftMargin + 150, yPosition + 6);

    yPosition += 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    if (Array.isArray(userTypeData)) {
      userTypeData.forEach((user, index) => {
      // Check for page overflow
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;

        // Re-draw headers on new page
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(leftMargin, yPosition, pageWidth - 2 * leftMargin, 8, 'F');
        pdf.text('User Type', leftMargin + 2, yPosition + 6);
        pdf.text('Total', leftMargin + 60, yPosition + 6);
        pdf.text('Completed', leftMargin + 90, yPosition + 6);
        pdf.text('Pending', leftMargin + 120, yPosition + 6);
        pdf.text('Success Rate', leftMargin + 150, yPosition + 6);
        yPosition += 12;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
      }

      let userServiceData;
      if (serviceType === 'medical') {
        userServiceData = user.medical;
      } else if (serviceType === 'dental') {
        userServiceData = user.dental;
      } else {
        userServiceData = user.documents;
      }

      if (!userServiceData) {
        userServiceData = { total: 0, completed: 0, pending: 0 };
      }
      
      const completed = serviceType === 'certificates' ? (userServiceData.completed || userServiceData.issued || 0) : (userServiceData.completed || 0);
      const rate = userServiceData.total > 0 ? ((completed / userServiceData.total) * 100).toFixed(1) : '0';

      // Draw row line
      pdf.setDrawColor(230, 230, 230);
      pdf.line(leftMargin, yPosition + 2, pageWidth - leftMargin, yPosition + 2);

      pdf.text(user.userType, leftMargin + 2, yPosition);
      pdf.text(userServiceData.total.toString(), leftMargin + 60, yPosition);
      pdf.text(completed.toString(), leftMargin + 90, yPosition);
      pdf.text(userServiceData.pending.toString(), leftMargin + 120, yPosition);
      pdf.text(`${rate}%`, leftMargin + 150, yPosition);

      yPosition += 8;
      });
    }

    // Summary Section at the bottom of the table
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);
    yPosition += 6;

    pdf.text('TOTAL SYSTEM SUMMARY', leftMargin + 2, yPosition);
    pdf.text(serviceStats.total.toString(), leftMargin + 60, yPosition);
    const totalCompletedVal = (serviceType === 'certificates' ? (serviceStats?.issued || 0) : (serviceStats?.completed || 0));
    pdf.text(totalCompletedVal.toString(), leftMargin + 90, yPosition);
    pdf.text(serviceStats?.pending?.toString() || '0', leftMargin + 120, yPosition);
    pdf.text(`${(serviceStats?.total || 0) > 0 ? (totalCompletedVal / serviceStats.total * 100).toFixed(1) : '0'}%`, leftMargin + 150, yPosition);

    yPosition += 15;

    // Add Medical Inventory section for dental reports
    if (serviceType === 'dental' && medicalInventory && medicalInventory.length > 0) {
      yPosition += 15;

      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Medical Items Used in ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Dental Services`, leftMargin, yPosition);
      yPosition += 8;

      // Table header
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Item Name', leftMargin, yPosition);
      pdf.text('Quantity Used', leftMargin + 40, yPosition);
      pdf.text('Unit', leftMargin + 65, yPosition);
      if (medicalInventory.some(item => item.total_cost)) {
        pdf.text('Total Cost', leftMargin + 80, yPosition);
      }
      yPosition += 6;

      // Draw header underline
      pdf.line(leftMargin, yPosition - 2, leftMargin + 90, yPosition - 2);

      // Table data
      pdf.setFont('helvetica', 'normal');
      medicalInventory.slice(0, 20).forEach(item => { // Limit to 20 items to avoid overflow
        pdf.text(item.item_name.length > 25 ? item.item_name.substring(0, 25) + '...' : item.item_name, leftMargin, yPosition);
        pdf.text(item.quantity_used.toString(), leftMargin + 40, yPosition);
        pdf.text(item.unit || 'pcs', leftMargin + 65, yPosition);
        if (item.total_cost) {
          pdf.text(`₱${item.total_cost.toFixed(2)}`, leftMargin + 80, yPosition);
        }
        yPosition += 4;

        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 30;
        }
      });

      // Summary
      yPosition += 6;
      const totalItems = medicalInventory.reduce((sum, item) => sum + item.quantity_used, 0);
      const totalCost = medicalInventory.reduce((sum, item) => sum + (item.total_cost || 0), 0);

      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Items Used: ${totalItems}`, leftMargin, yPosition);
      if (totalCost > 0) {
        pdf.text(`Total Cost: ₱${totalCost.toFixed(2)}`, leftMargin + 50, yPosition);
      }
      yPosition += 4;

      if (medicalInventory.length > 20) {
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Note: Showing top 20 items. Total ${medicalInventory.length} items used.`, leftMargin, yPosition);
        yPosition += 4;
      }
    }

    // Page 2: Clinician Performance for this service
    if (stats.clinicians && stats.clinicians.length > 0) {
      pdf.addPage();
      addClinicianPerformancePage(pdf, stats.clinicians, pageWidth, pageHeight, leftMargin);
    }

    // Page 3: Medicine Usage
    if (stats.medicine_usage && stats.medicine_usage.length > 0) {
      pdf.addPage();
      addMedicineUsagePage(pdf, stats.medicine_usage, stats.medical_med_total_entries || 0, pageWidth, pageHeight, leftMargin);
    }

    // Page footer for all pages
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`WMSU Health Services - Institutional Report | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`WMSU-${serviceType}-${reportType}-Detailed-Report-${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error('Error generating service-specific PDF report:', error);
    throw new Error('Failed to generate service-specific PDF report. Please try again.');
  }
};

// Enhanced CSV export with detailed demographic breakdown by service type
export const generateServiceSpecificCSV = (
  stats: StatsData,
  userTypeData: UserTypeData[],
  serviceType: 'medical' | 'dental' | 'certificates',
  reportType: 'weekly' | 'monthly' | 'yearly' = 'monthly',
  medicalInventory?: Array<{ item_name: string; quantity_used: number; unit?: string; total_cost?: number; }>
): string => {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString();

  let csvContent = `WMSU Health Services ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Consultations Report\n`;
  csvContent += `Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n`;
  csvContent += `Generated on: ${currentDate}\n`;
  csvContent += `Generated at: ${currentTime}\n`;
  csvContent += `Academic Semester: 2024-2025\n`;
  csvContent += `\n`;

  // Service-specific overview
  csvContent += `=== ${serviceType.toUpperCase()} CONSULTATIONS OVERVIEW ===\n`;

  if (serviceType === 'medical') {
    csvContent += `Total Medical Consultations: ${stats.medical.total}\n`;
    csvContent += `Completed: ${stats.medical.completed}\n`;
    csvContent += `Pending: ${stats.medical.pending}\n`;
    csvContent += `Rejected: ${stats.medical.rejected}\n`;
    csvContent += `Completion Rate: ${stats.medical.total > 0 ? ((stats.medical.completed / stats.medical.total) * 100).toFixed(1) : '0'}%\n`;
  } else if (serviceType === 'dental') {
    csvContent += `Total Dental Consultations: ${stats.dental.total}\n`;
    csvContent += `Completed: ${stats.dental.completed}\n`;
    csvContent += `Pending: ${stats.dental.pending}\n`;
    csvContent += `Rejected: ${stats.dental.rejected}\n`;
    csvContent += `Completion Rate: ${stats.dental.total > 0 ? ((stats.dental.completed / stats.dental.total) * 100).toFixed(1) : '0'}%\n`;
  } else if (serviceType === 'certificates') {
    csvContent += `Total Medical Certificates: ${stats.documents.total}\n`;
    csvContent += `Issued: ${stats.documents.issued}\n`;
    csvContent += `Pending: ${stats.documents.pending}\n`;
    csvContent += `Issuance Rate: ${stats.documents.total > 0 ? ((stats.documents.issued / stats.documents.total) * 100).toFixed(1) : '0'}%\n`;
  }

  csvContent += `\n`;

  // Detailed demographic breakdown
  csvContent += `=== DEMOGRAPHIC BREAKDOWN BY USER TYPE ===\n`;
  csvContent += `User Type,Sub-Category,Total Consultations,Completed,Pending,Rejected,Completion Rate (%),Additional Details\n`;

  userTypeData.forEach(user => {
    let serviceTotal = 0;
    let serviceCompleted = 0;
    let servicePending = 0;
    let serviceRejected = 0;

    if (serviceType === 'medical') {
      serviceTotal = user.medical.total;
      serviceCompleted = user.medical.completed;
      servicePending = user.medical.pending || 0;
      serviceRejected = user.medical.rejected || 0;
    } else if (serviceType === 'dental') {
      serviceTotal = user.dental.total;
      serviceCompleted = user.dental.completed;
      servicePending = user.dental.pending || 0;
      serviceRejected = user.dental.rejected || 0;
    } else if (serviceType === 'certificates') {
      serviceTotal = user.documents.total;
      serviceCompleted = user.documents.completed || user.documents.issued || 0;
      servicePending = user.documents.pending || 0;
      serviceRejected = user.documents.rejected || 0;
    }

    const completionRate = serviceTotal > 0 ? ((serviceCompleted / serviceTotal) * 100).toFixed(1) : '0';

    // Generate additional details based on user type
    let additionalDetails = '';
    switch (user.userType) {
      case 'Kindergarten':
        additionalDetails = 'Early Childhood Education';
        break;
      case 'Elementary':
        additionalDetails = 'Primary Education (Grades 1-6)';
        break;
      case 'High School':
        additionalDetails = 'Secondary Education (Grades 7-10)';
        break;
      case 'Senior High School':
        additionalDetails = 'Senior High Education (Grades 11-12)';
        break;
      case 'College':
        additionalDetails = 'Undergraduate Studies';
        break;
      case 'Incoming Freshman':
        additionalDetails = 'New College Students';
        break;
      case 'Employee':
        additionalDetails = 'University Staff/Faculty';
        break;
      default:
        additionalDetails = 'General';
    }

    csvContent += `${user.userType},"${additionalDetails}",${serviceTotal},${serviceCompleted},${servicePending},${serviceRejected},${completionRate},"${additionalDetails}"\n`;
  });

  csvContent += `\n`;

  // Academic level breakdown for students
  csvContent += `=== ACADEMIC LEVEL ANALYSIS ===\n`;
  csvContent += `Level Category,Description,Estimated Population,${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Consultations,Utilization Rate (%)\n`;

  const studentTypes = userTypeData.filter(user =>
    ['Kindergarten', 'Elementary', 'High School', 'Senior High School', 'College', 'Incoming Freshman'].includes(user.userType)
  );

  const employeeTypes = userTypeData.filter(user => user.userType === 'Employee');

  studentTypes.forEach(student => {
    let serviceCount = 0;
    if (serviceType === 'medical') serviceCount = student.medical.total;
    else if (serviceType === 'dental') serviceCount = student.dental.total;
    else if (serviceType === 'certificates') serviceCount = student.documents.total;

    const estimatedPop = student.totalTransactions * 10; // Rough estimate
    const utilizationRate = estimatedPop > 0 ? ((serviceCount / estimatedPop) * 100).toFixed(1) : '0';

    csvContent += `${student.userType},"Student Population",${estimatedPop},${serviceCount},${utilizationRate}\n`;
  });

  if (employeeTypes.length > 0) {
    const totalEmployeeConsultations = employeeTypes.reduce((sum, emp) => {
      if (serviceType === 'medical') return sum + emp.medical.total;
      else if (serviceType === 'dental') return sum + emp.dental.total;
      else if (serviceType === 'certificates') return sum + emp.documents.total;
      return sum;
    }, 0);

    csvContent += `Employee,"Faculty & Staff",${employeeTypes.reduce((sum, emp) => sum + emp.totalTransactions * 5, 0)},${totalEmployeeConsultations},"High Priority"\n`;
  }

  csvContent += `\n`;

  // Service-specific insights
  csvContent += `=== ${serviceType.toUpperCase()} SERVICE INSIGHTS ===\n`;

  if (serviceType === 'medical') {
    csvContent += `Service Focus: General health consultations, medical examinations, health monitoring\n`;
    csvContent += `Peak Demand: College and High School students during enrollment periods\n`;
    csvContent += `Common Issues: Health clearance for enrollment, general checkups, illness consultations\n`;
  } else if (serviceType === 'dental') {
    csvContent += `Service Focus: Dental checkups, cleanings, basic dental treatments\n`;
    csvContent += `Peak Demand: Semester starts and health awareness months\n`;
    csvContent += `Common Issues: Routine cleanings, cavity treatments, dental clearance\n`;
  } else if (serviceType === 'certificates') {
    csvContent += `Service Focus: Medical certificate issuance for various purposes\n`;
    csvContent += `Peak Demand: Job applications, school transfers, travel requirements\n`;
    csvContent += `Common Types: Health clearance, fitness certificates, medical leave documentation\n`;
  }

  csvContent += `\n`;

  // Monthly trends if available
  if (stats.monthly_trends && stats.monthly_trends.length > 0) {
    csvContent += `=== MONTHLY TRENDS ===\n`;
    csvContent += `Month,${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Consultations,Growth Rate (%)\n`;

    stats.monthly_trends.forEach((trend, index) => {
      let currentCount = 0;
      if (serviceType === 'medical') currentCount = trend.medical || 0;
      else if (serviceType === 'dental') currentCount = trend.dental || 0;
      else if (serviceType === 'certificates') currentCount = trend.documents || 0;

      let growthRate = '0';
      if (index > 0) {
        const prevTrend = stats.monthly_trends![index - 1];
        let prevCount = 0;
        if (serviceType === 'medical') prevCount = prevTrend.medical || 0;
        else if (serviceType === 'dental') prevCount = prevTrend.dental || 0;
        else if (serviceType === 'certificates') prevCount = prevTrend.documents || 0;

        if (prevCount > 0) {
          growthRate = (((currentCount - prevCount) / prevCount) * 100).toFixed(1);
        }
      }

      csvContent += `${trend.month},${currentCount},${growthRate}\n`;
    });
    csvContent += `\n`;
  }

  // Medical inventory section for dental reports
  if (serviceType === 'dental' && medicalInventory && medicalInventory.length > 0) {
    csvContent += `=== MEDICAL INVENTORY USAGE (${reportType.toUpperCase()}) ===\n`;
    csvContent += `Item Name,Quantity Used,Unit,Total Cost\n`;

    let totalQuantity = 0;
    let totalCost = 0;

    medicalInventory.forEach(item => {
      totalQuantity += item.quantity_used;
      totalCost += item.total_cost || 0;

      csvContent += `"${item.item_name}",${item.quantity_used},"${item.unit || 'pcs'}",${item.total_cost ? item.total_cost.toFixed(2) : '0.00'}\n`;
    });

    csvContent += `\n`;
    csvContent += `=== INVENTORY SUMMARY ===\n`;
    csvContent += `Total Items Used: ${totalQuantity}\n`;
    csvContent += `Total Cost: ₱${totalCost.toFixed(2)}\n`;
    csvContent += `Average Cost per Item: ₱${medicalInventory.length > 0 ? (totalCost / medicalInventory.length).toFixed(2) : '0.00'}\n`;
    csvContent += `Most Used Item: ${medicalInventory.length > 0 ? medicalInventory.reduce((prev, current) => (prev.quantity_used > current.quantity_used) ? prev : current).item_name : 'N/A'}\n`;
    csvContent += `\n`;
    csvContent += `=== INVENTORY INSIGHTS ===\n`;
    csvContent += `Report Period: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n`;
    csvContent += `Items Tracked: ${medicalInventory.length}\n`;
    csvContent += `Usage Pattern: Regular dental consumables and treatment materials\n`;
    csvContent += `Cost Efficiency: Optimized for routine dental procedures\n`;
    csvContent += `\n`;
  }

  // Report footer
  csvContent += `=== REPORT METADATA ===\n`;
  csvContent += `Service Type: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Consultations\n`;
  csvContent += `Report Generated by: WMSU Health Services Admin Dashboard\n`;
  csvContent += `System Status: Active\n`;
  csvContent += `Data Accuracy: Real-time\n`;
  csvContent += `Last Updated: ${currentDate} ${currentTime}\n`;
  csvContent += `Report ID: ${serviceType}-${reportType}-${currentDate.replace(/-/g, '')}\n`;

  return csvContent;
};

// Enhanced CSV export with more detailed data
export const generateEnhancedCSV = (
  stats: StatsData,
  userTypeData: UserTypeData[],
  reportType: 'weekly' | 'monthly' | 'yearly' = 'monthly'
): string => {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString();

  let csvContent = `WMSU Health Services ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report\n`;
  csvContent += `Generated on: ${currentDate}\n`;
  csvContent += `Generated at: ${currentTime}\n`;
  csvContent += `Academic Semester: 2024-2025\n`;
  csvContent += `Report Period: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n`;
  csvContent += `\n`;

  // Summary Statistics
  csvContent += `=== SUMMARY STATISTICS ===\n`;
  csvContent += `Category,Total,Completed,Pending,Completion Rate (%)\n`;

  const medicalRate = stats.medical.total > 0 ? ((stats.medical.completed / stats.medical.total) * 100).toFixed(1) : '0';
  const dentalRate = stats.dental.total > 0 ? ((stats.dental.completed / stats.dental.total) * 100).toFixed(1) : '0';
  const documentsRate = stats.documents.total > 0 ? ((stats.documents.issued / stats.documents.total) * 100).toFixed(1) : '0';
  const patientsRate = stats.patients.total > 0 ? ((stats.patients.verified / stats.patients.total) * 100).toFixed(1) : '0';

  csvContent += `Medical Consultations,${stats.medical.total},${stats.medical.completed},${stats.medical.pending},${medicalRate}\n`;
  csvContent += `Dental Consultations,${stats.dental.total},${stats.dental.completed},${stats.dental.pending},${dentalRate}\n`;
  csvContent += `Medical Documents,${stats.documents.total},${stats.documents.issued},${stats.documents.pending},${documentsRate}\n`;
  const pendingPatients = stats.patients.pending || stats.patients.unverified || 0;
  csvContent += `Patient Profiles,${stats.patients.total},${stats.patients.verified},${pendingPatients},${patientsRate}\n`;
  csvContent += `\n`;

  // User Type Breakdown
  csvContent += `=== USER TYPE BREAKDOWN ===\n`;
  csvContent += `User Type,Total Transactions,Completed Transactions,Medical Total,Medical Completed,Dental Total,Dental Completed,Documents Total,Documents Completed,Overall Rate (%)\n`;

  userTypeData.forEach(user => {
    const documentsCompleted = user.documents.completed || user.documents.issued || 0;
    csvContent += `${user.userType},${user.totalTransactions},${user.completedTransactions},${user.medical.total},${user.medical.completed},${user.dental.total},${user.dental.completed},${user.documents.total},${documentsCompleted},${user.completionRate.toFixed(1)}\n`;
  });
  csvContent += `\n`;

  // Monthly trends if available
  if (stats.monthly_trends && stats.monthly_trends.length > 0) {
    csvContent += `=== MONTHLY TRENDS ===\n`;
    csvContent += `Month,Medical,Dental,Documents,Total\n`;
    stats.monthly_trends.forEach(trend => {
      const total = (trend.medical || 0) + (trend.dental || 0) + (trend.documents || 0);
      csvContent += `${trend.month},${trend.medical || 0},${trend.dental || 0},${trend.documents || 0},${total}\n`;
    });
    csvContent += `\n`;
  }

  // Report Footer
  csvContent += `=== REPORT FOOTER ===\n`;
  csvContent += `Report Generated by: WMSU Health Services Admin Dashboard\n`;
  csvContent += `System Status: Active\n`;
  csvContent += `Data Accuracy: Real-time\n`;
  csvContent += `Last Updated: ${currentDate} ${currentTime}\n`;

  return csvContent;
};

// Helper function to add medicine usage page
function addMedicineUsagePage(pdf: any, medicineUsage: any[], medicalMedCount: number, pageWidth: number, pageHeight: number, leftMargin: number) {
  let yPos = 30;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('RESOURCE UTILIZATION & CONSUMABLES', leftMargin, yPos);
  yPos += 12;

  // Medicine Summary Table
  const medicalTotal = medicineUsage.filter(m => m.type === 'medical').reduce((sum, m) => sum + m.quantity, 0);
  const dentalTotal = medicineUsage.filter(m => m.type === 'dental').reduce((sum, m) => sum + m.quantity, 0);

  autoTable(pdf, {
    startY: yPos,
    head: [['Service Category', 'Total Items Consumed']],
    body: [
      ['Medical Consultations', medicalTotal.toString()],
      ['Dental Examinations', dentalTotal.toString()],
      ['Total Combined', (medicalTotal + dentalTotal).toString()]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
  });

  yPos = (pdf as any).lastAutoTable?.finalY || (yPos + 12);

  // Check if we need a new page for detailed breakdown
  if (yPos > pageHeight - 50) {
    pdf.addPage();
    yPos = 30;
  }

  pdf.setFontSize(11);
  pdf.text('DETAILED ITEM BREAKDOWN', leftMargin, yPos);
  yPos += 8;

  const tableBody = Array.isArray(medicineUsage) ? medicineUsage.sort((a, b) => b.quantity - a.quantity).map(item => [
    item.name || 'Unnamed Item',
    (item.quantity || 0).toString(),
    item.unit || 'pcs',
    item.type === 'dental' ? 'Dental' : 'Medical'
  ]) : [];

  autoTable(pdf, {
    startY: yPos,
    head: [['Item Name', 'Quantity Used', 'Unit', 'Service']],
    body: tableBody,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
  });

  const lastTableY = (pdf as any).lastAutoTable?.finalY || yPos;
  const finalY = lastTableY + 10;

  // Final check for bottom of page
  const textY = finalY > pageHeight - 20 ? pageHeight - 15 : finalY;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`Total Medical prescription entries analyzed: ${medicalMedCount || 0}`, leftMargin, textY);
}

// Download function for files
export const downloadFile = (filename: string, content: string | Blob, type: 'csv' | 'pdf' = 'csv') => {
  const blob = content instanceof Blob ? content : new Blob([content], {
    type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/pdf'
  });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};


/**
 * Exports a single patient profile to a professional PDF document
 */
export const exportPatientProfilePDF = async (patient: any): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const [wmsuLogo, healthLogo] = await Promise.all([
      loadLogo('/WMSU-Logo.jpg'),
      loadLogo('/WMSU-HealthLogo.png')
    ]);

    const clean = (value: any) => {
      if (value === undefined || value === null) return '';
      const s = String(value).trim().toLowerCase();
      if (s === 'undefined' || s === 'null' || s === '' || s === 'n/a' || s === 'none') return '';
      return String(value).trim();
    };

    const resolveText = (...values: any[]) => {
      for (const value of values) {
        const cleaned = clean(value);
        if (cleaned) return cleaned;
      }
      return 'N/A';
    };

    const yesNo = (value: any) => {
      if (value === true || value === 1 || value === '1' || value === 'true') return 'Yes';
      if (value === false || value === 0 || value === '0' || value === 'false') return 'No';
      return 'N/A';
    };

    const formatDate = (value: any) => {
      if (!value) return 'N/A';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return 'N/A';
      return parsed.toLocaleDateString('en-US');
    };

    const formatSemester = (schoolYear: any) => {
      if (!schoolYear) return 'N/A';
      const semMap: Record<string, string> = {
        '1st_semester': '1st',
        '2nd_semester': '2nd',
        'summer': 'Summer',
      };
      const semRaw = schoolYear.semester_type || '';
      const sem = semMap[semRaw] || semRaw;
      const currentLabel = schoolYear.is_current ? ' (Current)' : '';
      return `${schoolYear.academic_year || 'N/A'}${sem ? ` - ${sem}` : ''}${currentLabel}`;
    };

    const normalizePhotoSrc = (src: string) => {
      if (!src) return '';
      if (src.startsWith('data:')) return src;

      let url = src;
      if (!url.startsWith('http') && !url.startsWith('blob:')) {
        const base = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api').replace('/api', '');
        url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
      }

      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }

      return url;
    };

    // Header
    if (wmsuLogo) doc.addImage(wmsuLogo, 'PNG', 20, 15, 20, 20);
    if (healthLogo) doc.addImage(healthLogo, 'PNG', 170, 15, 20, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('WESTERN MINDANAO STATE UNIVERSITY', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('UNIVERSITY HEALTH SERVICES CENTER', pageWidth / 2, 28, { align: 'center' });
    doc.text('Zamboanga City', pageWidth / 2, 33, { align: 'center' });

    doc.setDrawColor(139, 0, 0); // Maroon color
    doc.setLineWidth(1);
    doc.line(20, 38, 190, 38);

    doc.setFillColor(139, 0, 0);
    doc.rect(20, 42, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT HEALTH PROFILE & CONSULTATIONS RECORD', pageWidth / 2, 48.5, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('(Electronic/Paper-based Input)', pageWidth / 2, 57, { align: 'center' });

    // Patient Photo if available
    if (typeof patient.photo === 'string' && patient.photo) {
      const photoSrc = normalizePhotoSrc(patient.photo);
      const photo = photoSrc ? await loadLogo(photoSrc) : null;
      if (photo) {
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, 65, 30, 40);
        doc.addImage(photo, 'PNG', 20.5, 65.5, 29, 39);
      } else {
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, 65, 30, 40);
        doc.setFontSize(8);
        doc.text('No Photo', 35, 85, { align: 'center' });
      }
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, 65, 30, 40);
      doc.setFontSize(8);
      doc.text('No Photo', 35, 85, { align: 'center' });
    }

    // Personal Information Table
    const fullName = resolveText(
      patient.name,
      `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.trim()
    );
    const religionValue = patient.religion === 'Other'
      ? resolveText(patient.religion_specify)
      : resolveText(patient.religion);

    autoTable(doc, {
      startY: 65,
      margin: { left: 55 },
      tableWidth: 135,
      head: [['PERSONAL INFORMATION', '']],
      body: [
        ['Name:', fullName],
        ['Sex:', resolveText(patient.gender)],
        ['Age:', patient.age?.toString() || 'N/A'],
        ['Year Level:', resolveText(patient.year_level, patient.grade_level)],
        ['Religion:', religionValue],
        ['Course:', resolveText(patient.course, patient.department)],
        ['Civil Status:', resolveText(patient.civil_status)],
        ['Birthday:', formatDate(patient.date_of_birth)],
        ['Nationality:', patient.nationality === 'Foreigner'
          ? `Foreigner (${resolveText(patient.nationality_specify)})`
          : resolveText(patient.nationality)
        ],
        ['Email:', resolveText(patient.email)],
        ['Contact #:', resolveText(patient.contact_number)],
        ['City/Municipality:', resolveText(patient.city_municipality)],
        ['Barangay:', resolveText(patient.barangay)],
        ['Street:', resolveText(patient.street)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 150;
    currentY += 8;

    // Emergency Contact
    autoTable(doc, {
      startY: currentY,
      margin: { left: 20 },
      head: [['EMERGENCY CONTACT', ''] ],
      body: [
        ['Name:', resolveText(
          `${patient.emergency_contact_first_name || ''} ${patient.emergency_contact_middle_name || ''} ${patient.emergency_contact_surname || ''}`.trim()
        )],
        ['Contact #:', resolveText(patient.emergency_contact_number)],
        ['Relationship:', resolveText(patient.emergency_contact_relationship)],
        ['Barangay:', resolveText(patient.emergency_contact_barangay)],
        ['Street:', resolveText(patient.emergency_contact_street)],
        ['Address:', resolveText(patient.emergency_contact_address)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 10);
    currentY += 8;

    const cleanArrayData = (data: any[]) => {
      if (!data || !Array.isArray(data)) return 'None reported';
      return data.map(item => typeof item === 'string' ? item : (item.name || item.condition || item.illness || 'Unknown'))
        .filter(Boolean)
        .join(', ') || 'None reported';
    };

    const formatVaccinationHistory = (history: any) => {
      if (!history || typeof history !== 'object' || Object.keys(history).length === 0) return 'None recorded';
      const labels: Record<string, string> = {
        'fully_vaccinated': 'Fully Vaccinated',
        'partially_vaccinated': 'Partially Vaccinated',
        'unvaccinated': 'Unvaccinated',
        'boosted': 'Boosted',
        'lapsed': 'Lapsed'
      };
      return Object.entries(history)
        .map(([name, status]) => `${name}: ${labels[status as string] || status}`)
        .join(', ');
    };

    const formatVaccinationRecords = (history: any) => {
      if (!history || typeof history !== 'object' || Object.keys(history).length === 0) return 'None recorded';
      const labels: Record<string, string> = {
        'fully_vaccinated': 'Fully Vaccinated',
        'partially_vaccinated': 'Partially Vaccinated',
        'unvaccinated': 'Unvaccinated',
        'boosted': 'Boosted',
        'lapsed': 'Lapsed'
      };
      return Object.entries(history)
        .map(([name, status]) => `${name} - ${labels[status as string] || status}`)
        .join('\n');
    };

    const formatMedications = (meds: any[]) => {
      if (!meds || !Array.isArray(meds) || meds.length === 0) return 'None reported';
      return meds.map((med, idx) => {
        const drug = med.custom_drug || med.drug || med.drug_type || med.name || 'Unknown Drug';
        const dose = med.dose || med.dosage || '';
        const unit = med.unit || '';
        const freq = med.custom_frequency || med.frequency || med.frequency_type || '';
        const dur = med.custom_duration || med.duration || med.duration_type || '';
        return `${idx + 1}. ${drug} ${dose}${unit}${freq ? ` - ${freq}` : ''}${dur ? ` (${dur})` : ''}`.trim();
      }).join('\n');
    };

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20 },
      head: [['HEALTH INFO', ''] ],
      body: [
        ['Blood Type:', resolveText(patient.blood_type)],
        ['Allergies:', resolveText(patient.allergies, 'None reported')],
        ['Vaccination History:', formatVaccinationHistory(patient.vaccination_history)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 'auto' } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 10);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20 },
      head: [['COMORBID ILLNESSES', ''] ],
      body: [
        ['Reported Conditions:', cleanArrayData(patient.comorbid_illnesses)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 'auto' } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 10);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20 },
      head: [['MEDICATIONS', ''] ],
      body: [
        ['Maintenance Medications:', formatMedications(patient.maintenance_medications)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 'auto' } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 10);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20 },
      head: [['VACCINATION HISTORY', ''] ],
      body: [
        ['Vaccination Records:', formatVaccinationRecords(patient.vaccination_history)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 'auto' } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 10);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20 },
      head: [['MEDICAL HISTORY', ''] ],
      body: [
        ['Past Medical History:', cleanArrayData(patient.past_medical_history)],
        ['Family Medical History:', cleanArrayData(patient.family_medical_history)],
        ['Hospital Admission/Surgery:', yesNo(patient.hospital_admission_or_surgery)],
        ['Hospital Details:', resolveText(patient.hospital_admission_details)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 'auto' } }
    });

    currentY = (doc as any).lastAutoTable?.finalY || (currentY + 10);
    currentY += 8;

    const genderValue = String(patient.gender || '').toLowerCase();
    const isFemaleProfile = ['female', 'f', 'woman', 'women'].includes(genderValue);
    const hasWomenData = [
      patient.menstruation_age_began,
      patient.menstruation_regular,
      patient.menstruation_irregular,
      patient.number_of_pregnancies,
      patient.number_of_live_children,
      patient.menstrual_symptoms,
      patient.menstrual_symptoms_other
    ].some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });

    if (isFemaleProfile) {
      const baseSymptoms = Array.isArray(patient.menstrual_symptoms)
        ? cleanArrayData(patient.menstrual_symptoms)
        : resolveText(patient.menstrual_symptoms);
      const normalizedBaseSymptoms = (baseSymptoms === 'None reported' || baseSymptoms === 'N/A') ? '' : baseSymptoms;
      const otherSymptoms = resolveText(patient.menstrual_symptoms_other);
      const symptomsValue = [normalizedBaseSymptoms, otherSymptoms].filter(Boolean).join(', ') || 'None reported';

      autoTable(doc, {
        startY: currentY,
        margin: { left: 20 },
        head: [['WOMEN ONLY', ''] ],
        body: [
          ['Menstruation Age Began:', resolveText(patient.menstruation_age_began)],
          ['Menstruation Regular:', yesNo(patient.menstruation_regular)],
          ['Menstruation Irregular:', yesNo(patient.menstruation_irregular)],
          ['Number of Pregnancies:', resolveText(patient.number_of_pregnancies)],
          ['Number of Live Children:', resolveText(patient.number_of_live_children)],
          ['Menstrual Symptoms:', symptomsValue]
        ],
        theme: 'grid',
        headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 'auto' } }
      });
    }

    doc.save(`Profile_${fullName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Failed to export patient profile PDF:', error);
  }
};

/**
 * Exports a signed waiver to a professional PDF document
 */
export const exportWaiverPDF = async (waiver: any, patientName: string): Promise<void> => {
  try {
    if (!waiver) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 20;
    const contentWidth = pageWidth - leftMargin * 2;

    const [wmsuLogo, healthLogo] = await Promise.all([
      loadLogo('/WMSU-Logo.jpg'),
      loadLogo('/WMSU-HealthLogo.png')
    ]);

    // Header
    if (wmsuLogo) doc.addImage(wmsuLogo, 'PNG', 20, 15, 20, 20);
    if (healthLogo) doc.addImage(healthLogo, 'PNG', 170, 15, 20, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('WESTERN MINDANAO STATE UNIVERSITY', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('UNIVERSITY HEALTH SERVICES CENTER', pageWidth / 2, 28, { align: 'center' });
    doc.text('Zamboanga City', pageWidth / 2, 33, { align: 'center' });

    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(1);
    doc.line(20, 38, 190, 38);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WAIVER AND CONSENT FORM', pageWidth / 2, 55, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const paragraphs = [
      `I, ${waiver.full_name || patientName}, of legal age, currently enrolled/employed at Western Mindanao State University, hereby acknowledge and agree to the following:`,
      'I have given explicit consent to the University Health Services Center (UHSC) to collect, use, store, and process my personal and sensitive health information for the purpose of promoting and maintaining my health and general well-being as part of the school community.',
      'I understand that this information will be used to maintain my medical records, facilitate consultations, and ensure that appropriate medical assistance is provided when necessary. I am aware that my data will be handled with the utmost confidentiality in accordance with the Data Privacy Act of 2012 (Republic Act 10173).',
      'This consent is given freely and voluntarily, and I understand that I may withdraw this consent at any time by providing a written notice to the University Health Services Center, subject to legal and university requirements.'
    ];

    const lineHeight = 5.5;
    const paragraphGap = 3;
    let currentY = 72;

    const addParagraph = (text: string, y: number) => {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, leftMargin, y);
      return y + (lines.length * lineHeight) + paragraphGap;
    };

    paragraphs.forEach((paragraph) => {
      currentY = addParagraph(paragraph, currentY);
    });

    // Signature
    const dateSigned = waiver.date_signed
      ? new Date(waiver.date_signed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const signatureImageHeight = waiver.signature ? 22 : 0;
    const signatureBlockHeight = (signatureImageHeight || 16) + 24;
    if (currentY + signatureBlockHeight > pageHeight - 30) {
      doc.addPage();
      currentY = 40;
    }

    const signatureX = pageWidth - 90;
    const signatureWidth = 70;
    const signatureImageY = currentY + 2;

    if (waiver.signature) {
      const signature = await loadLogo(waiver.signature);
      if (signature) {
        doc.addImage(signature, 'PNG', signatureX + 5, signatureImageY, signatureWidth - 10, signatureImageHeight);
      }
    }

    const signatureLineY = currentY + (waiver.signature ? signatureImageHeight + 6 : 18);
    doc.line(signatureX, signatureLineY, signatureX + signatureWidth, signatureLineY);
    doc.setFont('helvetica', 'bold');
    doc.text((waiver.full_name || patientName).toUpperCase(), signatureX + signatureWidth / 2, signatureLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Signature over Printed Name', signatureX + signatureWidth / 2, signatureLineY + 10, { align: 'center' });
    doc.text(`Date Signed: ${dateSigned}`, signatureX + signatureWidth / 2, signatureLineY + 18, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Document ID: WMSU-UHSC-WVR-${(waiver.id || 0).toString().padStart(6, '0')}`, leftMargin, pageHeight - 12);
    doc.text(`Generated on ${new Date().toLocaleString()}`, leftMargin, pageHeight - 7);

    doc.save(`Waiver_${patientName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Failed to export waiver PDF:', error);
  }
};
export const exportDentalPatientRecordPDF = async (record: any, patient: any): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const [wmsuLogo, healthLogo] = await Promise.all([
      loadLogo('/WMSU-Logo.jpg'),
      loadLogo('/WMSU-HealthLogo.png')
    ]);

    // Header
    if (wmsuLogo) doc.addImage(wmsuLogo, 'PNG', 20, 15, 20, 20);
    if (healthLogo) doc.addImage(healthLogo, 'PNG', 170, 15, 20, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('WESTERN MINDANAO STATE UNIVERSITY', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('UNIVERSITY HEALTH SERVICES CENTER', pageWidth / 2, 28, { align: 'center' });
    doc.text('Zamboanga City', pageWidth / 2, 33, { align: 'center' });

    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    doc.setFillColor(139, 0, 0);
    doc.rect(20, 42, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DENTAL PATIENT INFORMATION RECORD', pageWidth / 2, 48.5, { align: 'center' });

    const clean = (value: any) => {
      if (value === undefined || value === null) return '';
      const s = String(value).trim().toLowerCase();
      if (s === 'undefined' || s === 'null' || s === '' || s === 'n/a' || s === 'none') return '';
      return String(value).trim();
    };

    const resolveText = (...values: any[]) => {
      for (const value of values) {
        const cleaned = clean(value);
        if (cleaned) return cleaned;
      }
      return 'N/A';
    };

    const isTrue = (value: any) => value === true || value === 1 || value === '1' || value === 'true';
    const isFalse = (value: any) => value === false || value === 0 || value === '0' || value === 'false';
    const yesNo = (value: any) => (isTrue(value) ? 'Yes' : isFalse(value) ? 'No' : 'N/A');

    const formatDate = (value: any) => {
      if (!value) return 'N/A';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return 'N/A';
      return parsed.toLocaleDateString('en-US');
    };

    const listTrueFlags = (items: Array<{ key: string; label: string }>) => {
      const matches = items.filter((item) => isTrue(record[item.key])).map((item) => item.label);
      return matches.length > 0 ? matches.join(', ') : 'None reported';
    };

    const resolvedSexValue = resolveText(record.sex, patient.gender);
    const isWomanValue = record.is_woman !== undefined && record.is_woman !== null
      ? isTrue(record.is_woman)
      : resolvedSexValue.toLowerCase() === 'female';

    const addSection = (title: string, body: Array<[string, string]>, startY: number) => {
      autoTable(doc, {
        startY,
        margin: { left: 20, right: 20 },
        head: [[title, '']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 'auto' } }
      });
      return (doc as any).lastAutoTable?.finalY || startY;
    };

    let currentY = 60;
    const patientName = resolveText(record.patient_name, patient.name, `${patient.first_name || ''} ${patient.last_name || ''}`.trim());

    currentY = addSection('PATIENT DETAILS', [
      ['Patient Name:', patientName],
      ['Age:', record.age ?? patient.age ?? 'N/A'],
      ['Sex:', resolvedSexValue],
      ['Education Level:', resolveText(record.education_level, patient.user_type)],
      ['Year Level:', resolveText(record.year_level, patient.year_level, patient.grade_level)],
      ['Course:', resolveText(record.course, patient.course, patient.department)],
      ['Year/Section:', resolveText(record.year_section, patient.year_level, patient.strand, patient.grade_level)],
      ['Date:', formatDate(record.date || record.created_at)]
    ], currentY);
    currentY += 6;

    currentY = addSection('DENTAL HISTORY', [
      ['Previous Dentist:', resolveText(record.name_of_previous_dentist)],
      ['Last Dental Visit:', resolveText(record.last_dental_visit)],
      ['Last Cleaning:', resolveText(record.date_of_last_cleaning)]
    ], currentY);
    currentY += 6;

    currentY = addSection('FAMILY DENTIST', [
      ['Has Family Dentist:', yesNo(record.has_family_dentist)],
      ['Name:', resolveText(record.family_dentist_name)],
      ['Address:', resolveText(record.family_dentist_address)],
      ['Phone:', resolveText(record.family_dentist_phone)]
    ], currentY);
    currentY += 6;

    currentY = addSection('MEDICAL HISTORY', [
      ['Oral Hygiene Instructions:', yesNo(record.oral_hygiene_instructions)],
      ['Gums Bleed Brushing:', yesNo(record.gums_bleed_brushing)],
      ['Sensitive to Hot/Cold:', yesNo(record.teeth_sensitive_hot_cold)],
      ['Pain in Teeth:', yesNo(record.feel_pain_teeth)],
      ['Difficult Extractions:', yesNo(record.difficult_extractions_past)],
      ['Orthodontic Treatment:', yesNo(record.orthodontic_treatment)],
      ['Prolonged Bleeding:', yesNo(record.prolonged_bleeding_extractions)],
      ['Frequent Headaches:', yesNo(record.frequent_headaches)],
      ['Clench/Grind Teeth:', yesNo(record.clench_grind_teeth)]
    ], currentY);
    currentY += 6;

    const allergyList = listTrueFlags([
      { key: 'allergic_penicillin', label: 'Penicillin' },
      { key: 'allergic_amoxicillin', label: 'Amoxicillin' },
      { key: 'allergic_local_anesthetic', label: 'Local Anesthetic' },
      { key: 'allergic_sulfa_drugs', label: 'Sulfa Drugs' },
      { key: 'allergic_latex', label: 'Latex' }
    ]);
    const allergyDetails = record.allergic_others
      ? `${allergyList}, Other: ${record.allergic_others}`
      : allergyList;

    currentY = addSection('ALLERGIES', [
      ['Allergic to:', allergyDetails]
    ], currentY);
    currentY += 6;

    const menstruationValue = isWomanValue ? yesNo(record.menstruation_today) : 'N/A';
    const pregnantValue = isWomanValue ? yesNo(record.pregnant) : 'N/A';
    const birthControlValue = isWomanValue ? yesNo(record.taking_birth_control) : 'N/A';

    currentY = addSection('WOMEN ONLY', [
      ['Is Woman:', yesNo(isWomanValue)],
      ['Menstruation Today:', menstruationValue],
      ['Pregnant:', pregnantValue],
      ['Taking Birth Control:', birthControlValue]
    ], currentY);
    currentY += 6;

    currentY = addSection('MEDICAL TREATMENT', [
      ['Smoke:', yesNo(record.smoke)],
      ['Under Medical Treatment:', yesNo(record.under_medical_treatment)],
      ['Condition:', resolveText(record.medical_treatment_condition)],
      ['Hospitalized:', yesNo(record.hospitalized)],
      ['When/Why:', resolveText(record.hospitalization_when_why)],
      ['Taking Prescription Meds:', yesNo(record.taking_prescription_medication)],
      ['Prescription Details:', resolveText(record.prescription_medication_details)]
    ], currentY);
    currentY += 6;

    const conditionsList = listTrueFlags([
      { key: 'high_blood_pressure', label: 'High Blood Pressure' },
      { key: 'low_blood_pressure', label: 'Low Blood Pressure' },
      { key: 'epilepsy_convulsions', label: 'Epilepsy/Convulsions' },
      { key: 'aids_hiv_positive', label: 'AIDS/HIV' },
      { key: 'sexually_transmitted_disease', label: 'STD' },
      { key: 'stomach_trouble_ulcers', label: 'Stomach Trouble/Ulcers' },
      { key: 'fainting_seizure', label: 'Fainting/Seizure' },
      { key: 'rapid_weight_loss', label: 'Rapid Weight Loss' },
      { key: 'radiation_therapy', label: 'Radiation Therapy' },
      { key: 'joint_replacement_implant', label: 'Joint Replacement/Implant' },
      { key: 'heart_surgery', label: 'Heart Surgery' },
      { key: 'heart_attack', label: 'Heart Attack' },
      { key: 'thyroid_problem', label: 'Thyroid Problem' },
      { key: 'heart_disease', label: 'Heart Disease' },
      { key: 'heart_murmur', label: 'Heart Murmur' },
      { key: 'hepatitis_liver_disease', label: 'Hepatitis/Liver Disease' },
      { key: 'rheumatic_fever', label: 'Rheumatic Fever' },
      { key: 'hay_fever_allergies', label: 'Hay Fever/Allergies' },
      { key: 'respiratory_problems', label: 'Respiratory Problems' },
      { key: 'hepatitis_jaundice', label: 'Hepatitis/Jaundice' },
      { key: 'tuberculosis', label: 'Tuberculosis' },
      { key: 'swollen_ankles', label: 'Swollen Ankles' },
      { key: 'kidney_disease', label: 'Kidney Disease' },
      { key: 'diabetes', label: 'Diabetes' },
      { key: 'chest_pain', label: 'Chest Pain' },
      { key: 'stroke', label: 'Stroke' },
      { key: 'cancer_tumors', label: 'Cancer/Tumors' },
      { key: 'anemia', label: 'Anemia' },
      { key: 'angina', label: 'Angina' },
      { key: 'asthma', label: 'Asthma' },
      { key: 'emphysema', label: 'Emphysema' },
      { key: 'blood_diseases', label: 'Blood Diseases' },
      { key: 'head_injuries', label: 'Head Injuries' },
      { key: 'arthritis_rheumatism', label: 'Arthritis/Rheumatism' }
    ]);
    const conditionsDetails = record.other_conditions
      ? `${conditionsList}, Other: ${record.other_conditions}`
      : conditionsList;

    currentY = addSection('MEDICAL CONDITIONS', [
      ['Reported Conditions:', conditionsDetails]
    ], currentY);
    currentY += 6;

    addSection('SIGNATURE', [
      ['Patient Signature:', resolveText(record.patient_signature)],
      ['Signature Date:', formatDate(record.signature_date)]
    ], currentY);

    doc.save(`Dental_Record_${patient.student_id || patient.id}.pdf`);
  } catch (error) {
    console.error('Failed to generate dental PDF:', error);
  }
};


