import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AdminRoute } from "@/features/auth/AdminRoute";
import { AuthProvider } from "@/providers/AuthContext";
import { AdminLayout } from "@/layouts/AdminLayout";

// Lazy loading — páginas de administración
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const AdminLogin = lazy(() => import("@/pages/AdminLogin").then(module => ({ default: module.AdminLogin })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                {/* En admin, la ruta base / es el dashboard en lugar de /admin */}
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;
