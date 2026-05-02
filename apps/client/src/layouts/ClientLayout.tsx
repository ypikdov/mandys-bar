/**
 * ClientLayout — Layout wrapper para páginas públicas del restaurante
 *
 * Responsabilidades:
 * - Renderizar Navbar (navegación principal)
 * - Renderizar Footer (excepto en Home)
 * - Renderizar CartDrawer (carrito flotante)
 * - Proveer un <main> con flex-1 para las rutas hijas via <Outlet>
 *
 * Se debe usar como layout element en React Router:
 *   <Route element={<ClientLayout />}>
 *     <Route path="/" element={<Home />} />
 *     ...
 *   </Route>
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/providers/CartContext';
import { useFavorites } from '@/providers/FavoritesContext';
import { AuthModalProvider } from '@/features/auth/AuthModalProvider';
import { preloadPublicPages } from '@/lib/pagePreload';

const CartDrawer = lazy(() =>
  import('@/features/cart/CartDrawer').then((module) => ({ default: module.CartDrawer }))
);
const FavoritesDrawer = lazy(() =>
  import('@/modules/menu/components/FavoritesDrawer').then((module) => ({ default: module.FavoritesDrawer }))
);

export const ClientLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { isCartOpen } = useCart();
  const { isFavoritesOpen } = useFavorites();
  const [shouldRenderCartDrawer, setShouldRenderCartDrawer] = useState(isCartOpen);
  const [shouldRenderFavoritesDrawer, setShouldRenderFavoritesDrawer] = useState(isFavoritesOpen);

  useEffect(() => {
    if (isCartOpen) {
      setShouldRenderCartDrawer(true);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (isFavoritesOpen) {
      setShouldRenderFavoritesDrawer(true);
    }
  }, [isFavoritesOpen]);

  useEffect(() => {
    const preloadNavigationPages = () => preloadPublicPages(['menu', 'about', 'contact', 'events', 'gallery']);

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(preloadNavigationPages, { timeout: 2200 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(preloadNavigationPages, 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        {!isHomePage && <Footer />}
        {shouldRenderCartDrawer && (
          <Suspense fallback={null}>
            <CartDrawer />
          </Suspense>
        )}
        {shouldRenderFavoritesDrawer && (
          <Suspense fallback={null}>
            <FavoritesDrawer />
          </Suspense>
        )}
      </div>
    </AuthModalProvider>
  );
};

export default ClientLayout;
