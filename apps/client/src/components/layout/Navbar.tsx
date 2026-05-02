import { useLocation } from "react-router-dom";
import { useCart } from "@/providers/CartContext";
import { useAuth } from "@/providers/AuthContext";
import { useFavorites } from "@/providers/FavoritesContext";
import { useSiteContent } from "@/modules/site-content/providers/SiteContentProvider";
import { useAuthModal } from "@/features/auth/AuthModalProvider";
import { NavbarUI } from "./NavbarUI";
import { preloadPublicPageByPath } from "@/lib/pagePreload";

export const Navbar = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalFavorites, setIsFavoritesOpen } = useFavorites();
  const { user, logout } = useAuth();
  const { content } = useSiteContent();
  const { openAuthModal } = useAuthModal();
  const location = useLocation();

  return (
    <NavbarUI
      user={user ? { 
        nombre: user.nombre, 
        foto_perfil: user.foto_perfil ?? undefined, 
        role: user.role 
      } : null}
      totalItems={totalItems}
      pathname={location.pathname}
      onLogout={logout}
      onOpenCart={() => setIsCartOpen(true)}
      totalFavorites={totalFavorites}
      onOpenFavorites={() => setIsFavoritesOpen(true)}
      onOpenAuthModal={() => openAuthModal("login")}
      navLinks={content?.navbarLinks}
      onPreloadPath={preloadPublicPageByPath}
    />
  );
};
