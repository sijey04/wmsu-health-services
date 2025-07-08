import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

const VerifyEmailPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token as string);
    } else if (router.isReady) {
      setStatus('invalid');
      setMessage('Invalid verification link.');
    }
  }, [token, router.isReady]);
  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/verify_email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // If tokens are provided, store them and redirect to dashboard
        if (data.access_token && data.refresh_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirect to index page after 2 seconds
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Email verification failed.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#800000] mx-auto"></div>
        );
      case 'success':
        return (
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
      case 'invalid':
        return (
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'error':
        return 'Verification Failed';
      case 'invalid':
        return 'Invalid Verification Link';
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Left side: Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#800000] text-white flex-col items-center justify-center p-12 text-center">
        <Image src="/logo.png" alt="WMSU Logo" width={150} height={150} />
        <h1 className="mt-6 text-4xl font-bold">WMSU Health Services</h1>
        <p className="mt-2 text-pink-100">Your Health, Our Priority.</p>
      </div>

      {/* Right side: Verification Status */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="WMSU Logo" width={100} height={100} className="mx-auto" />
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg w-full text-center">
            {/* Status Icon */}
            <div className="mb-6">
              {getStatusIcon()}
            </div>

            {/* Status Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {getStatusTitle()}
            </h2>

            {/* Status Message */}
            <p className={`text-lg mb-6 ${
              status === 'success' ? 'text-green-600' : 
              status === 'error' || status === 'invalid' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {message}
            </p>            {/* Action Buttons */}
            <div className="space-y-4">
              {status === 'success' && (
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Your email has been verified successfully! You are now logged in and will be redirected to the homepage shortly.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-[#800000]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#800000]"></div>
                    <span className="text-sm">Redirecting...</span>
                  </div>
                  <Link 
                    href="/"
                    className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] transition-colors font-medium inline-block"
                  >
                    Go to Homepage Now
                  </Link>
                </div>
              )}

              {(status === 'error' || status === 'invalid') && (
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    {status === 'invalid' 
                      ? 'The verification link is invalid or has expired.'
                      : 'There was an error verifying your email. Please try again or contact support.'
                    }
                  </p>
                  <div className="space-y-2">
                    <Link 
                      href="/signup"
                      className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] transition-colors font-medium inline-block"
                    >
                      Try Signing Up Again
                    </Link>
                    <Link 
                      href="/resend-verification"
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium inline-block"
                    >
                      Resend Verification Email
                    </Link>
                  </div>
                </div>
              )}

              {status === 'loading' && (
                <p className="text-gray-600 text-sm">
                  Please wait while we verify your email address...
                </p>
              )}
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-[#800000] transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
