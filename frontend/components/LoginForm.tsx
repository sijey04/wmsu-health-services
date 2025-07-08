import { useState } from 'react';
import { useRouter } from 'next/router';
import Modal from './Modal';
import { getPostLoginRedirectPath } from '../utils/auth';

export default function LoginForm({ onLogin, isOpen, onClose, onSwitchToSignup }: { 
  onLogin: (gradeLevel: string, user: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToSignup?: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Removed showPostLoginModal and userGradeLevel states from here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();      if (res.ok) {        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccessMessage('Login successful!');
        
        // Implement role-based routing
        const redirectPath = getPostLoginRedirectPath(data.user);
        
        // Call the login callback
        onLogin(data.user.grade_level || '', data.user);
        
        // Redirect based on user role
        if (redirectPath !== '/') {
          // For staff users, redirect to admin pages
          router.push(redirectPath);
        }
        
        if (onClose) onClose();        } else {
          // Handle Django REST framework error format
          let errorMessage = 'Invalid email or password.';
          
          if (data?.non_field_errors && Array.isArray(data.non_field_errors)) {
            errorMessage = data.non_field_errors[0];
          } else if (data?.detail) {
            errorMessage = data.detail;
          } else if (data?.error) {
            errorMessage = data.error;
          } else if (data?.message) {
            errorMessage = data.message;
          } else if (typeof data === 'object' && data !== null) {
            // Handle other object formats
            const values = Object.values(data).flat();
            if (values.length > 0) {
              errorMessage = values.join(' ');
            }
          }
          
          // Check if it's an email verification error
          if (errorMessage.toLowerCase().includes('verify your email') || 
              errorMessage.toLowerCase().includes('email verification')) {
            setError(
              <div className="text-sm">
                <p className="font-medium mb-2">Email verification required</p>
                <p className="mb-2">Please verify your email address before signing in.</p>
                <a 
                  href="/resend-verification" 
                  className="text-[#800000] hover:underline font-medium"
                >
                  Resend verification email →
                </a>
              </div>
            );
          } else {
            setError(errorMessage);
          }
        }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };  return (
    <Modal isOpen={isOpen ?? true} onClose={onClose || (() => {})}>
      <div className="w-full max-w-md mx-auto">        {/* Header with Logo/Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#800000] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-[#800000] mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to WMSU Health Services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">              <input
                id="login-email"
                type="email"
                className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-password">
              Password
            </label>
            <div className="relative">              <input
                id="login-password"
                type="password"
                className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#800000] focus:ring-[#800000] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-[#800000] hover:text-[#a83232] transition-colors"
            >
              Forgot password?
            </button>
          </div>          <button 
            type="submit" 
            className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Switch to Signup */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-medium text-[#800000] hover:text-[#a83232] transition-colors"
            >
              Create account here
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Need help?</span>
            </div>
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Contact WMSU Health Services for assistance
          </p>          <div className="flex justify-center space-x-4 text-xs">
            <a href="#" className="text-[#800000] hover:text-[#a83232] transition-colors">Support</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="text-[#800000] hover:text-[#a83232] transition-colors">FAQ</a>
          </div>
        </div>
      </div>
    </Modal>
  );
}