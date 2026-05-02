import { useEffect } from "react";
import { useAuth } from "@/providers/AuthContext";
import { LoginForm } from "@/features/auth/LoginForm";
import { useNavigate } from "react-router-dom";

export function AdminLogin() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const hasAdminAccess = ['ADMIN', 'MANAGER', 'VENTAS'].includes(user?.role || '');
      if (hasAdminAccess) {
        navigate("/");
      } else {
        logout();
      }
    }
  }, [isAuthenticated, user, navigate, logout]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="max-w-md w-full bg-[#111] p-8 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="mb-8 text-center text-white">
          <div className="w-24 h-24 mx-auto bg-primary/20 flex items-center justify-center rounded-full border-4 border-primary/40 mb-4">
             <span className="font-black text-3xl text-primary">M</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
            MANDY'S ADMIN
          </h2>
          <p className="text-zinc-400 font-medium text-sm">
            Ingresa tus credenciales de administrador.
          </p>
        </div>
        <LoginForm onClose={() => {}} />
      </div>
    </div>
  );
}
