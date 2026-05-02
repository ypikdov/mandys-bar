import { Link, Outlet } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import {
  AdminNavigationProvider,
  useAdminNavigation,
  type AdminTab,
  type AdminTabKey,
} from '@/providers/AdminNavigationContext';

const resolveImageUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value}`;
};

const AdminLayoutFrame = () => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, preloadTab, isPending, visibleTabs } = useAdminNavigation();

  return (
    <div className="min-h-screen bg-zinc-50 text-black">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur">
        <div className="mx-auto max-w-[1760px] px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/admin"
              className="flex min-w-0 max-w-[210px] items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10 sm:min-w-[244px] sm:max-w-none"
            >
              <img src="/images/logo mandys.jpg" alt="Mandy's Bar" className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary sm:text-[11px] sm:tracking-[0.26em]">
                  Panel Mandy&apos;s
                </p>
                <p className="truncate text-sm font-black uppercase tracking-tight sm:text-base">Administrador</p>
              </div>
            </Link>

            <AdminTopNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              preloadTab={preloadTab}
              isPending={isPending}
              visibleTabs={visibleTabs}
              className="hidden min-w-0 flex-1 justify-center xl:flex"
            />

            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-3 py-2 text-white sm:flex">
                {user?.foto_perfil ? (
                  <img
                    src={resolveImageUrl(user.foto_perfil)}
                    alt={user.nombre}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                )}
                <div className="hidden min-w-0 lg:block">
                  <p className="truncate text-sm font-black">{user?.nombre ?? 'Administrador'}</p>
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                    {user?.role ?? 'ADMIN'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white px-3 py-2.5 text-xs font-black text-black transition hover:bg-zinc-100 sm:px-4 sm:text-sm"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>

          <AdminTopNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            preloadTab={preloadTab}
            isPending={isPending}
            visibleTabs={visibleTabs}
            className="mt-3 flex xl:hidden"
          />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};

const AdminTopNavigation = ({
  activeTab,
  setActiveTab,
  preloadTab,
  isPending,
  visibleTabs,
  className,
}: {
  activeTab: AdminTabKey;
  setActiveTab: (tab: AdminTabKey) => void;
  preloadTab: (tab: AdminTabKey) => void;
  isPending: boolean;
  visibleTabs: AdminTab[];
  className?: string;
}) => (
  <nav
    className={`${className ?? ''} min-w-0 max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]`}
    aria-label="Secciones del panel admin"
    aria-busy={isPending}
  >
    <div className="flex min-w-max items-center gap-2">
      {visibleTabs.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            onFocus={() => preloadTab(key)}
            onMouseEnter={() => preloadTab(key)}
            onTouchStart={() => preloadTab(key)}
            className={`inline-flex h-12 shrink-0 items-center gap-3 rounded-[18px] border px-4 text-sm font-black transition-all duration-200 ${
              isActive
                ? 'border-primary/80 bg-primary/10 text-white shadow-[0_0_0_1px_rgba(239,124,55,0.18)]'
                : 'border-transparent text-white/78 hover:border-white/10 hover:bg-white/8 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-white/70'}`} />
            {label}
          </button>
        );
      })}
    </div>
  </nav>
);

export const AdminLayout = () => (
  <AdminNavigationProvider>
    <AdminLayoutFrame />
  </AdminNavigationProvider>
);

export default AdminLayout;
