-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 19, 2025 at 10:07 AM
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
(20, '2024-2025', '2024-08-15', '2025-07-31', 1, 'active', '2025-07-08 04:11:53.813165', '2025-07-16 06:15:05.507440', '2024-08-15', '2024-12-20', '2025-01-15', '2025-05-31', '2025-06-01', '2025-07-31'),
(21, '2031-2032', '2031-08-14', '2032-07-30', 0, 'active', '2025-07-16 05:41:33.323068', '2025-07-16 05:42:14.546565', '2031-08-14', '2031-12-19', '2032-01-14', '2032-05-14', '2032-05-31', '2032-07-30'),
(22, '2032-2033', '2032-08-14', '2033-07-30', 0, 'active', '2025-07-16 05:42:14.507647', '2025-07-16 14:15:05.502732', '2032-08-14', '2032-12-19', '2033-01-14', '2033-05-14', '2033-05-31', '2033-07-30'),
(23, '2023-2024', '2023-08-15', '2024-07-31', 0, 'completed', '2025-07-16 06:13:47.594588', '2025-07-16 06:13:47.594588', '2023-08-15', '2023-12-20', '2024-01-15', '2024-05-31', '2024-06-01', '2024-07-31');

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
(57, '2025-07-17', '08:00:00.000000', 'Extraction', 'completed', NULL, '2025-07-16 12:04:40.843483', '2025-07-16 12:20:56.411318', NULL, 45, 'Extraction', 'dental', NULL, 'a', 20, 0, NULL, NULL, NULL, NULL, NULL, 'summer');

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
(5, 'a', '08:00:00.000000', '17:00:00.000000', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', 1, '2025-07-02 18:35:38.316935', '2025-07-16 05:42:11.888873'),
(6, 'b', '08:00:00.000000', '17:00:00.000000', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', 1, '2025-07-02 18:35:38.316935', '2025-07-16 05:42:11.900132'),
(7, 'c', '08:00:00.000000', '17:00:00.000000', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', 1, '2025-07-02 18:35:38.316935', '2025-07-16 05:42:11.900132');

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
(1, 'Hypertension', '', 0, 0, '2025-07-04 18:06:45.921382', '2025-07-16 05:42:12.255609'),
(2, 'Diabetes Mellitus', '', 0, 1, '2025-07-04 18:06:45.939916', '2025-07-16 05:42:12.225568'),
(3, 'Asthma', '', 0, 2, '2025-07-04 18:06:45.943553', '2025-07-16 05:42:12.074040'),
(4, 'Heart Disease', '', 0, 3, '2025-07-04 18:06:45.948092', '2025-07-16 05:42:12.238473'),
(5, 'Epilepsy', '', 0, 4, '2025-07-04 18:06:45.952259', '2025-07-16 05:42:12.233350'),
(6, 'Kidney Disease', '', 0, 5, '2025-07-04 18:06:45.957015', '2025-07-16 05:42:12.253599'),
(7, 'Liver Disease', '', 0, 6, '2025-07-04 18:06:45.959262', '2025-07-16 05:42:12.283165'),
(8, 'Thyroid Disease', '', 0, 7, '2025-07-04 18:06:45.959262', '2025-07-16 05:42:12.377352'),
(9, 'Depression', '', 0, 8, '2025-07-04 18:06:45.972281', '2025-07-16 05:42:12.188241'),
(10, 'Anxiety Disorder', '', 0, 9, '2025-07-04 18:06:45.974275', '2025-07-16 05:42:12.067495'),
(11, 'Bipolar Disorder', '', 0, 10, '2025-07-04 18:06:45.974275', '2025-07-16 05:42:12.094583'),
(12, 'Schizophrenia', '', 1, 11, '2025-07-04 18:06:45.974275', '2025-07-16 05:42:12.359703'),
(13, 'Other Mental Health Condition', '', 0, 12, '2025-07-04 18:06:45.990368', '2025-07-16 05:42:12.345146'),
(14, 'Bronchitis', 'Common medical condition: Bronchitis', 0, 4, '2025-07-05 18:41:02.805345', '2025-07-16 05:42:12.119642'),
(15, 'Tuberculosis', 'Common medical condition: Tuberculosis', 0, 5, '2025-07-05 18:41:02.822231', '2025-07-16 05:42:12.412987'),
(16, 'Chronic Kidney Disease', 'Common medical condition: Chronic Kidney Disease', 0, 6, '2025-07-05 18:41:02.824239', '2025-07-16 05:42:12.179626'),
(17, 'Obesity', 'Common medical condition: Obesity', 0, 8, '2025-07-05 18:41:02.824239', '2025-07-16 05:42:12.318045'),
(18, 'Stroke', 'Common medical condition: Stroke', 0, 11, '2025-07-05 18:41:02.838173', '2025-07-16 05:42:12.391098'),
(19, 'Cancer', 'Common medical condition: Cancer', 0, 12, '2025-07-05 18:41:02.838173', '2025-07-16 05:42:12.127097'),
(20, 'Autoimmune Disease', 'Common medical condition: Autoimmune Disease', 0, 13, '2025-07-05 18:41:02.838173', '2025-07-16 05:42:12.072937'),
(21, 'COPD (Chronic Obstructive Pulmonary Disease)', 'Common medical condition: COPD (Chronic Obstructive Pulmonary Disease)', 0, 14, '2025-07-05 18:41:02.851132', '2025-07-16 05:42:12.159768'),
(22, 'Arthritis', 'Common medical condition: Arthritis', 0, 15, '2025-07-05 18:41:02.851132', '2025-07-16 05:42:12.069455'),
(23, 'Osteoporosis', 'Common medical condition: Osteoporosis', 0, 16, '2025-07-05 18:41:02.859478', '2025-07-16 05:42:12.343095'),
(24, 'Mental Health Disorders', 'Common medical condition: Mental Health Disorders', 0, 17, '2025-07-05 18:41:02.859478', '2025-07-16 05:42:12.311967'),
(25, 'Allergies', 'Common medical condition: Allergies', 0, 18, '2025-07-05 18:41:02.859478', '2025-07-16 05:42:12.071616'),
(26, 'None', 'Common medical condition: None', 0, 19, '2025-07-05 18:41:02.859478', '2025-07-16 05:42:12.301362'),
(27, 'Diabetes', '', 0, 0, '2025-07-06 06:23:21.043405', '2025-07-16 05:42:12.206009'),
(28, 'COPD', '', 0, 0, '2025-07-06 06:23:21.083838', '2025-07-16 05:42:12.156584'),
(29, 'Mental Health Conditions', '', 0, 0, '2025-07-06 06:45:50.402002', '2025-07-16 05:42:12.306530'),
(30, 'Test Illness', '', 1, 0, '2025-07-06 07:00:32.302506', '2025-07-16 05:42:12.377352');

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
(64, 'pbkdf2_sha256$600000$obzC8bgo7LJCv7WoC4MFRu$JFZIm9yMO3uLaLtUi0vyNKKWPe9eJzIjFbG7WVWIhCs=', NULL, 0, 'faminianochristianjude@gmail.com', 'CHRISTIAN', 'FAMINIANO', 0, 1, '2025-07-16 11:51:35.594143', 'faminianochristianjude@gmail.com', 'Incoming Freshman', 1, '715359eb35f947ca83e82483a3c326ce', '2025-07-16 11:51:43.831239', 'student', 'JUDE', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);

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
  `consultation_template_compliant` tinyint(1) NOT NULL,
  `used_medicines` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`used_medicines`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_dentalformdata`
--

INSERT INTO `api_dentalformdata` (`id`, `file_no`, `surname`, `first_name`, `middle_name`, `grade_year_section`, `age`, `sex`, `has_toothbrush`, `dentition`, `periodontal`, `occlusion`, `malocclusion_severity`, `remarks`, `examined_by`, `date`, `permanent_teeth_status`, `temporary_teeth_status`, `created_at`, `updated_at`, `appointment_id`, `patient_id`, `decayed_teeth`, `filled_teeth`, `missing_teeth`, `next_appointment`, `oral_hygiene`, `prevention_advice`, `recommended_treatments`, `treatment_priority`, `academic_year_id`, `examiner_license`, `examiner_phone`, `examiner_position`, `examiner_ptr`, `consultations_record`, `current_consultation_date`, `current_signs_symptoms`, `current_hr`, `current_rr`, `current_temp`, `current_o2_sat`, `current_bp`, `current_test_results`, `current_diagnosis`, `current_management`, `current_nurse_physician`, `total_consultations`, `consultation_template_compliant`, `used_medicines`) VALUES
(15, 'TEMP-64', 'FAMINIANO', 'CHRISTIAN', 'JUDE', NULL, 24, 'Male', 'Yes', 'Satisfactory', 'Satisfactory', 'Malocclusion', 'Moderate', '', 'Rezier John O Magno', '2025-07-16', '{\"32\": {\"treatment\": \"NONE\", \"status\": \"Extracted\"}}', '{\"1\": {\"treatment\": \"\", \"status\": \"Extracted\"}, \"7\": {\"treatment\": \"aMOX\", \"status\": \"Extracted\"}}', '2025-07-16 12:20:56.403441', '2025-07-16 12:20:56.403441', 57, 45, '8', '7', '6', '', 'Good', '', '', '', 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '[{\"id\": \"29\", \"name\": \"Impression Material\", \"quantity\": 1, \"unit\": \"cartridge\", \"notes\": \"\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `api_dentalinformationrecord`
--

CREATE TABLE `api_dentalinformationrecord` (
  `id` bigint(20) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `patient_name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `sex` varchar(20) NOT NULL,
  `year_section` varchar(100) DEFAULT NULL,
  `date` date NOT NULL,
  `name_of_previous_dentist` varchar(255) DEFAULT NULL,
  `last_dental_visit` varchar(255) DEFAULT NULL,
  `date_of_last_cleaning` varchar(255) DEFAULT NULL,
  `oral_hygiene_instructions` tinyint(1) DEFAULT NULL,
  `gums_bleed_brushing` tinyint(1) DEFAULT NULL,
  `teeth_sensitive_hot_cold` tinyint(1) DEFAULT NULL,
  `feel_pain_teeth` tinyint(1) DEFAULT NULL,
  `difficult_extractions_past` tinyint(1) DEFAULT NULL,
  `orthodontic_treatment` tinyint(1) DEFAULT NULL,
  `prolonged_bleeding_extractions` tinyint(1) DEFAULT NULL,
  `frequent_headaches` tinyint(1) DEFAULT NULL,
  `clench_grind_teeth` tinyint(1) DEFAULT NULL,
  `allergic_to_following` tinyint(1) DEFAULT NULL,
  `allergic_penicillin` tinyint(1) NOT NULL,
  `allergic_amoxicillin` tinyint(1) NOT NULL,
  `allergic_local_anesthetic` tinyint(1) NOT NULL,
  `allergic_sulfa_drugs` tinyint(1) NOT NULL,
  `allergic_latex` tinyint(1) NOT NULL,
  `allergic_others` varchar(255) DEFAULT NULL,
  `is_woman` tinyint(1) NOT NULL,
  `menstruation_today` tinyint(1) DEFAULT NULL,
  `pregnant` tinyint(1) DEFAULT NULL,
  `taking_birth_control` tinyint(1) DEFAULT NULL,
  `smoke` tinyint(1) DEFAULT NULL,
  `under_medical_treatment` tinyint(1) DEFAULT NULL,
  `medical_treatment_condition` varchar(255) DEFAULT NULL,
  `hospitalized` tinyint(1) DEFAULT NULL,
  `hospitalization_when_why` varchar(255) DEFAULT NULL,
  `taking_prescription_medication` tinyint(1) DEFAULT NULL,
  `prescription_medication_details` varchar(255) DEFAULT NULL,
  `high_blood_pressure` tinyint(1) NOT NULL,
  `low_blood_pressure` tinyint(1) NOT NULL,
  `epilepsy_convulsions` tinyint(1) NOT NULL,
  `aids_hiv_positive` tinyint(1) NOT NULL,
  `sexually_transmitted_disease` tinyint(1) NOT NULL,
  `stomach_trouble_ulcers` tinyint(1) NOT NULL,
  `fainting_seizure` tinyint(1) NOT NULL,
  `rapid_weight_loss` tinyint(1) NOT NULL,
  `radiation_therapy` tinyint(1) NOT NULL,
  `joint_replacement_implant` tinyint(1) NOT NULL,
  `heart_surgery` tinyint(1) NOT NULL,
  `heart_attack` tinyint(1) NOT NULL,
  `thyroid_problem` tinyint(1) NOT NULL,
  `heart_disease` tinyint(1) NOT NULL,
  `heart_murmur` tinyint(1) NOT NULL,
  `hepatitis_liver_disease` tinyint(1) NOT NULL,
  `rheumatic_fever` tinyint(1) NOT NULL,
  `hay_fever_allergies` tinyint(1) NOT NULL,
  `respiratory_problems` tinyint(1) NOT NULL,
  `hepatitis_jaundice` tinyint(1) NOT NULL,
  `tuberculosis` tinyint(1) NOT NULL,
  `swollen_ankles` tinyint(1) NOT NULL,
  `kidney_disease` tinyint(1) NOT NULL,
  `diabetes` tinyint(1) NOT NULL,
  `chest_pain` tinyint(1) NOT NULL,
  `stroke` tinyint(1) NOT NULL,
  `cancer_tumors` tinyint(1) NOT NULL,
  `anemia` tinyint(1) NOT NULL,
  `angina` tinyint(1) NOT NULL,
  `asthma` tinyint(1) NOT NULL,
  `emphysema` tinyint(1) NOT NULL,
  `blood_diseases` tinyint(1) NOT NULL,
  `head_injuries` tinyint(1) NOT NULL,
  `arthritis_rheumatism` tinyint(1) NOT NULL,
  `other_conditions` varchar(255) DEFAULT NULL,
  `patient_signature` varchar(255) DEFAULT NULL,
  `signature_date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `education_level` varchar(50) DEFAULT NULL,
  `year_level` varchar(50) DEFAULT NULL,
  `course` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_dentalinformationrecord`
--

INSERT INTO `api_dentalinformationrecord` (`id`, `semester`, `patient_name`, `age`, `sex`, `year_section`, `date`, `name_of_previous_dentist`, `last_dental_visit`, `date_of_last_cleaning`, `oral_hygiene_instructions`, `gums_bleed_brushing`, `teeth_sensitive_hot_cold`, `feel_pain_teeth`, `difficult_extractions_past`, `orthodontic_treatment`, `prolonged_bleeding_extractions`, `frequent_headaches`, `clench_grind_teeth`, `allergic_to_following`, `allergic_penicillin`, `allergic_amoxicillin`, `allergic_local_anesthetic`, `allergic_sulfa_drugs`, `allergic_latex`, `allergic_others`, `is_woman`, `menstruation_today`, `pregnant`, `taking_birth_control`, `smoke`, `under_medical_treatment`, `medical_treatment_condition`, `hospitalized`, `hospitalization_when_why`, `taking_prescription_medication`, `prescription_medication_details`, `high_blood_pressure`, `low_blood_pressure`, `epilepsy_convulsions`, `aids_hiv_positive`, `sexually_transmitted_disease`, `stomach_trouble_ulcers`, `fainting_seizure`, `rapid_weight_loss`, `radiation_therapy`, `joint_replacement_implant`, `heart_surgery`, `heart_attack`, `thyroid_problem`, `heart_disease`, `heart_murmur`, `hepatitis_liver_disease`, `rheumatic_fever`, `hay_fever_allergies`, `respiratory_problems`, `hepatitis_jaundice`, `tuberculosis`, `swollen_ankles`, `kidney_disease`, `diabetes`, `chest_pain`, `stroke`, `cancer_tumors`, `anemia`, `angina`, `asthma`, `emphysema`, `blood_diseases`, `head_injuries`, `arthritis_rheumatism`, `other_conditions`, `patient_signature`, `signature_date`, `created_at`, `updated_at`, `patient_id`, `school_year_id`, `education_level`, `year_level`, `course`) VALUES
(5, '1st_semester', 'FAMINIANO, CHRISTIAN JUDE', 12, 'Male', 'Kindergarten 2 (K2)', '2025-07-16', 'Na', 'Na', 'Na', 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, '', 0, NULL, NULL, NULL, 1, 1, 'hypertension', 0, '', 0, '', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', 'FAMINIANO, CHRISTIAN JUDE', '2025-07-16', '2025-07-16 12:03:06.779041', '2025-07-16 12:03:06.779041', 45, 20, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `api_dentalmedicinesupply`
--

CREATE TABLE `api_dentalmedicinesupply` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(20) NOT NULL,
  `description` longtext DEFAULT NULL,
  `unit` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `api_dentalmedicinesupply`
--

INSERT INTO `api_dentalmedicinesupply` (`id`, `name`, `type`, `description`, `unit`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Lidocaine 2%', 'anesthetic', 'Local anesthetic for dental procedures', 'ml', 1, '2025-07-16 03:09:14.718303', '2025-07-16 03:09:14.718303'),
(2, 'Articaine 4%', 'anesthetic', 'Local anesthetic with epinephrine', 'ml', 1, '2025-07-16 03:09:14.725169', '2025-07-16 03:09:14.725169'),
(3, 'Benzocaine gel', 'anesthetic', 'Topical anesthetic gel', 'g', 1, '2025-07-16 03:09:14.730849', '2025-07-16 03:09:14.730849'),
(4, 'Amoxicillin 500mg', 'antibiotic', 'Antibiotic for dental infections', 'capsule', 1, '2025-07-16 03:09:14.737255', '2025-07-16 03:09:14.737255'),
(5, 'Clindamycin 300mg', 'antibiotic', 'Alternative antibiotic for penicillin-allergic patients', 'capsule', 1, '2025-07-16 03:09:14.740397', '2025-07-16 03:09:14.740397'),
(6, 'Metronidazole 400mg', 'antibiotic', 'Antibiotic for anaerobic infections', 'tablet', 1, '2025-07-16 03:09:14.745552', '2025-07-16 03:09:14.745552'),
(7, 'Ibuprofen 400mg', 'medicine', 'Anti-inflammatory pain reliever', 'tablet', 1, '2025-07-16 03:09:14.747582', '2025-07-16 03:09:14.747582'),
(8, 'Paracetamol 500mg', 'medicine', 'Pain reliever and fever reducer', 'tablet', 1, '2025-07-16 03:09:14.750629', '2025-07-16 03:09:14.750629'),
(9, 'Mefenamic acid 250mg', 'medicine', 'NSAID for pain relief', 'capsule', 1, '2025-07-16 03:09:14.753779', '2025-07-16 03:09:14.753779'),
(10, 'Composite resin', 'dental_supply', 'Tooth-colored filling material', 'syringe', 1, '2025-07-16 03:09:14.755872', '2025-07-16 03:09:14.755872'),
(11, 'Dental amalgam', 'dental_supply', 'Silver filling material', 'capsule', 1, '2025-07-16 03:09:14.757905', '2025-07-16 03:09:14.757905'),
(12, 'Fluoride varnish', 'dental_supply', 'Topical fluoride treatment', 'ml', 1, '2025-07-16 03:09:14.761348', '2025-07-16 03:09:14.761348'),
(13, 'Dental cement', 'dental_supply', 'Temporary filling material', 'g', 1, '2025-07-16 03:09:14.761348', '2025-07-16 03:09:14.761348'),
(14, 'Cotton rolls', 'material', 'Absorbent cotton for isolation', 'pcs', 1, '2025-07-16 03:09:14.761348', '2025-07-16 03:09:14.761348'),
(15, 'Gauze pads', 'material', 'Sterile gauze for bleeding control', 'pcs', 1, '2025-07-16 03:09:14.771091', '2025-07-16 03:09:14.771091'),
(16, 'Disposable gloves', 'material', 'Latex-free examination gloves', 'pair', 1, '2025-07-16 03:09:14.772742', '2025-07-16 03:09:14.772742'),
(17, 'Dental floss', 'material', 'Waxed dental floss', 'pack', 1, '2025-07-16 03:09:14.776756', '2025-07-16 03:09:14.776756'),
(18, 'Dental probe', 'equipment', 'Periodontal probe for examination', 'pcs', 1, '2025-07-16 03:09:14.779955', '2025-07-16 03:09:14.779955'),
(19, 'Dental mirror', 'equipment', 'Mouth mirror for examination', 'pcs', 1, '2025-07-16 03:09:14.783094', '2025-07-16 03:09:14.783094'),
(20, 'Dental scaler', 'equipment', 'Hand scaler for cleaning', 'pcs', 1, '2025-07-16 03:09:14.788436', '2025-07-16 03:09:14.789693'),
(21, 'Lidocaine HCl 2%', 'anesthetic', 'Local anesthetic for dental procedures', 'cartridge', 1, '2025-07-16 03:35:52.695607', '2025-07-16 03:35:52.695607'),
(22, 'Articaine HCl 4%', 'anesthetic', 'Long-acting local anesthetic', 'cartridge', 1, '2025-07-16 03:35:52.711417', '2025-07-16 03:35:52.711417'),
(23, 'Benzocaine 20%', 'anesthetic', 'Topical anesthetic gel', 'tube', 1, '2025-07-16 03:35:52.711417', '2025-07-16 03:35:52.711417'),
(24, 'Amoxicillin 500mg', 'medicine', 'Antibiotic for dental infections', 'capsule', 1, '2025-07-16 03:35:52.727477', '2025-07-16 03:35:52.727477'),
(25, 'Chlorhexidine Mouthwash', 'medicine', 'Antiseptic mouth rinse', 'bottle', 1, '2025-07-16 03:35:52.739395', '2025-07-16 03:35:52.739395'),
(26, 'Azithromycin 250mg', 'antibiotic', 'Antibiotic for respiratory and dental infections', 'tablet', 1, '2025-07-16 03:35:52.743024', '2025-07-16 03:35:52.743024'),
(27, 'Glass Ionomer Cement', 'dental_supply', 'Fluoride-releasing filling material', 'capsule', 1, '2025-07-16 03:35:52.757146', '2025-07-16 03:35:52.757146'),
(28, 'Dental Floss', 'dental_supply', 'Oral hygiene tool', 'roll', 1, '2025-07-16 03:35:52.763120', '2025-07-16 03:35:52.763120'),
(29, 'Impression Material', 'dental_supply', 'Material for taking dental impressions', 'cartridge', 1, '2025-07-16 03:35:52.773471', '2025-07-16 03:35:52.773471'),
(30, 'Disposable Gloves', 'equipment', 'Latex-free examination gloves', 'box', 1, '2025-07-16 03:35:52.777471', '2025-07-16 03:35:52.779708'),
(31, 'Face Masks', 'equipment', 'Surgical face masks', 'box', 1, '2025-07-16 03:35:52.788514', '2025-07-16 03:35:52.788514'),
(32, 'Dental Bib', 'equipment', 'Patient protection bib', 'pack', 1, '2025-07-16 03:35:52.795586', '2025-07-16 03:35:52.795586'),
(33, 'Gauze Pads', 'equipment', 'Sterile gauze for wound care', 'pack', 1, '2025-07-16 03:35:52.801173', '2025-07-16 03:35:52.801173'),
(34, 'Dental Wax', 'material', 'Wax for dental procedures', 'stick', 1, '2025-07-16 03:35:52.802237', '2025-07-16 03:35:52.802237'),
(35, 'Polishing Paste', 'material', 'Abrasive paste for tooth polishing', 'tube', 1, '2025-07-16 03:35:52.816055', '2025-07-16 03:35:52.816055'),
(36, 'Etching Gel', 'material', 'Acid gel for tooth preparation', 'syringe', 1, '2025-07-16 03:35:52.822859', '2025-07-16 03:35:52.822859'),
(37, 'Bonding Agent', 'material', 'Adhesive for dental restorations', 'bottle', 1, '2025-07-16 03:35:52.825468', '2025-07-16 03:35:52.825468'),
(38, 'Test', 'medicine', '', 'mg', 1, '2025-07-16 03:51:53.890810', '2025-07-16 03:51:53.890810');

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
  `patient_id` bigint(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL
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
(4, 'Dr. Maria Santos', 'a', '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]', '[\"08:00-09:00\", \"09:00-10:00\", \"10:00-11:00\", \"13:00-14:00\", \"14:00-15:00\", \"15:00-16:00\"]', 1, '2025-07-02 18:35:38.334430', '2025-07-16 05:42:11.900132'),
(5, 'Dr. Smith', 'a', '[\"Monday\", \"Wednesday\", \"Friday\"]', '[\"08:00-09:00\", \"09:00-10:00\", \"10:00-11:00\", \"14:00-15:00\"]', 1, '2025-07-06 06:23:20.997129', '2025-07-16 05:42:11.900132'),
(6, 'Dr. Johnson', 'b', '[\"Tuesday\", \"Thursday\"]', '[\"08:00-09:00\", \"09:00-10:00\", \"10:00-11:00\", \"14:00-15:00\"]', 1, '2025-07-06 06:23:21.014010', '2025-07-16 05:42:11.915321');

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
(1, 'chest_xray', 'Chest X-Ray', 'Recent chest X-ray results', 1, 6, '[]', 1, '2025-07-02 18:13:27.062772', '2025-07-16 05:42:11.900132'),
(2, 'cbc', 'Complete Blood Count (CBC)', 'Complete blood count laboratory results', 1, 6, '[]', 1, '2025-07-02 18:13:27.067627', '2025-07-16 05:42:11.913314'),
(3, 'blood_typing', 'Blood Typing', 'Blood type and Rh factor test results', 1, 12, '[]', 1, '2025-07-02 18:13:27.071764', '2025-07-16 05:42:11.896112'),
(4, 'urinalysis', 'Urinalysis', 'Complete urinalysis test results', 1, 6, '[]', 1, '2025-07-02 18:13:27.080367', '2025-07-16 05:42:11.936220'),
(5, 'drug_test', 'Drug Test', 'Drug screening test results', 1, 12, '[]', 1, '2025-07-02 18:13:27.085766', '2025-07-16 05:42:11.919474'),
(6, 'hepa_b', 'Hepatitis B Test', 'Hepatitis B surface antigen test results', 0, 12, '[\"College of Medicine\", \"College of Nursing\", \"College of Home Economics\", \"College of Criminal Justice Education\", \"BS Food Technology\", \"BS Biology\"]', 1, '2025-07-02 18:13:27.090196', '2025-07-16 05:42:11.919474'),
(7, 'medical_certificate', 'Medical Certificate', 'Medical certificate from licensed physician', 1, 12, '[]', 1, '2025-07-06 06:23:20.963974', '2025-07-16 05:42:11.931091');

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
(1, 'Diabetes', '', 0, 0, '2025-07-04 18:06:46.168469', '2025-07-16 05:42:13.742339'),
(2, 'Hypertension', '', 0, 1, '2025-07-04 18:06:46.168469', '2025-07-16 05:42:13.790598'),
(3, 'Heart Disease', '', 0, 2, '2025-07-04 18:06:46.168469', '2025-07-16 05:42:13.794157'),
(4, 'Stroke', '', 0, 3, '2025-07-04 18:06:46.184492', '2025-07-16 05:42:13.820224'),
(5, 'Cancer', '', 0, 4, '2025-07-04 18:06:46.184492', '2025-07-16 05:42:13.836566'),
(6, 'Asthma', '', 0, 5, '2025-07-04 18:06:46.184492', '2025-07-16 05:42:13.868493'),
(7, 'Allergies', '', 0, 6, '2025-07-04 18:06:46.184492', '2025-07-16 05:42:13.904919'),
(8, 'Kidney Disease', '', 0, 7, '2025-07-04 18:06:46.200531', '2025-07-16 05:42:13.928586'),
(9, 'Liver Disease', '', 0, 8, '2025-07-04 18:06:46.206360', '2025-07-16 05:42:13.907266'),
(10, 'Thyroid Disorders', '', 0, 9, '2025-07-04 18:06:46.210861', '2025-07-16 05:42:13.962924'),
(11, 'Epilepsy', '', 0, 10, '2025-07-04 18:06:46.213875', '2025-07-16 05:42:14.036505'),
(12, 'Mental Health Conditions', '', 0, 11, '2025-07-04 18:06:46.213875', '2025-07-16 05:42:14.010600'),
(13, 'Autoimmune Disorders', '', 0, 12, '2025-07-04 18:06:46.213875', '2025-07-16 05:42:14.056906'),
(14, 'Blood Disorders', '', 0, 13, '2025-07-04 18:06:46.213875', '2025-07-16 05:42:14.137023'),
(15, 'Genetic Disorders', '', 0, 14, '2025-07-04 18:06:46.229974', '2025-07-16 05:42:14.133604'),
(16, 'Obesity', '', 0, 15, '2025-07-04 18:06:46.229974', '2025-07-16 05:42:14.176801'),
(17, 'Osteoporosis', '', 0, 16, '2025-07-04 18:06:46.229974', '2025-07-16 05:42:14.203177'),
(18, 'Arthritis', '', 0, 17, '2025-07-04 18:06:46.229974', '2025-07-16 05:42:14.240692'),
(19, 'High Cholesterol', '', 1, 18, '2025-07-04 18:06:46.245861', '2025-07-16 05:42:14.273425'),
(20, 'Glaucoma', '', 0, 19, '2025-07-04 18:06:46.245861', '2025-07-16 05:42:14.323920'),
(21, 'Alzheimer\'s Disease', '', 0, 20, '2025-07-04 18:06:46.245861', '2025-07-16 05:42:14.351411'),
(22, 'Parkinson\'s Disease', '', 0, 21, '2025-07-04 18:06:46.245861', '2025-07-16 05:42:14.429248'),
(23, 'Huntington\'s Disease', '', 0, 22, '2025-07-04 18:06:46.261634', '2025-07-16 05:42:14.439860'),
(24, 'Sickle Cell Disease', '', 0, 23, '2025-07-04 18:06:46.261634', '2025-07-16 05:42:14.447589'),
(25, 'Thalassemia', '', 0, 24, '2025-07-04 18:06:46.261634', '2025-07-16 05:42:14.460024'),
(26, 'High Blood Pressure', 'Family medical history: High Blood Pressure', 0, 5, '2025-07-05 18:41:03.060781', '2025-07-16 05:42:13.851192'),
(27, 'Mental Health Disorders', 'Family medical history: Mental Health Disorders', 0, 8, '2025-07-05 18:41:03.076023', '2025-07-16 05:42:13.951807'),
(28, 'Thyroid Disease', 'Family medical history: Thyroid Disease', 0, 11, '2025-07-05 18:41:03.086719', '2025-07-16 05:42:14.026183'),
(29, 'Tuberculosis', 'Family medical history: Tuberculosis', 0, 12, '2025-07-05 18:41:03.090882', '2025-07-16 05:42:14.079837'),
(30, 'Autoimmune Diseases', 'Family medical history: Autoimmune Diseases', 0, 13, '2025-07-05 18:41:03.096436', '2025-07-16 05:42:14.064380'),
(31, 'Bone/Joint Problems', 'Family medical history: Bone/Joint Problems', 0, 15, '2025-07-05 18:41:03.096436', '2025-07-16 05:42:14.151858'),
(32, 'Eye Problems', 'Family medical history: Eye Problems', 0, 16, '2025-07-05 18:41:03.096436', '2025-07-16 05:42:14.172151'),
(33, 'Hearing Problems', 'Family medical history: Hearing Problems', 1, 17, '2025-07-05 18:41:03.110179', '2025-07-16 05:42:14.252825'),
(34, 'Skin Conditions', 'Family medical history: Skin Conditions', 1, 18, '2025-07-05 18:41:03.110179', '2025-07-16 05:42:14.297094'),
(35, 'Substance Abuse', 'Family medical history: Substance Abuse', 0, 19, '2025-07-05 18:41:03.110179', '2025-07-16 05:42:14.301753'),
(36, 'Other Genetic Conditions', 'Family medical history: Other Genetic Conditions', 0, 20, '2025-07-05 18:41:03.126220', '2025-07-16 05:42:14.389860'),
(37, 'None Known', 'Family medical history: None Known', 0, 21, '2025-07-05 18:41:03.128931', '2025-07-16 05:42:14.407313'),
(38, 'Mental Illness', '', 0, 0, '2025-07-06 06:23:21.311023', '2025-07-16 05:42:13.731002');

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
(1, 'Asthma', '', 0, 0, '2025-07-04 18:06:46.055977', '2025-07-16 05:42:12.943016'),
(2, 'Allergic Rhinitis', '', 0, 1, '2025-07-04 18:06:46.055977', '2025-07-16 05:42:13.080772'),
(3, 'Skin Allergies', '', 0, 2, '2025-07-04 18:06:46.067579', '2025-07-16 05:42:13.134875'),
(4, 'Food Allergies', '', 0, 3, '2025-07-04 18:06:46.071579', '2025-07-16 05:42:13.190684'),
(5, 'Drug Allergies', '', 0, 4, '2025-07-04 18:06:46.073534', '2025-07-16 05:42:13.172526'),
(6, 'Hypertension', '', 0, 5, '2025-07-04 18:06:46.073534', '2025-07-16 05:42:13.256848'),
(7, 'Diabetes', '', 0, 6, '2025-07-04 18:06:46.073534', '2025-07-16 05:42:13.227761'),
(8, 'Heart Disease', '', 0, 7, '2025-07-04 18:06:46.073534', '2025-07-16 05:42:13.256848'),
(9, 'Kidney Disease', '', 0, 8, '2025-07-04 18:06:46.089304', '2025-07-16 05:42:13.269998'),
(10, 'Liver Disease', '', 0, 9, '2025-07-04 18:06:46.089304', '2025-07-16 05:42:13.354174'),
(11, 'Thyroid Disorders', '', 0, 10, '2025-07-04 18:06:46.089304', '2025-07-16 05:42:13.367472'),
(12, 'Epilepsy/Seizures', '', 0, 11, '2025-07-04 18:06:46.089304', '2025-07-16 05:42:13.363952'),
(13, 'Mental Health Conditions', '', 0, 12, '2025-07-04 18:06:46.105270', '2025-07-16 05:42:13.422425'),
(14, 'Cancer', '', 0, 13, '2025-07-04 18:06:46.121089', '2025-07-16 05:42:13.430990'),
(15, 'Stroke', '', 0, 14, '2025-07-04 18:06:46.121089', '2025-07-16 05:42:13.435989'),
(16, 'Tuberculosis', '', 0, 15, '2025-07-04 18:06:46.121089', '2025-07-16 05:42:13.503301'),
(17, 'Hepatitis', '', 0, 16, '2025-07-04 18:06:46.121089', '2025-07-16 05:42:13.517048'),
(18, 'Pneumonia', '', 0, 17, '2025-07-04 18:06:46.137005', '2025-07-16 05:42:13.541952'),
(19, 'Surgeries', '', 0, 18, '2025-07-04 18:06:46.137005', '2025-07-16 05:42:13.537674'),
(20, 'Hospitalizations', '', 0, 19, '2025-07-04 18:06:46.137005', '2025-07-16 05:42:13.559500'),
(21, 'Blood Transfusions', '', 0, 20, '2025-07-04 18:06:46.137005', '2025-07-16 05:42:13.607618'),
(22, 'Chronic Pain', '', 0, 21, '2025-07-04 18:06:46.152672', '2025-07-16 05:42:13.609628'),
(23, 'Autoimmune Disorders', '', 0, 22, '2025-07-04 18:06:46.152672', '2025-07-16 05:42:13.620013'),
(24, 'Gastrointestinal Disorders', '', 0, 23, '2025-07-04 18:06:46.152672', '2025-07-16 05:42:13.696458'),
(25, 'Respiratory Conditions', '', 0, 24, '2025-07-04 18:06:46.168469', '2025-07-16 05:42:13.713367'),
(26, 'Allergic Reactions', 'Past medical history: Allergic Reactions', 0, 0, '2025-07-05 18:41:02.942142', '2025-07-16 05:42:12.934714'),
(27, 'Chickenpox', 'Past medical history: Chickenpox', 0, 2, '2025-07-05 18:41:02.947757', '2025-07-16 05:42:13.136763'),
(28, 'Dengue Fever', 'Past medical history: Dengue Fever', 0, 3, '2025-07-05 18:41:02.956207', '2025-07-16 05:42:13.154832'),
(29, 'Fractures', 'Past medical history: Fractures', 0, 5, '2025-07-05 18:41:02.963509', '2025-07-16 05:42:13.176945'),
(30, 'Heart Problems', 'Past medical history: Heart Problems', 0, 6, '2025-07-05 18:41:02.970074', '2025-07-16 05:42:13.247594'),
(31, 'High Blood Pressure', 'Past medical history: High Blood Pressure', 0, 8, '2025-07-05 18:41:02.976368', '2025-07-16 05:42:13.286641'),
(32, 'Hospitalization', 'Past medical history: Hospitalization', 0, 9, '2025-07-05 18:41:02.976368', '2025-07-16 05:42:13.322083'),
(33, 'Injuries', 'Past medical history: Injuries', 0, 10, '2025-07-05 18:41:02.985991', '2025-07-16 05:42:13.322083'),
(34, 'Kidney Problems', 'Past medical history: Kidney Problems', 0, 11, '2025-07-05 18:41:02.993609', '2025-07-16 05:42:13.367967'),
(35, 'Liver Problems', 'Past medical history: Liver Problems', 0, 12, '2025-07-05 18:41:02.995341', '2025-07-16 05:42:13.390120'),
(36, 'Malaria', 'Past medical history: Malaria', 0, 13, '2025-07-05 18:41:02.999635', '2025-07-16 05:42:13.444509'),
(37, 'Measles', 'Past medical history: Measles', 0, 14, '2025-07-05 18:41:03.006383', '2025-07-16 05:42:13.461632'),
(38, 'Operations/Surgery', 'Past medical history: Operations/Surgery', 0, 15, '2025-07-05 18:41:03.010732', '2025-07-16 05:42:13.477759'),
(39, 'Skin Conditions', 'Past medical history: Skin Conditions', 0, 17, '2025-07-05 18:41:03.019124', '2025-07-16 05:42:13.517048'),
(40, 'Typhoid', 'Past medical history: Typhoid', 0, 18, '2025-07-05 18:41:03.025155', '2025-07-16 05:42:13.537674'),
(41, 'Urinary Tract Infections', 'Past medical history: Urinary Tract Infections', 0, 20, '2025-07-05 18:41:03.032694', '2025-07-16 05:42:13.603547'),
(42, 'Vision Problems', 'Past medical history: Vision Problems', 0, 21, '2025-07-05 18:41:03.034704', '2025-07-16 05:42:13.636545'),
(43, 'Other Medical Conditions', 'Past medical history: Other Medical Conditions', 0, 22, '2025-07-05 18:41:03.042600', '2025-07-16 05:42:13.620013'),
(44, 'None', 'Past medical history: None', 0, 23, '2025-07-05 18:41:03.052163', '2025-07-16 05:42:13.684672'),
(45, 'Surgery', '', 1, 0, '2025-07-06 06:23:21.188125', '2025-07-16 05:42:13.109360'),
(46, 'Allergic Reaction', '', 0, 0, '2025-07-06 06:23:21.204683', '2025-07-16 05:42:12.907714'),
(47, 'Blood Transfusion', '', 0, 0, '2025-07-06 06:23:21.216976', '2025-07-16 05:42:12.943016'),
(48, 'Fracture', '', 0, 0, '2025-07-06 06:23:21.229824', '2025-07-16 05:42:12.960848'),
(49, 'Serious Injury', '', 0, 0, '2025-07-06 06:23:21.246322', '2025-07-16 05:42:13.059379'),
(50, 'Pregnancy', '', 0, 0, '2025-07-06 06:23:21.258643', '2025-07-16 05:42:13.017993'),
(51, 'Mental Health Treatment', '', 0, 0, '2025-07-06 06:23:21.269343', '2025-07-16 05:42:13.011079'),
(52, 'Serious Illness', '', 0, 0, '2025-07-06 06:45:50.455419', '2025-07-16 05:42:13.051285'),
(53, 'Chronic Conditions', '', 0, 0, '2025-07-06 06:45:50.462013', '2025-07-16 05:42:12.960848'),
(54, 'Substance Abuse Treatment', '', 1, 0, '2025-07-06 06:45:50.478061', '2025-07-16 05:42:13.068341'),
(55, 'Organ Transplant', '', 0, 0, '2025-07-06 06:45:50.489576', '2025-07-16 05:42:13.036652'),
(56, 'Major Injury', '', 0, 0, '2025-07-06 06:45:50.496962', '2025-07-16 05:42:12.980003');

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
(45, 'TEMP-64', 'FAMINIANO, CHRISTIAN', 'Male', '2000-11-11', 24, 'Incoming Freshman', '09230239052', 'MAin, TUgbungan, Zamboanga City', 'CHRISTIAN', '09708701567', 'B+', NULL, '2025-07-16 11:51:43.960340', '2025-07-19 04:07:28.927217', 64, 'widowed', '[\"Psychiatric Illness\", \"Schizophrenia\"]', 'faminianochristianjude@gmail.com', 'Crystal Street San Jose Cawa-Cawa, Tugbungan, Zamboanga City', 'JUDE', 'Child', 'FAMINIANO', '[\"asd\"]', 'CHRISTIAN', 0, '[{\"drug\": \"Amoxicillin\", \"dose\": \"500\", \"unit\": \"g\", \"frequency\": \"As needed\"}]', 'JUDE', 'Filipino', '[]', 'patient_photos/cutekitten_5zzBIKL.png', 'Islam', NULL, 'TUgbungan', 'Zamboanga City', 'MAin', 'Tugbungan', 'Crystal Street San Jose Cawa-Cawa', 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 0, '', NULL, NULL, 'summer');

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
(1, 'name', 'Last Name', 'Patient surname/family name', 'personal', 1, 1, '2025-07-02 18:13:26.970083', '2025-07-16 05:42:11.979164'),
(2, 'first_name', 'First Name', 'Patient first name', 'personal', 1, 1, '2025-07-02 18:13:26.978322', '2025-07-16 05:42:11.963168'),
(3, 'middle_name', 'Middle Name', 'Patient middle name', 'personal', 0, 1, '2025-07-02 18:13:26.979319', '2025-07-16 05:42:11.987185'),
(4, 'date_of_birth', 'Date of Birth', 'Patient birthdate', 'personal', 1, 1, '2025-07-02 18:13:26.979319', '2025-07-16 05:42:11.963168'),
(5, 'gender', 'Gender', 'Patient gender', 'personal', 1, 1, '2025-07-02 18:13:26.997188', '2025-07-16 05:42:11.979164'),
(6, 'blood_type', 'Blood Type', 'Patient blood type', 'health', 1, 1, '2025-07-02 18:13:27.003861', '2025-07-16 05:42:11.942251'),
(7, 'city_municipality', 'City/Municipality', 'City or municipality', 'personal', 1, 1, '2025-07-02 18:13:27.013470', '2025-07-16 05:42:11.963168'),
(8, 'barangay', 'Barangay', 'Barangay/district', 'personal', 1, 1, '2025-07-02 18:13:27.019685', '2025-07-16 05:42:11.951195'),
(9, 'street', 'Street', 'Street address', 'personal', 1, 1, '2025-07-02 18:13:27.025594', '2025-07-16 05:42:11.994988'),
(10, 'covid_vaccination_status', 'COVID Vaccination Status', 'COVID-19 vaccination status', 'health', 1, 1, '2025-07-02 18:13:27.031941', '2025-07-16 05:42:11.949187'),
(11, 'hospital_admission_or_surgery', 'Hospital Admission/Surgery History', 'History of hospital admissions or surgeries', 'health', 1, 1, '2025-07-02 18:13:27.038071', '2025-07-16 05:42:11.951195'),
(12, 'emergency_contact_first_name', 'Emergency Contact First Name', 'Emergency contact first name', 'emergency', 1, 1, '2025-07-02 18:13:27.042240', '2025-07-16 05:42:11.900132'),
(13, 'emergency_contact_last_name', 'Emergency Contact Last Name', 'Emergency contact last name', 'emergency', 1, 1, '2025-07-02 18:13:27.046058', '2025-07-16 05:42:11.913314'),
(14, 'emergency_contact_phone', 'Emergency Contact Phone', 'Emergency contact phone number', 'emergency', 1, 1, '2025-07-02 18:13:27.053937', '2025-07-16 05:42:11.931091'),
(15, 'last_name', 'Last Name', 'Patient last name', 'personal', 1, 1, '2025-07-06 06:23:20.881708', '2025-07-16 05:42:11.987185'),
(16, 'contact_number', 'Contact Number', 'Patient contact number', 'personal', 1, 1, '2025-07-06 06:23:20.922344', '2025-07-16 05:42:11.963168'),
(17, 'emergency_contact', 'Emergency Contact', 'Emergency contact information', 'emergency', 1, 1, '2025-07-06 06:23:20.936932', '2025-07-16 05:42:11.894100'),
(18, 'emergency_contact_name', 'Emergency Contact Name', 'Emergency contact person\'s name', 'emergency', 1, 1, '2025-07-06 06:45:25.066261', '2025-07-16 05:42:11.919474'),
(19, 'emergency_contact_number', 'Emergency Contact Number', 'Emergency contact person\'s phone number', 'emergency', 1, 1, '2025-07-06 06:45:25.082276', '2025-07-16 05:42:11.919474'),
(20, 'allergies', 'Allergies', 'Patient\'s known allergies', 'health', 0, 1, '2025-07-06 06:45:25.090085', '2025-07-16 05:42:11.940242');

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
(21, 'staff_signatures/signature_vsmxbN8.png', 'Rezier John O Magno', 'Staff', '23398', '12984291', 'a', '2025-07-07 02:16:13.559363', '2025-07-08 02:55:59.632003', 8, '019240912920', 'a');

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
(1, 'COVID-19', '', 0, 0, '2025-07-04 18:06:45.990368', '2025-07-16 05:42:12.436190'),
(2, 'Influenza (Flu)', '', 0, 1, '2025-07-04 18:06:45.990368', '2025-07-16 05:42:12.648564'),
(3, 'Hepatitis B', '', 0, 2, '2025-07-04 18:06:45.990368', '2025-07-16 05:42:12.483996'),
(4, 'Hepatitis A', '', 0, 3, '2025-07-04 18:06:46.006114', '2025-07-16 05:42:12.468080'),
(5, 'Tetanus', '', 0, 4, '2025-07-04 18:06:46.006114', '2025-07-16 05:42:12.865692'),
(6, 'Measles, Mumps, Rubella (MMR)', '', 0, 5, '2025-07-04 18:06:46.013935', '2025-07-16 05:42:12.696429'),
(7, 'Polio', '', 0, 6, '2025-07-04 18:06:46.013935', '2025-07-16 05:42:12.786927'),
(8, 'Pneumococcal', '', 0, 7, '2025-07-04 18:06:46.013935', '2025-07-16 05:42:12.765734'),
(9, 'Meningococcal', '', 0, 8, '2025-07-04 18:06:46.013935', '2025-07-16 05:42:12.708321'),
(10, 'Human Papillomavirus (HPV)', '', 0, 9, '2025-07-04 18:06:46.031313', '2025-07-16 05:42:12.621555'),
(11, 'Varicella (Chickenpox)', '', 0, 10, '2025-07-04 18:06:46.031313', '2025-07-16 05:42:12.907714'),
(12, 'Tuberculosis (BCG)', '', 0, 11, '2025-07-04 18:06:46.040161', '2025-07-16 05:42:12.869708'),
(13, 'Japanese Encephalitis', '', 0, 12, '2025-07-04 18:06:46.040161', '2025-07-16 05:42:12.671154'),
(14, 'Rabies', '', 0, 13, '2025-07-04 18:06:46.048847', '2025-07-16 05:42:12.793803'),
(15, 'Typhoid', '', 0, 14, '2025-07-04 18:06:46.048847', '2025-07-16 05:42:12.876303'),
(16, 'BCG (Bacillus Calmette-Guérin)', 'Standard vaccination: BCG (Bacillus Calmette-Guérin)', 0, 0, '2025-07-05 18:41:02.879496', '2025-07-16 05:42:12.444064'),
(17, 'DPT (Diphtheria, Pertussis, Tetanus)', 'Standard vaccination: DPT (Diphtheria, Pertussis, Tetanus)', 0, 2, '2025-07-05 18:41:02.884012', '2025-07-16 05:42:12.444064'),
(18, 'OPV (Oral Polio Vaccine)', 'Standard vaccination: OPV (Oral Polio Vaccine)', 0, 3, '2025-07-05 18:41:02.888150', '2025-07-16 05:42:12.724327'),
(19, 'IPV (Inactivated Polio Vaccine)', 'Standard vaccination: IPV (Inactivated Polio Vaccine)', 0, 4, '2025-07-05 18:41:02.894629', '2025-07-16 05:42:12.636394'),
(20, 'HIB (Haemophilus influenzae type b)', 'Standard vaccination: HIB (Haemophilus influenzae type b)', 0, 5, '2025-07-05 18:41:02.898796', '2025-07-16 05:42:12.512401'),
(21, 'PCV (Pneumococcal Conjugate Vaccine)', 'Standard vaccination: PCV (Pneumococcal Conjugate Vaccine)', 0, 6, '2025-07-05 18:41:02.904468', '2025-07-16 05:42:12.765734'),
(22, 'MMR (Measles, Mumps, Rubella)', 'Standard vaccination: MMR (Measles, Mumps, Rubella)', 0, 7, '2025-07-05 18:41:02.910644', '2025-07-16 05:42:12.719034'),
(23, 'Influenza (Annual)', 'Standard vaccination: Influenza (Annual)', 0, 10, '2025-07-05 18:41:02.910644', '2025-07-16 05:42:12.628590'),
(24, 'HPV (Human Papillomavirus)', 'Standard vaccination: HPV (Human Papillomavirus)', 0, 11, '2025-07-05 18:41:02.910644', '2025-07-16 05:42:12.603063'),
(25, 'Tdap (Tetanus, Diphtheria, Pertussis)', 'Standard vaccination: Tdap (Tetanus, Diphtheria, Pertussis)', 1, 13, '2025-07-05 18:41:02.923126', '2025-07-16 05:42:12.822044'),
(26, 'Other', 'Standard vaccination: Other', 0, 15, '2025-07-05 18:41:02.934668', '2025-07-16 05:42:12.768010'),
(27, 'Influenza', '', 0, 0, '2025-07-06 06:23:21.102895', '2025-07-16 05:42:12.619544'),
(28, 'MMR', '', 0, 0, '2025-07-06 06:23:21.121519', '2025-07-16 05:42:12.684897'),
(29, 'HPV', '', 0, 0, '2025-07-06 06:23:21.140176', '2025-07-16 05:42:12.503124'),
(30, 'Varicella', '', 1, 0, '2025-07-06 06:23:21.158413', '2025-07-16 05:42:12.876303'),
(31, 'Tdap', '', 0, 0, '2025-07-06 06:23:21.172852', '2025-07-16 05:42:12.822044'),
(32, 'Measles', '', 0, 0, '2025-07-06 06:45:50.417792', '2025-07-16 05:42:12.676387'),
(33, 'Mumps', '', 0, 0, '2025-07-06 06:45:50.430294', '2025-07-16 05:42:12.742992'),
(34, 'Rubella', '', 0, 0, '2025-07-06 06:45:50.433810', '2025-07-16 05:42:12.817960'),
(35, 'asd', '', 1, 0, '2025-07-06 13:08:29.155521', '2025-07-16 05:42:12.436190');

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
(17, 'FAMINIANO, CHRISTIAN JUDE', '2025-07-16', 'data:image/png;base64,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', '2025-07-16 11:52:30.891586', 64);

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
(128, 'Can view dental waiver', 31, 'view_dentalwaiver'),
(129, 'Can add dental information record', 32, 'add_dentalinformationrecord'),
(130, 'Can change dental information record', 32, 'change_dentalinformationrecord'),
(131, 'Can delete dental information record', 32, 'delete_dentalinformationrecord'),
(132, 'Can view dental information record', 32, 'view_dentalinformationrecord'),
(133, 'Can add Dental Medicine/Supply', 33, 'add_dentalmedicinesupply'),
(134, 'Can change Dental Medicine/Supply', 33, 'change_dentalmedicinesupply'),
(135, 'Can delete Dental Medicine/Supply', 33, 'delete_dentalmedicinesupply'),
(136, 'Can view Dental Medicine/Supply', 33, 'view_dentalmedicinesupply');

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
(32, 'api', 'dentalinformationrecord'),
(33, 'api', 'dentalmedicinesupply'),
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
(74, 'api', '0046_add_semester_to_patient', '2025-07-15 16:37:48.053330'),
(77, 'api', '0002_dentalinformationrecord', '2025-07-15 19:07:57.628115'),
(78, 'api', '0003_campusschedule_comorbidillness_dentalformdata_and_more', '2025-07-15 21:48:40.069053'),
(79, 'api', '0004_add_semester_to_dentalwaiver', '2025-07-15 21:52:43.925376'),
(80, 'api', '0004_dentalwaiver_school_year', '2025-07-15 22:28:45.816762'),
(81, 'api', '0051_add_education_fields_to_dental_info_record', '2025-07-15 22:29:03.509532'),
(82, 'api', '0052_remove_section_from_dental_info_record', '2025-07-15 22:34:58.881325'),
(83, 'api', '0053_change_gender_to_sex_in_dental_info_record', '2025-07-15 22:43:39.989715'),
(84, 'api', '0054_rename_gender_to_sex_dental_record', '2025-07-15 22:44:04.468185'),
(85, 'api', '0055_dentalformdata_used_medicines', '2025-07-16 02:10:24.755595'),
(86, 'api', '0056_dentalmedicinesupply', '2025-07-16 03:09:14.696882'),
(87, 'api', '0057_populate_dental_medicines', '2025-07-16 03:09:14.800903'),
(88, 'api', '0056_add_dental_medicine_supply_model', '2025-07-16 03:09:14.857408'),
(89, 'api', '0058_merge_20250716_1108', '2025-07-16 03:09:14.864855'),
(90, 'api', '0060_consolidate_duplicate_patients', '2025-07-16 07:25:50.866058');

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
-- Indexes for table `api_dentalinformationrecord`
--
ALTER TABLE `api_dentalinformationrecord`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_dentalinformationrec_patient_id_school_year_i_b18af192_uniq` (`patient_id`,`school_year_id`,`semester`),
  ADD KEY `api_dentalinformatio_school_year_id_de355a15_fk_api_acade` (`school_year_id`);

--
-- Indexes for table `api_dentalmedicinesupply`
--
ALTER TABLE `api_dentalmedicinesupply`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `api_dentalwaiver`
--
ALTER TABLE `api_dentalwaiver`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dental_waiver_per_user` (`user_id`),
  ADD KEY `api_dentalwaiver_patient_id_9f154893_fk_api_patient_id` (`patient_id`),
  ADD KEY `api_dentalwaiver_user_id_e5992a5d` (`user_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `api_academicsemester`
--
ALTER TABLE `api_academicsemester`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `api_appointment`
--
ALTER TABLE `api_appointment`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `api_dentalinformationrecord`
--
ALTER TABLE `api_dentalinformationrecord`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `api_dentalmedicinesupply`
--
ALTER TABLE `api_dentalmedicinesupply`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `api_dentalwaiver`
--
ALTER TABLE `api_dentalwaiver`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `api_medicalformdata`
--
ALTER TABLE `api_medicalformdata`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `api_profilerequirement`
--
ALTER TABLE `api_profilerequirement`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `api_staffdetails`
--
ALTER TABLE `api_staffdetails`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=137;

--
-- AUTO_INCREMENT for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

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
-- Constraints for table `api_dentalinformationrecord`
--
ALTER TABLE `api_dentalinformationrecord`
  ADD CONSTRAINT `api_dentalinformatio_patient_id_637002ef_fk_api_patie` FOREIGN KEY (`patient_id`) REFERENCES `api_patient` (`id`),
  ADD CONSTRAINT `api_dentalinformatio_school_year_id_de355a15_fk_api_acade` FOREIGN KEY (`school_year_id`) REFERENCES `api_academicschoolyear` (`id`);

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
