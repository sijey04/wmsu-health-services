import React, { useEffect, useState } from 'react';
import InlineLoginForm from '../components/InlineLoginForm';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const LoginPage = () => {
  const router = useRouter();
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (router.query.signup === 'success') {
      setSignupSuccess(true);
      // Optional: remove the query param from URL without reloading
      router.replace('/login', undefined, { shallow: true });
    }
  }, [router]);

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Left side: Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#800000] text-white flex-col items-center justify-center p-12 text-center">
        <Image src="/logo.png" alt="WMSU Logo" width={150} height={150} />
        <h1 className="mt-6 text-4xl font-bold">WMSU Health Services</h1>
        <p className="mt-2 text-pink-100">Your Health, Our Priority.</p>
      </div>

      {/* Right side: Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="WMSU Logo" width={100} height={100} className="mx-auto" />
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg w-full">
            {signupSuccess && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg" role="alert">
                <p className="font-bold">Signup Successful!</p>
                <p>Please check your email to verify your account and then sign in.</p>
              </div>
            )}
            <InlineLoginForm 
              onLogin={(gradeLevel) => {
                // The form itself handles redirection to index page
                console.log('Login successful for user with grade level:', gradeLevel);
              }} 
            />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-[#800000] hover:underline">
                  Sign up
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

export default LoginPage;