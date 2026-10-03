import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRole }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="page-loader">Restoring your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Outlet />;
}
