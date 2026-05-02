import { lazy, type ComponentType } from 'react';
import type { AdminTabKey } from '@/providers/AdminNavigationContext';

export interface AdminTabComponentProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type AdminTabModule = { default: ComponentType<AdminTabComponentProps> };

const adminTabLoaders: Record<AdminTabKey, () => Promise<AdminTabModule>> = {
  orders: () => import('@/modules/orders/components/OrdersTab').then((module) => ({ default: module.OrdersTab })),
  products: () => import('@/modules/products/components/ProductsTab').then((module) => ({ default: module.ProductsTab })),
  reservations: () =>
    import('@/modules/reservations/components/ReservationsTab').then((module) => ({ default: module.ReservationsTab })),
  users: () => import('@/modules/users/components/UsersTab').then((module) => ({ default: module.UsersTab })),
  'site-content': () =>
    import('@/modules/site-content/components/SiteContentTab').then((module) => ({ default: module.SiteContentTab })),
  staff: () => import('@/modules/staff/components/StaffTab').then((module) => ({ default: module.StaffTab })),
};

const adminTabPromises: Partial<Record<AdminTabKey, Promise<AdminTabModule>>> = {};

export const loadAdminTab = (tab: AdminTabKey) => {
  adminTabPromises[tab] ??= adminTabLoaders[tab]().catch((error) => {
    delete adminTabPromises[tab];
    throw error;
  });

  return adminTabPromises[tab]!;
};

export const preloadAdminTab = (tab: AdminTabKey) => {
  void loadAdminTab(tab);
};

export const preloadAdminTabs = (tabs: AdminTabKey[]) => {
  tabs.forEach(preloadAdminTab);
};

export const adminTabComponents: Record<AdminTabKey, ComponentType<AdminTabComponentProps>> = {
  orders: lazy(() => loadAdminTab('orders')),
  products: lazy(() => loadAdminTab('products')),
  reservations: lazy(() => loadAdminTab('reservations')),
  users: lazy(() => loadAdminTab('users')),
  'site-content': lazy(() => loadAdminTab('site-content')),
  staff: lazy(() => loadAdminTab('staff')),
};
