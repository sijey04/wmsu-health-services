import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, canAccessAdminPages } from '../utils/auth';

interface WithAdminAccessProps {
  [key: string]: any;
}

/**
 * Higher-order component to protect admin pages
 * Redirects non-staff users to the index page
 */
const withAdminAccess = <P extends WithAdminAccessProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AdminProtectedComponent = (props: P) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
      const checkAccess = () => {
        const user = getCurrentUser();
        const userCanAccess = canAccessAdminPages(user);
        
        if (!userCanAccess) {
          // Redirect to index page if user doesn't have access
          router.replace('/');
          return;
        }
        
        setHasAccess(true);
        setIsLoading(false);
      };

      checkAccess();
    }, [router]);

    // Show loading spinner while checking access
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying access...</p>
          </div>
        </div>
      );
    }

    // Only render the component if user has access
    if (!hasAccess) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  AdminProtectedComponent.displayName = `withAdminAccess(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AdminProtectedComponent;
};

export default withAdminAccess;
