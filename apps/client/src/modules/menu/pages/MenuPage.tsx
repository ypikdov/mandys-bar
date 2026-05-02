import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, FileText, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta, Product } from "@mandys/shared";
import { MenuItemCard } from "@/modules/menu/components/MenuItemCard";
import { Button } from "@mandys/ui";
import {
  getCachedProductsPageSnapshot,
  getProductsPage,
  getStaticProductsPageFallback,
  type ProductSortParam,
} from "@/services/api/productService";
import { useFavorites } from "@/providers/FavoritesContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const CatalogModal = lazy(() =>
  import("@/modules/menu/components/CatalogModal").then((module) => ({ default: module.CatalogModal })),
);

type SortOption =
  | "Destacados"
  | "A-Z"
  | "Z-A"
  | "Precio: bajo a alto"
  | "Precio: alto a bajo"
  | "Fecha: antiguo a nuevo"
  | "Fecha: nuevo a antiguo";

const ITEMS_PER_PAGE = 10;

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: ITEMS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const SORT_PARAM_BY_LABEL: Record<SortOption, ProductSortParam> = {
  Destacados: "featured",
  "A-Z": "name_asc",
  "Z-A": "name_desc",
  "Precio: bajo a alto": "price_asc",
  "Precio: alto a bajo": "price_desc",
  "Fecha: antiguo a nuevo": "oldest",
  "Fecha: nuevo a antiguo": "newest",
};

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

const getProductsSignature = (items: Product[]) =>
  items
    .map((item) => `${item.id}:${item.nombre}:${item.precio_con_iva}:${item.categoria}:${item.imagen_url ?? ""}`)
    .join("|");

const resolveImageUrl = (path?: string | null) => {
  if (!path) return "/images/menu/Surtida Mandy_s.webp";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const resolveMenuCardImageUrl = (path?: string | null) => {
  const imageUrl = resolveImageUrl(path);
  if (
    imageUrl.startsWith("/images/menu/") &&
    imageUrl.toLowerCase().endsWith(".webp") &&
    !imageUrl.toLowerCase().endsWith("_thumb.webp")
  ) {
    return imageUrl.replace(/\.webp$/i, "_thumb.webp");
  }

  return imageUrl;
};

export const Menu = () => {
  const { isFavorite } = useFavorites();
  const initialProductPage = useMemo(
    () =>
      getCachedProductsPageSnapshot({
        page: 1,
        limit: ITEMS_PER_PAGE,
        sort: SORT_PARAM_BY_LABEL.Destacados,
      }) ??
      getStaticProductsPageFallback({
        page: 1,
        limit: ITEMS_PER_PAGE,
        sort: SORT_PARAM_BY_LABEL.Destacados,
      }),
    [],
  );
  const [products, setProducts] = useState<Product[]>(initialProductPage.items);
  const productsSignatureRef = useRef(getProductsSignature(initialProductPage.items));
  const [categories, setCategories] = useState<string[]>(initialProductPage.categories);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Destacados");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(initialProductPage.pagination ?? DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const hasMountedPageRef = useRef(false);
  const shouldScrollAfterProductsRef = useRef(false);

  const scrollToResultsTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      const top = resultsTopRef.current?.getBoundingClientRect().top ?? 0;
      const target = Math.max(0, window.scrollY + top - 112);
      window.scrollTo({ top: target, behavior: "auto" });
    });
  }, []);

  const applyProductPage = (data: { items: Product[]; categories: string[]; pagination: PaginationMeta }) => {
    const nextSignature = getProductsSignature(data.items);
    if (nextSignature !== productsSignatureRef.current) {
      productsSignatureRef.current = nextSignature;
      setProducts(data.items);
    }
    setCategories(data.categories);
    setPagination(data.pagination);
    if (shouldScrollAfterProductsRef.current) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToResultsTop();
          shouldScrollAfterProductsRef.current = false;
        });
      });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    if (!hasMountedPageRef.current) {
      hasMountedPageRef.current = true;
      return;
    }

    scrollToResultsTop();
  }, [currentPage, scrollToResultsTop]);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      const requestOptions = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        category: activeCategory,
        q: debouncedSearchQuery,
        sort: SORT_PARAM_BY_LABEL[sortBy],
      };
      const cachedPage = getCachedProductsPageSnapshot(requestOptions);
      if (cachedPage) {
        applyProductPage(cachedPage);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getProductsPage(requestOptions);
        if (isMounted) {
          applyProductPage(data);
        }
      } catch (error) {
        console.error("Error fetching public products:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, [activeCategory, currentPage, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    if (!loading && pagination.totalPages > 0 && currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [currentPage, loading, pagination.totalPages]);

  const visibleProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const favoriteDelta = Number(isFavorite(b.id)) - Number(isFavorite(a.id));
        return favoriteDelta !== 0 ? favoriteDelta : 0;
      }),
    [isFavorite, products],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      shouldScrollAfterProductsRef.current = true;
      setCurrentPage(page);
      scrollToResultsTop();
    },
    [scrollToResultsTop],
  );

  return (
    <div className="bg-[#fdfbf7] min-h-screen py-12">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-10 uppercase text-black">Nuestro Menú</h1>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 max-w-4xl mx-auto">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Buscar platillo..."
              className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-zinc-200 bg-white focus:outline-none focus:border-primary transition-all text-black"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search className="absolute text-zinc-400 left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <Button
              variant="outline"
              className="rounded-full py-7 px-8 border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold transition-all uppercase tracking-wide flex items-center gap-2 flex-1 md:flex-none"
              onClick={() => setIsCatalogOpen(true)}
            >
              <FileText className="w-5 h-5" />
              Catálogo
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 w-full sm:w-1/2 md:w-auto flex-1">
            <span className="hidden md:inline-block text-sm font-bold text-zinc-500 uppercase whitespace-nowrap">Ver:</span>
            <div className="relative w-full group">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-zinc-200 rounded-xl px-5 py-3 pr-12 text-black font-semibold focus:outline-none focus:border-primary cursor-pointer hover:border-zinc-300 transition-colors"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category === "Todos" ? "Todas las categorías" : category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-primary transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-1/2 md:w-auto flex-1">
            <span className="hidden md:inline-block text-sm font-bold text-zinc-500 uppercase whitespace-nowrap">Ordenar por:</span>
            <div className="relative w-full group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full appearance-none bg-white border-2 border-zinc-200 rounded-xl px-5 py-3 pr-12 text-black font-semibold focus:outline-none focus:border-primary cursor-pointer hover:border-zinc-300 transition-colors"
              >
                <option value="Destacados">Destacados</option>
                <option value="A-Z">Alfabéticamente (A-Z)</option>
                <option value="Z-A">Alfabéticamente (Z-A)</option>
                <option value="Precio: bajo a alto">Precio: bajo a alto</option>
                <option value="Precio: alto a bajo">Precio: alto a bajo</option>
                <option value="Fecha: antiguo a nuevo">Fecha: antiguo a nuevo</option>
                <option value="Fecha: nuevo a antiguo">Fecha: nuevo a antiguo</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>

        <div ref={resultsTopRef} className="scroll-mt-28" data-menu-results-top="true">
          {loading && visibleProducts.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20">
              <p className="text-xl">Cargando menú...</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-150 ${loading ? "opacity-80" : "opacity-100"}`}>
              {visibleProducts.map((item, index) => (
                <div key={item.id}>
                  <MenuItemCard
                    priority={index < 4}
                    product={{
                    id: item.id,
                    name: item.nombre,
                    description: item.descripcion || "Consulta detalles en nuestro local o por WhatsApp.",
                    price: item.precio_con_iva,
                    categoryId: item.categoria,
                    image: resolveMenuCardImageUrl(item.imagen_url),
                  }}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && visibleProducts.length === 0 && (
            <div className="text-center text-zinc-500 mt-20">
              <p className="text-xl">No se encontraron productos con estos criterios.</p>
            </div>
          )}
        </div>

        {!loading && visibleProducts.length > 0 && (
          <PublicPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {isCatalogOpen ? (
          <Suspense fallback={null}>
            <CatalogModal isOpen={isCatalogOpen} onOpenChange={setIsCatalogOpen} />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
};

interface PublicPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PublicPagination = ({ currentPage, totalPages, onPageChange }: PublicPaginationProps) => {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginacion del menu">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
        aria-label="Pagina anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {visiblePages.map((page, index) => {
        const previous = visiblePages[index - 1];
        const showGap = previous !== undefined && page - previous > 1;

        return (
          <span key={page} className="inline-flex items-center gap-2">
            {showGap && <span className="px-1 text-sm font-black text-zinc-400" aria-hidden="true">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-11 min-w-11 rounded-full px-4 text-sm font-black transition ${
                page === currentPage
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:text-primary"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
        aria-label="Pagina siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};
