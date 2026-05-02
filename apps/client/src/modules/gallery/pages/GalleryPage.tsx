import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryContentItem, PaginationMeta } from "@mandys/shared";
import { ImmersiveGallery } from "@/components/features/ImmersiveGallery";
import { fallbackGalleryItems } from "@/data/gallery";
import { useSiteContent } from "@/modules/site-content/providers/SiteContentProvider";

type GalleryCategory = "comida" | "bebida" | "lugar" | "eventos";
type GalleryFilter = "todos" | GalleryCategory;

const ITEMS_PER_PAGE = 8;

const buildGalleryPagination = (totalItems: number, page: number): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    limit: ITEMS_PER_PAGE,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
};

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

interface GalleryImage {
  src: string;
  category: GalleryCategory;
  alt: string;
  rotation?: number;
  aspect?: "portrait" | "landscape";
  objectPosition?: string;
}

const resolveImageUrl = (path?: string | null) => {
  if (!path) return "/images/paisajes/slide1_mandy_sign.webp";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const normalizeCategory = (category?: string, title = ""): GalleryCategory => {
  const looksLikeEvent = /\b(evento|eventos|concierto|escenario|gala|celebraci[o\u00f3]n|cumplea[n\u00f1]os|xv)\b/i.test(title);

  if (category === "lugar" && looksLikeEvent) {
    return "eventos";
  }

  if (category === "comida" || category === "bebida" || category === "lugar" || category === "eventos") {
    return category;
  }
  return "lugar";
};

const normalizeObjectPosition = (value?: string) => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, " ");
  switch (normalized) {
    case "top":
    case "arriba":
    case "top center":
    case "arriba centro":
      return "center top";
    case "bottom":
    case "abajo":
    case "bottom center":
    case "abajo centro":
      return "center bottom";
    case "left":
    case "izquierda":
      return "left center";
    case "right":
    case "derecha":
      return "right center";
    case "center":
    case "centro":
    default:
      return "center center";
  }
};

const sortGalleryItems = (items: GalleryContentItem[]) =>
  [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

const hasUsableImage = (item: GalleryContentItem) => Boolean(item.image_url?.trim());

const getPublishedGalleryItems = (items: GalleryContentItem[]) =>
  sortGalleryItems(items.filter((item) => item.active !== false && hasUsableImage(item)));

export const Gallery = () => {
  const { content } = useSiteContent();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("todos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryTopRef = useRef<HTMLDivElement>(null);

  const sourceGalleryItems = useMemo(
    () => getPublishedGalleryItems(content?.galleryItems ?? fallbackGalleryItems),
    [content?.galleryItems],
  );

  const allGalleryImages = useMemo<GalleryImage[]>(
    () =>
      sourceGalleryItems.map((item) => ({
        src: resolveImageUrl(item.image_url),
        category: normalizeCategory(item.category, `${item.title} ${item.alt_text ?? ""}`),
        alt: item.alt_text || item.title,
        rotation: item.rotation ?? 0,
        aspect: item.aspect === "portrait" ? "portrait" : "landscape",
        objectPosition: item.object_position ?? "center",
      })),
    [sourceGalleryItems],
  );

  const filteredGalleryImages = useMemo(
    () => (activeFilter === "todos" ? allGalleryImages : allGalleryImages.filter((image) => image.category === activeFilter)),
    [activeFilter, allGalleryImages],
  );

  const pagination = useMemo(
    () => buildGalleryPagination(filteredGalleryImages.length, currentPage),
    [currentPage, filteredGalleryImages.length],
  );

  const paginatedGalleryImages = useMemo(() => {
    const start = (pagination.page - 1) * ITEMS_PER_PAGE;
    return filteredGalleryImages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGalleryImages, pagination.page]);

  const scrollToGalleryTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      galleryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleFilterChange = useCallback(
    (filter: GalleryFilter) => {
      setActiveFilter(filter);
      setCurrentPage(1);
      setLightboxIndex(null);
      scrollToGalleryTop();
    },
    [scrollToGalleryTop],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      setLightboxIndex(null);
      scrollToGalleryTop();
    },
    [scrollToGalleryTop],
  );

  useEffect(() => {
    if (pagination.page !== currentPage) {
      setCurrentPage(pagination.page);
    }
  }, [currentPage, pagination.page]);

  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= paginatedGalleryImages.length) {
      setLightboxIndex(null);
    }
  }, [lightboxIndex, paginatedGalleryImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || paginatedGalleryImages.length === 0) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((current) => (current === null ? null : (current + 1) % paginatedGalleryImages.length));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((current) => (current === null ? null : (current - 1 + paginatedGalleryImages.length) % paginatedGalleryImages.length));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, paginatedGalleryImages.length]);

  const currentImage = lightboxIndex !== null ? paginatedGalleryImages[lightboxIndex] : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080808] text-white selection:bg-primary selection:text-white">
      <div ref={galleryTopRef} className="scroll-mt-24">
        <ImmersiveGallery
          images={paginatedGalleryImages}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onImageClick={(index) => setLightboxIndex(index)}
        />
      </div>

      <PublicPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      <AnimatePresence>
        {currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-hidden bg-[#030405]/96 px-4 py-5 text-white backdrop-blur-xl md:px-8 md:py-8"
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={currentImage.alt}
            data-gallery-lightbox="true"
          >
            <img
              src={currentImage.src}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl"
              style={{ objectPosition: normalizeObjectPosition(currentImage.objectPosition) }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),rgba(0,0,0,0.78)_58%,rgba(0,0,0,0.96)_100%)]" />

            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-4 top-4 z-[120] inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-white/16 hover:text-white md:right-10 md:top-10 md:h-20 md:w-20"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              aria-label="Cerrar imagen"
            >
              <X className="h-7 w-7 md:h-9 md:w-9" />
            </motion.button>

            <button
              type="button"
              className="absolute left-4 top-1/2 z-[120] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-white/16 hover:text-white md:left-8 md:h-16 md:w-16 xl:left-[7.5vw]"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((current) => (current === null ? null : (current - 1 + paginatedGalleryImages.length) % paginatedGalleryImages.length));
              }}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-8 w-8 md:h-10 md:w-10" />
            </button>

            <motion.div
              layoutId={`img-${currentImage.src}`}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative z-[110] flex max-h-[calc(100dvh-2.5rem)] w-full max-w-[1288px] flex-col rounded-[2.2rem] border border-white/30 bg-[#080a0d]/88 px-5 pb-6 pt-5 shadow-[0_42px_120px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:rounded-[3rem] md:max-h-[calc(100dvh-4rem)] md:px-10 md:pb-8 md:pt-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative min-h-0 w-full overflow-hidden rounded-[1.7rem] border border-white/28 bg-black/70 sm:rounded-[2rem]">
                <div className="relative flex h-[52dvh] max-h-[530px] min-h-[250px] w-full items-center justify-center bg-black/70 md:h-[58dvh]">
                  <img
                    src={currentImage.src}
                    alt={currentImage.alt}
                    decoding="async"
                    style={{
                      transform: currentImage.rotation ? `rotate(${currentImage.rotation}deg)` : undefined,
                      objectPosition: normalizeObjectPosition(currentImage.objectPosition),
                    }}
                    className="h-full max-h-full w-full max-w-full object-contain"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.2, ease: "easeOut" }}
                className="mx-auto mt-6 flex max-w-4xl shrink-0 flex-col items-center text-center md:mt-8"
              >
                <span className="mb-4 inline-flex rounded-full bg-primary px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white shadow-[0_12px_32px_rgba(197,112,54,0.25)]">
                  {currentImage.category}
                </span>
                <h2 className="text-balance text-3xl font-black leading-tight text-white md:text-5xl">
                  {currentImage.alt}
                </h2>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/35 md:text-sm">
                  Imagen {(lightboxIndex ?? 0) + 1} de {paginatedGalleryImages.length}
                </p>
              </motion.div>
            </motion.div>

            <button
              type="button"
              className="absolute right-4 top-1/2 z-[120] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-white/16 hover:text-white md:right-8 md:h-16 md:w-16 xl:right-[7.5vw]"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((current) => (current === null ? null : (current + 1) % paginatedGalleryImages.length));
              }}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-8 w-8 md:h-10 md:w-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
    <nav className="mt-12 flex items-center justify-center gap-2 px-6" aria-label="Paginacion de galeria">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Pagina anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {visiblePages.map((page, index) => {
        const previous = visiblePages[index - 1];
        const showGap = previous !== undefined && page - previous > 1;

        return (
          <span key={page} className="inline-flex items-center gap-2">
            {showGap && <span className="px-1 text-sm font-black text-white/35" aria-hidden="true">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-11 min-w-11 rounded-full px-4 text-sm font-black transition ${
                page === currentPage
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "border border-white/10 bg-white/5 text-white/70 hover:border-primary hover:text-white"
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
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Pagina siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};
