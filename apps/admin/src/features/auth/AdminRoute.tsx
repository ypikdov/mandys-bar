import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/providers/AuthContext";

export const AdminRoute = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAdminAccess = ['ADMIN', 'MANAGER', 'VENTAS'].includes(user?.role || '');
  if (!hasAdminAccess) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

