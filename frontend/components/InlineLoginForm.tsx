import { useState } from 'react';
import { useRouter } from 'next/router';

export default function InlineLoginForm({ onLogin, showSwitchLink = false, onSwitchToSignup }: { 
  onLogin?: (gradeLevel: string) => void;
  showSwitchLink?: boolean;
  onSwitchToSignup?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

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
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccessMessage('Login successful! Redirecting...');
        
        // Call the callback if provided
        if (onLogin) {
          onLogin(data.user.grade_level || '');
        }
        
        // Redirect based on user role
        setTimeout(() => {
          if (data.user.is_staff || data.user.is_superuser) {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 1000);
      } else {
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
        
        setError(errorMessage);
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
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#8B1538] mb-2">Sign In</h2>
        <p className="text-gray-600">Sign in to your WMSU Health Services account</p>
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
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-[#8B1538] text-white py-3 px-4 rounded-md hover:bg-[#A31545] focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            'Sign In'
          )}
        </button>
      </form>

      {showSwitchLink && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-medium text-[#8B1538] hover:text-[#A31545] transition-colors"
            >
              Create account here
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
