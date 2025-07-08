/**
 * Utility functions for role-based access control and routing
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  is_staff: boolean;
  grade_level?: string;
  is_email_verified: boolean;
  user_type: string;
  patient_profile?: number;
}

/**
 * Check if a user is a staff member
 */
export const isStaffUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.is_staff || user.user_type === 'staff' || user.user_type === 'admin';
};

/**
 * Get the appropriate redirect path after login based on user role
 */
export const getPostLoginRedirectPath = (user: User | null): string => {
  if (!user) return '/';
  
  if (isStaffUser(user)) {
    return '/admin/medical-consultations';
  }
  
  return '/';
};

/**
 * Check if the current user should have access to admin pages
 */
export const canAccessAdminPages = (user: User | null): boolean => {
  return isStaffUser(user);
};

/**
 * Get user from localStorage
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('access_token');
  return !!token;
};
