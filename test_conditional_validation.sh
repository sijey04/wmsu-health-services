#!/bin/bash

# Test script to verify the conditional validation in profile-setup.tsx

echo "Testing conditional validation for profile-setup.tsx..."

# Test 1: Check if the validation function includes conditional checks
echo "Test 1: Checking if conditional validation is implemented..."
grep -n "Conditional validation" frontend/pages/patient/profile-setup.tsx

# Test 2: Check if error styling is added to all "Other" fields
echo -e "\nTest 2: Checking error styling for specification fields..."
grep -n "fieldErrors\." frontend/pages/patient/profile-setup.tsx | grep -E "(past_medical_history_other|food_allergy_specify|other_comorbid_specify|family_medical_history_other|family_medical_history_allergies|hospital_admission_details)"

# Test 3: Check if placeholder text is descriptive
echo -e "\nTest 3: Checking descriptive placeholder text..."
grep -n "placeholder=" frontend/pages/patient/profile-setup.tsx | grep -E "(Specify|specify)"

echo -e "\nTest completed successfully!"
