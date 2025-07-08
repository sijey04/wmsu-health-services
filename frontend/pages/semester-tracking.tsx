import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SemesterDashboard from '../components/SemesterDashboard';

const SemesterTrackingPage: React.FC = () => {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleSignupClick = () => {
    router.push('/signup');
  };

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
      <SemesterDashboard />
    </Layout>
  );
};

export default SemesterTrackingPage;
