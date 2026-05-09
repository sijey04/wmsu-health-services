import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const ResetPasswordPage = () => {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data?.message || 'Password reset successfully. You can now sign in.');
      } else {
        const errorMessage = data?.error || data?.detail || data?.message || 'Failed to reset password.';
        setError(Array.isArray(errorMessage) ? errorMessage.join(' ') : errorMessage);
      }
    } catch (err: any) {
      if (err?.name === 'TypeError' && String(err?.message || '').includes('fetch')) {
        setError('Network error. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <div className="hidden lg:flex w-1/2 bg-[#800000] text-white flex-col items-center justify-center p-12 text-center">
        <div className="flex items-center space-x-4 mb-6">
          <img src="/WMSU-Logo.jpg" alt="WMSU Logo" className="w-24 h-24 object-contain brightness-110" />
          <img src="/WMSU-HealthLogo.png" alt="Health Logo" className="w-24 h-24 object-contain brightness-110" />
        </div>
        <h1 className="text-4xl font-bold">WMSU Health Services</h1>
        <p className="mt-2 text-pink-100">Set a new password for your account.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/WMSU-Logo.jpg" alt="WMSU Logo" className="w-16 h-16 object-contain" />
              <img src="/WMSU-HealthLogo.png" alt="Health Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#800000] mb-2">Reset Password</h2>
              <p className="text-sm text-gray-600">Create a new password for your account.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="reset-password">
                  New Password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="reset-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#800000] text-white py-3 px-4 rounded-md hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Ready to sign in?{' '}
                <Link href="/login" className="font-medium text-[#800000] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-[#800000] transition-colors">
              <- Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
