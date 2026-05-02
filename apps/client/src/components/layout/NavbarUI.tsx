import { useCallback, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { Heart, User, ShoppingCart, Menu } from "lucide-react";
import type { NavbarLink } from "@mandys/shared";
import { sanitizeInternalPath } from "@/lib/utils";

export interface NavbarUIProps {
  user: { nombre: string; foto_perfil?: string; role: string } | null;
  totalItems: number;
  totalFavorites: number;
  pathname: string;
  onLogout: () => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenAuthModal: () => void;
  navLinks?: NavbarLink[];
  onPreloadPath?: (path: string) => void;
}

export const NavbarUI: React.FC<NavbarUIProps> = ({
  user,
  totalItems,
  totalFavorites,
  pathname,
  onLogout,
  onOpenCart,
  onOpenFavorites,
  onOpenAuthModal,
  navLinks: navLinksProp,
  onPreloadPath,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggleMobileMenu = useCallback(() => {
    startTransition(() => {
      setIsMobileMenuOpen(prev => !prev);
    });
  }, [startTransition]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const getPreloadProps = useCallback(
    (path: string) => ({
      onFocus: () => onPreloadPath?.(path),
      onMouseEnter: () => onPreloadPath?.(path),
      onTouchStart: () => onPreloadPath?.(path),
    }),
    [onPreloadPath],
  );

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const profileImageSrc = user?.foto_perfil
    ? /^https?:\/\//i.test(user.foto_perfil)
      ? user.foto_perfil
      : user.foto_perfil.startsWith('/')
        ? user.foto_perfil
        : `/${user.foto_perfil}`
    : null;

  const fallbackNavLinks = [
    { name: "MENU", path: "/menu" },
    { 
      name: "ACERCA DE", 
      path: "/acerca",
      dropdown: [
        { name: "Nuestra historia", path: "/acerca/historia" },
        { name: "Equipo", path: "/acerca/equipo" },
        { name: "Preguntas frecuentes", path: "/acerca/faq" },
      ]
    },
    { name: "CONTACTO", path: "/contacto" },
    { 
      name: "EVENTOS", 
      path: "/eventos",
      dropdown: [
        { name: "Todo Público", path: "/eventos/publicos" },
        { name: "Reservar Espacio Privado", path: "/eventos/privados" },
      ]
    },
    { name: "GALERÍA", path: "/galeria" },
  ];

  const navLinks = navLinksProp?.length
    ? navLinksProp.map((link, index) => {
        const fallbackLink = fallbackNavLinks[index];
        const fallbackDropdown = fallbackLink?.dropdown ?? [];

        return {
          name: link.label,
          path: sanitizeInternalPath(link.path, fallbackLink?.path ?? "/"),
          dropdown: link.dropdown?.length
            ? link.dropdown.map((item, dropdownIndex) => ({
                name: item.label,
                path: sanitizeInternalPath(
                  item.path,
                  fallbackDropdown[dropdownIndex]?.path ?? fallbackLink?.path ?? "/",
                ),
              }))
            : undefined,
        };
      })
    : fallbackNavLinks;

  return (
    <nav className="sticky top-0 z-50 w-full bg-black px-4 py-3 text-white md:px-8">
      <div className="relative flex items-center justify-between gap-4">
      {/* Logo Area */}
      <Link to="/" className="flex items-center gap-3" {...getPreloadProps("/")}>
        <img src="/images/logo mandys.jpg" alt="Mandy's Bar" className="h-12 w-12 rounded-full object-cover" />
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-widest leading-none text-white">MANDY'S</span>
          <span className="text-xs text-zinc-300">Bar & Restaurante</span>
        </div>
      </Link>

      {/* Desktop Navigation - Pill Shaped Container */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-center lg:flex">
        <div className="pointer-events-auto relative flex items-center rounded-full bg-white px-2 py-1 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
        {navLinks.map((link) => {
          const dropdownItems = link.dropdown ?? [];
          const hasDropdown = dropdownItems.length > 0;
          const isDropdownOpen = activeDropdown === link.name;
          
          return (
            <div key={link.name} className="relative group"
              onBlur={(e) => {
                 if (hasDropdown && !e.currentTarget.contains(e.relatedTarget)) {
                    setActiveDropdown(null);
                 }
              }}
            >
              {hasDropdown ? (
                <div className={`relative z-10 flex items-center rounded-full transition-colors ${isDropdownOpen || isActive(link.path) ? "text-white" : "text-black hover:bg-zinc-100"}`}>
                  {(isDropdownOpen || isActive(link.path)) && (
                    <span className="absolute inset-0 -z-10 rounded-full bg-primary transition-colors" />
                  )}
                   <Link
                    to={link.path}
                    {...getPreloadProps(link.path)}
                    className="pl-5 pr-1 py-2 text-sm font-semibold rounded-l-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  >
                    {link.name}
                  </Link>
                   <button 
                    className="pr-4 pl-1 py-2 rounded-r-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary cursor-pointer"
                    onClick={(e) => { e.preventDefault(); setActiveDropdown(isDropdownOpen ? null : link.name); }}
                    aria-haspopup="true"
                    aria-expanded={String(isDropdownOpen) as "true" | "false"}
                    aria-label={`Menú de ${link.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </div>
              ) : (
                <Link
                  to={link.path}
                  {...getPreloadProps(link.path)}
                  className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-full flex items-center gap-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    isActive(link.path) 
                      ? "text-white" 
                      : "text-black hover:bg-zinc-100"
                  }`}
                >
                  {isActive(link.path) && (
                    <span className="absolute inset-0 -z-10 rounded-full bg-primary transition-colors" />
                  )}
                  {link.name}
                </Link>
              )}

              {/* Dropdown Menu */}
              {hasDropdown && isDropdownOpen && (
                <div className="absolute top-full left-0 pt-3 z-50">
                  <div 
                    className="bg-white shadow-2xl rounded-xl min-w-[220px] flex flex-col overflow-hidden text-black border border-zinc-200"
                    role="group"
                    aria-label={`Submenú de ${link.name}`}
                  >
                    {dropdownItems.map(dropLink => {
                      const isDropActive = pathname === dropLink.path;
                      return (
                        <Link
                          key={dropLink.name}
                          to={dropLink.path}
                          {...getPreloadProps(dropLink.path)}
                          className={`px-6 py-4 text-sm font-semibold transition-colors outline-none focus-visible:bg-zinc-100 block ${
                            isDropActive 
                              ? "bg-primary/10 text-primary border-l-4 border-primary" 
                              : "hover:bg-primary hover:text-white border-l-4 border-transparent"
                          }`}
                          onClick={() => setActiveDropdown(null)}
                        >
                          {dropLink.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Right Icons & CTA */}
      <div className="ml-auto flex items-center gap-4">
        <button className="hidden lg:flex items-center justify-center h-10 w-10 rounded-full border border-white hover:bg-white/10 transition-colors relative" aria-label="Favoritos" onClick={onOpenFavorites}>
          <Heart className="h-5 w-5 text-white" />
          {totalFavorites > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {totalFavorites}
            </span>
          )}
        </button>
        {user ? (
          <div className="hidden lg:flex items-center gap-2 group relative">
            <button 
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 transition-all cursor-pointer"
              title={user.nombre}
            >
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                {profileImageSrc ? (
                  <img src={profileImageSrc} alt={user.nombre} className="h-full w-full object-cover" />
                ) : (
                  user.nombre.charAt(0)
                )}
              </div>
              <span className="text-xs font-bold text-zinc-300 max-w-[100px] truncate">{user.nombre.split(' ')[0]}</span>
            </button>
            
            {/* User Dropdown */}
            <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
               <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden min-w-[200px]">
                  <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Conectado como</p>
                    <p className="text-sm font-bold text-white truncate">{user.nombre}</p>
                  </div>
                  <Link
                    to="/perfil"
                    {...getPreloadProps("/perfil")}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Ver Mi Perfil
                  </Link>
                  <Link
                    to="/perfil"
                    {...getPreloadProps("/perfil")}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 border-b border-zinc-800/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    Mis Pedidos
                  </Link>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar Sesión
                  </button>
               </div>
            </div>
          </div>
        ) : (
          <button 
            className="hidden md:flex items-center justify-center h-10 w-10 rounded-full border border-white hover:bg-zinc-800 transition-colors cursor-pointer"
            onClick={onOpenAuthModal}
            title="Mi Cuenta"
          >
            <User className="h-5 w-5 text-white" />
          </button>
        )}
        
        <Link 
          to="/menu" 
          {...getPreloadProps("/menu")}
          className="hidden lg:flex bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold text-sm tracking-wide items-center transition-colors"
        >
          PIDE AHORA
        </Link>
        
        <button 
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white hover:bg-zinc-200 transition-colors relative cursor-pointer"
          onClick={onOpenCart}
          aria-label={`Carrito de compras, ${totalItems} artículos`}
        >
          <ShoppingCart className="h-5 w-5 text-black" fill="currentColor" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-lg">
              {totalItems}
            </span>
          )}
        </button>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden flex items-center justify-center h-10 w-10 text-white cursor-pointer"
          onClick={toggleMobileMenu}
          aria-label="Menú principal"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div 
          className="absolute top-full left-0 w-full bg-black border-t border-zinc-800 flex flex-col lg:hidden shadow-2xl"
          style={{ 
            maxHeight: 'calc(100dvh - 72px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-4 px-3 py-2 sm:p-4 md:p-6">
            {navLinks.map((link) => {
              const dropdownItems = link.dropdown ?? [];
              const hasDropdown = dropdownItems.length > 0;
              return (
                <div key={link.name} className="flex flex-col">
                   <Link
                    to={link.path}
                    {...getPreloadProps(link.path)}
                    className={`py-3 px-3 sm:py-4 sm:px-4 font-bold border-b border-zinc-900 transition-colors text-sm sm:text-base ${
                      isActive(link.path) || (hasDropdown && pathname.startsWith(link.path))
                        ? "text-primary hover:bg-zinc-900/80" 
                        : "text-white hover:bg-zinc-900"
                    }`}
                    onClick={() => !hasDropdown && closeMobileMenu()}
                  >
                    {link.name}
                  </Link>
                  {hasDropdown && (
                    <div className="flex flex-col bg-zinc-900/30 pl-5 sm:pl-6 border-b border-zinc-900 overflow-hidden">
                      {dropdownItems.map(dropLink => {
                        const isDropActive = pathname === dropLink.path;
                        return (
                          <Link
                            key={dropLink.name}
                            to={dropLink.path}
                            {...getPreloadProps(dropLink.path)}
                            className={`py-2.5 px-3 sm:py-3 sm:px-4 text-sm font-semibold transition-colors ${
                              isDropActive 
                                ? "text-primary border-l-4 border-primary bg-zinc-900/50" 
                                : "text-zinc-300 hover:text-white border-l-4 border-transparent"
                            }`}
                            onClick={closeMobileMenu}
                          >
                            {dropLink.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acciones y CTA */}
          <div className="flex-shrink-0 border-t border-zinc-800 px-3 py-2 sm:p-4 md:px-6">
            <div className="flex gap-4 justify-center mb-2 sm:mb-3">
              <button className="relative p-2 cursor-pointer" aria-label="Favoritos" onClick={() => { closeMobileMenu(); onOpenFavorites(); }}>
                <Heart className="h-6 w-6 text-white" />
                {totalFavorites > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {totalFavorites}
                  </span>
                )}
              </button>
              <button className="p-2 cursor-pointer" aria-label="Mi cuenta" onClick={() => { closeMobileMenu(); onOpenAuthModal(); }}>
                <User className="h-6 w-6 text-white" />
              </button>
            </div>
            <Link 
              to="/menu" 
              {...getPreloadProps("/menu")}
              onClick={closeMobileMenu}
              className="bg-primary text-white px-4 py-2.5 sm:py-3 text-center font-bold tracking-wide rounded block text-sm sm:text-base md:max-w-xs md:mx-auto"
            >
              PIDE AHORA
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
