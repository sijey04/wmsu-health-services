import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (gradeLevel: string, user: any) => void;
  onSignup: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onSignup, 
  initialMode = 'login' 
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const handleSwitchToSignup = () => {
    setMode('signup');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };
  const handleSignupSuccess = () => {
    onSignup();
    // Switch to login mode after successful signup
    setMode('login');
  };

  if (mode === 'signup') {
    return (
      <SignupForm
        isOpen={isOpen}
        onClose={onClose}
        onSignup={handleSignupSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    );
  }

  return (
    <LoginForm
      isOpen={isOpen}
      onClose={onClose}
      onLogin={onLogin}
      onSwitchToSignup={handleSwitchToSignup}
    />
  );
}
