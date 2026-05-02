import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  Briefcase,
  CalendarDays,
  Globe,
  Package,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { preloadAdminTab, preloadAdminTabs } from '@/modules/admin/adminTabs';

export type AdminTabKey = 'orders' | 'products' | 'users' | 'staff' | 'reservations' | 'site-content';

export interface AdminTab {
  key: AdminTabKey;
  label: string;
  Icon: LucideIcon;
  roles?: string[];
}

interface AdminNavigationContextValue {
  activeTab: AdminTabKey;
  setActiveTab: (tab: AdminTabKey) => void;
  preloadTab: (tab: AdminTabKey) => void;
  isPending: boolean;
  visibleTabs: AdminTab[];
}

const ADMIN_TABS: AdminTab[] = [
  { key: 'orders', label: 'Órdenes', Icon: Store },
  { key: 'products', label: 'Productos', Icon: Package },
  { key: 'reservations', label: 'Reservaciones', Icon: CalendarDays },
  { key: 'users', label: 'Clientes', Icon: Users },
  { key: 'site-content', label: 'Contenido Web', Icon: Globe, roles: ['ADMIN', 'MANAGER'] },
  { key: 'staff', label: 'Vida personal', Icon: Briefcase, roles: ['ADMIN', 'MANAGER'] },
];

const AdminNavigationContext = createContext<AdminNavigationContextValue | undefined>(undefined);

export const AdminNavigationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabKey>('orders');
  const [isPending, startTransition] = useTransition();

  const visibleTabs = useMemo(
    () => ADMIN_TABS.filter((tab) => !tab.roles || tab.roles.includes(user?.role || '')),
    [user?.role],
  );

  const selectTab = useCallback(
    (tab: AdminTabKey) => {
      preloadAdminTab(tab);
      startTransition(() => {
        setActiveTab(tab);
      });
    },
    [startTransition],
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      selectTab(visibleTabs[0]?.key ?? 'orders');
    }
  }, [activeTab, selectTab, visibleTabs]);

  useEffect(() => {
    const tabsToPreload = visibleTabs.map((tab) => tab.key).filter((key) => key !== activeTab);
    if (tabsToPreload.length === 0) return;

    const preload = () => preloadAdminTabs(tabsToPreload);

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(preload, { timeout: 1800 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(preload, 500);
    return () => window.clearTimeout(timeoutId);
  }, [activeTab, visibleTabs]);

  const value = useMemo(
    () => ({ activeTab, setActiveTab: selectTab, preloadTab: preloadAdminTab, isPending, visibleTabs }),
    [activeTab, isPending, selectTab, visibleTabs],
  );

  return (
    <AdminNavigationContext.Provider value={value}>
      {children}
    </AdminNavigationContext.Provider>
  );
};

export const useAdminNavigation = () => {
  const context = useContext(AdminNavigationContext);
  if (!context) {
    throw new Error('useAdminNavigation must be used within AdminNavigationProvider');
  }
  return context;
};
