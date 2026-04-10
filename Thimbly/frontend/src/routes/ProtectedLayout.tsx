import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cottage-cream">
        <h2 className="text-xl font-serif text-cottage-wood">Loading Thimbly...</h2>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
