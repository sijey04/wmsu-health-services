import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function InlineSignupForm({ onSignup, showSwitchLink = false, onSwitchToLogin }: { 
  onSignup: () => void;
  showSwitchLink?: boolean;
  onSwitchToLogin?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkPasswordStrength = (pw: string) => {
    let strength = 0;
    if (pw.length > 7) strength++;
    if (pw.match(/[a-z]/) && pw.match(/[A-Z]/)) strength++;
    if (pw.match(/\d/)) strength++;
    if (pw.match(/[^a-zA-Z0-9]/)) strength++;

    if (strength === 4) return 'strong';
    if (strength >= 2) return 'moderate';
    return 'weak';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!lastName || !firstName || !gradeLevel) {
        setError('Please fill in all required personal information fields.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all required account information fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (passwordStrength === 'weak') {
        setError('Password is too weak. Please create a stronger password.');
        return;
      }
      if (!agreeToTerms) {
        setError('You must agree to the Privacy Policy and Terms of Service.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/auth/signup/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            grade_level: gradeLevel,
            email,
            password,
            confirm_password: confirmPassword,
            user_type: userType,
            username: email,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          onSignup();
        } else {
          // Handle Django REST framework error format
          let errorMessage = 'Signup failed.';
          
          if (data?.non_field_errors && Array.isArray(data.non_field_errors)) {
            errorMessage = data.non_field_errors[0];
          } else if (data?.detail) {
            errorMessage = data.detail;
          } else if (data?.error) {
            errorMessage = data.error;
          } else if (data?.message) {
            errorMessage = data.message;
          } else if (typeof data === 'object' && data !== null) {
            // Handle field-specific errors or other object formats
            const values = Object.values(data).flat();
            if (values.length > 0) {
              errorMessage = values.join(' ');
            }
          }
          
          setError(errorMessage);
        }
      } catch (err: any) {
        console.error('Signup error:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-[#8B1538] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[#8B1538] mb-2">Create Account</h2>
        <p className="text-gray-600">Join WMSU Health Services</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-[#8B1538] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-[#8B1538]' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-[#8B1538] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
              <p className="text-sm text-gray-600">Please provide your basic information</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="last-name">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="last-name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="first-name">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="first-name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  placeholder="Enter first name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="middle-name">
                Middle Name <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="middle-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
                value={middleName}
                onChange={e => setMiddleName(e.target.value)}
                placeholder="Enter middle name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="grade-level">
                User Type <span className="text-red-500">*</span>
              </label>
              <select
                id="grade-level"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors bg-white"
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                required
              >
                <option value="">Select User Type</option>
                <option value="Kindergarten">Kindergarten</option>
                <option value="Elementary">Elementary</option>
                <option value="College">College</option>
                <option value="Employee">Employee</option>
                <option value="Incoming Freshman">Incoming Freshman</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-[#8B1538] text-white py-3 px-4 rounded-md hover:bg-[#A31545] focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-2 transition-colors font-medium"
            >
              Continue to Account Setup
              <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Setup</h3>
              <p className="text-sm text-gray-600">Create your secure account credentials</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="signup-email">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="signup-password">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="signup-password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="Create a strong password"
              />
              {password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Password strength:</span>
                    <span className={`text-sm font-medium capitalize ${
                      passwordStrength === 'strong' ? 'text-green-600' : 
                      passwordStrength === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-gray-200">
                    <div 
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ 
                        width: passwordStrength === 'strong' ? '100%' : 
                               passwordStrength === 'moderate' ? '66%' : '33%' 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirm-password">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] transition-colors"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start">
                <input
                  id="agree-to-terms"
                  type="checkbox"
                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded mt-0.5"
                  checked={agreeToTerms}
                  onChange={e => setAgreeToTerms(e.target.checked)}
                />
                <label htmlFor="agree-to-terms" className="ml-3 text-sm text-gray-700">
                  I agree to the Privacy Policy and Terms of Service
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={handlePrevStep} 
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-[#8B1538] text-white py-3 px-4 rounded-md hover:bg-[#A31545] focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {showSwitchLink && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-[#8B1538] hover:text-[#A31545] transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
