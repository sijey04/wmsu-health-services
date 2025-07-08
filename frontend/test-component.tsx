// Simple test to check TypeScript compilation
import { useState } from 'react';

const TestComponent = () => {
  const [test, setTest] = useState<string>('test');
  return <div>{test}</div>;
};

export default TestComponent;
