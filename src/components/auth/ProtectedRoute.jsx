import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading, isAuthEnabled } = useAuth();
  const location = useLocation();

  if (!isAuthEnabled) return <Outlet />;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-surface">
        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <ShieldCheck size={24} className="text-white" />
        </span>
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
