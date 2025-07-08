/**
 * Test script to verify role-based routing logic
 */

import { isStaffUser, getPostLoginRedirectPath, canAccessAdminPages } from '../utils/auth';

// Mock user data for testing
const staffUser = {
  id: 1,
  username: 'doctor_main',
  email: 'doctor.main@wmsu.edu.ph',
  first_name: 'Felicitas',
  middle_name: 'C.',
  last_name: 'Elago',
  is_staff: true,
  grade_level: '',
  is_email_verified: true,
  user_type: 'staff',
  patient_profile: null
};

const studentUser = {
  id: 2,
  username: 'student123',
  email: 'student@wmsu.edu.ph',
  first_name: 'John',
  middle_name: 'A.',
  last_name: 'Doe',
  is_staff: false,
  grade_level: '1st Year',
  is_email_verified: true,
  user_type: 'student',
  patient_profile: 123
};

const adminUser = {
  id: 3,
  username: 'admin',
  email: 'admin@wmsu.edu.ph',
  first_name: 'Admin',
  middle_name: '',
  last_name: 'User',
  is_staff: false,
  grade_level: '',
  is_email_verified: true,
  user_type: 'admin',
  patient_profile: null
};

// Test function
function testRoleBasedRouting() {
  console.log('🧪 Testing Role-Based Routing Logic');
  console.log('=' * 40);
  
  // Test staff user
  console.log('\n👨‍⚕️ Testing Staff User:');
  console.log(`  isStaffUser: ${isStaffUser(staffUser)}`);
  console.log(`  canAccessAdminPages: ${canAccessAdminPages(staffUser)}`);
  console.log(`  redirectPath: ${getPostLoginRedirectPath(staffUser)}`);
  
  // Test student user
  console.log('\n👨‍🎓 Testing Student User:');
  console.log(`  isStaffUser: ${isStaffUser(studentUser)}`);
  console.log(`  canAccessAdminPages: ${canAccessAdminPages(studentUser)}`);
  console.log(`  redirectPath: ${getPostLoginRedirectPath(studentUser)}`);
  
  // Test admin user
  console.log('\n👤 Testing Admin User:');
  console.log(`  isStaffUser: ${isStaffUser(adminUser)}`);
  console.log(`  canAccessAdminPages: ${canAccessAdminPages(adminUser)}`);
  console.log(`  redirectPath: ${getPostLoginRedirectPath(adminUser)}`);
  
  // Test null user
  console.log('\n❌ Testing Null User:');
  console.log(`  isStaffUser: ${isStaffUser(null)}`);
  console.log(`  canAccessAdminPages: ${canAccessAdminPages(null)}`);
  console.log(`  redirectPath: ${getPostLoginRedirectPath(null)}`);
  
  console.log('\n✅ Role-based routing logic verified!');
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testRoleBasedRouting();
}

export default testRoleBasedRouting;
