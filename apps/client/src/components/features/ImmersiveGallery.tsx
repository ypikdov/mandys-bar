import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface GalleryImage {
  src: string;
  category: "comida" | "bebida" | "lugar" | "eventos";
  alt: string;
  rotation?: number;
  aspect?: "portrait" | "landscape";
  objectPosition?: string;
}

type GalleryFilter = "todos" | GalleryImage["category"];

interface ImmersiveGalleryProps {
  images: GalleryImage[];
  activeFilter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
  onImageClick: (index: number) => void;
}

const cascadeOffsets = [0, 0, 0, 0];

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

const resolveObjectFocusOrigin = (value?: string) => {
  const normalized = normalizeObjectPosition(value);
  if (normalized === "center top") return "50% 0%";
  if (normalized === "center bottom") return "50% 100%";
  if (normalized === "left center") return "0% 50%";
  if (normalized === "right center") return "100% 50%";
  return "50% 50%";
};

const resolveObjectScaleClass = (value?: string) => {
  const normalized = normalizeObjectPosition(value);
  if (normalized === "center top" || normalized === "center bottom") return "scale-[1.03] group-hover:scale-[1.07]";
  if (normalized === "left center" || normalized === "right center") return "scale-[1.02] group-hover:scale-[1.06]";
  return "scale-100 group-hover:scale-[1.04]";
};

const getDisplayCategory = (category: GalleryImage["category"]) => {
  if (category === "comida") return "Comida";
  if (category === "bebida") return "Bebida";
  if (category === "eventos") return "Evento";
  return "Lugar";
};

const GalleryItem = ({
  image,
  index,
  onImageClick,
}: {
  image: GalleryImage;
  index: number;
  onImageClick: () => void;
}) => {
  const cascadeOffset = cascadeOffsets[index % cascadeOffsets.length];
  const imageScaleClassName = resolveObjectScaleClass(image.objectPosition);

  return (
    <motion.button
      type="button"
      initial={false}
      animate={{ opacity: 1, y: cascadeOffset }}
      transition={{
        duration: 0.16,
        ease: "easeOut",
      }}
      className="group relative block h-full w-full cursor-pointer text-left"
      onClick={onImageClick}
      data-gallery-item="true"
      data-gallery-category={image.category}
      aria-label={`Abrir ${image.alt}`}
    >
      <div className="relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-[2rem] border border-white/18 bg-[#080808] shadow-[0_26px_64px_rgba(0,0,0,0.38)] transition-all duration-300 group-hover:-translate-y-2 group-hover:border-white/32 group-hover:shadow-[0_38px_92px_rgba(0,0,0,0.46)] md:min-h-[640px]">
        <div className="relative h-[360px] shrink-0 overflow-hidden bg-zinc-950 md:h-[450px]">
          <div
            className={`h-full w-full transition-transform duration-500 ease-out ${imageScaleClassName}`}
            style={{ transformOrigin: resolveObjectFocusOrigin(image.objectPosition) }}
          >
            <img
              src={image.src}
              alt={image.alt}
              data-gallery-image="true"
              fetchPriority={index < 6 ? "high" : "auto"}
              loading={index < 6 ? "eager" : "lazy"}
              decoding="async"
              style={{
                objectPosition: normalizeObjectPosition(image.objectPosition),
                transform: image.rotation ? `rotate(${image.rotation}deg)` : undefined,
              }}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/75 bg-black/38 px-4 py-2 text-[12px] font-black uppercase tracking-[0.06em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-md">
            {getDisplayCategory(image.category)}
          </div>
          <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/75 bg-black/38 px-4 py-2 text-[12px] font-black uppercase tracking-[0.06em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-md">
            <span className="inline-flex h-4 w-4 items-center justify-center">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </span>
            Abrir
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between border-t border-white/8 bg-gradient-to-b from-[#0d0d0d] to-[#090909] px-6 py-6 md:px-7">
          <div>
            <h3 className="line-clamp-2 min-h-[3.25rem] text-[1.24rem] font-black leading-tight text-white md:text-[1.32rem]">
              {image.alt}
            </h3>
            <div className="mt-10 h-[2px] w-16 overflow-hidden rounded-full">
              <div className="h-full w-full origin-left bg-primary transition-transform duration-300 group-hover:scale-x-[1.45]" />
            </div>
          </div>
          <p className="pt-7 text-[11px] font-black uppercase tracking-[0.32em] text-white/58">
            Ver en detalle
          </p>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-white/6" />
      </div>
    </motion.button>
  );
};

export const ImmersiveGallery = ({ images, activeFilter, onFilterChange, onImageClick }: ImmersiveGalleryProps) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      images.slice(0, 8).forEach((image) => {
        const preload = new Image();
        preload.decoding = "async";
        preload.src = image.src;
      });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [images]);

  const filterLabels: Record<GalleryFilter, string> = {
    todos: "Todo",
    comida: "Comidas",
    bebida: "Bebidas",
    lugar: "Lugares",
    eventos: "Eventos",
  };

  return (
    <div className="relative px-4 pb-14 pt-4 md:px-8 md:pb-16 md:pt-5" data-gallery-layout="true">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent" />

      <div className="relative z-10 mb-6 flex justify-center overflow-x-auto px-1 [scrollbar-width:none]">
        <div className="inline-flex min-w-max items-center gap-1.5 rounded-full border border-zinc-200 bg-white p-2 shadow-[0_18px_44px_rgba(0,0,0,0.28)] md:gap-2" data-gallery-filter-bar="true">
          {Object.entries(filterLabels).map(([cat, label]) => {
            const filterKey = cat as GalleryFilter;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterChange(filterKey)}
                aria-pressed={activeFilter === filterKey}
                data-gallery-filter={cat}
                className={`relative overflow-hidden rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition-all md:min-w-[112px] md:px-5 md:text-[15px] ${
                  activeFilter === filterKey ? "bg-primary text-white shadow-[0_12px_28px_rgba(197,112,54,0.28)]" : "text-black hover:bg-zinc-100"
                }`}
              >
                <span className="relative z-10">{label}</span>
                {activeFilter === filterKey && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.14, duration: 0.24 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-[1636px] pb-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {images.map((image, index) => (
              <GalleryItem
                key={`${image.src}-${index}`}
                image={image}
                index={index}
                onImageClick={() => onImageClick(index)}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex min-h-[340px] max-w-3xl items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/55">
              No hay imagenes para esta categoria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
