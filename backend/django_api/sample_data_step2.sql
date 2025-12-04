-- Sample Data Population Step 2: Medical and Dental Forms
-- This adds realistic medical and dental form data for completed appointments

-- Sample Medical Form Data for completed medical appointments
INSERT INTO `api_medicalformdata` (`id`, `patient_id`, `appointment_id`, `academic_year_id`, `file_no`, `surname`, `first_name`, `middle_name`, `age`, `sex`, `date`, `blood_pressure_systolic`, `blood_pressure_diastolic`, `heart_rate`, `temperature`, `respiratory_rate`, `oxygen_saturation`, `weight`, `height`, `chief_complaint`, `diagnosis`, `treatment_plan`, `physician_name`, `created_at`, `updated_at`) VALUES
(101, 101, 101, 20, 'MED-SAMPLE-101', 'Santos', 'Maria', 'A', 19, 'Female', '2024-09-15', 120, 80, 72, 36.5, 16, 98, 55, 160, 'Annual health examination', 'Generally healthy', 'Continue healthy lifestyle, annual follow-up', 'Dr. John Smith', '2024-09-15 09:00:00', '2024-09-15 10:00:00'),
(102, 102, 102, 20, 'MED-SAMPLE-102', 'Rodriguez', 'Juan', 'B', 20, 'Male', '2024-09-20', 130, 85, 78, 36.8, 18, 97, 70, 175, 'Headache and dizziness', 'Tension headache', 'Prescribed ibuprofen, stress management', 'Dr. John Smith', '2024-09-20 10:30:00', '2024-09-20 11:30:00'),
(103, 103, 103, 20, 'MED-SAMPLE-103', 'Garcia', 'Ana', 'C', 21, 'Female', '2024-10-05', 125, 82, 75, 36.6, 17, 99, 58, 165, 'Medical certificate for internship', 'Fit for internship', 'Medical clearance granted', 'Dr. John Smith', '2024-10-05 14:00:00', '2024-10-05 15:00:00'),
(104, 104, 104, 20, 'MED-SAMPLE-104', 'Martinez', 'Carlos', 'D', 22, 'Male', '2024-10-12', 118, 78, 68, 36.4, 15, 99, 75, 180, 'Follow-up on previous consultation', 'Recovery progressing well', 'Continue current medication', 'Dr. John Smith', '2024-10-12 11:00:00', '2024-10-12 12:00:00'),
(105, 105, 105, 20, 'MED-SAMPLE-105', 'Lopez', 'Elena', 'E', 19, 'Female', '2024-11-08', 122, 79, 74, 36.7, 16, 98, 52, 158, 'Pre-employment medical exam', 'Medically fit for employment', 'Cleared for employment', 'Dr. John Smith', '2024-11-08 13:30:00', '2024-11-08 14:30:00'),
(106, 106, 106, 20, 'MED-SAMPLE-106', 'Hernandez', 'Miguel', 'F', 20, 'Male', '2024-11-22', 135, 88, 82, 37.2, 20, 96, 68, 172, 'Fever and cough', 'Upper respiratory tract infection', 'Prescribed antibiotics and rest', 'Dr. John Smith', '2024-11-22 08:30:00', '2024-11-22 09:30:00'),
(107, 107, 107, 20, 'MED-SAMPLE-107', 'Gonzalez', 'Sofia', 'G', 21, 'Female', '2024-12-10', 121, 80, 73, 36.5, 16, 99, 56, 162, 'COVID-19 vaccination', 'Post-vaccination monitoring', 'No adverse reactions observed', 'Dr. John Smith', '2024-12-10 15:00:00', '2024-12-10 16:00:00'),
(108, 108, 108, 20, 'MED-SAMPLE-108', 'Perez', 'Luis', 'H', 22, 'Male', '2025-01-20', 128, 83, 76, 36.6, 17, 98, 72, 178, 'Annual health screening', 'All parameters within normal limits', 'Continue healthy habits', 'Dr. John Smith', '2025-01-20 09:30:00', '2025-01-20 10:30:00'),
(109, 109, 109, 20, 'MED-SAMPLE-109', 'Sanchez', 'Carmen', 'I', 17, 'Female', '2025-02-14', 115, 75, 70, 36.9, 18, 97, 50, 155, 'Stomach pain', 'Gastritis', 'Prescribed antacid, dietary changes', 'Dr. John Smith', '2025-02-14 11:30:00', '2025-02-14 12:30:00'),
(110, 110, 110, 20, 'MED-SAMPLE-110', 'Ramirez', 'Pedro', 'J', 18, 'Male', '2025-03-05', 123, 81, 74, 36.5, 16, 98, 65, 170, 'Routine health check', 'Generally healthy', 'Maintain current health status', 'Dr. John Smith', '2025-03-05 14:30:00', '2025-03-05 15:30:00');

-- Sample Dental Form Data for completed dental appointments
INSERT INTO `api_dentalformdata` (`id`, `patient_id`, `appointment_id`, `academic_year_id`, `file_no`, `surname`, `first_name`, `middle_name`, `age`, `sex`, `date`, `has_toothbrush`, `dentition`, `periodontal`, `occlusion`, `examined_by`, `oral_hygiene`, `decayed_teeth`, `filled_teeth`, `missing_teeth`, `recommended_treatments`, `created_at`, `updated_at`, `total_consultations`, `consultation_template_compliant`) VALUES
(101, 101, 111, 20, 'DENTAL-SAMPLE-101', 'Santos', 'Maria', 'A', 19, 'Female', '2024-09-25', 'Yes', 'Permanent', 'Normal', 'Normal', 'Dr. Lisa Johnson', 'Good', '0', '2', '0', 'Regular cleaning every 6 months', '2024-09-25 10:00:00', '2024-09-25 11:00:00', 1, 1),
(102, 102, 112, 20, 'DENTAL-SAMPLE-102', 'Rodriguez', 'Juan', 'B', 20, 'Male', '2024-10-15', 'Yes', 'Permanent', 'Gingivitis', 'Class I', 'Dr. Lisa Johnson', 'Fair', '1', '1', '0', 'Deep cleaning, improved oral hygiene', '2024-10-15 13:00:00', '2024-10-15 14:00:00', 1, 1),
(103, 103, 113, 20, 'DENTAL-SAMPLE-103', 'Garcia', 'Ana', 'C', 21, 'Female', '2024-11-12', 'Yes', 'Permanent', 'Normal', 'Normal', 'Dr. Lisa Johnson', 'Good', '2', '3', '0', 'Filling for cavities', '2024-11-12 09:00:00', '2024-11-12 10:00:00', 1, 1),
(104, 104, 114, 20, 'DENTAL-SAMPLE-104', 'Martinez', 'Carlos', 'D', 22, 'Male', '2024-12-03', 'Yes', 'Permanent', 'Normal', 'Class II', 'Dr. Lisa Johnson', 'Good', '1', '4', '0', 'Cavity filling completed', '2024-12-03 15:30:00', '2024-12-03 16:30:00', 1, 1),
(105, 105, 115, 20, 'DENTAL-SAMPLE-105', 'Lopez', 'Elena', 'E', 19, 'Female', '2025-01-25', 'Yes', 'Permanent', 'Normal', 'Normal', 'Dr. Lisa Johnson', 'Excellent', '0', '1', '0', 'Continue excellent oral hygiene', '2025-01-25 08:00:00', '2025-01-25 09:00:00', 1, 1);

-- Sample Medical Documents/Certificates
INSERT INTO `api_medicaldocument` (`id`, `patient_id`, `document_type`, `document_name`, `purpose`, `issued_date`, `expiry_date`, `issued_by`, `is_active`, `created_at`, `updated_at`) VALUES
(101, 101, 'health_certificate', 'Health Certificate', 'General health verification', '2024-09-15', '2025-09-15', 'Dr. John Smith', 1, '2024-09-15 10:00:00', '2024-09-15 10:00:00'),
(102, 103, 'medical_clearance', 'Medical Clearance for Internship', 'Internship requirement', '2024-10-05', '2025-04-05', 'Dr. John Smith', 1, '2024-10-05 15:00:00', '2024-10-05 15:00:00'),
(103, 105, 'fitness_certificate', 'Physical Fitness Certificate', 'Employment requirement', '2024-11-08', '2025-11-08', 'Dr. John Smith', 1, '2024-11-08 14:30:00', '2024-11-08 14:30:00'),
(104, 107, 'vaccination_record', 'COVID-19 Vaccination Record', 'Vaccination documentation', '2024-12-10', '2026-12-10', 'Dr. John Smith', 1, '2024-12-10 16:00:00', '2024-12-10 16:00:00'),
(105, 108, 'health_certificate', 'Annual Health Certificate', 'General health verification', '2025-01-20', '2026-01-20', 'Dr. John Smith', 1, '2025-01-20 10:30:00', '2025-01-20 10:30:00'),
(106, 102, 'medical_report', 'Medical Consultation Report', 'Medical documentation', '2024-09-20', '2025-09-20', 'Dr. John Smith', 1, '2024-09-20 11:30:00', '2024-09-20 11:30:00'),
(107, 106, 'medical_clearance', 'Medical Clearance Post-Treatment', 'Health verification', '2024-11-22', '2025-05-22', 'Dr. John Smith', 1, '2024-11-22 09:30:00', '2024-11-22 09:30:00'),
(108, 109, 'health_certificate', 'Student Health Certificate', 'Academic requirement', '2025-02-14', '2026-02-14', 'Dr. John Smith', 1, '2025-02-14 12:30:00', '2025-02-14 12:30:00');

-- Update appointment statistics for better dashboard data
UPDATE `api_appointment` SET 
    `notes` = CASE 
        WHEN `status` = 'completed' THEN CONCAT('Completed - ', `purpose`)
        WHEN `status` = 'confirmed' THEN 'Appointment confirmed by patient'
        WHEN `status` = 'pending' THEN 'Awaiting confirmation'
        ELSE `notes`
    END
WHERE `id` BETWEEN 101 AND 120;
