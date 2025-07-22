import React, { useState } from 'react';
import Link from 'next/link';
import Modal from './Modal'; // Import the Modal component

export default function SignupForm({ onSignup, isOpen, onClose, onSwitchToLogin }: { 
  onSignup: () => void;
  isOpen?: boolean;
  onClose?: () => void;
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
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false); // New state for Privacy Policy modal
  const [isTermsOfServiceModalOpen, setIsTermsOfServiceModalOpen] = useState(false); // New state for Terms of Service modal
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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
      }      setLoading(true);
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
            username: email, // Use email as username
          }),
        });

        const data = await res.json();        if (res.ok) {
          setSignupSuccess(true);
          setUserEmail(email);
          setStep(3); // Move to success step
        } else {
          setError(data?.detail || data?.error || Object.values(data).join(', ') || 'Signup failed.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
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
  };  return (
    <Modal isOpen={isOpen ?? true} onClose={onClose || (() => {})}>
      <div className="w-full max-w-md mx-auto">        {/* Header with Logo/Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-[#800000] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-[#800000] mb-2">Create Account</h2>
          <p className="text-gray-600">Join WMSU Health Services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {signupSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              A verification email has been sent to {userEmail}. Please check your inbox to verify your email address.
            </div>
          )}

          {/* Progress Indicator */}
             {step === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">Please provide your basic information</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="last-name">
                Last Name <span className="text-red-500">*</span>
              </label>              <input
                id="last-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors bg-white"
              value={gradeLevel}
              onChange={e => setGradeLevel(e.target.value)}
              required
            >
              <option value="">Select User Type</option>
                <option value="Kindergarten">Kindergarten</option>
                <option value="Elementary">Elementary</option>
                <option value="High School">High School</option>
                <option value="Senior High School">Senior High School</option>
                <option value="College">College</option>
                <option value="Employee">Employee</option>
                <option value="Incoming Freshman">Incoming Freshman</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 transition-colors font-medium"
          >
            Continue to Account Setup
            <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Setup</h3>
            <p className="text-sm text-gray-600">Create your secure account credentials</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="signup-email">
              Email Address <span className="text-red-500">*</span>
            </label>            <div className="relative">
              <input
                id="signup-email"
                type="email"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="signup-password">
              Password <span className="text-red-500">*</span>
            </label>            <div className="relative">
              <input
                id="signup-password"
                type="password"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="Create a strong password"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
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
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600 font-medium mb-1">Password requirements:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={`flex items-center ${password.length > 7 ? 'text-green-600' : ''}`}>
                      <svg className={`w-3 h-3 mr-2 ${password.length > 7 ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${password.match(/[a-z]/) && password.match(/[A-Z]/) ? 'text-green-600' : ''}`}>
                      <svg className={`w-3 h-3 mr-2 ${password.match(/[a-z]/) && password.match(/[A-Z]/) ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Uppercase and lowercase letters
                    </li>
                    <li className={`flex items-center ${password.match(/\d/) ? 'text-green-600' : ''}`}>
                      <svg className={`w-3 h-3 mr-2 ${password.match(/\d/) ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      At least one number
                    </li>
                    <li className={`flex items-center ${password.match(/[^a-zA-Z0-9]/) ? 'text-green-600' : ''}`}>
                      <svg className={`w-3 h-3 mr-2 ${password.match(/[^a-zA-Z0-9]/) ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirm-password">
              Confirm Password <span className="text-red-500">*</span>
            </label>            <div className="relative">
              <input
                id="confirm-password"
                type="password"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-start">              <input
                id="agree-to-terms"
                type="checkbox"
                className="h-4 w-4 text-[#800000] focus:ring-[#800000] border-gray-300 rounded mt-0.5"
                checked={agreeToTerms}
                onChange={e => setAgreeToTerms(e.target.checked)}
              />
              <label htmlFor="agree-to-terms" className="ml-3 text-sm text-gray-700">
                I agree to the{' '}
                <button
                  type="button"                  onClick={() => setIsPrivacyPolicyModalOpen(true)}
                  className="text-[#800000] underline hover:text-[#a83232] font-medium"
                >
                  Privacy Policy
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsOfServiceModalOpen(true)}
                  className="text-[#800000] underline hover:text-[#a83232] font-medium"
                >
                  Terms of Service
                </button>
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
              className="flex-1 bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}      {step === 3 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Created Successfully!</h3>
          <p className="text-sm text-gray-600 mb-4">
            We&apos;ve sent a verification email to{' '}
            <span className="font-medium text-[#800000]">{userEmail}</span>
          </p>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-6">
            <p className="font-medium mb-2">Next Steps:</p>
            <ol className="text-left space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the verification link in the email</li>
              <li>3. Return here to sign in to your account</li>
            </ol>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (onClose) onClose();
                onSignup();
              }}
              className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 transition-colors font-medium"
            >
              Go to Sign In
            </button>
            <p className="text-xs text-gray-500">
              Didn&apos;t receive the email?{' '}
              <Link href="/resend-verification" className="text-[#800000] hover:underline">
                Resend verification email
              </Link>
            </p>
          </div>
        </div>
      )}

      <Modal isOpen={isPrivacyPolicyModalOpen} onClose={() => setIsPrivacyPolicyModalOpen(false)}>
        <h3 className="text-xl font-bold text-[#800000] mb-4">Privacy Policy</h3>
        <div className="text-gray-700 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          <p>
            <strong>1. Information We Collect:</strong> We collect personal information you provide during registration, such as your name, email address, grade level, and other relevant details. We may also collect information about your use of our services.
          </p>
          <p>
            <strong>2. How We Use Your Information:</strong> Your information is used to create and manage your account, provide health services, communicate important updates, and improve our services. We may use anonymized data for research and reporting purposes.
          </p>
          <p>
            <strong>3. Data Sharing and Disclosure:</strong> We do not sell or share your personal information with third parties except as required by law or to provide essential health services. Your data may be shared with authorized university personnel and health professionals as needed.
          </p>
          <p>
            <strong>4. Data Security:</strong> We implement reasonable security measures to protect your information. However, no system is completely secure, and we cannot guarantee absolute security of your data.
          </p>
          <p>
            <strong>5. Your Rights:</strong> You have the right to access, update, or request deletion of your personal information. For any privacy-related concerns, please contact the University Health Services Center.
          </p>
          <p>
            <strong>6. Updates to This Policy:</strong> We may update this Privacy Policy from time to time. Significant changes will be communicated through the website or via email.
          </p>
          <p>
            By using this service, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </Modal>

      <Modal isOpen={isTermsOfServiceModalOpen} onClose={() => setIsTermsOfServiceModalOpen(false)}>
        <h3 className="text-xl font-bold text-[#800000] mb-4">Terms of Service</h3>
        <div className="text-gray-700 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          <p>
            <strong>1. Acceptance of Terms:</strong> By creating an account, you agree to comply with and be bound by these Terms of Service and all applicable university policies.
          </p>
          <p>
            <strong>2. Use of Services:</strong> You agree to use the health services platform only for lawful and appropriate purposes. Misuse of the system, including providing false information or unauthorized access, is strictly prohibited.
          </p>
          <p>
            <strong>3. Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately if you suspect any unauthorized use of your account.
          </p>
          <p>
            <strong>4. Service Availability:</strong> We strive to provide continuous access to our services but do not guarantee uninterrupted or error-free operation. The university reserves the right to modify or discontinue services at any time.
          </p>
          <p>
            <strong>5. Limitation of Liability:</strong> The university is not liable for any damages arising from your use of the platform, except as required by law.
          </p>
          <p>
            <strong>6. Changes to Terms:</strong> We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>
          <p>
            If you do not agree with these terms, please do not use this service.
          </p>        </div>
      </Modal>        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-[#800000] hover:text-[#a83232] transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}