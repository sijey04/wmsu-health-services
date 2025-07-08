import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const ResendVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/resend_verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Verification email sent successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send verification email.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Left side: Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#800000] text-white flex-col items-center justify-center p-12 text-center">
        <Image src="/logo.png" alt="WMSU Logo" width={150} height={150} />
        <h1 className="mt-6 text-4xl font-bold">WMSU Health Services</h1>
        <p className="mt-2 text-pink-100">Resend verification email to activate your account.</p>
      </div>

      {/* Right side: Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="WMSU Logo" width={100} height={100} className="mx-auto" />
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-[#800000] rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#800000] mb-2">Resend Verification</h2>
              <p className="text-gray-600 text-sm">
                Enter your email address and we'll send you a new verification link.
              </p>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {message}
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {message}
              </div>
            )}

            {status !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
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

                <button 
                  type="submit" 
                  className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Verification Email
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                  <p className="font-medium">Check your email!</p>
                  <p>We've sent a verification link to <strong>{email}</strong></p>
                  <p className="mt-2">Click the link in the email to verify your account.</p>
                </div>
                <Link 
                  href="/login"
                  className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] transition-colors font-medium inline-block"
                >
                  Go to Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="flex justify-center space-x-4 text-sm">
              <Link href="/login" className="text-[#800000] hover:text-[#a83232] transition-colors">
                Sign In
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/signup" className="text-[#800000] hover:text-[#a83232] transition-colors">
                Sign Up
              </Link>
            </div>
            <Link href="/" className="text-sm text-gray-600 hover:text-[#800000] transition-colors block">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerificationPage;
