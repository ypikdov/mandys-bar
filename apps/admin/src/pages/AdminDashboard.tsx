import { PageShell } from '@mandys/ui';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useAdminNavigation } from '@/providers/AdminNavigationContext';
import { adminTabComponents, preloadAdminTab } from '@/modules/admin/adminTabs';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { activeTab } = useAdminNavigation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ActiveTab = adminTabComponents[activeTab];

  useEffect(() => {
    preloadAdminTab(activeTab);
  }, [activeTab]);

  const handleSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  return (
    <PageShell withNavbarOffset={false} maxWidth="wide" className="bg-[#f6f5f2] pt-6">
      <section className="mb-5 rounded-[28px] border border-zinc-200/80 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 md:text-3xl">
              Panel Administrativo
            </h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Bienvenido, <span className="font-black text-zinc-700">{user?.nombre}</span>. Gestiona ventas, catálogo y accesos.
            </p>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="mb-5 rounded-[22px] border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-700">
          Error: {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="animate-in slide-in-from-top-2 mb-5 flex rounded-[22px] border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-bold text-green-700 fade-in">
          {successMessage}
        </div>
      )}

      <Suspense fallback={<AdminTabFallback />}>
        <ActiveTab onSuccess={handleSuccess} onError={handleError} />
      </Suspense>
    </PageShell>
  );
};

const AdminTabFallback = () => (
  <section className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
    <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-5 md:px-7">
      <div className="h-6 w-56 animate-pulse rounded-full bg-zinc-100" />
      <div className="h-11 w-36 animate-pulse rounded-[16px] bg-zinc-100" />
    </div>
    <div className="space-y-4 p-5 md:p-7">
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-14 animate-pulse rounded-[18px] bg-zinc-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[22px] bg-zinc-100" />
    </div>
  </section>
);

export default AdminDashboard;
