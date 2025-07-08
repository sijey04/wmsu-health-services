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
        <Image src="/logo.png" alt="WMSU Logo" width={150} height={150} />
        <h1 className="mt-6 text-4xl font-bold">WMSU Health Services</h1>
        <p className="mt-2 text-pink-100">Create an account to access our services.</p>
      </div>

      {/* Right side: Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="WMSU Logo" width={100} height={100} className="mx-auto" />
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
