import React from 'react';
import InlineSignupForm from '../components/InlineSignupForm';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const SignupPage = () => {
  const router = useRouter();

  const handleSignupSuccess = () => {
    router.push('/login?signup=success');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Left side: Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#800000] text-white flex-col items-center justify-center p-12 text-center">
        <div className="flex items-center space-x-4 mb-6">
          <img src="/WMSU-Logo.jpg" alt="WMSU Logo" className="w-24 h-24 object-contain brightness-110" />
          <img src="/WMSU-HealthLogo.png" alt="Health Logo" className="w-24 h-24 object-contain brightness-110" />
        </div>
        <h1 className="text-4xl font-bold">WMSU Health Services</h1>
        <p className="mt-2 text-pink-100">Create an account to access our services.</p>
      </div>

      {/* Right side: Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/WMSU-Logo.jpg" alt="WMSU Logo" className="w-16 h-16 object-contain" />
              <img src="/WMSU-HealthLogo.png" alt="Health Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg w-full">
            <InlineSignupForm onSignup={handleSignupSuccess} />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-[#800000] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
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

export default SignupPage;
