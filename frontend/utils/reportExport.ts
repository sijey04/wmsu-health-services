import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types for our report data
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
}

interface UserTypeData {
  userType: string;
  totalTransactions: number;
  completedTransactions: number;
  completionRate: number;
  medical: { total: number; completed: number; pending?: number; rejected?: number };
  dental: { total: number; completed: number; pending?: number; rejected?: number };
  documents: { total: number; completed: number; issued?: number; pending?: number; rejected?: number };
}

// Generate professional PDF report with charts and detailed demographics
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
    
    // Professional Header with University Branding
    pdf.setFillColor(128, 0, 0); // WMSU maroon color
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Add logo on the left side
    try {
      // Try to load and add logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.png';
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx?.drawImage(logoImg, 0, 0);
            const logoDataUrl = canvas.toDataURL('image/png');
            pdf.addImage(logoDataUrl, 'PNG', leftMargin, 8, 20, 20);
            resolve(true);
          } catch (error) {
            console.warn('Could not add logo:', error);
            resolve(false);
          }
        };
        logoImg.onerror = () => resolve(false);
        // Timeout after 2 seconds
        setTimeout(() => resolve(false), 2000);
      });
    } catch (error) {
      console.warn('Logo loading failed:', error);
    }
    
    // Header text aligned to the right
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('WMSU Health Services Report', pageWidth - leftMargin, 15, { align: 'right' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Performance Report`, pageWidth - leftMargin, 23, { align: 'right' });
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - leftMargin, 30, { align: 'right' });
    
    // Reset text color for content
    pdf.setTextColor(0, 0, 0);
    let yPosition = 45;
    
    // Left Side - Summary Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', leftMargin, yPosition);
    yPosition += 8;
    
    // Summary statistics in a structured format
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const summaryItems = [
      { label: 'Report Period', value: reportType.charAt(0).toUpperCase() + reportType.slice(1) },
      { label: 'Total Services', value: (stats.medical.total + stats.dental.total + stats.documents.total).toString() },
      { label: 'Completion Rate', value: `${((stats.medical.completed + stats.dental.completed + stats.documents.issued) / (stats.medical.total + stats.dental.total + stats.documents.total) * 100).toFixed(1)}%` },
      { label: 'User Categories', value: userTypeData.length.toString() },
      { label: 'Report Date', value: new Date().toLocaleDateString() }
    ];
    
    summaryItems.forEach(item => {
      pdf.text(item.label, leftMargin, yPosition);
      pdf.text(item.value, leftMargin + 35, yPosition);
      yPosition += 5;
    });
    
    yPosition += 8;
    
    // Key Metrics Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Metrics', leftMargin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const medicalRate = stats.medical.total > 0 ? ((stats.medical.completed / stats.medical.total) * 100).toFixed(1) : '0';
    const dentalRate = stats.dental.total > 0 ? ((stats.dental.completed / stats.dental.total) * 100).toFixed(1) : '0';
    const documentsRate = stats.documents.total > 0 ? ((stats.documents.issued / stats.documents.total) * 100).toFixed(1) : '0';
    
    const keyMetrics = [
      { service: 'Medical Consultations', total: stats.medical.total, rate: `${medicalRate}%` },
      { service: 'Dental Consultations', total: stats.dental.total, rate: `${dentalRate}%` },
      { service: 'Medical Certificates', total: stats.documents.total, rate: `${documentsRate}%` }
    ];
    
    keyMetrics.forEach(metric => {
      pdf.text(metric.service, leftMargin, yPosition);
      pdf.text(metric.total.toString(), leftMargin + 35, yPosition);
      pdf.text(metric.rate, leftMargin + 50, yPosition);
      yPosition += 5;
    });
    
    yPosition += 8;
    
    // Demographics Breakdown Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('User Demographics', leftMargin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Demographics table
    userTypeData.slice(0, 8).forEach(user => {
      const totalServices = user.medical.total + user.dental.total + user.documents.total;
      const completedServices = user.medical.completed + user.dental.completed + (user.documents.completed || user.documents.issued || 0);
      const userRate = totalServices > 0 ? ((completedServices / totalServices) * 100).toFixed(0) : '0';
      
      // User type with truncation if needed
      const displayType = user.userType.length > 12 ? user.userType.substring(0, 12) + '...' : user.userType;
      pdf.text(displayType, leftMargin, yPosition);
      pdf.text(totalServices.toString(), leftMargin + 30, yPosition);
      pdf.text(completedServices.toString(), leftMargin + 42, yPosition);
      pdf.text(`${userRate}%`, leftMargin + 55, yPosition);
      yPosition += 4;
    });
    
    yPosition += 8;
    
    // Service Utilization Analysis
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Service Analysis', leftMargin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const analysisPoints = [
      `Most Active: ${userTypeData[0]?.userType || 'N/A'} (${userTypeData[0]?.totalTransactions || 0} services)`,
      `Medical Focus: ${stats.medical.completed}/${stats.medical.total} completed`,
      `Dental Focus: ${stats.dental.completed}/${stats.dental.total} completed`,
      `Certificate Demand: ${stats.documents.issued} issued certificates`,
      `Overall Efficiency: ${((stats.medical.completed + stats.dental.completed + stats.documents.issued) / (stats.medical.total + stats.dental.total + stats.documents.total) * 100).toFixed(1)}% completion`
    ];
    
    analysisPoints.forEach(point => {
      pdf.text(point, leftMargin, yPosition);
      yPosition += 4;
    });
    
    // Right Side - Charts and Visual Elements
    const chartX = rightMargin;
    const chartWidth = pageWidth - rightMargin - 15;
    let rightY = 45;
    
    // Service Distribution Chart Area
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Service Distribution', chartX, rightY);
    rightY += 8;
    
    // Draw a simple pie chart representation
    const totalServices = stats.medical.total + stats.dental.total + stats.documents.total;
    if (totalServices > 0) {
      const centerX = chartX + 30;
      const centerY = rightY + 20;
      const radius = 15;
      
      // Medical slice (blue)
      const medicalAngle = (stats.medical.total / totalServices) * 360;
      pdf.setFillColor(59, 130, 246); // Blue
      pdf.circle(centerX, centerY, radius, 'F');
      
      // Dental slice (green) - simplified representation
      pdf.setFillColor(16, 185, 129); // Green
      const dentalAngle = (stats.dental.total / totalServices) * 360;
      
      // Documents slice (amber) - simplified representation
      pdf.setFillColor(245, 158, 11); // Amber
      
      // Legend for the chart
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFillColor(59, 130, 246);
      pdf.rect(chartX, rightY + 45, 3, 3, 'F');
      pdf.text(`Medical: ${stats.medical.total}`, chartX + 5, rightY + 47);
      
      pdf.setFillColor(16, 185, 129);
      pdf.rect(chartX, rightY + 52, 3, 3, 'F');
      pdf.text(`Dental: ${stats.dental.total}`, chartX + 5, rightY + 54);
      
      pdf.setFillColor(245, 158, 11);
      pdf.rect(chartX, rightY + 59, 3, 3, 'F');
      pdf.text(`Certificates: ${stats.documents.total}`, chartX + 5, rightY + 61);
      
      rightY += 75;
    }
    
    // Performance Table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Table', chartX, rightY);
    rightY += 8;
    
    // Table headers
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Service', chartX, rightY);
    pdf.text('Total', chartX + 25, rightY);
    pdf.text('Completed', chartX + 40, rightY);
    pdf.text('Rate', chartX + 60, rightY);
    rightY += 5;
    
    // Table data
    pdf.setFont('helvetica', 'normal');
    const tableData = [
      ['Medical', stats.medical.total.toString(), stats.medical.completed.toString(), `${medicalRate}%`],
      ['Dental', stats.dental.total.toString(), stats.dental.completed.toString(), `${dentalRate}%`],
      ['Certificates', stats.documents.total.toString(), stats.documents.issued.toString(), `${documentsRate}%`]
    ];
    
    tableData.forEach(row => {
      pdf.text(row[0], chartX, rightY);
      pdf.text(row[1], chartX + 25, rightY);
      pdf.text(row[2], chartX + 40, rightY);
      pdf.text(row[3], chartX + 60, rightY);
      rightY += 4;
    });
    
    rightY += 10;
    
    // User Demographics Area Chart
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Demographics Trends', chartX, rightY);
    rightY += 8;
    
    // Create area chart representation for user demographics
    const maxDemographicValue = Math.max(...userTypeData.map(u => u.totalTransactions));
    const areaChartHeight = 40;
    const areaChartWidth = 70;
    
    // Draw chart background
    pdf.setDrawColor(230, 230, 230);
    pdf.rect(chartX, rightY, areaChartWidth, areaChartHeight);
    
    // Draw area chart for user demographics
    if (userTypeData.length > 0) {
      userTypeData.slice(0, 6).forEach((user, index) => {
        const barHeight = (user.totalTransactions / maxDemographicValue) * (areaChartHeight - 5);
        const barWidth = areaChartWidth / 6;
        const barX = chartX + (index * barWidth);
        const barY = rightY + areaChartHeight - barHeight;
        
        // Create gradient effect for area chart
        pdf.setFillColor(59 + (index * 20), 130 + (index * 10), 246 - (index * 15));
        pdf.rect(barX, barY, barWidth - 1, barHeight, 'F');
        
        // Add user type label
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        const shortLabel = user.userType.length > 8 ? user.userType.substring(0, 8) + '.' : user.userType;
        pdf.text(shortLabel, barX + 1, rightY + areaChartHeight + 4, { angle: 45 });
      });
    }
    
    rightY += areaChartHeight + 15;
    
    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text('Western Mindanao State University Health Services', pageWidth / 2, pageHeight - 15, { align: 'center' });
    pdf.text(`Report generated on ${new Date().toLocaleDateString()} | System Status: Active | Data: Real-time`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Confidential - For authorized personnel only`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Save the PDF
    const filename = `WMSU-Health-${reportType}-report-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}.pdf`;
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report. Please try again.');
  }
};

// Generate service-specific PDF report with demographics
export const generateServiceSpecificPDFReport = async (
  stats: StatsData,
  userTypeData: UserTypeData[],
  serviceType: 'medical' | 'dental' | 'certificates',
  reportType: 'weekly' | 'monthly' | 'yearly' = 'monthly'
): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 15;
    const rightMargin = 105;
    
    // Professional Header with University Branding
    pdf.setFillColor(128, 0, 0); // WMSU maroon color
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Add logo on the left side
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.png';
      await new Promise((resolve) => {
        logoImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx?.drawImage(logoImg, 0, 0);
            const logoDataUrl = canvas.toDataURL('image/png');
            pdf.addImage(logoDataUrl, 'PNG', leftMargin, 8, 20, 20);
            resolve(true);
          } catch (error) {
            console.warn('Could not add logo:', error);
            resolve(false);
          }
        };
        logoImg.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 2000);
      });
    } catch (error) {
      console.warn('Logo loading failed:', error);
    }
    
    // Header text aligned to the right
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Services Report`, pageWidth - leftMargin, 15, { align: 'right' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Demographics Report`, pageWidth - leftMargin, 23, { align: 'right' });
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - leftMargin, 30, { align: 'right' });
    
    // Reset text color for content
    pdf.setTextColor(0, 0, 0);
    let yPosition = 45;
    
    // Service-specific overview (Left side)
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Overview`, leftMargin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Service statistics
    let serviceStats;
    if (serviceType === 'medical') {
      serviceStats = stats.medical;
    } else if (serviceType === 'dental') {
      serviceStats = stats.dental;
    } else {
      serviceStats = stats.documents;
    }
    
    const serviceItems = [
      { label: 'Total', value: serviceStats.total.toString() },
      { label: 'Completed', value: serviceType === 'certificates' ? serviceStats.issued.toString() : serviceStats.completed.toString() },
      { label: 'Pending', value: serviceStats.pending.toString() },
      { label: 'Rate', value: `${serviceStats.total > 0 ? ((serviceType === 'certificates' ? serviceStats.issued : serviceStats.completed) / serviceStats.total * 100).toFixed(1) : '0'}%` }
    ];
    
    serviceItems.forEach(item => {
      pdf.text(item.label, leftMargin, yPosition);
      pdf.text(item.value, leftMargin + 35, yPosition);
      yPosition += 5;
    });
    
    yPosition += 8;
    
    // Demographics Breakdown
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Demographics Breakdown', leftMargin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    userTypeData.slice(0, 8).forEach(user => {
      let userServiceData;
      if (serviceType === 'medical') {
        userServiceData = user.medical;
      } else if (serviceType === 'dental') {
        userServiceData = user.dental;
      } else {
        userServiceData = user.documents;
      }
      
      const completed = serviceType === 'certificates' ? (userServiceData.completed || userServiceData.issued || 0) : userServiceData.completed;
      const rate = userServiceData.total > 0 ? ((completed / userServiceData.total) * 100).toFixed(0) : '0';
      
      const displayType = user.userType.length > 12 ? user.userType.substring(0, 12) + '...' : user.userType;
      pdf.text(displayType, leftMargin, yPosition);
      pdf.text(userServiceData.total.toString(), leftMargin + 30, yPosition);
      pdf.text(completed.toString(), leftMargin + 42, yPosition);
      pdf.text(`${rate}%`, leftMargin + 55, yPosition);
      yPosition += 4;
    });
    
    // Right side - Service-specific visualization
    const chartX = rightMargin;
    let rightY = 45;
    
    // Service Distribution
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} by User Type`, chartX, rightY);
    rightY += 8;
    
    // Create demographic area chart for this service
    const maxServiceValue = Math.max(...userTypeData.map(u => {
      if (serviceType === 'medical') return u.medical.total;
      if (serviceType === 'dental') return u.dental.total;
      return u.documents.total;
    }));
    
    if (maxServiceValue > 0) {
      const serviceChartHeight = 45;
      const serviceChartWidth = 75;
      
      // Draw chart background
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(chartX, rightY, serviceChartWidth, serviceChartHeight);
      
      userTypeData.slice(0, 6).forEach((user, index) => {
        let userServiceTotal = 0;
        if (serviceType === 'medical') userServiceTotal = user.medical.total;
        else if (serviceType === 'dental') userServiceTotal = user.dental.total;
        else userServiceTotal = user.documents.total;
        
        const barHeight = (userServiceTotal / maxServiceValue) * (serviceChartHeight - 5);
        const barWidth = serviceChartWidth / 6;
        const barX = chartX + (index * barWidth);
        const barY = rightY + serviceChartHeight - barHeight;
        
        // Service-specific colors
        let color;
        if (serviceType === 'medical') color = [59, 130, 246]; // Blue
        else if (serviceType === 'dental') color = [16, 185, 129]; // Green
        else color = [245, 158, 11]; // Amber
        
        pdf.setFillColor(color[0] + (index * 10), color[1] - (index * 5), color[2] + (index * 8));
        pdf.rect(barX, barY, barWidth - 1, barHeight, 'F');
        
        // Add user type label
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        const shortLabel = user.userType.length > 6 ? user.userType.substring(0, 6) + '.' : user.userType;
        pdf.text(shortLabel, barX + 1, rightY + serviceChartHeight + 4, { angle: 45 });
      });
      
      rightY += serviceChartHeight + 15;
    }
    
    // Performance Summary Table
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Summary', chartX, rightY);
    rightY += 6;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const topPerformers = userTypeData
      .filter(user => {
        if (serviceType === 'medical') return user.medical.total > 0;
        if (serviceType === 'dental') return user.dental.total > 0;
        return user.documents.total > 0;
      })
      .slice(0, 5);
    
    topPerformers.forEach((user, index) => {
      let total = 0;
      if (serviceType === 'medical') total = user.medical.total;
      else if (serviceType === 'dental') total = user.dental.total;
      else total = user.documents.total;
      
      const displayType = user.userType.length > 12 ? user.userType.substring(0, 12) + '...' : user.userType;
      pdf.text(`${index + 1}. ${displayType}`, chartX, rightY);
      pdf.text(total.toString(), chartX + 65, rightY);
      rightY += 4;
    });
    
    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text('Western Mindanao State University Health Services', pageWidth / 2, pageHeight - 15, { align: 'center' });
    pdf.text(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Services Report | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Confidential - For authorized personnel only`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Save the PDF
    const filename = `WMSU-${serviceType}-${reportType}-demographics-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}.pdf`;
    pdf.save(filename);
    
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
  reportType: 'weekly' | 'monthly' | 'yearly' = 'monthly'
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
