-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 15, 2025 at 05:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `wmsu_health_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `api_academicschoolyear`
--

CREATE TABLE `api_academicschoolyear` (
  `id` int(11) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'upcoming',
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `first_sem_start` date DEFAULT NULL,
  `first_sem_end` date DEFAULT NULL,
  `second_sem_start` date DEFAULT NULL,
  `second_sem_end` date DEFAULT NULL,
  `summer_start` date DEFAULT NULL,
  `summer_end` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_academicschoolyear`
--

INSERT INTO `api_academicschoolyear` (`id`, `academic_year`, `start_date`, `end_date`, `is_current`, `status`, `created_at`, `updated_at`, `first_sem_start`, `first_sem_end`, `second_sem_start`, `second_sem_end`, `summer_start`, `summer_end`) VALUES
(14, '2025-2026', '2025-06-15', '2026-03-15', 0, 'active', '2025-07-06 07:27:59.720147', '2025-07-08 01:46:52.557217', NULL, NULL, NULL, NULL, NULL, NULL),
(15, '2026-2027', '2026-06-14', '2027-03-14', 0, 'active', '2025-07-06 09:58:20.261926', '2025-07-08 01:46:52.549893', NULL, NULL, NULL, NULL, NULL, NULL),
(16, '2027-2028', '2027-06-14', '2028-03-14', 0, 'active', '2025-07-08 01:39:45.181182', '2025-07-08 01:46:52.541248', NULL, NULL, NULL, NULL, NULL, NULL),
(17, '2028-2029', '2028-06-14', '2029-03-14', 0, 'active', '2025-07-08 01:40:42.687983', '2025-07-08 01:46:52.532957', NULL, NULL, NULL, NULL, NULL, NULL),
(18, '2029-2030', '2029-06-14', '2030-03-14', 0, 'active', '2025-07-08 01:46:00.346102', '2025-07-08 01:46:52.516653', NULL, NULL, NULL, NULL, NULL, NULL),
(19, '2030-2031', '2030-06-14', '2031-03-14', 0, 'active', '2025-07-08 01:46:52.491878', '2025-07-08 12:11:53.794063', NULL, NULL, NULL, NULL, NULL, NULL),
(20, '2024-2025', '2024-08-01', '2025-07-31', 1, 'upcoming', '2025-07-08 04:11:53.813165', '2025-07-08 04:11:53.813165', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_academicsemester`
--

CREATE TABLE `api_academicsemester` (
  `id` bigint(20) NOT NULL,
  `semester` varchar(10) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `academic_year_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_appointment`
--

CREATE TABLE `api_appointment` (
  `id` bigint(20) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time(6) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL,
  `notes` longtext DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `doctor_id` bigint(20) DEFAULT NULL,
  `patient_id` bigint(20) NOT NULL,
  `concern` longtext DEFAULT NULL,
  `type` varchar(10) NOT NULL,
  `rejection_reason` longtext DEFAULT NULL,
  `campus` varchar(20) NOT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `is_rescheduled` tinyint(1) NOT NULL,
  `original_date` date DEFAULT NULL,
  `original_time` time(6) DEFAULT NULL,
  `reschedule_reason` longtext DEFAULT NULL,
  `rescheduled_at` datetime(6) DEFAULT NULL,
  `rescheduled_by_id` bigint(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_appointment`
--

INSERT INTO `api_appointment` (`id`, `appointment_date`, `appointment_time`, `purpose`, `status`, `notes`, `created_at`, `updated_at`, `doctor_id`, `patient_id`, `concern`, `type`, `rejection_reason`, `campus`, `school_year_id`, `is_rescheduled`, `original_date`, `original_time`, `reschedule_reason`, `rescheduled_at`, `rescheduled_by_id`, `semester`) VALUES
(49, '2025-07-09', '09:03:00.000000', 'sadasd', 'completed', NULL, '2025-07-08 05:03:18.545269', '2025-07-08 05:03:50.795475', NULL, 31, '', 'medical', NULL, 'a', 20, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(50, '2025-07-09', '08:00:00.000000', 'asdasdas', 'completed', NULL, '2025-07-08 05:33:51.195180', '2025-07-08 05:35:44.496246', NULL, 31, 'asdasdas', 'dental', NULL, 'a', 20, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(51, '2025-07-08', '10:00:00.000000', 'Dental checkup', 'confirmed', NULL, '2025-07-08 05:48:40.299950', '2025-07-08 05:48:40.299950', 52, 32, NULL, 'dental', NULL, 'a', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_campusschedule`
--

CREATE TABLE `api_campusschedule` (
  `id` bigint(20) NOT NULL,
  `campus` varchar(20) NOT NULL,
  `open_time` time(6) NOT NULL,
  `close_time` time(6) NOT NULL,
  `operating_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`operating_days`)),
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_campusschedule`
--

INSERT INTO `api_campusschedule` (`id`, `campus`, `open_time`, `close_time`, `operating_days`, `is_active`, `created_at`, `updated_at`) VALUES
(5, 'a', '08:00:00.000000', '17:00:00.000000', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', 1, '2025-07-02 18:35:38.316935', '2025-07-08 01:46:50.349745'),
(6, 'b', '08:00:00.000000', '17:00:00.000000', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', 1, '2025-07-02 18:35:38.316935', '2025-07-08 01:46:50.358053'),
(7, 'c', '08:00:00.000000', '17:00:00.000000', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', 1, '2025-07-02 18:35:38.316935', '2025-07-08 01:46:50.366205');

-- --------------------------------------------------------

--
-- Table structure for table `api_comorbidillness`
--

CREATE TABLE `api_comorbidillness` (
  `id` bigint(20) NOT NULL,
  `label` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `display_order` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_comorbidillness`
--

INSERT INTO `api_comorbidillness` (`id`, `label`, `description`, `is_enabled`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Hypertension', '', 0, 0, '2025-07-04 18:06:45.921382', '2025-07-08 01:46:50.673602'),
(2, 'Diabetes Mellitus', '', 0, 1, '2025-07-04 18:06:45.939916', '2025-07-08 01:46:50.635800'),
(3, 'Asthma', '', 0, 2, '2025-07-04 18:06:45.943553', '2025-07-08 01:46:50.517230'),
(4, 'Heart Disease', '', 0, 3, '2025-07-04 18:06:45.948092', '2025-07-08 01:46:50.650433'),
(5, 'Epilepsy', '', 0, 4, '2025-07-04 18:06:45.952259', '2025-07-08 01:46:50.667758'),
(6, 'Kidney Disease', '', 0, 5, '2025-07-04 18:06:45.957015', '2025-07-08 01:46:50.707335'),
(7, 'Liver Disease', '', 0, 6, '2025-07-04 18:06:45.959262', '2025-07-08 01:46:50.693820'),
(8, 'Thyroid Disease', '', 0, 7, '2025-07-04 18:06:45.959262', '2025-07-08 01:46:50.840543'),
(9, 'Depression', '', 0, 8, '2025-07-04 18:06:45.972281', '2025-07-08 01:46:50.607150'),
(10, 'Anxiety Disorder', '', 0, 9, '2025-07-04 18:06:45.974275', '2025-07-08 01:46:50.486163'),
(11, 'Bipolar Disorder', '', 0, 10, '2025-07-04 18:06:45.974275', '2025-07-08 01:46:50.503550'),
(12, 'Schizophrenia', '', 1, 11, '2025-07-04 18:06:45.974275', '2025-07-08 01:46:50.792542'),
(13, 'Other Mental Health Condition', '', 0, 12, '2025-07-04 18:06:45.990368', '2025-07-08 01:46:50.767020'),
(14, 'Bronchitis', 'Common medical condition: Bronchitis', 0, 4, '2025-07-05 18:41:02.805345', '2025-07-08 01:46:50.583551'),
(15, 'Tuberculosis', 'Common medical condition: Tuberculosis', 0, 5, '2025-07-05 18:41:02.822231', '2025-07-08 01:46:50.834730'),
(16, 'Chronic Kidney Disease', 'Common medical condition: Chronic Kidney Disease', 0, 6, '2025-07-05 18:41:02.824239', '2025-07-08 01:46:50.590226'),
(17, 'Obesity', 'Common medical condition: Obesity', 0, 8, '2025-07-05 18:41:02.824239', '2025-07-08 01:46:50.725340'),
(18, 'Stroke', 'Common medical condition: Stroke', 0, 11, '2025-07-05 18:41:02.838173', '2025-07-08 01:46:50.786128'),
(19, 'Cancer', 'Common medical condition: Cancer', 0, 12, '2025-07-05 18:41:02.838173', '2025-07-08 01:46:50.583551'),
(20, 'Autoimmune Disease', 'Common medical condition: Autoimmune Disease', 0, 13, '2025-07-05 18:41:02.838173', '2025-07-08 01:46:50.489695'),
(21, 'COPD (Chronic Obstructive Pulmonary Disease)', 'Common medical condition: COPD (Chronic Obstructive Pulmonary Disease)', 0, 14, '2025-07-05 18:41:02.851132', '2025-07-08 01:46:50.583551'),
(22, 'Arthritis', 'Common medical condition: Arthritis', 0, 15, '2025-07-05 18:41:02.851132', '2025-07-08 01:46:50.511911'),
(23, 'Osteoporosis', 'Common medical condition: Osteoporosis', 0, 16, '2025-07-05 18:41:02.859478', '2025-07-08 01:46:50.761085'),
(24, 'Mental Health Disorders', 'Common medical condition: Mental Health Disorders', 0, 17, '2025-07-05 18:41:02.859478', '2025-07-08 01:46:50.742556'),
(25, 'Allergies', 'Common medical condition: Allergies', 0, 18, '2025-07-05 18:41:02.859478', '2025-07-08 01:46:50.493989'),
(26, 'None', 'Common medical condition: None', 0, 19, '2025-07-05 18:41:02.859478', '2025-07-08 01:46:50.723811'),
(27, 'Diabetes', '', 0, 0, '2025-07-06 06:23:21.043405', '2025-07-08 01:46:50.636199'),
(28, 'COPD', '', 0, 0, '2025-07-06 06:23:21.083838', '2025-07-08 01:46:50.600829'),
(29, 'Mental Health Conditions', '', 0, 0, '2025-07-06 06:45:50.402002', '2025-07-08 01:46:50.700137'),
(30, 'Test Illness', '', 1, 0, '2025-07-06 07:00:32.302506', '2025-07-08 01:46:50.817870');

-- --------------------------------------------------------

--
-- Table structure for table `api_customuser`
--

CREATE TABLE `api_customuser` (
  `id` bigint(20) NOT NULL,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `email` varchar(254) NOT NULL,
  `grade_level` varchar(50) DEFAULT NULL,
  `is_email_verified` tinyint(1) NOT NULL,
  `email_verification_token` char(36) NOT NULL,
  `email_verification_sent_at` datetime(6) DEFAULT NULL,
  `user_type` varchar(10) NOT NULL,
  `middle_name` varchar(150) DEFAULT NULL,
  `blocked_at` datetime(6) DEFAULT NULL,
  `blocked_by_id` bigint(20) DEFAULT NULL,
  `block_reason` longtext DEFAULT NULL,
  `is_blocked` tinyint(1) NOT NULL,
  `education_level` varchar(20) DEFAULT NULL,
  `education_year` int(11) DEFAULT NULL,
  `education_program` varchar(200) DEFAULT NULL,
  `department_college` varchar(200) DEFAULT NULL,
  `employee_position` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_customuser`
--

INSERT INTO `api_customuser` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `is_staff`, `is_active`, `date_joined`, `email`, `grade_level`, `is_email_verified`, `email_verification_token`, `email_verification_sent_at`, `user_type`, `middle_name`, `blocked_at`, `blocked_by_id`, `block_reason`, `is_blocked`, `education_level`, `education_year`, `education_program`, `department_college`, `employee_position`) VALUES
(8, 'pbkdf2_sha256$600000$HdZr2FXHyxmtmSe8gXr9tX$BEmYGrfcyHntT2pv6faLJDZngLpXdxOb8kToy1vhJGM=', NULL, 1, 'usamaputli@gmail.com', 'usamaputli@gmail.com', '', 1, 1, '2025-06-24 02:55:15.689131', 'usamaputli@gmail.com', 'Incoming Freshman', 1, '16527cbf-9540-4aa1-9eae-87446d7b89dd', '2025-06-24 10:55:20.071692', 'student', 'AOID', NULL, NULL, '', 0, NULL, NULL, NULL, NULL, NULL),
(31, 'pbkdf2_sha256$600000$m9kuC2CETGsOO90ZjVXDjG$sUNnhUL6uf1kN/uAmrD17Z33gC909aUBbfpG4G0Lc1s=', NULL, 1, 'admin', 'System', 'Administrator', 1, 1, '2025-07-05 21:19:23.138087', 'admin@wmsu.edu.ph', NULL, 1, 'b8360aaf-ef92-4033-b4e7-11c2d47d1961', NULL, 'admin', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL),
(51, 'pbkdf2_sha256$600000$YE9TXEDxMJWcD4TnEHLpkZ$9KyrQqGfSJJANmrjZworLFZ5o5V4ml/Zc5XlqcMmK7U=', NULL, 0, 'johnmagno332@gmail.com', 'Rezier', 'Magno', 0, 1, '2025-07-08 04:59:41.455825', 'johnmagno332@gmail.com', 'Incoming Freshman', 1, 'e553300d-7c07-4b45-b79d-ed7a9c4c4b32', '2025-07-08 04:59:46.047911', 'student', 'John O.', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL),
(52, 'pbkdf2_sha256$600000$WF0cipmONguN4vKs3jfKVv$1VHmDtqwE+5MPk0Cf99moPO3Hk+oMTbSc4sTooiWsTI=', NULL, 0, 'teststaff', 'Dr. Maria', 'Santos', 1, 1, '2025-07-08 05:45:11.199892', 'test.staff@wmsu.edu', NULL, 1, '8c19b442-623c-4652-9b56-ffa1fbd180ab', NULL, 'staff', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL),
(53, '', NULL, 0, 'testpatient', 'Juan', 'Dela Cruz', 0, 1, '2025-07-08 05:47:29.419278', 'test.patient@wmsu.edu', NULL, 1, '7706c0a1-8d4d-4e34-8d0b-ff1751282fe0', NULL, 'student', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL),
(55, 'pbkdf2_sha256$600000$sXSrbIp08YGgTofZZFxAhM$TxIbNXXHdUcFJQBWnIaKy8cbnrPeCQxivKHahtC9Kl8=', NULL, 0, 'doctor_main', 'Felicitas', 'Elago', 1, 1, '2025-07-15 21:11:21.000000', 'doctor.main@wmsu.edu.ph', '', 1, 'c69ff049-4614-43e9-b5a2-4fd36f13912f', NULL, 'staff', 'C.', NULL, NULL, '', 0, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_customuser_groups`
--

CREATE TABLE `api_customuser_groups` (
  `id` bigint(20) NOT NULL,
  `customuser_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_customuser_user_permissions`
--

CREATE TABLE `api_customuser_user_permissions` (
  `id` bigint(20) NOT NULL,
  `customuser_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_dentalappointmentmedication`
--

CREATE TABLE `api_dentalappointmentmedication` (
  `id` bigint(20) NOT NULL,
  `quantity_used` int(11) NOT NULL,
  `dosage_given` varchar(100) DEFAULT NULL,
  `administration_method` varchar(20) NOT NULL,
  `time_administered` datetime(6) NOT NULL,
  `administered_by` varchar(200) NOT NULL,
  `patient_response` longtext DEFAULT NULL,
  `effectiveness_rating` int(11) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `appointment_id` bigint(20) NOT NULL,
  `medication_id` bigint(20) NOT NULL,
  `recorded_by_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_dentalformdata`
--

CREATE TABLE `api_dentalformdata` (
  `id` bigint(20) NOT NULL,
  `file_no` varchar(50) DEFAULT NULL,
  `surname` varchar(100) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `grade_year_section` varchar(50) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `sex` varchar(10) NOT NULL,
  `has_toothbrush` varchar(3) NOT NULL,
  `dentition` varchar(20) DEFAULT NULL,
  `periodontal` varchar(20) DEFAULT NULL,
  `occlusion` varchar(20) DEFAULT NULL,
  `malocclusion_severity` varchar(20) DEFAULT NULL,
  `remarks` longtext DEFAULT NULL,
  `examined_by` varchar(100) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `permanent_teeth_status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permanent_teeth_status`)),
  `temporary_teeth_status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`temporary_teeth_status`)),
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `appointment_id` bigint(20) DEFAULT NULL,
  `patient_id` bigint(20) NOT NULL,
  `decayed_teeth` varchar(100) DEFAULT NULL,
  `filled_teeth` varchar(100) DEFAULT NULL,
  `missing_teeth` varchar(100) DEFAULT NULL,
  `next_appointment` varchar(100) DEFAULT NULL,
  `oral_hygiene` varchar(100) DEFAULT NULL,
  `prevention_advice` longtext DEFAULT NULL,
  `recommended_treatments` longtext DEFAULT NULL,
  `treatment_priority` varchar(100) DEFAULT NULL,
  `academic_year_id` bigint(20) DEFAULT NULL,
  `examiner_license` varchar(50) DEFAULT NULL,
  `examiner_phone` varchar(20) DEFAULT NULL,
  `examiner_position` varchar(100) DEFAULT NULL,
  `examiner_ptr` varchar(50) DEFAULT NULL,
  `consultations_record` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`consultations_record`)),
  `current_consultation_date` date DEFAULT NULL,
  `current_signs_symptoms` longtext DEFAULT NULL,
  `current_hr` varchar(10) DEFAULT NULL,
  `current_rr` varchar(10) DEFAULT NULL,
  `current_temp` varchar(10) DEFAULT NULL,
  `current_o2_sat` varchar(10) DEFAULT NULL,
  `current_bp` varchar(15) DEFAULT NULL,
  `current_test_results` longtext DEFAULT NULL,
  `current_diagnosis` longtext DEFAULT NULL,
  `current_management` longtext DEFAULT NULL,
  `current_nurse_physician` varchar(100) DEFAULT NULL,
  `total_consultations` int(11) NOT NULL,
  `consultation_template_compliant` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_dentalformdata`
--

INSERT INTO `api_dentalformdata` (`id`, `file_no`, `surname`, `first_name`, `middle_name`, `grade_year_section`, `age`, `sex`, `has_toothbrush`, `dentition`, `periodontal`, `occlusion`, `malocclusion_severity`, `remarks`, `examined_by`, `date`, `permanent_teeth_status`, `temporary_teeth_status`, `created_at`, `updated_at`, `appointment_id`, `patient_id`, `decayed_teeth`, `filled_teeth`, `missing_teeth`, `next_appointment`, `oral_hygiene`, `prevention_advice`, `recommended_treatments`, `treatment_priority`, `academic_year_id`, `examiner_license`, `examiner_phone`, `examiner_position`, `examiner_ptr`, `consultations_record`, `current_consultation_date`, `current_signs_symptoms`, `current_hr`, `current_rr`, `current_temp`, `current_o2_sat`, `current_bp`, `current_test_results`, `current_diagnosis`, `current_management`, `current_nurse_physician`, `total_consultations`, `consultation_template_compliant`) VALUES
(12, 'TEMP-51', 'Magno', 'Rezier', 'John O.', NULL, 7, 'Female', 'Yes', '', '', '', '', '', 'usamaputli@gmail.com', '2025-07-08', '{}', '{\"5\": {\"treatment\": \"asdas\", \"status\": \"\"}}', '2025-07-08 05:35:44.477476', '2025-07-08 05:35:44.477476', 50, 31, '', '', '', '', '', '', '', '', 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `api_dentalwaiver`
--

CREATE TABLE `api_dentalwaiver` (
  `id` bigint(20) NOT NULL,
  `patient_name` varchar(100) NOT NULL,
  `date_signed` date NOT NULL,
  `patient_signature` longtext NOT NULL,
  `parent_guardian_signature` longtext DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_signature` longtext DEFAULT NULL,
  `patient_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_dentistschedule`
--

CREATE TABLE `api_dentistschedule` (
  `id` bigint(20) NOT NULL,
  `dentist_name` varchar(200) NOT NULL,
  `campus` varchar(20) NOT NULL,
  `available_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`available_days`)),
  `time_slots` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`time_slots`)),
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_dentistschedule`
--

INSERT INTO `api_dentistschedule` (`id`, `dentist_name`, `campus`, `available_days`, `time_slots`, `is_active`, `created_at`, `updated_at`) VALUES
(4, 'Dr. Maria Santos', 'a', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', '[\"08:00-09:00\", \"09:00-10:00\", \"10:00-11:00\", \"13:00-14:00\", \"14:00-15:00\", \"15:00-16:00\"]', 1, '2025-07-02 18:35:38.334430', '2025-07-08 01:46:50.349745'),
(5, 'Dr. Smith', 'a', '[\"Monday\", \"Wednesday\", \"Friday\"]', '[\"08:00-09:00\", \"09:00-10:00\", \"10:00-11:00\", \"14:00-15:00\"]', 1, '2025-07-06 06:23:20.997129', '2025-07-08 01:46:50.358053'),
(6, 'Dr. Johnson', 'b', '[\"Tuesday\", \"Thursday\"]', '[\"08:00-09:00\", \"09:00-10:00\", \"10:00-11:00\", \"14:00-15:00\"]', 1, '2025-07-06 06:23:21.014010', '2025-07-08 01:46:50.366205');

-- --------------------------------------------------------

--
-- Table structure for table `api_documentrequirement`
--

CREATE TABLE `api_documentrequirement` (
  `id` bigint(20) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `display_name` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `is_required` tinyint(1) NOT NULL,
  `validity_period_months` int(11) NOT NULL,
  `specific_courses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`specific_courses`)),
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_documentrequirement`
--

INSERT INTO `api_documentrequirement` (`id`, `field_name`, `display_name`, `description`, `is_required`, `validity_period_months`, `specific_courses`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'chest_xray', 'Chest X-Ray', 'Recent chest X-ray results', 1, 6, '[]', 1, '2025-07-02 18:13:27.062772', '2025-07-08 01:46:50.349745'),
(2, 'cbc', 'Complete Blood Count (CBC)', 'Complete blood count laboratory results', 1, 6, '[]', 1, '2025-07-02 18:13:27.067627', '2025-07-08 01:46:50.358053'),
(3, 'blood_typing', 'Blood Typing', 'Blood type and Rh factor test results', 1, 12, '[]', 1, '2025-07-02 18:13:27.071764', '2025-07-08 01:46:50.341434'),
(4, 'urinalysis', 'Urinalysis', 'Complete urinalysis test results', 1, 6, '[]', 1, '2025-07-02 18:13:27.080367', '2025-07-08 01:46:50.383300'),
(5, 'drug_test', 'Drug Test', 'Drug screening test results', 1, 12, '[]', 1, '2025-07-02 18:13:27.085766', '2025-07-08 01:46:50.366205'),
(6, 'hepa_b', 'Hepatitis B Test', 'Hepatitis B surface antigen test results', 0, 12, '[\"College of Medicine\", \"College of Nursing\", \"College of Home Economics\", \"College of Criminal Justice Education\", \"BS Food Technology\", \"BS Biology\"]', 1, '2025-07-02 18:13:27.090196', '2025-07-08 01:46:50.374470'),
(7, 'medical_certificate', 'Medical Certificate', 'Medical certificate from licensed physician', 1, 12, '[]', 1, '2025-07-06 06:23:20.963974', '2025-07-08 01:46:50.374470');

-- --------------------------------------------------------

--
-- Table structure for table `api_familymedicalhistoryitem`
--

CREATE TABLE `api_familymedicalhistoryitem` (
  `id` bigint(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `display_order` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_familymedicalhistoryitem`
--

INSERT INTO `api_familymedicalhistoryitem` (`id`, `name`, `description`, `is_enabled`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Diabetes', '', 0, 0, '2025-07-04 18:06:46.168469', '2025-07-08 01:46:52.031346'),
(2, 'Hypertension', '', 0, 1, '2025-07-04 18:06:46.168469', '2025-07-08 01:46:52.058467'),
(3, 'Heart Disease', '', 0, 2, '2025-07-04 18:06:46.168469', '2025-07-08 01:46:52.065750'),
(4, 'Stroke', '', 0, 3, '2025-07-04 18:06:46.184492', '2025-07-08 01:46:52.075046'),
(5, 'Cancer', '', 0, 4, '2025-07-04 18:06:46.184492', '2025-07-08 01:46:52.091814'),
(6, 'Asthma', '', 0, 5, '2025-07-04 18:06:46.184492', '2025-07-08 01:46:52.091814'),
(7, 'Allergies', '', 0, 6, '2025-07-04 18:06:46.184492', '2025-07-08 01:46:52.140975'),
(8, 'Kidney Disease', '', 0, 7, '2025-07-04 18:06:46.200531', '2025-07-08 01:46:52.149705'),
(9, 'Liver Disease', '', 0, 8, '2025-07-04 18:06:46.206360', '2025-07-08 01:46:52.149705'),
(10, 'Thyroid Disorders', '', 0, 9, '2025-07-04 18:06:46.210861', '2025-07-08 01:46:52.166746'),
(11, 'Epilepsy', '', 0, 10, '2025-07-04 18:06:46.213875', '2025-07-08 01:46:52.197966'),
(12, 'Mental Health Conditions', '', 0, 11, '2025-07-04 18:06:46.213875', '2025-07-08 01:46:52.224885'),
(13, 'Autoimmune Disorders', '', 0, 12, '2025-07-04 18:06:46.213875', '2025-07-08 01:46:52.224885'),
(14, 'Blood Disorders', '', 0, 13, '2025-07-04 18:06:46.213875', '2025-07-08 01:46:52.258450'),
(15, 'Genetic Disorders', '', 0, 14, '2025-07-04 18:06:46.229974', '2025-07-08 01:46:52.283167'),
(16, 'Obesity', '', 0, 15, '2025-07-04 18:06:46.229974', '2025-07-08 01:46:52.299612'),
(17, 'Osteoporosis', '', 0, 16, '2025-07-04 18:06:46.229974', '2025-07-08 01:46:52.316319'),
(18, 'Arthritis', '', 0, 17, '2025-07-04 18:06:46.229974', '2025-07-08 01:46:52.331498'),
(19, 'High Cholesterol', '', 1, 18, '2025-07-04 18:06:46.245861', '2025-07-08 01:46:52.357289'),
(20, 'Glaucoma', '', 0, 19, '2025-07-04 18:06:46.245861', '2025-07-08 01:46:52.375411'),
(21, 'Alzheimer\'s Disease', '', 0, 20, '2025-07-04 18:06:46.245861', '2025-07-08 01:46:52.397937'),
(22, 'Parkinson\'s Disease', '', 0, 21, '2025-07-04 18:06:46.245861', '2025-07-08 01:46:52.441643'),
(23, 'Huntington\'s Disease', '', 0, 22, '2025-07-04 18:06:46.261634', '2025-07-08 01:46:52.441643'),
(24, 'Sickle Cell Disease', '', 0, 23, '2025-07-04 18:06:46.261634', '2025-07-08 01:46:52.450127'),
(25, 'Thalassemia', '', 0, 24, '2025-07-04 18:06:46.261634', '2025-07-08 01:46:52.460518'),
(26, 'High Blood Pressure', 'Family medical history: High Blood Pressure', 0, 5, '2025-07-05 18:41:03.060781', '2025-07-08 01:46:52.116955'),
(27, 'Mental Health Disorders', 'Family medical history: Mental Health Disorders', 0, 8, '2025-07-05 18:41:03.076023', '2025-07-08 01:46:52.141954'),
(28, 'Thyroid Disease', 'Family medical history: Thyroid Disease', 0, 11, '2025-07-05 18:41:03.086719', '2025-07-08 01:46:52.216758'),
(29, 'Tuberculosis', 'Family medical history: Tuberculosis', 0, 12, '2025-07-05 18:41:03.090882', '2025-07-08 01:46:52.222852'),
(30, 'Autoimmune Diseases', 'Family medical history: Autoimmune Diseases', 0, 13, '2025-07-05 18:41:03.096436', '2025-07-08 01:46:52.216758'),
(31, 'Bone/Joint Problems', 'Family medical history: Bone/Joint Problems', 0, 15, '2025-07-05 18:41:03.096436', '2025-07-08 01:46:52.266701'),
(32, 'Eye Problems', 'Family medical history: Eye Problems', 0, 16, '2025-07-05 18:41:03.096436', '2025-07-08 01:46:52.299612'),
(33, 'Hearing Problems', 'Family medical history: Hearing Problems', 1, 17, '2025-07-05 18:41:03.110179', '2025-07-08 01:46:52.339822'),
(34, 'Skin Conditions', 'Family medical history: Skin Conditions', 1, 18, '2025-07-05 18:41:03.110179', '2025-07-08 01:46:52.366699'),
(35, 'Substance Abuse', 'Family medical history: Substance Abuse', 0, 19, '2025-07-05 18:41:03.110179', '2025-07-08 01:46:52.391381'),
(36, 'Other Genetic Conditions', 'Family medical history: Other Genetic Conditions', 0, 20, '2025-07-05 18:41:03.126220', '2025-07-08 01:46:52.407999'),
(37, 'None Known', 'Family medical history: None Known', 0, 21, '2025-07-05 18:41:03.128931', '2025-07-08 01:46:52.422822'),
(38, 'Mental Illness', '', 0, 0, '2025-07-06 06:23:21.311023', '2025-07-08 01:46:52.041548');

-- --------------------------------------------------------

--
-- Table structure for table `api_inventory`
--

CREATE TABLE `api_inventory` (
  `id` bigint(20) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `item_type` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `description` longtext DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `last_restocked_date` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_restocked_by_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_medicaldocument`
--

CREATE TABLE `api_medicaldocument` (
  `id` bigint(20) NOT NULL,
  `chest_xray` varchar(100) DEFAULT NULL,
  `cbc` varchar(100) DEFAULT NULL,
  `blood_typing` varchar(100) DEFAULT NULL,
  `urinalysis` varchar(100) DEFAULT NULL,
  `drug_test` varchar(100) DEFAULT NULL,
  `hepa_b` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `rejection_reason` longtext DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `reviewed_by_id` bigint(20) DEFAULT NULL,
  `submitted_for_review` tinyint(1) NOT NULL,
  `certificate_issued_at` datetime(6) DEFAULT NULL,
  `medical_certificate` varchar(100) DEFAULT NULL,
  `academic_year_id` bigint(20) DEFAULT NULL,
  `advised_for_consultation_at` datetime(6) DEFAULT NULL,
  `advised_for_consultation_by_id` bigint(20) DEFAULT NULL,
  `consultation_reason` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_medicaldocument`
--

INSERT INTO `api_medicaldocument` (`id`, `chest_xray`, `cbc`, `blood_typing`, `urinalysis`, `drug_test`, `hepa_b`, `uploaded_at`, `updated_at`, `patient_id`, `status`, `rejection_reason`, `reviewed_at`, `reviewed_by_id`, `submitted_for_review`, `certificate_issued_at`, `medical_certificate`, `academic_year_id`, `advised_for_consultation_at`, `advised_for_consultation_by_id`, `consultation_reason`) VALUES
(37, 'medical_documents/chest_xray/cutekitten_fBLoZKz.png', 'medical_documents/cbc/dog1_MNhXEH3.png', 'medical_documents/blood_typing/cutekitten_Morimkf.png', 'medical_documents/urinalysis/dog2.png', 'medical_documents/drug_test/cutekitten_IzT5Ddm.png', '', '2025-07-08 05:01:47.946290', '2025-07-08 05:09:38.549799', 31, 'issued', NULL, '2025-07-08 05:09:29.014255', 8, 0, '2025-07-08 05:09:37.869946', 'medical_certificates/medical_certificate_Magno_Rezier_20250708_050938.pdf', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_medicalformdata`
--

CREATE TABLE `api_medicalformdata` (
  `id` bigint(20) NOT NULL,
  `file_no` varchar(50) DEFAULT NULL,
  `surname` varchar(100) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `sex` varchar(10) DEFAULT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `pulse_rate` varchar(20) DEFAULT NULL,
  `temperature` varchar(20) DEFAULT NULL,
  `respiratory_rate` varchar(20) DEFAULT NULL,
  `weight` varchar(20) DEFAULT NULL,
  `height` varchar(20) DEFAULT NULL,
  `chief_complaint` longtext DEFAULT NULL,
  `present_illness` longtext DEFAULT NULL,
  `past_medical_history` longtext DEFAULT NULL,
  `family_history` longtext DEFAULT NULL,
  `allergies` longtext DEFAULT NULL,
  `medications` longtext DEFAULT NULL,
  `general_appearance` longtext DEFAULT NULL,
  `heent` longtext DEFAULT NULL,
  `cardiovascular` longtext DEFAULT NULL,
  `respiratory` longtext DEFAULT NULL,
  `gastrointestinal` longtext DEFAULT NULL,
  `genitourinary` longtext DEFAULT NULL,
  `neurological` longtext DEFAULT NULL,
  `musculoskeletal` longtext DEFAULT NULL,
  `integumentary` longtext DEFAULT NULL,
  `diagnosis` longtext DEFAULT NULL,
  `treatment_plan` longtext DEFAULT NULL,
  `recommendations` longtext DEFAULT NULL,
  `follow_up` longtext DEFAULT NULL,
  `examined_by` varchar(100) DEFAULT NULL,
  `examiner_license` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `appointment_id` bigint(20) DEFAULT NULL,
  `patient_id` bigint(20) NOT NULL,
  `academic_year_id` bigint(20) DEFAULT NULL,
  `bmi` decimal(4,2) DEFAULT NULL,
  `cbc_results` longtext DEFAULT NULL,
  `chest_xray_results` longtext DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `hepatitis_b_screening` longtext DEFAULT NULL,
  `other_tests` longtext DEFAULT NULL,
  `physical_examination_notes` longtext DEFAULT NULL,
  `urinalysis_results` longtext DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_medicalformdata`
--

INSERT INTO `api_medicalformdata` (`id`, `file_no`, `surname`, `first_name`, `middle_name`, `age`, `sex`, `blood_pressure`, `pulse_rate`, `temperature`, `respiratory_rate`, `weight`, `height`, `chief_complaint`, `present_illness`, `past_medical_history`, `family_history`, `allergies`, `medications`, `general_appearance`, `heent`, `cardiovascular`, `respiratory`, `gastrointestinal`, `genitourinary`, `neurological`, `musculoskeletal`, `integumentary`, `diagnosis`, `treatment_plan`, `recommendations`, `follow_up`, `examined_by`, `examiner_license`, `date`, `created_at`, `updated_at`, `appointment_id`, `patient_id`, `academic_year_id`, `bmi`, `cbc_results`, `chest_xray_results`, `height_cm`, `hepatitis_b_screening`, `other_tests`, `physical_examination_notes`, `urinalysis_results`, `weight_kg`) VALUES
(2, 'TEMP-51', 'Magno', 'Rezier', 'John O.', 7, 'Female', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Return for follow-up consultation as needed.', 'Rezier John O Magno', '23398', '2025-07-08', '2025-07-08 05:03:50.763308', '2025-07-08 05:03:50.763308', 49, 31, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_medicalrecord`
--

CREATE TABLE `api_medicalrecord` (
  `id` bigint(20) NOT NULL,
  `record_date` datetime(6) NOT NULL,
  `diagnosis` longtext NOT NULL,
  `treatment` longtext NOT NULL,
  `prescription` longtext DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `doctor_id` bigint(20) DEFAULT NULL,
  `patient_id` bigint(20) NOT NULL,
  `school_year_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_medicationinventory`
--

CREATE TABLE `api_medicationinventory` (
  `id` bigint(20) NOT NULL,
  `medication_name` varchar(200) NOT NULL,
  `medication_type` varchar(20) NOT NULL,
  `brand_name` varchar(200) DEFAULT NULL,
  `generic_name` varchar(200) DEFAULT NULL,
  `dosage_form` varchar(20) NOT NULL,
  `strength` varchar(100) DEFAULT NULL,
  `unit_size` varchar(100) NOT NULL,
  `current_stock` int(11) NOT NULL,
  `minimum_stock_level` int(11) NOT NULL,
  `cost_per_unit` decimal(10,2) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `storage_instructions` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `notes` longtext DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_id` bigint(20) DEFAULT NULL,
  `last_updated_by_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_medicationrestockrecord`
--

CREATE TABLE `api_medicationrestockrecord` (
  `id` bigint(20) NOT NULL,
  `restock_type` varchar(20) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `cost_per_unit` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `receipt_reference` varchar(100) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `restock_date` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `medication_id` bigint(20) NOT NULL,
  `restocked_by_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_pastmedicalhistoryitem`
--

CREATE TABLE `api_pastmedicalhistoryitem` (
  `id` bigint(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `display_order` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_pastmedicalhistoryitem`
--

INSERT INTO `api_pastmedicalhistoryitem` (`id`, `name`, `description`, `is_enabled`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Asthma', '', 0, 0, '2025-07-04 18:06:46.055977', '2025-07-08 01:46:51.357261'),
(2, 'Allergic Rhinitis', '', 0, 1, '2025-07-04 18:06:46.055977', '2025-07-08 01:46:51.500094'),
(3, 'Skin Allergies', '', 0, 2, '2025-07-04 18:06:46.067579', '2025-07-08 01:46:51.524851'),
(4, 'Food Allergies', '', 0, 3, '2025-07-04 18:06:46.071579', '2025-07-08 01:46:51.552957'),
(5, 'Drug Allergies', '', 0, 4, '2025-07-04 18:06:46.073534', '2025-07-08 01:46:51.581479'),
(6, 'Hypertension', '', 0, 5, '2025-07-04 18:06:46.073534', '2025-07-08 01:46:51.592196'),
(7, 'Diabetes', '', 0, 6, '2025-07-04 18:06:46.073534', '2025-07-08 01:46:51.625020'),
(8, 'Heart Disease', '', 0, 7, '2025-07-04 18:06:46.073534', '2025-07-08 01:46:51.641703'),
(9, 'Kidney Disease', '', 0, 8, '2025-07-04 18:06:46.089304', '2025-07-08 01:46:51.666585'),
(10, 'Liver Disease', '', 0, 9, '2025-07-04 18:06:46.089304', '2025-07-08 01:46:51.700049'),
(11, 'Thyroid Disorders', '', 0, 10, '2025-07-04 18:06:46.089304', '2025-07-08 01:46:51.733282'),
(12, 'Epilepsy/Seizures', '', 0, 11, '2025-07-04 18:06:46.089304', '2025-07-08 01:46:51.724240'),
(13, 'Mental Health Conditions', '', 0, 12, '2025-07-04 18:06:46.105270', '2025-07-08 01:46:51.783249'),
(14, 'Cancer', '', 0, 13, '2025-07-04 18:06:46.121089', '2025-07-08 01:46:51.791386'),
(15, 'Stroke', '', 0, 14, '2025-07-04 18:06:46.121089', '2025-07-08 01:46:51.800112'),
(16, 'Tuberculosis', '', 0, 15, '2025-07-04 18:06:46.121089', '2025-07-08 01:46:51.856303'),
(17, 'Hepatitis', '', 0, 16, '2025-07-04 18:06:46.121089', '2025-07-08 01:46:51.850100'),
(18, 'Pneumonia', '', 0, 17, '2025-07-04 18:06:46.137005', '2025-07-08 01:46:51.866703'),
(19, 'Surgeries', '', 0, 18, '2025-07-04 18:06:46.137005', '2025-07-08 01:46:51.866703'),
(20, 'Hospitalizations', '', 0, 19, '2025-07-04 18:06:46.137005', '2025-07-08 01:46:51.945838'),
(21, 'Blood Transfusions', '', 0, 20, '2025-07-04 18:06:46.137005', '2025-07-08 01:46:51.933403'),
(22, 'Chronic Pain', '', 0, 21, '2025-07-04 18:06:46.152672', '2025-07-08 01:46:51.950229'),
(23, 'Autoimmune Disorders', '', 0, 22, '2025-07-04 18:06:46.152672', '2025-07-08 01:46:51.966509'),
(24, 'Gastrointestinal Disorders', '', 0, 23, '2025-07-04 18:06:46.152672', '2025-07-08 01:46:51.991776'),
(25, 'Respiratory Conditions', '', 0, 24, '2025-07-04 18:06:46.168469', '2025-07-08 01:46:52.016853'),
(26, 'Allergic Reactions', 'Past medical history: Allergic Reactions', 0, 0, '2025-07-05 18:41:02.942142', '2025-07-08 01:46:51.342278'),
(27, 'Chickenpox', 'Past medical history: Chickenpox', 0, 2, '2025-07-05 18:41:02.947757', '2025-07-08 01:46:51.524851'),
(28, 'Dengue Fever', 'Past medical history: Dengue Fever', 0, 3, '2025-07-05 18:41:02.956207', '2025-07-08 01:46:51.552957'),
(29, 'Fractures', 'Past medical history: Fractures', 0, 5, '2025-07-05 18:41:02.963509', '2025-07-08 01:46:51.584234'),
(30, 'Heart Problems', 'Past medical history: Heart Problems', 0, 6, '2025-07-05 18:41:02.970074', '2025-07-08 01:46:51.650036'),
(31, 'High Blood Pressure', 'Past medical history: High Blood Pressure', 0, 8, '2025-07-05 18:41:02.976368', '2025-07-08 01:46:51.650036'),
(32, 'Hospitalization', 'Past medical history: Hospitalization', 0, 9, '2025-07-05 18:41:02.976368', '2025-07-08 01:46:51.675000'),
(33, 'Injuries', 'Past medical history: Injuries', 0, 10, '2025-07-05 18:41:02.985991', '2025-07-08 01:46:51.716966'),
(34, 'Kidney Problems', 'Past medical history: Kidney Problems', 0, 11, '2025-07-05 18:41:02.993609', '2025-07-08 01:46:51.742089'),
(35, 'Liver Problems', 'Past medical history: Liver Problems', 0, 12, '2025-07-05 18:41:02.995341', '2025-07-08 01:46:51.766628'),
(36, 'Malaria', 'Past medical history: Malaria', 0, 13, '2025-07-05 18:41:02.999635', '2025-07-08 01:46:51.783249'),
(37, 'Measles', 'Past medical history: Measles', 0, 14, '2025-07-05 18:41:03.006383', '2025-07-08 01:46:51.800112'),
(38, 'Operations/Surgery', 'Past medical history: Operations/Surgery', 0, 15, '2025-07-05 18:41:03.010732', '2025-07-08 01:46:51.850100'),
(39, 'Skin Conditions', 'Past medical history: Skin Conditions', 0, 17, '2025-07-05 18:41:03.019124', '2025-07-08 01:46:51.874865'),
(40, 'Typhoid', 'Past medical history: Typhoid', 0, 18, '2025-07-05 18:41:03.025155', '2025-07-08 01:46:51.916486'),
(41, 'Urinary Tract Infections', 'Past medical history: Urinary Tract Infections', 0, 20, '2025-07-05 18:41:03.032694', '2025-07-08 01:46:51.925002'),
(42, 'Vision Problems', 'Past medical history: Vision Problems', 0, 21, '2025-07-05 18:41:03.034704', '2025-07-08 01:46:51.945838'),
(43, 'Other Medical Conditions', 'Past medical history: Other Medical Conditions', 0, 22, '2025-07-05 18:41:03.042600', '2025-07-08 01:46:51.991776'),
(44, 'None', 'Past medical history: None', 0, 23, '2025-07-05 18:41:03.052163', '2025-07-08 01:46:52.008141'),
(45, 'Surgery', '', 1, 0, '2025-07-06 06:23:21.188125', '2025-07-08 01:46:51.465742'),
(46, 'Allergic Reaction', '', 0, 0, '2025-07-06 06:23:21.204683', '2025-07-08 01:46:51.350124'),
(47, 'Blood Transfusion', '', 0, 0, '2025-07-06 06:23:21.216976', '2025-07-08 01:46:51.375505'),
(48, 'Fracture', '', 0, 0, '2025-07-06 06:23:21.229824', '2025-07-08 01:46:51.399943'),
(49, 'Serious Injury', '', 0, 0, '2025-07-06 06:23:21.246322', '2025-07-08 01:46:51.474924'),
(50, 'Pregnancy', '', 0, 0, '2025-07-06 06:23:21.258643', '2025-07-08 01:46:51.448028'),
(51, 'Mental Health Treatment', '', 0, 0, '2025-07-06 06:23:21.269343', '2025-07-08 01:46:51.416467'),
(52, 'Serious Illness', '', 0, 0, '2025-07-06 06:45:50.455419', '2025-07-08 01:46:51.449910'),
(53, 'Chronic Conditions', '', 0, 0, '2025-07-06 06:45:50.462013', '2025-07-08 01:46:51.391337'),
(54, 'Substance Abuse Treatment', '', 1, 0, '2025-07-06 06:45:50.478061', '2025-07-08 01:46:51.474924'),
(55, 'Organ Transplant', '', 0, 0, '2025-07-06 06:45:50.489576', '2025-07-08 01:46:51.406355'),
(56, 'Major Injury', '', 0, 0, '2025-07-06 06:45:50.496962', '2025-07-08 01:46:51.399943');

-- --------------------------------------------------------

--
-- Table structure for table `api_patient`
--

CREATE TABLE `api_patient` (
  `id` bigint(20) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `address` longtext DEFAULT NULL,
  `emergency_contact_first_name` varchar(100) DEFAULT NULL,
  `emergency_contact_number` varchar(20) DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `allergies` longtext DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `civil_status` varchar(20) DEFAULT NULL,
  `comorbid_illnesses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`comorbid_illnesses`)),
  `email` varchar(254) DEFAULT NULL,
  `emergency_contact_address` longtext DEFAULT NULL,
  `emergency_contact_middle_name` varchar(100) DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) DEFAULT NULL,
  `emergency_contact_surname` varchar(100) DEFAULT NULL,
  `family_medical_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`family_medical_history`)),
  `first_name` varchar(100) DEFAULT NULL,
  `hospital_admission_or_surgery` tinyint(1) NOT NULL,
  `maintenance_medications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`maintenance_medications`)),
  `middle_name` varchar(100) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `past_medical_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`past_medical_history`)),
  `photo` varchar(100) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city_municipality` varchar(100) DEFAULT NULL,
  `street` varchar(200) DEFAULT NULL,
  `emergency_contact_barangay` varchar(100) DEFAULT NULL,
  `emergency_contact_street` varchar(200) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `vaccination_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`vaccination_history`)),
  `hospital_admission_details` text DEFAULT NULL COMMENT 'Details of hospital admission or surgery when answer is Yes',
  `surname` varchar(100) DEFAULT NULL,
  `sex` varchar(10) DEFAULT NULL,
  `course` varchar(200) DEFAULT NULL,
  `year_level` varchar(50) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `city_address` longtext DEFAULT NULL,
  `provincial_address` longtext DEFAULT NULL,
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_city_address` longtext DEFAULT NULL,
  `covid19_vaccination_status` varchar(50) DEFAULT NULL,
  `menstruation_age_began` int(11) DEFAULT NULL,
  `menstruation_regular` tinyint(1) NOT NULL,
  `menstruation_irregular` tinyint(1) NOT NULL,
  `number_of_pregnancies` int(11) DEFAULT NULL,
  `number_of_live_children` int(11) DEFAULT NULL,
  `menstrual_symptoms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`menstrual_symptoms`)),
  `past_conditions_this_year` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`past_conditions_this_year`)),
  `hospital_admissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`hospital_admissions`)),
  `uhs_template_compliant` tinyint(1) NOT NULL,
  `record_completion_status` varchar(20) NOT NULL,
  `staff_notes` longtext DEFAULT NULL,
  `semester_id` int(11) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_patient`
--

INSERT INTO `api_patient` (`id`, `student_id`, `name`, `gender`, `date_of_birth`, `age`, `department`, `contact_number`, `address`, `emergency_contact_first_name`, `emergency_contact_number`, `blood_type`, `allergies`, `created_at`, `updated_at`, `user_id`, `civil_status`, `comorbid_illnesses`, `email`, `emergency_contact_address`, `emergency_contact_middle_name`, `emergency_contact_relationship`, `emergency_contact_surname`, `family_medical_history`, `first_name`, `hospital_admission_or_surgery`, `maintenance_medications`, `middle_name`, `nationality`, `past_medical_history`, `photo`, `religion`, `suffix`, `barangay`, `city_municipality`, `street`, `emergency_contact_barangay`, `emergency_contact_street`, `school_year_id`, `vaccination_history`, `hospital_admission_details`, `surname`, `sex`, `course`, `year_level`, `birthday`, `city_address`, `provincial_address`, `emergency_contact_name`, `emergency_contact_city_address`, `covid19_vaccination_status`, `menstruation_age_began`, `menstruation_regular`, `menstruation_irregular`, `number_of_pregnancies`, `number_of_live_children`, `menstrual_symptoms`, `past_conditions_this_year`, `hospital_admissions`, `uhs_template_compliant`, `record_completion_status`, `staff_notes`, `semester_id`, `semester`) VALUES
(31, 'TEMP-51', 'Magno, Rezier', 'Female', '2018-05-16', 7, 'Incoming Freshman', '09702402180', 'asdasdasas, dasdasd, Zamboanga City', 'Rezier', '09702402180', 'A-', NULL, '2025-07-08 04:59:46.068642', '2025-07-08 05:33:33.854630', 51, 'single', NULL, 'johnmagno332@gmail.com', 'asdasdasdasd, 1212412, Zamboanga City', 'asdas', 'Parent', 'asad', NULL, 'Rezier', 0, NULL, 'John O.', 'Filipino', NULL, 'patient_photos/cutekitten_z1qfbCt.png', 'Roman Catholic', NULL, 'dasdasd', 'Zamboanga City', 'asdasdasas', '1212412', 'asdasdasdasd', 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, NULL, 1, 'incomplete', NULL, NULL, NULL),
(32, 'TEST-001', 'Dela Cruz, Juan', 'Male', NULL, 20, 'Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-08 05:47:52.826700', '2025-07-08 05:47:52.826700', 53, NULL, NULL, 'test.patient@wmsu.edu', NULL, NULL, NULL, NULL, NULL, 'Juan', 0, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, NULL, 1, 'incomplete', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_profilerequirement`
--

CREATE TABLE `api_profilerequirement` (
  `id` bigint(20) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `display_name` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `category` varchar(20) NOT NULL,
  `is_required` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_profilerequirement`
--

INSERT INTO `api_profilerequirement` (`id`, `field_name`, `display_name`, `description`, `category`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'name', 'Last Name', 'Patient surname/family name', 'personal', 1, 1, '2025-07-02 18:13:26.970083', '2025-07-08 01:46:50.424320'),
(2, 'first_name', 'First Name', 'Patient first name', 'personal', 1, 1, '2025-07-02 18:13:26.978322', '2025-07-08 01:46:50.416075'),
(3, 'middle_name', 'Middle Name', 'Patient middle name', 'personal', 0, 1, '2025-07-02 18:13:26.979319', '2025-07-08 01:46:50.432729'),
(4, 'date_of_birth', 'Date of Birth', 'Patient birthdate', 'personal', 1, 1, '2025-07-02 18:13:26.979319', '2025-07-08 01:46:50.408046'),
(5, 'gender', 'Gender', 'Patient gender', 'personal', 1, 1, '2025-07-02 18:13:26.997188', '2025-07-08 01:46:50.416075'),
(6, 'blood_type', 'Blood Type', 'Patient blood type', 'health', 1, 1, '2025-07-02 18:13:27.003861', '2025-07-08 01:46:50.383300'),
(7, 'city_municipality', 'City/Municipality', 'City or municipality', 'personal', 1, 1, '2025-07-02 18:13:27.013470', '2025-07-08 01:46:50.399603'),
(8, 'barangay', 'Barangay', 'Barangay/district', 'personal', 1, 1, '2025-07-02 18:13:27.019685', '2025-07-08 01:46:50.399603'),
(9, 'street', 'Street', 'Street address', 'personal', 1, 1, '2025-07-02 18:13:27.025594', '2025-07-08 01:46:50.432729'),
(10, 'covid_vaccination_status', 'COVID Vaccination Status', 'COVID-19 vaccination status', 'health', 1, 1, '2025-07-02 18:13:27.031941', '2025-07-08 01:46:50.391415'),
(11, 'hospital_admission_or_surgery', 'Hospital Admission/Surgery History', 'History of hospital admissions or surgeries', 'health', 1, 1, '2025-07-02 18:13:27.038071', '2025-07-08 01:46:50.391415'),
(12, 'emergency_contact_first_name', 'Emergency Contact First Name', 'Emergency contact first name', 'emergency', 1, 1, '2025-07-02 18:13:27.042240', '2025-07-08 01:46:50.349745'),
(13, 'emergency_contact_last_name', 'Emergency Contact Last Name', 'Emergency contact last name', 'emergency', 1, 1, '2025-07-02 18:13:27.046058', '2025-07-08 01:46:50.358053'),
(14, 'emergency_contact_phone', 'Emergency Contact Phone', 'Emergency contact phone number', 'emergency', 1, 1, '2025-07-02 18:13:27.053937', '2025-07-08 01:46:50.374470'),
(15, 'last_name', 'Last Name', 'Patient last name', 'personal', 1, 1, '2025-07-06 06:23:20.881708', '2025-07-08 01:46:50.424320'),
(16, 'contact_number', 'Contact Number', 'Patient contact number', 'personal', 1, 1, '2025-07-06 06:23:20.922344', '2025-07-08 01:46:50.408046'),
(17, 'emergency_contact', 'Emergency Contact', 'Emergency contact information', 'emergency', 1, 1, '2025-07-06 06:23:20.936932', '2025-07-08 01:46:50.341434'),
(18, 'emergency_contact_name', 'Emergency Contact Name', 'Emergency contact person\'s name', 'emergency', 1, 1, '2025-07-06 06:45:25.066261', '2025-07-08 01:46:50.366205'),
(19, 'emergency_contact_number', 'Emergency Contact Number', 'Emergency contact person\'s phone number', 'emergency', 1, 1, '2025-07-06 06:45:25.082276', '2025-07-08 01:46:50.374470'),
(20, 'allergies', 'Allergies', 'Patient\'s known allergies', 'health', 0, 1, '2025-07-06 06:45:25.090085', '2025-07-08 01:46:50.383300');

-- --------------------------------------------------------

--
-- Table structure for table `api_staffdetails`
--

CREATE TABLE `api_staffdetails` (
  `id` bigint(20) NOT NULL,
  `signature` varchar(100) DEFAULT NULL,
  `full_name` varchar(200) NOT NULL,
  `position` varchar(100) NOT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `ptr_number` varchar(50) DEFAULT NULL,
  `campus_assigned` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `assigned_campuses` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_staffdetails`
--

INSERT INTO `api_staffdetails` (`id`, `signature`, `full_name`, `position`, `license_number`, `ptr_number`, `campus_assigned`, `created_at`, `updated_at`, `user_id`, `phone_number`, `assigned_campuses`) VALUES
(20, '', 'Updated Admin User', 'Updated System Administrator', 'ADMIN123', 'PTR123', 'a', '2025-07-07 02:08:09.331016', '2025-07-07 02:10:31.187360', 31, '123-456-7890', 'a,b'),
(21, 'staff_signatures/signature_vsmxbN8.png', 'Rezier John O Magno', 'Staff', '23398', '12984291', 'a', '2025-07-07 02:16:13.559363', '2025-07-08 02:55:59.632003', 8, '019240912920', 'a'),
(24, '', 'Dr. Maria Santos', 'Chief Dentist', 'DDS-12345', 'PTR-67890', 'a', '2025-07-08 05:45:11.207654', '2025-07-08 05:45:11.207654', 52, '+639123456789', 'a'),
(25, '', 'Dr. Felicitas C. Elago', 'Chief Medical Officer', 'MD-12345', '', 'a', '2025-07-15 21:11:21.000000', '2025-07-15 21:11:21.000000', 55, '+639123456789', 'a');

-- --------------------------------------------------------

--
-- Table structure for table `api_systemconfiguration`
--

CREATE TABLE `api_systemconfiguration` (
  `id` bigint(20) NOT NULL,
  `profile_requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`profile_requirements`)),
  `document_requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`document_requirements`)),
  `campus_schedules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`campus_schedules`)),
  `dentist_schedules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`dentist_schedules`)),
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_vaccination`
--

CREATE TABLE `api_vaccination` (
  `id` bigint(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `display_order` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_vaccination`
--

INSERT INTO `api_vaccination` (`id`, `name`, `description`, `is_enabled`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'COVID-19', '', 0, 0, '2025-07-04 18:06:45.990368', '2025-07-08 01:46:50.875207'),
(2, 'Influenza (Flu)', '', 0, 1, '2025-07-04 18:06:45.990368', '2025-07-08 01:46:51.032521'),
(3, 'Hepatitis B', '', 0, 2, '2025-07-04 18:06:45.990368', '2025-07-08 01:46:50.916724'),
(4, 'Hepatitis A', '', 0, 3, '2025-07-04 18:06:46.006114', '2025-07-08 01:46:50.915915'),
(5, 'Tetanus', '', 0, 4, '2025-07-04 18:06:46.006114', '2025-07-08 01:46:51.224206'),
(6, 'Measles, Mumps, Rubella (MMR)', '', 0, 5, '2025-07-04 18:06:46.013935', '2025-07-08 01:46:51.050018'),
(7, 'Polio', '', 0, 6, '2025-07-04 18:06:46.013935', '2025-07-08 01:46:51.141676'),
(8, 'Pneumococcal', '', 0, 7, '2025-07-04 18:06:46.013935', '2025-07-08 01:46:51.150209'),
(9, 'Meningococcal', '', 0, 8, '2025-07-04 18:06:46.013935', '2025-07-08 01:46:51.064809'),
(10, 'Human Papillomavirus (HPV)', '', 0, 9, '2025-07-04 18:06:46.031313', '2025-07-08 01:46:50.950059'),
(11, 'Varicella (Chickenpox)', '', 0, 10, '2025-07-04 18:06:46.031313', '2025-07-08 01:46:51.333367'),
(12, 'Tuberculosis (BCG)', '', 0, 11, '2025-07-04 18:06:46.040161', '2025-07-08 01:46:51.216970'),
(13, 'Japanese Encephalitis', '', 0, 12, '2025-07-04 18:06:46.040161', '2025-07-08 01:46:51.008167'),
(14, 'Rabies', '', 0, 13, '2025-07-04 18:06:46.048847', '2025-07-08 01:46:51.158321'),
(15, 'Typhoid', '', 0, 14, '2025-07-04 18:06:46.048847', '2025-07-08 01:46:51.300003'),
(16, 'BCG (Bacillus Calmette-Guérin)', 'Standard vaccination: BCG (Bacillus Calmette-Guérin)', 0, 0, '2025-07-05 18:41:02.879496', '2025-07-08 01:46:50.858674'),
(17, 'DPT (Diphtheria, Pertussis, Tetanus)', 'Standard vaccination: DPT (Diphtheria, Pertussis, Tetanus)', 0, 2, '2025-07-05 18:41:02.884012', '2025-07-08 01:46:50.891768'),
(18, 'OPV (Oral Polio Vaccine)', 'Standard vaccination: OPV (Oral Polio Vaccine)', 0, 3, '2025-07-05 18:41:02.888150', '2025-07-08 01:46:51.124768'),
(19, 'IPV (Inactivated Polio Vaccine)', 'Standard vaccination: IPV (Inactivated Polio Vaccine)', 0, 4, '2025-07-05 18:41:02.894629', '2025-07-08 01:46:51.008167'),
(20, 'HIB (Haemophilus influenzae type b)', 'Standard vaccination: HIB (Haemophilus influenzae type b)', 0, 5, '2025-07-05 18:41:02.898796', '2025-07-08 01:46:50.932529'),
(21, 'PCV (Pneumococcal Conjugate Vaccine)', 'Standard vaccination: PCV (Pneumococcal Conjugate Vaccine)', 0, 6, '2025-07-05 18:41:02.904468', '2025-07-08 01:46:51.133517'),
(22, 'MMR (Measles, Mumps, Rubella)', 'Standard vaccination: MMR (Measles, Mumps, Rubella)', 0, 7, '2025-07-05 18:41:02.910644', '2025-07-08 01:46:51.075261'),
(23, 'Influenza (Annual)', 'Standard vaccination: Influenza (Annual)', 0, 10, '2025-07-05 18:41:02.910644', '2025-07-08 01:46:51.000212'),
(24, 'HPV (Human Papillomavirus)', 'Standard vaccination: HPV (Human Papillomavirus)', 0, 11, '2025-07-05 18:41:02.910644', '2025-07-08 01:46:50.958422'),
(25, 'Tdap (Tetanus, Diphtheria, Pertussis)', 'Standard vaccination: Tdap (Tetanus, Diphtheria, Pertussis)', 1, 13, '2025-07-05 18:41:02.923126', '2025-07-08 01:46:51.191701'),
(26, 'Other', 'Standard vaccination: Other', 0, 15, '2025-07-05 18:41:02.934668', '2025-07-08 01:46:51.133517'),
(27, 'Influenza', '', 0, 0, '2025-07-06 06:23:21.102895', '2025-07-08 01:46:50.983282'),
(28, 'MMR', '', 0, 0, '2025-07-06 06:23:21.121519', '2025-07-08 01:46:51.066831'),
(29, 'HPV', '', 0, 0, '2025-07-06 06:23:21.140176', '2025-07-08 01:46:50.942280'),
(30, 'Varicella', '', 1, 0, '2025-07-06 06:23:21.158413', '2025-07-08 01:46:51.316809'),
(31, 'Tdap', '', 0, 0, '2025-07-06 06:23:21.172852', '2025-07-08 01:46:51.208374'),
(32, 'Measles', '', 0, 0, '2025-07-06 06:45:50.417792', '2025-07-08 01:46:51.050018'),
(33, 'Mumps', '', 0, 0, '2025-07-06 06:45:50.430294', '2025-07-08 01:46:51.091273'),
(34, 'Rubella', '', 0, 0, '2025-07-06 06:45:50.433810', '2025-07-08 01:46:51.190794'),
(35, 'asd', '', 1, 0, '2025-07-06 13:08:29.155521', '2025-07-08 01:46:50.834730');

-- --------------------------------------------------------

--
-- Table structure for table `api_waiver`
--

CREATE TABLE `api_waiver` (
  `id` bigint(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `date_signed` date NOT NULL,
  `signature` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_waiver`
--

INSERT INTO `api_waiver` (`id`, `full_name`, `date_signed`, `signature`, `created_at`, `user_id`) VALUES
(4, 'Adonis, AOASJD AOID', '2025-07-06', 'data:image/png;base64,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', '2025-07-06 06:47:32.006545', 8),
(11, 'Magno, Rezier John O.', '2025-07-08', 'data:image/png;base64,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', '2025-07-08 05:00:15.399287', 51);

-- --------------------------------------------------------

--
-- Table structure for table `auth_group`
--

CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_group_permissions`
--

CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_permission`
--

CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_permission`
--

INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add user', 6, 'add_customuser'),
(22, 'Can change user', 6, 'change_customuser'),
(23, 'Can delete user', 6, 'delete_customuser'),
(24, 'Can view user', 6, 'view_customuser'),
(25, 'Can add patient', 7, 'add_patient'),
(26, 'Can change patient', 7, 'change_patient'),
(27, 'Can delete patient', 7, 'delete_patient'),
(28, 'Can view patient', 7, 'view_patient'),
(29, 'Can add medical record', 8, 'add_medicalrecord'),
(30, 'Can change medical record', 8, 'change_medicalrecord'),
(31, 'Can delete medical record', 8, 'delete_medicalrecord'),
(32, 'Can view medical record', 8, 'view_medicalrecord'),
(33, 'Can add appointment', 9, 'add_appointment'),
(34, 'Can change appointment', 9, 'change_appointment'),
(35, 'Can delete appointment', 9, 'delete_appointment'),
(36, 'Can view appointment', 9, 'view_appointment'),
(37, 'Can add inventory', 10, 'add_inventory'),
(38, 'Can change inventory', 10, 'change_inventory'),
(39, 'Can delete inventory', 10, 'delete_inventory'),
(40, 'Can view inventory', 10, 'view_inventory'),
(41, 'Can add waiver', 11, 'add_waiver'),
(42, 'Can change waiver', 11, 'change_waiver'),
(43, 'Can delete waiver', 11, 'delete_waiver'),
(44, 'Can view waiver', 11, 'view_waiver'),
(45, 'Can add medical document', 12, 'add_medicaldocument'),
(46, 'Can change medical document', 12, 'change_medicaldocument'),
(47, 'Can delete medical document', 12, 'delete_medicaldocument'),
(48, 'Can view medical document', 12, 'view_medicaldocument'),
(49, 'Can add staff details', 13, 'add_staffdetails'),
(50, 'Can change staff details', 13, 'change_staffdetails'),
(51, 'Can delete staff details', 13, 'delete_staffdetails'),
(52, 'Can view staff details', 13, 'view_staffdetails'),
(53, 'Can add dental form data', 14, 'add_dentalformdata'),
(54, 'Can change dental form data', 14, 'change_dentalformdata'),
(55, 'Can delete dental form data', 14, 'delete_dentalformdata'),
(56, 'Can view dental form data', 14, 'view_dentalformdata'),
(57, 'Can add medical form data', 15, 'add_medicalformdata'),
(58, 'Can change medical form data', 15, 'change_medicalformdata'),
(59, 'Can delete medical form data', 15, 'delete_medicalformdata'),
(60, 'Can view medical form data', 15, 'view_medicalformdata'),
(61, 'Can add campus schedule', 16, 'add_campusschedule'),
(62, 'Can change campus schedule', 16, 'change_campusschedule'),
(63, 'Can delete campus schedule', 16, 'delete_campusschedule'),
(64, 'Can view campus schedule', 16, 'view_campusschedule'),
(65, 'Can add document requirement', 17, 'add_documentrequirement'),
(66, 'Can change document requirement', 17, 'change_documentrequirement'),
(67, 'Can delete document requirement', 17, 'delete_documentrequirement'),
(68, 'Can view document requirement', 17, 'view_documentrequirement'),
(69, 'Can add profile requirement', 18, 'add_profilerequirement'),
(70, 'Can change profile requirement', 18, 'change_profilerequirement'),
(71, 'Can delete profile requirement', 18, 'delete_profilerequirement'),
(72, 'Can view profile requirement', 18, 'view_profilerequirement'),
(73, 'Can add System Configuration', 19, 'add_systemconfiguration'),
(74, 'Can change System Configuration', 19, 'change_systemconfiguration'),
(75, 'Can delete System Configuration', 19, 'delete_systemconfiguration'),
(76, 'Can view System Configuration', 19, 'view_systemconfiguration'),
(77, 'Can add dentist schedule', 20, 'add_dentistschedule'),
(78, 'Can change dentist schedule', 20, 'change_dentistschedule'),
(79, 'Can delete dentist schedule', 20, 'delete_dentistschedule'),
(80, 'Can view dentist schedule', 20, 'view_dentistschedule'),
(81, 'Can add academic semester', 21, 'add_academicsemester'),
(82, 'Can change academic semester', 21, 'change_academicsemester'),
(83, 'Can delete academic semester', 21, 'delete_academicsemester'),
(84, 'Can view academic semester', 21, 'view_academicsemester'),
(85, 'Can add academic year', 22, 'add_academicyear'),
(86, 'Can change academic year', 22, 'change_academicyear'),
(87, 'Can delete academic year', 22, 'delete_academicyear'),
(88, 'Can view academic year', 22, 'view_academicyear'),
(89, 'Can add academic year', 23, 'add_academicyear'),
(90, 'Can change academic year', 23, 'change_academicyear'),
(91, 'Can delete academic year', 23, 'delete_academicyear'),
(92, 'Can view academic year', 23, 'view_academicyear'),
(93, 'Can add academic school year', 22, 'add_academicschoolyear'),
(94, 'Can change academic school year', 22, 'change_academicschoolyear'),
(95, 'Can delete academic school year', 22, 'delete_academicschoolyear'),
(96, 'Can view academic school year', 22, 'view_academicschoolyear'),
(97, 'Can add comorbid illness', 24, 'add_comorbidillness'),
(98, 'Can change comorbid illness', 24, 'change_comorbidillness'),
(99, 'Can delete comorbid illness', 24, 'delete_comorbidillness'),
(100, 'Can view comorbid illness', 24, 'view_comorbidillness'),
(101, 'Can add family medical history item', 25, 'add_familymedicalhistoryitem'),
(102, 'Can change family medical history item', 25, 'change_familymedicalhistoryitem'),
(103, 'Can delete family medical history item', 25, 'delete_familymedicalhistoryitem'),
(104, 'Can view family medical history item', 25, 'view_familymedicalhistoryitem'),
(105, 'Can add past medical history item', 26, 'add_pastmedicalhistoryitem'),
(106, 'Can change past medical history item', 26, 'change_pastmedicalhistoryitem'),
(107, 'Can delete past medical history item', 26, 'delete_pastmedicalhistoryitem'),
(108, 'Can view past medical history item', 26, 'view_pastmedicalhistoryitem'),
(109, 'Can add vaccination', 27, 'add_vaccination'),
(110, 'Can change vaccination', 27, 'change_vaccination'),
(111, 'Can delete vaccination', 27, 'delete_vaccination'),
(112, 'Can view vaccination', 27, 'view_vaccination'),
(113, 'Can add Medication Inventory', 28, 'add_medicationinventory'),
(114, 'Can change Medication Inventory', 28, 'change_medicationinventory'),
(115, 'Can delete Medication Inventory', 28, 'delete_medicationinventory'),
(116, 'Can view Medication Inventory', 28, 'view_medicationinventory'),
(117, 'Can add Dental Appointment Medication', 29, 'add_dentalappointmentmedication'),
(118, 'Can change Dental Appointment Medication', 29, 'change_dentalappointmentmedication'),
(119, 'Can delete Dental Appointment Medication', 29, 'delete_dentalappointmentmedication'),
(120, 'Can view Dental Appointment Medication', 29, 'view_dentalappointmentmedication'),
(121, 'Can add Medication Restock Record', 30, 'add_medicationrestockrecord'),
(122, 'Can change Medication Restock Record', 30, 'change_medicationrestockrecord'),
(123, 'Can delete Medication Restock Record', 30, 'delete_medicationrestockrecord'),
(124, 'Can view Medication Restock Record', 30, 'view_medicationrestockrecord'),
(125, 'Can add dental waiver', 31, 'add_dentalwaiver'),
(126, 'Can change dental waiver', 31, 'change_dentalwaiver'),
(127, 'Can delete dental waiver', 31, 'delete_dentalwaiver'),
(128, 'Can view dental waiver', 31, 'view_dentalwaiver');

-- --------------------------------------------------------

--
-- Table structure for table `django_admin_log`
--

CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) UNSIGNED NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `django_content_type`
--

CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `django_content_type`
--

INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(1, 'admin', 'logentry'),
(22, 'api', 'academicschoolyear'),
(21, 'api', 'academicsemester'),
(23, 'api', 'academicyear'),
(9, 'api', 'appointment'),
(16, 'api', 'campusschedule'),
(24, 'api', 'comorbidillness'),
(6, 'api', 'customuser'),
(29, 'api', 'dentalappointmentmedication'),
(14, 'api', 'dentalformdata'),
(31, 'api', 'dentalwaiver'),
(20, 'api', 'dentistschedule'),
(17, 'api', 'documentrequirement'),
(25, 'api', 'familymedicalhistoryitem'),
(10, 'api', 'inventory'),
(12, 'api', 'medicaldocument'),
(15, 'api', 'medicalformdata'),
(8, 'api', 'medicalrecord'),
(28, 'api', 'medicationinventory'),
(30, 'api', 'medicationrestockrecord'),
(26, 'api', 'pastmedicalhistoryitem'),
(7, 'api', 'patient'),
(18, 'api', 'profilerequirement'),
(13, 'api', 'staffdetails'),
(19, 'api', 'systemconfiguration'),
(27, 'api', 'vaccination'),
(11, 'api', 'waiver'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(4, 'contenttypes', 'contenttype'),
(5, 'sessions', 'session');

-- --------------------------------------------------------

--
-- Table structure for table `django_migrations`
--

CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `django_migrations`
--

INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'contenttypes', '0001_initial', '2025-06-20 01:53:21.128879'),
(2, 'contenttypes', '0002_remove_content_type_name', '2025-06-20 01:53:21.202532'),
(3, 'auth', '0001_initial', '2025-06-20 01:53:21.479645'),
(4, 'auth', '0002_alter_permission_name_max_length', '2025-06-20 01:53:21.549445'),
(5, 'auth', '0003_alter_user_email_max_length', '2025-06-20 01:53:21.559358'),
(6, 'auth', '0004_alter_user_username_opts', '2025-06-20 01:53:21.578353'),
(7, 'auth', '0005_alter_user_last_login_null', '2025-06-20 01:53:21.588370'),
(8, 'auth', '0006_require_contenttypes_0002', '2025-06-20 01:53:21.598522'),
(9, 'auth', '0007_alter_validators_add_error_messages', '2025-06-20 01:53:21.611059'),
(10, 'auth', '0008_alter_user_username_max_length', '2025-06-20 01:53:21.617677'),
(11, 'auth', '0009_alter_user_last_name_max_length', '2025-06-20 01:53:21.634396'),
(12, 'auth', '0010_alter_group_name_max_length', '2025-06-20 01:53:21.655514'),
(13, 'auth', '0011_update_proxy_permissions', '2025-06-20 01:53:21.670129'),
(14, 'auth', '0012_alter_user_first_name_max_length', '2025-06-20 01:53:21.681633'),
(15, 'api', '0001_initial', '2025-06-20 01:53:22.909759'),
(16, 'admin', '0001_initial', '2025-06-20 01:53:23.094197'),
(17, 'admin', '0002_logentry_remove_auto_add', '2025-06-20 01:53:23.137418'),
(18, 'admin', '0003_logentry_add_action_flag_choices', '2025-06-20 01:53:23.176606'),
(19, 'sessions', '0001_initial', '2025-06-20 01:53:23.258409'),
(20, 'api', '0002_customuser_user_type', '2025-06-20 02:30:28.121422'),
(21, 'api', '0003_waiver', '2025-06-20 07:35:18.016308'),
(22, 'api', '0004_customuser_middle_name', '2025-06-20 08:00:24.014645'),
(23, 'api', '0005_rename_emergency_contact_name_patient_emergency_contact_first_name_and_more', '2025-06-20 11:41:32.442611'),
(24, 'api', '0006_medicaldocument_waiver_unique_waiver_per_user_and_more', '2025-06-20 19:06:50.091988'),
(25, 'api', '0007_appointment_concern_appointment_type', '2025-06-20 19:13:42.518706'),
(26, 'api', '0008_appointment_rejection_reason', '2025-06-21 09:49:04.436496'),
(27, 'api', '0009_dentalformdata', '2025-06-21 10:43:57.397867'),
(28, 'api', '0010_medicaldocument_status', '2025-06-21 15:41:45.521305'),
(29, 'api', '0011_medicaldocument_rejection_reason_and_more', '2025-06-23 07:29:11.160852'),
(30, 'api', '0012_medicaldocument_certificate_issued_at_and_more', '2025-06-23 07:29:22.832662'),
(31, 'api', '0013_appointment_campus_staffdetails_and_more', '2025-06-23 07:48:12.739075'),
(32, 'api', '0014_medicalformdata', '2025-06-24 07:32:29.247094'),
(33, 'api', '0015_patient_barangay_patient_city_municipality_and_more', '2025-07-02 17:26:11.184407'),
(34, 'api', '0016_remove_patient_provincial_address_and_more', '2025-07-02 17:40:32.705036'),
(35, 'api', '0017_campusschedule_documentrequirement_and_more', '2025-07-02 18:11:30.507956'),
(36, 'api', '0018_alter_campusschedule_campus_and_more', '2025-07-02 18:19:21.331575'),
(37, 'api', '0019_alter_appointment_campus_and_more', '2025-07-02 18:40:34.335786'),
(38, 'api', '0002_academicsemester', '2025-07-03 10:37:53.209465'),
(39, 'api', '0020_academicsemester_academicyear', '2025-07-04 07:22:21.104833'),
(40, 'api', '0021_rename_academicyear_academicschoolyear_and_more', '2025-07-04 09:50:15.498939'),
(41, 'api', '0022_alter_patient_student_id_alter_patient_user_and_more', '2025-07-04 10:14:30.550455'),
(42, 'api', '0023_staffdetails_phone_number', '2025-07-04 11:42:10.057972'),
(43, 'api', '0024_staffdetails_assigned_campuses', '2025-07-04 11:50:18.446667'),
(44, 'api', '0025_customuser_blocked_at_customuser_blocked_by_and_more', '2025-07-04 13:00:32.083897'),
(45, 'api', '0026_remove_customuser_blocked_reason_and_more', '2025-07-04 13:10:46.149259'),
(46, 'api', '0027_comorbidillness_familymedicalhistoryitem_and_more', '2025-07-04 18:05:40.642869'),
(47, 'api', '0028_alter_patient_gender_alter_patient_name_and_more', '2025-07-04 20:51:54.504999'),
(48, 'api', '0029_patient_vaccination_history', '2025-07-04 21:25:17.997399'),
(49, 'api', '0030_remove_covid_vaccination_status', '2025-07-04 21:33:40.137047'),
(50, 'api', '0031_alter_patient_gender_alter_patient_name_and_more', '2025-07-04 22:02:37.697868'),
(51, 'api', '0032_appointment_is_rescheduled_appointment_original_date_and_more', '2025-07-05 00:48:25.974521'),
(52, 'api', '0033_add_dental_form_fields', '2025-07-05 11:23:19.134042'),
(53, 'api', '0034_remove_medicaldocument_unique_medical_document_per_patient_and_more', '2025-07-05 20:34:22.621218'),
(55, 'api', '0035_add_academic_year_to_forms', '2025-07-05 23:10:45.139341'),
(56, 'api', '0036_alter_dentalformdata_academic_year_and_more', '2025-07-05 23:11:12.216793'),
(57, 'api', '0037_add_academic_year_to_medicaldocument', '2025-07-05 23:14:17.063956'),
(58, 'api', '0038_alter_medicaldocument_patient', '2025-07-06 08:22:06.009734'),
(59, 'api', '0039_patient_hospital_admission_details', '2025-07-07 16:21:09.914917'),
(60, 'api', '0040_remove_other_specification_fields', '2025-07-07 16:21:09.937170'),
(61, 'api', '0041_medicaldocument_advised_for_consultation_at_and_more', '2025-07-07 23:37:54.028045'),
(62, 'api', '0042_dentalformdata_examiner_license_and_more', '2025-07-08 05:41:46.191473'),
(63, 'api', '0043_add_semester_tracking', '2025-07-15 13:13:09.461900'),
(64, 'api', '0044_add_medication_inventory_and_education_levels', '2025-07-15 13:13:26.355905'),
(65, 'api', '0045_uhs_patient_record_template_compliance', '2025-07-15 13:13:28.160140'),
(66, 'api', '0046_add_dental_consultations_record', '2025-07-15 13:13:28.830407'),
(67, 'api', '0047_alter_patient_address', '2025-07-15 13:13:28.883957'),
(68, 'api', '0048_remove_uhs_staff_only_fields', '2025-07-15 13:13:29.381688'),
(69, 'api', '0049_add_staff_only_fields_to_dental_form', '2025-07-15 13:13:29.723157'),
(70, 'api', '0050_move_staff_fields_to_medical_form', '2025-07-15 13:13:30.505879'),
(71, 'api', '0043_add_semester_fields_to_academic_year', '2025-07-15 14:23:32.733122'),
(72, 'api', '0044_add_semester_to_appointment', '2025-07-15 14:44:07.352706'),
(73, 'api', '0045_add_dental_waiver_model', '2025-07-15 16:34:55.163138'),
(74, 'api', '0046_add_semester_to_patient', '2025-07-15 16:37:48.053330');

-- --------------------------------------------------------

--
-- Table structure for table `django_session`
--

CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `item_type` varchar(50) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `last_restocked_date` date DEFAULT NULL,
  `last_restocked_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_number` varchar(20) DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `student_id`, `name`, `gender`, `date_of_birth`, `age`, `department`, `contact_number`, `address`, `emergency_contact_name`, `emergency_contact_number`, `blood_type`, `allergies`, `school_year_id`, `created_at`, `updated_at`) VALUES
(1, '2020-0001', 'Juan Dela Cruz', 'Male', '2003-05-15', 22, 'Engineering', '09123456789', NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-04 09:10:01', '2025-07-04 09:10:01'),
(2, '2021-0042', 'Maria Santos', 'Female', '2004-08-22', 20, 'Education', '09198765432', NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-04 09:10:01', '2025-07-04 09:10:01'),
(3, '2022-0105', 'Carlos Reyes', 'Male', '2003-12-10', 21, 'Nursing', '09178901234', NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-04 09:10:01', '2025-07-04 09:10:01');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','doctor','nurse','staff') NOT NULL DEFAULT 'staff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'admin@wmsu.edu.ph', '$2a$10$XQjKtAHvSDGKBjQ1rN0xL.TQY07tZutV1q3HZlp5qhNUFarU/YkEe', 'admin', '2025-07-04 09:10:01', '2025-07-04 09:10:01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `api_academicschoolyear`
--
ALTER TABLE `api_academicschoolyear`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_academicschoolyear_is_current` (`is_current`),
  ADD KEY `idx_academicschoolyear_status` (`status`);

--
-- Indexes for table `api_academicsemester`
--
ALTER TABLE `api_academicsemester`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_academicsemester_academic_year_id_semester_1aaad318_uniq` (`academic_year_id`,`semester`);

--
-- Indexes for table `api_appointment`
--
ALTER TABLE `api_appointment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_appointment_doctor_id_b0f543eb_fk_api_customuser_id` (`doctor_id`),
  ADD KEY `api_appointment_patient_id_52c787b0_fk_api_patient_id` (`patient_id`),
  ADD KEY `fk_appointment_school_year` (`school_year_id`),
  ADD KEY `api_appointment_rescheduled_by_id_4f5e0006_fk_api_customuser_id` (`rescheduled_by_id`);

--
-- Indexes for table `api_campusschedule`
--
ALTER TABLE `api_campusschedule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `campus` (`campus`);

--
-- Indexes for table `api_comorbidillness`
--
ALTER TABLE `api_comorbidillness`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `label` (`label`);

--
-- Indexes for table `api_customuser`
--
ALTER TABLE `api_customuser`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `api_customuser_blocked_by_id_e7f2d61b_fk_api_customuser_id` (`blocked_by_id`);

--
-- Indexes for table `api_customuser_groups`
--
ALTER TABLE `api_customuser_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_customuser_groups_customuser_id_group_id_d5b0c2ab_uniq` (`customuser_id`,`group_id`),
  ADD KEY `api_customuser_groups_group_id_f049027c_fk_auth_group_id` (`group_id`);

--
-- Indexes for table `api_customuser_user_permissions`
--
ALTER TABLE `api_customuser_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_customuser_user_perm_customuser_id_permission_9deacd8d_uniq` (`customuser_id`,`permission_id`),
  ADD KEY `api_customuser_user__permission_id_8735d73e_fk_auth_perm` (`permission_id`);

--
-- Indexes for table `api_dentalappointmentmedication`
--
ALTER TABLE `api_dentalappointmentmedication`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_dentalappointmen_appointment_id_5fecf20d_fk_api_appoi` (`appointment_id`),
  ADD KEY `api_dentalappointmen_medication_id_7f787eb9_fk_api_medic` (`medication_id`),
  ADD KEY `api_dentalappointmen_recorded_by_id_d02e3b71_fk_api_custo` (`recorded_by_id`);

--
-- Indexes for table `api_dentalformdata`
--
ALTER TABLE `api_dentalformdata`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_dentalformdata_patient_id_appointment_id_9af5953d_uniq` (`patient_id`,`appointment_id`),
  ADD KEY `api_dentalformdata_appointment_id_8463eab9_fk_api_appointment_id` (`appointment_id`),
  ADD KEY `api_dentalformdata_academic_year_id_352478ae` (`academic_year_id`);

--
-- Indexes for table `api_dentalwaiver`
--
ALTER TABLE `api_dentalwaiver`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dental_waiver_per_user` (`user_id`),
  ADD KEY `api_dentalwaiver_patient_id_9f154893_fk_api_patient_id` (`patient_id`);

--
-- Indexes for table `api_dentistschedule`
--
ALTER TABLE `api_dentistschedule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_dentistschedule_dentist_name_campus_612c354a_uniq` (`dentist_name`,`campus`);

--
-- Indexes for table `api_documentrequirement`
--
ALTER TABLE `api_documentrequirement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `field_name` (`field_name`);

--
-- Indexes for table `api_familymedicalhistoryitem`
--
ALTER TABLE `api_familymedicalhistoryitem`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `api_inventory`
--
ALTER TABLE `api_inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_inventory_last_restocked_by_id_b83645c4_fk_api_customuser_id` (`last_restocked_by_id`);

--
-- Indexes for table `api_medicaldocument`
--
ALTER TABLE `api_medicaldocument`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_medicaldocument_reviewed_by_id_6d962220_fk_api_customuser_id` (`reviewed_by_id`),
  ADD KEY `api_medicaldocument_patient_id_23898408` (`patient_id`),
  ADD KEY `api_medicaldocument_advised_for_consulta_4ceb2b84_fk_api_custo` (`advised_for_consultation_by_id`);

--
-- Indexes for table `api_medicalformdata`
--
ALTER TABLE `api_medicalformdata`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_medicalformdata_patient_id_appointment_id_b4e9dada_uniq` (`patient_id`,`appointment_id`),
  ADD KEY `api_medicalformdata_appointment_id_14d13659_fk_api_appoi` (`appointment_id`),
  ADD KEY `api_medicalformdata_academic_year_id_4d65c604` (`academic_year_id`);

--
-- Indexes for table `api_medicalrecord`
--
ALTER TABLE `api_medicalrecord`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_medicalrecord_doctor_id_22a41281_fk_api_customuser_id` (`doctor_id`),
  ADD KEY `api_medicalrecord_patient_id_b000d25a_fk_api_patient_id` (`patient_id`),
  ADD KEY `fk_medicalrecord_school_year` (`school_year_id`);

--
-- Indexes for table `api_medicationinventory`
--
ALTER TABLE `api_medicationinventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_medication_strength_form` (`medication_name`,`strength`,`dosage_form`),
  ADD KEY `api_medicationinvent_created_by_id_2afa7f61_fk_api_custo` (`created_by_id`),
  ADD KEY `api_medicationinvent_last_updated_by_id_1db9968a_fk_api_custo` (`last_updated_by_id`);

--
-- Indexes for table `api_medicationrestockrecord`
--
ALTER TABLE `api_medicationrestockrecord`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_medicationrestoc_medication_id_2f4a47ab_fk_api_medic` (`medication_id`),
  ADD KEY `api_medicationrestoc_restocked_by_id_d153df69_fk_api_custo` (`restocked_by_id`);

--
-- Indexes for table `api_pastmedicalhistoryitem`
--
ALTER TABLE `api_pastmedicalhistoryitem`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `api_patient`
--
ALTER TABLE `api_patient`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_patient_user_id_school_year_id_semester_ab980f66_uniq` (`user_id`,`school_year_id`,`semester`),
  ADD KEY `fk_patient_school_year` (`school_year_id`),
  ADD KEY `api_patient_user_id_0944016a` (`user_id`),
  ADD KEY `api_patient_user_id_b1c93a_idx` (`user_id`,`school_year_id`);

--
-- Indexes for table `api_profilerequirement`
--
ALTER TABLE `api_profilerequirement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `field_name` (`field_name`);

--
-- Indexes for table `api_staffdetails`
--
ALTER TABLE `api_staffdetails`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `unique_staff_details_per_user` (`user_id`);

--
-- Indexes for table `api_systemconfiguration`
--
ALTER TABLE `api_systemconfiguration`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_systemconfigurat_updated_by_id_91ff6dd4_fk_api_custo` (`updated_by_id`);

--
-- Indexes for table `api_vaccination`
--
ALTER TABLE `api_vaccination`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `api_waiver`
--
ALTER TABLE `api_waiver`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_waiver_per_user` (`user_id`);

--
-- Indexes for table `auth_group`
--
ALTER TABLE `auth_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  ADD KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`);

--
-- Indexes for table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`);

--
-- Indexes for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  ADD KEY `django_admin_log_user_id_c564eba6_fk_api_customuser_id` (`user_id`);

--
-- Indexes for table `django_content_type`
--
ALTER TABLE `django_content_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`);

--
-- Indexes for table `django_migrations`
--
ALTER TABLE `django_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `django_session`
--
ALTER TABLE `django_session`
  ADD PRIMARY KEY (`session_key`),
  ADD KEY `django_session_expire_date_a5c62663` (`expire_date`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `last_restocked_by` (`last_restocked_by`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `fk_patients_school_year2` (`school_year_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `api_academicschoolyear`
--
ALTER TABLE `api_academicschoolyear`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `api_academicsemester`
--
ALTER TABLE `api_academicsemester`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_appointment`
--
ALTER TABLE `api_appointment`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `api_campusschedule`
--
ALTER TABLE `api_campusschedule`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `api_comorbidillness`
--
ALTER TABLE `api_comorbidillness`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `api_customuser`
--
ALTER TABLE `api_customuser`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `api_customuser_groups`
--
ALTER TABLE `api_customuser_groups`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_customuser_user_permissions`
--
ALTER TABLE `api_customuser_user_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_dentalappointmentmedication`
--
ALTER TABLE `api_dentalappointmentmedication`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_dentalformdata`
--
ALTER TABLE `api_dentalformdata`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `api_dentalwaiver`
--
ALTER TABLE `api_dentalwaiver`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_dentistschedule`
--
ALTER TABLE `api_dentistschedule`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `api_documentrequirement`
--
ALTER TABLE `api_documentrequirement`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `api_familymedicalhistoryitem`
--
ALTER TABLE `api_familymedicalhistoryitem`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `api_inventory`
--
ALTER TABLE `api_inventory`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_medicaldocument`
--
ALTER TABLE `api_medicaldocument`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `api_medicalformdata`
--
ALTER TABLE `api_medicalformdata`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `api_medicalrecord`
--
ALTER TABLE `api_medicalrecord`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_medicationinventory`
--
ALTER TABLE `api_medicationinventory`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_medicationrestockrecord`
--
ALTER TABLE `api_medicationrestockrecord`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_pastmedicalhistoryitem`
--
ALTER TABLE `api_pastmedicalhistoryitem`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `api_patient`
--
ALTER TABLE `api_patient`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `api_profilerequirement`
--
ALTER TABLE `api_profilerequirement`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `api_staffdetails`
--
ALTER TABLE `api_staffdetails`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `api_systemconfiguration`
--
ALTER TABLE `api_systemconfiguration`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_vaccination`
--
ALTER TABLE `api_vaccination`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `api_waiver`
--
ALTER TABLE `api_waiver`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `auth_group`
--
ALTER TABLE `auth_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_permission`
--
ALTER TABLE `auth_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=129;

--
-- AUTO_INCREMENT for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `api_appointment`
--
ALTER TABLE `api_appointment`
  ADD CONSTRAINT `api_appointment_doctor_id_b0f543eb_fk_api_customuser_id` FOREIGN KEY (`doctor_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `api_appointment_patient_id_52c787b0_fk_api_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `api_patient` (`id`),
  ADD CONSTRAINT `api_appointment_rescheduled_by_id_4f5e0006_fk_api_customuser_id` FOREIGN KEY (`rescheduled_by_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `fk_appointment_school_year` FOREIGN KEY (`school_year_id`) REFERENCES `api_academicschoolyear` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `api_customuser`
--
ALTER TABLE `api_customuser`
  ADD CONSTRAINT `api_customuser_blocked_by_id_e7f2d61b_fk_api_customuser_id` FOREIGN KEY (`blocked_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_customuser_groups`
--
ALTER TABLE `api_customuser_groups`
  ADD CONSTRAINT `api_customuser_group_customuser_id_9eb4b783_fk_api_custo` FOREIGN KEY (`customuser_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `api_customuser_groups_group_id_f049027c_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Constraints for table `api_customuser_user_permissions`
--
ALTER TABLE `api_customuser_user_permissions`
  ADD CONSTRAINT `api_customuser_user__customuser_id_5365c9ba_fk_api_custo` FOREIGN KEY (`customuser_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `api_customuser_user__permission_id_8735d73e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);

--
-- Constraints for table `api_dentalappointmentmedication`
--
ALTER TABLE `api_dentalappointmentmedication`
  ADD CONSTRAINT `api_dentalappointmen_appointment_id_5fecf20d_fk_api_appoi` FOREIGN KEY (`appointment_id`) REFERENCES `api_appointment` (`id`),
  ADD CONSTRAINT `api_dentalappointmen_medication_id_7f787eb9_fk_api_medic` FOREIGN KEY (`medication_id`) REFERENCES `api_medicationinventory` (`id`),
  ADD CONSTRAINT `api_dentalappointmen_recorded_by_id_d02e3b71_fk_api_custo` FOREIGN KEY (`recorded_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_dentalformdata`
--
ALTER TABLE `api_dentalformdata`
  ADD CONSTRAINT `api_dentalformdata_appointment_id_8463eab9_fk_api_appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `api_appointment` (`id`),
  ADD CONSTRAINT `api_dentalformdata_patient_id_842b814e_fk_api_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `api_patient` (`id`);

--
-- Constraints for table `api_dentalwaiver`
--
ALTER TABLE `api_dentalwaiver`
  ADD CONSTRAINT `api_dentalwaiver_patient_id_9f154893_fk_api_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `api_patient` (`id`),
  ADD CONSTRAINT `api_dentalwaiver_user_id_e5992a5d_fk_api_customuser_id` FOREIGN KEY (`user_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_inventory`
--
ALTER TABLE `api_inventory`
  ADD CONSTRAINT `api_inventory_last_restocked_by_id_b83645c4_fk_api_customuser_id` FOREIGN KEY (`last_restocked_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_medicaldocument`
--
ALTER TABLE `api_medicaldocument`
  ADD CONSTRAINT `api_medicaldocument_advised_for_consulta_4ceb2b84_fk_api_custo` FOREIGN KEY (`advised_for_consultation_by_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `api_medicaldocument_reviewed_by_id_6d962220_fk_api_customuser_id` FOREIGN KEY (`reviewed_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_medicalformdata`
--
ALTER TABLE `api_medicalformdata`
  ADD CONSTRAINT `api_medicalformdata_appointment_id_14d13659_fk_api_appoi` FOREIGN KEY (`appointment_id`) REFERENCES `api_appointment` (`id`),
  ADD CONSTRAINT `api_medicalformdata_patient_id_10feb4bc_fk_api_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `api_patient` (`id`);

--
-- Constraints for table `api_medicalrecord`
--
ALTER TABLE `api_medicalrecord`
  ADD CONSTRAINT `api_medicalrecord_doctor_id_22a41281_fk_api_customuser_id` FOREIGN KEY (`doctor_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `api_medicalrecord_patient_id_b000d25a_fk_api_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `api_patient` (`id`),
  ADD CONSTRAINT `fk_medicalrecord_school_year` FOREIGN KEY (`school_year_id`) REFERENCES `api_academicschoolyear` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `api_medicationinventory`
--
ALTER TABLE `api_medicationinventory`
  ADD CONSTRAINT `api_medicationinvent_created_by_id_2afa7f61_fk_api_custo` FOREIGN KEY (`created_by_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `api_medicationinvent_last_updated_by_id_1db9968a_fk_api_custo` FOREIGN KEY (`last_updated_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_medicationrestockrecord`
--
ALTER TABLE `api_medicationrestockrecord`
  ADD CONSTRAINT `api_medicationrestoc_medication_id_2f4a47ab_fk_api_medic` FOREIGN KEY (`medication_id`) REFERENCES `api_medicationinventory` (`id`),
  ADD CONSTRAINT `api_medicationrestoc_restocked_by_id_d153df69_fk_api_custo` FOREIGN KEY (`restocked_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_patient`
--
ALTER TABLE `api_patient`
  ADD CONSTRAINT `api_patient_user_id_0944016a_fk_api_customuser_id` FOREIGN KEY (`user_id`) REFERENCES `api_customuser` (`id`),
  ADD CONSTRAINT `fk_patient_school_year` FOREIGN KEY (`school_year_id`) REFERENCES `api_academicschoolyear` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `api_staffdetails`
--
ALTER TABLE `api_staffdetails`
  ADD CONSTRAINT `api_staffdetails_user_id_5ad7fef7_fk_api_customuser_id` FOREIGN KEY (`user_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_systemconfiguration`
--
ALTER TABLE `api_systemconfiguration`
  ADD CONSTRAINT `api_systemconfigurat_updated_by_id_91ff6dd4_fk_api_custo` FOREIGN KEY (`updated_by_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `api_waiver`
--
ALTER TABLE `api_waiver`
  ADD CONSTRAINT `api_waiver_user_id_721aa3a8_fk_api_customuser_id` FOREIGN KEY (`user_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Constraints for table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

--
-- Constraints for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_api_customuser_id` FOREIGN KEY (`user_id`) REFERENCES `api_customuser` (`id`);

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`last_restocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `fk_patients_school_year2` FOREIGN KEY (`school_year_id`) REFERENCES `api_academicschoolyear` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`school_year_id`) REFERENCES `api_academicschoolyear` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
