import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Root redirect component that routes users based on their role
 */
const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // System Users go to Multi-Admin Dashboard
  if (user?.role === 'system') {
    return <Navigate to="/multi-admin" replace />;
  }

  // All other users go to regular dashboard
  return <Navigate to="/dashboard" replace />;
};

export default RootRedirect;


