import { SectionCard } from '@mandys/ui';
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Globe,
  GripVertical,
  Image as ImageIcon,
  MapPinned,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type DragEvent as ReactDragEvent } from 'react';
import type {
  PublicSiteContent,
  SiteEvent,
  SiteFaqCategory,
  SiteTeamMember,
  GalleryContentItem,
} from '@mandys/shared';
import { useAuth } from '@/providers/AuthContext';
import { uploadImage } from '@/shared/api/uploadService';
import { getAdminSiteContent, saveAdminSiteContent } from '../services/siteContentService';
import {
  AboutEditorModal,
  ContactEditorModal,
  EventsPageEditorModal,
  FaqCategoryEditorModal,
  GalleryItemEditorModal,
  GalleryPageEditorModal,
  SiteEventEditorModal,
  TeamMemberEditorModal,
} from './ContentManagerModals';

interface SiteContentTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type SidebarSection = 'general' | 'contact' | 'events' | 'gallery' | 'faq';

type ModalState =
  | { type: 'about' }
  | { type: 'team'; index: number }
  | { type: 'contact' }
  | { type: 'eventsPage' }
  | { type: 'event'; kind: 'PUBLIC_PROGRAM' | 'PRIVATE_TEMPLATE'; index: number }
  | { type: 'galleryPage' }
  | { type: 'galleryItem'; index: number }
  | { type: 'faq'; index: number }
  | null;

const sidebarButtonClassName =
  'flex w-full items-start gap-3 rounded-[24px] border px-4 py-4 text-left transition';
const smallButtonClassName =
  'inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClassName =
  'inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';

const resolveImageUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value}`;
};

const normalizeObjectPosition = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, ' ');
  switch (normalized) {
    case 'top':
    case 'arriba':
    case 'top center':
    case 'arriba centro':
      return 'center top';
    case 'bottom':
    case 'abajo':
    case 'bottom center':
    case 'abajo centro':
      return 'center bottom';
    case 'left':
    case 'izquierda':
      return 'left center';
    case 'right':
    case 'derecha':
      return 'right center';
    case 'center':
    case 'centro':
    default:
      return 'center center';
  }
};

const normalizeObjectPositionValue = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, ' ');
  switch (normalized) {
    case 'top':
    case 'arriba':
    case 'top center':
    case 'arriba centro':
      return 'top';
    case 'bottom':
    case 'abajo':
    case 'bottom center':
    case 'abajo centro':
      return 'bottom';
    case 'left':
    case 'izquierda':
      return 'left';
    case 'right':
    case 'derecha':
      return 'right';
    case 'center':
    case 'centro':
    default:
      return 'center';
  }
};

const resolveObjectFocusOrigin = (value?: string | null) => {
  const normalized = normalizeObjectPosition(value);
  if (normalized === 'center top') return '50% 0%';
  if (normalized === 'center bottom') return '50% 100%';
  if (normalized === 'left center') return '0% 50%';
  if (normalized === 'right center') return '100% 50%';
  return '50% 50%';
};

const resolveObjectScaleClass = (value?: string | null) => {
  const normalized = normalizeObjectPosition(value);
  if (normalized === 'center center') {
    return 'scale-[1.08] group-hover:scale-[1.12]';
  }
  if (normalized === 'center top' || normalized === 'center bottom') {
    return 'scale-[1.34] group-hover:scale-[1.38]';
  }
  return 'scale-[1.2] group-hover:scale-[1.24]';
};

const galleryCategoryLabelMap: Record<string, string> = {
  comida: 'Comida',
  bebida: 'Bebida',
  lugar: 'Lugar',
  eventos: 'Eventos',
};

const decodeAdminMojibake = (value: string) => {
  if (!/[\u00C3\u00C2]/.test(value)) return value;
  try {
    const decoded = decodeURIComponent(escape(value));
    return decoded.includes('\uFFFD') ? value : decoded;
  } catch {
    return value;
  }
};

const cleanAdminUiText = (value: string) =>
  decodeAdminMojibake(value)
    .replace(/\uFFFD/g, '')
    .replace(/\bTtulo\b/gi, 'Título')
    .replace(/\bDescripcion\b/gi, 'Descripción')
    .replace(/\bCategoria\b/gi, 'Categoría')
    .replace(/\bGaleria\b/gi, 'Galería')
    .replace(/\bCafe\b/gi, 'Café')
    .replace(/^\s*[?¿]+\s*(?=(MANDY'S|Redes)\b)/gi, '')
    .replace(/^\s*[?¿]+\s*Creo\b/gi, '')
    .replace(/^\s*[?¿¡!]*\s*Creo[:\-\s]*/gi, '')
    .replace(/\bTe esperanza\b/gi, 'Te esperamos')
    .replace(/\bTelefono\b/gi, 'Teléfono')
    .replace(/\bEvento publico\b/gi, 'Evento público')
    .replace(/\bEvento privado\b/gi, 'Evento privado')
    .replace(/\bTitulos galeria\b/gi, 'Título galería')
    .replace(/\bTitulo galeria\b/gi, 'Título galería')
    .replace(/\bGaleria\b/gi, 'Galería')
    .replace(/\bCategorias\b/gi, 'Categorías')
    .replace(/\bpagina\b/gi, 'página')
    .replace(/\bdireccion\b/gi, 'dirección')
    .replace(/\bprogramacion\b/gi, 'programación')
    .replace(/\bde\s+de\b/gi, 'de')
    .replace(/\u00C2·/g, '·')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\bImagen\s+(\d+)\s*\/{2,}\s*(\d+)\b/gi, 'Imagen $1/$2')
    .trim();

const sanitizeAdminTree = <T,>(value: T): T => {
  if (typeof value === 'string') return cleanAdminUiText(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeAdminTree(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeAdminTree(entry)]),
    ) as T;
  }
  return value;
};

const serializeContentSnapshot = (content: PublicSiteContent | null) =>
  content ? JSON.stringify(normalizeContentForSave(sanitizeAdminTree(content))) : '';

const createLocalId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();

const replaceAt = <T,>(items: T[], index: number, nextItem: T) =>
  items.map((item, currentIndex) => (currentIndex === index ? nextItem : item));

const removeAt = <T,>(items: T[], index: number) => items.filter((_, currentIndex) => currentIndex !== index);

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const createTeamMember = (): SiteTeamMember => ({
  id: createLocalId('team-member'),
  name: 'Nuevo integrante',
  role: 'ROL',
  image: '/images/logo mandys.jpg',
  description: 'Describe brevemente a esta persona.',
});

const createFaqCategory = (): SiteFaqCategory => ({
  title: 'Nueva categoría',
  items: [{ question: 'Nueva pregunta', answer: 'Nueva respuesta' }],
});

const createSiteEvent = (kind: SiteEvent['kind']): SiteEvent => ({
  id: createLocalId(kind === 'PUBLIC_PROGRAM' ? 'public-event' : 'private-event'),
  slug: kind === 'PUBLIC_PROGRAM' ? 'nuevo-evento' : 'nuevo-paquete',
  kind,
  title: kind === 'PUBLIC_PROGRAM' ? 'Nuevo evento' : 'Nuevo paquete',
  subtitle: '',
  description: '',
  day_label: '',
  display_date: '',
  start_time: '',
  image_url: '',
  price: kind === 'PRIVATE_TEMPLATE' ? 30000 : null,
  order_index: 0,
  active: true,
});

const createGalleryItem = (): GalleryContentItem => ({
  id: createLocalId('gallery-item'),
  title: 'Nueva imagen',
  alt_text: 'Nueva imagen',
  category: 'lugar',
  image_url: '',
  rotation: 0,
  aspect: 'landscape',
  object_position: 'center',
  order_index: 0,
  active: true,
});

const normalizeContentForSave = (content: PublicSiteContent): PublicSiteContent => ({
  ...content,
  navbarLinks: content.navbarLinks.map((link) => ({
    ...link,
    label: link.label.trim(),
    dropdown: (link.dropdown ?? []).map((item) => ({
      ...item,
      label: item.label.trim(),
    })),
  })),
  teamMembers: content.teamMembers.map((member) => ({
    ...member,
    name: member.name.trim(),
    role: member.role.trim(),
    image: member.image.trim(),
    description: member.description.trim(),
  })),
  faqCategories: content.faqCategories.map((category) => ({
    ...category,
    title: category.title.trim(),
    items: category.items.map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    })),
  })),
  publicEvents: content.publicEvents.map((item, index) => ({
    ...item,
    slug: item.slug.trim() || slugify(item.title),
    order_index: index,
  })),
  privateEventTemplates: content.privateEventTemplates.map((item, index) => ({
    ...item,
    slug: item.slug.trim() || slugify(item.title),
    order_index: index,
  })),
  galleryItems: content.galleryItems.map((item, index) => ({
    ...item,
    object_position: normalizeObjectPositionValue(item.object_position),
    order_index: index,
  })),
});

type SortableCollectionKey = 'publicEvents' | 'privateEventTemplates' | 'galleryItems';

type DragState = {
  collection: SortableCollectionKey;
  index: number;
} | null;

const SidebarButton = ({
  active,
  collapsed,
  label,
  description,
  count,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  collapsed: boolean;
  label: string;
  description: string;
  count: number;
  icon: typeof Globe;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`${sidebarButtonClassName} ${collapsed ? 'justify-center px-3 py-3' : ''} ${
      active
        ? 'border-primary bg-primary/10 text-black shadow-[0_18px_45px_rgba(245,141,66,0.18)]'
        : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary/30 hover:bg-zinc-50'
    }`}
  >
    <span className={`rounded-2xl p-2 ${active ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-500'}`}>
      <Icon className="h-4 w-4" />
    </span>
    {collapsed ? null : (
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-black uppercase tracking-[0.16em]">{label}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${active ? 'bg-white text-primary' : 'bg-zinc-100 text-zinc-500'}`}>
            {count}
          </span>
        </span>
        <span className="mt-1 block text-sm font-medium text-zinc-500">{description}</span>
      </span>
    )}
  </button>
);

const SummaryCard = ({
  title,
  subtitle,
  badge,
  image,
  objectPosition,
  onEdit,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragging = false,
  dragTarget = false,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  image?: string;
  objectPosition?: string;
  onEdit: () => void;
  draggable?: boolean;
  onDragStart?: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  dragTarget?: boolean;
}) => {
  const safeTitle = cleanAdminUiText(title);
  const safeSubtitle = cleanAdminUiText(subtitle);
  const safeBadge = badge ? cleanAdminUiText(badge) : '';
  const imageScaleClassName = resolveObjectScaleClass(objectPosition);

  return (
    <button
      type="button"
      onClick={onEdit}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      translate="no"
      className={`group flex flex-col overflow-hidden rounded-[28px] border bg-white text-left shadow-[0_18px_42px_rgba(15,23,42,0.08)] transition ${
        dragging
          ? 'scale-[0.985] opacity-60'
          : dragTarget
            ? 'border-primary ring-2 ring-primary/15'
            : 'border-zinc-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_24px_54px_rgba(15,23,42,0.1)]'
      }`}
      style={{
        width: '234.2px',
        minWidth: '234.2px',
        maxWidth: '234.2px',
        height: '234.3px',
      }}
    >
      {image ? (
        <div className="relative h-[112px] overflow-hidden bg-zinc-100">
          <img
            src={resolveImageUrl(image)}
            alt={safeTitle}
            className={`h-full w-full object-cover transition duration-500 ${imageScaleClassName}`}
            style={{
              objectPosition: normalizeObjectPosition(objectPosition),
              transformOrigin: resolveObjectFocusOrigin(objectPosition),
            }}
          />
          {safeBadge ? <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800" translate="no">{safeBadge}</span> : null}
          {draggable ? (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700 shadow-[0_10px_25px_rgba(15,23,42,0.12)]" translate="no">
              <GripVertical className="h-3.5 w-3.5" />
              Arrastra
            </span>
          ) : null}
        </div>
        ) : null}
      <div className="flex flex-1 flex-col gap-1 bg-white px-4 pb-3 pt-2">
        {image ? null : safeBadge ? <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary" translate="no">{safeBadge}</span> : null}
        <div className="flex-1 space-y-1">
          <div className="h-[30px] overflow-hidden">
            <h3 className="line-clamp-2 text-[11px] font-black uppercase leading-[1.16] tracking-tight text-black" translate="no">{safeTitle}</h3>
          </div>
          <div className="h-[14px] overflow-hidden">
            <p className="line-clamp-1 text-[11px] font-medium leading-snug text-zinc-500" translate="no">{safeSubtitle}</p>
          </div>
        </div>
        <div className="mt-auto flex min-h-[38px] items-center rounded-[18px] border border-zinc-100 bg-zinc-50/80 px-3 py-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-black text-primary" translate="no">
              Editar
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            {draggable ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 shadow-[0_8px_24px_rgba(15,23,42,0.06)]" translate="no">
                Mueve y guarda
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
};

const ContentManager = ({ onSuccess, onError }: SiteContentTabProps) => {
  const { token } = useAuth();
  const [draft, setDraft] = useState<PublicSiteContent | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SidebarSection>('general');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragState, setDragState] = useState<DragState>(null);
  const [wideSidebarLayout, setWideSidebarLayout] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1280,
  );
  const normalizedDraft = useMemo(() => (draft ? sanitizeAdminTree(draft) : null), [draft]);
  const hasUnsavedChanges = useMemo(
    () => serializeContentSnapshot(normalizedDraft) !== savedSnapshot,
    [normalizedDraft, savedSnapshot],
  );

  const loadContent = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const nextContent = sanitizeAdminTree(await getAdminSiteContent(token));
      setDraft(nextContent);
      setSavedSnapshot(serializeContentSnapshot(nextContent));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo cargar el contenido web.');
    } finally {
      setLoading(false);
    }
  }, [onError, token]);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncLayout = () => setWideSidebarLayout(window.innerWidth >= 1280);
    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, []);

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!token) throw new Error('Tu sesión expiró. Ingresa de nuevo.');
      return uploadImage(file, token, { bucket: 'gallery' });
    },
    [token],
  );

  const handleSaveAll = useCallback(async () => {
    if (!token || !normalizedDraft) return;
    setSaving(true);
    try {
      const payload = normalizeContentForSave(normalizedDraft);
      const saved = sanitizeAdminTree(await saveAdminSiteContent(payload, token));
      setDraft(saved);
      setSavedSnapshot(serializeContentSnapshot(saved));
      onSuccess('Contenido web actualizado correctamente.');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo guardar el contenido web.');
    } finally {
      setSaving(false);
    }
  }, [normalizedDraft, onError, onSuccess, token]);

  const reorderDraftCollection = useCallback((collection: SortableCollectionKey, fromIndex: number, toIndex: number) => {
    setDraft((current) => {
      if (!current) return current;
      if (collection === 'galleryItems') {
        return {
          ...current,
          galleryItems: reorderItems(current.galleryItems, fromIndex, toIndex),
        };
      }
      if (collection === 'publicEvents') {
        return {
          ...current,
          publicEvents: reorderItems(current.publicEvents, fromIndex, toIndex),
        };
      }
      return {
        ...current,
        privateEventTemplates: reorderItems(current.privateEventTemplates, fromIndex, toIndex),
      };
    });
  }, []);

  const sidebarItems = useMemo(
    () =>
      draft
        ? [
            { key: 'general' as const, label: 'General', description: 'Acerca de y equipo.', count: 1 + draft.teamMembers.length, icon: Globe },
            { key: 'contact' as const, label: 'Contacto', description: 'Horarios, teléfono y redes.', count: 1, icon: MapPinned },
            { key: 'events' as const, label: 'Eventos', description: 'Textos, públicos y privados.', count: 1 + draft.publicEvents.length + draft.privateEventTemplates.length, icon: CalendarDays },
            { key: 'gallery' as const, label: 'Galería', description: 'Título e imágenes del mosaico.', count: 1 + draft.galleryItems.length, icon: ImageIcon },
            { key: 'faq' as const, label: 'FAQ', description: 'Categorías y preguntas frecuentes.', count: draft.faqCategories.length, icon: CircleHelp },
          ]
        : [],
    [draft],
  );

  const buildDragHandlers = useCallback(
    (collection: SortableCollectionKey, index: number) => ({
      draggable: true,
      dragging: dragState?.collection === collection && dragState.index === index,
      dragTarget: dragState?.collection === collection && dragState.index !== index,
      onDragStart: (event: ReactDragEvent<HTMLButtonElement>) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${collection}:${index}`);
        setDragState({ collection, index });
      },
      onDragOver: (event: ReactDragEvent<HTMLButtonElement>) => {
        if (dragState?.collection === collection) {
          event.preventDefault();
        }
      },
      onDrop: (event: ReactDragEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!dragState || dragState.collection !== collection || dragState.index === index) {
          setDragState(null);
          return;
        }
        reorderDraftCollection(collection, dragState.index, index);
        setDragState(null);
      },
      onDragEnd: () => setDragState(null),
    }),
    [dragState, reorderDraftCollection],
  );

  if (loading) {
    return (
      <SectionCard title={<><Globe className="h-5 w-5 text-primary" /> Contenido Web</>}>
        <div className="p-8 text-sm font-medium text-zinc-500">Cargando gestor de contenido...</div>
      </SectionCard>
    );
  }

  if (!draft) {
    return (
      <SectionCard title={<><Globe className="h-5 w-5 text-primary" /> Contenido Web</>}>
        <div className="p-8 text-sm font-medium text-red-600">No se pudo cargar el contenido web.</div>
      </SectionCard>
    );
  }

  const renderGeneralSection = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black">General</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">Todo lo esencial de la página Acerca de y su bloque de equipo.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <SummaryCard
          title="Acerca de"
          subtitle={draft.about.historyTitle}
          badge="Historia"
          onEdit={() => setModalState({ type: 'about' })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">Equipo</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">Tarjetas visuales del equipo que aparece en Acerca de.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft((current) => (current ? { ...current, teamMembers: [...current.teamMembers, createTeamMember()] } : current));
              setModalState({ type: 'team', index: draft.teamMembers.length });
            }}
            className={smallButtonClassName}
          >
            <Plus className="h-4 w-4" />
            Agregar integrante
          </button>
        </div>
      <div className="flex flex-wrap gap-4">
        {draft.teamMembers.map((member, index) => (
          <SummaryCard
            key={member.id}
              title={member.name}
              subtitle={member.role}
              badge="Equipo"
              image={member.image}
              onEdit={() => setModalState({ type: 'team', index })}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderContactSection = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-black">Contacto</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">Bloque lateral del cliente con horarios, dirección y teléfono.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <SummaryCard
          title="Datos"
          subtitle={draft.contact.address}
          badge="Contacto"
          onEdit={() => setModalState({ type: 'contact' })}
        />
      </div>
    </div>
  );

  const renderEventsSection = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black">Eventos</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">Textos base, programación pública y paquetes privados.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <SummaryCard
          title="Textos de eventos"
          subtitle="Edita en un solo lugar los encabezados y descripciones de eventos públicos y privados."
          badge="Públicos y privados"
          onEdit={() => setModalState({ type: 'eventsPage' })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">Eventos públicos</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">Arrastra para reordenar artistas, fechas y portadas desde esta vista.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft((current) => (current ? { ...current, publicEvents: [...current.publicEvents, createSiteEvent('PUBLIC_PROGRAM')] } : current));
              setModalState({ type: 'event', kind: 'PUBLIC_PROGRAM', index: draft.publicEvents.length });
            }}
            className={smallButtonClassName}
          >
            <Plus className="h-4 w-4" />
            Agregar evento
          </button>
        </div>
      <div className="flex flex-wrap gap-4">
        {draft.publicEvents.map((item, index) => (
          <SummaryCard
            key={item.id}
              title={item.title}
              subtitle={`${item.display_date || 'Sin fecha'}${item.start_time ? ` · ${item.start_time}` : ''}`}
              badge={item.active ? 'Visible' : 'Oculto'}
              image={item.image_url || undefined}
              onEdit={() => setModalState({ type: 'event', kind: 'PUBLIC_PROGRAM', index })}
              {...buildDragHandlers('publicEvents', index)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">Eventos privados</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">Paquetes del formulario privado con precio y portada.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft((current) => (current ? { ...current, privateEventTemplates: [...current.privateEventTemplates, createSiteEvent('PRIVATE_TEMPLATE')] } : current));
              setModalState({ type: 'event', kind: 'PRIVATE_TEMPLATE', index: draft.privateEventTemplates.length });
            }}
            className={smallButtonClassName}
          >
            <Plus className="h-4 w-4" />
            Agregar paquete
          </button>
        </div>
      <div className="flex flex-wrap gap-4">
        {draft.privateEventTemplates.map((item, index) => (
          <SummaryCard
            key={item.id}
              title={item.title}
              subtitle={item.price != null ? `CRC ${item.price.toLocaleString('es-CR')}` : 'Sin precio'}
              badge={item.active ? 'Visible' : 'Oculto'}
              image={item.image_url || undefined}
              onEdit={() => setModalState({ type: 'event', kind: 'PRIVATE_TEMPLATE', index })}
              {...buildDragHandlers('privateEventTemplates', index)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderGallerySection = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black">Galería</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">Título galería y tarjetas visuales que se muestran al cliente.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <SummaryCard
          title={draft.galleryPage.heroTitle}
          subtitle={draft.galleryPage.heroDescription}
          badge="Título galería"
          onEdit={() => setModalState({ type: 'galleryPage' })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">Imágenes</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">Arrastra para reordenar y toca una tarjeta para abrir su edición.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft((current) => (current ? { ...current, galleryItems: [...current.galleryItems, createGalleryItem()] } : current));
              setModalState({ type: 'galleryItem', index: draft.galleryItems.length });
            }}
            className={smallButtonClassName}
          >
            <Plus className="h-4 w-4" />
            Agregar imagen
          </button>
        </div>
      <div className="flex flex-wrap gap-4">
        {draft.galleryItems.map((item, index) => (
          <SummaryCard
            key={item.id}
              title={item.title}
              subtitle={`${galleryCategoryLabelMap[item.category] ?? item.category} · ${item.active ? 'visible' : 'oculto'}`}
              badge={galleryCategoryLabelMap[item.category] ?? item.category}
              image={item.image_url}
              objectPosition={item.object_position ?? 'center'}
              onEdit={() => setModalState({ type: 'galleryItem', index })}
              {...buildDragHandlers('galleryItems', index)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderFaqSection = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black">Preguntas frecuentes</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">Categorías escaneables. Cada una abre su propio modal de edición.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft((current) => (current ? { ...current, faqCategories: [...current.faqCategories, createFaqCategory()] } : current));
            setModalState({ type: 'faq', index: draft.faqCategories.length });
          }}
          className={smallButtonClassName}
        >
          <Plus className="h-4 w-4" />
          Agregar categoría
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {draft.faqCategories.map((category, index) => (
          <SummaryCard
            key={`${category.title}-${index}`}
            title={category.title}
            subtitle={`${category.items.length} pregunta(s)`}
            badge="FAQ"
            onEdit={() => setModalState({ type: 'faq', index })}
          />
        ))}
      </div>
    </div>
  );

  const currentPublicEvent = modalState?.type === 'event' && modalState.kind === 'PUBLIC_PROGRAM' ? draft.publicEvents[modalState.index] : null;
  const currentPrivateEvent = modalState?.type === 'event' && modalState.kind === 'PRIVATE_TEMPLATE' ? draft.privateEventTemplates[modalState.index] : null;
  const currentGalleryItem = modalState?.type === 'galleryItem' ? draft.galleryItems[modalState.index] : null;
  const currentTeamMember = modalState?.type === 'team' ? draft.teamMembers[modalState.index] : null;
  const currentFaqCategory = modalState?.type === 'faq' ? draft.faqCategories[modalState.index] : null;

  return (
    <>
      <SectionCard
        title={<><Globe className="h-5 w-5 text-primary" /> Contenido Web</>}
        headerActions={
          <>
            <button type="button" onClick={() => void loadContent()} className={smallButtonClassName} disabled={loading || saving}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="inline-flex items-center rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-600">
              {hasUnsavedChanges ? 'Cambios pendientes' : 'Sin cambios'}
            </span>
            <button type="button" onClick={() => void handleSaveAll()} className={primaryButtonClassName} disabled={saving || !hasUnsavedChanges}>
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <div className="p-6">
          <div className={`items-start gap-6 ${wideSidebarLayout ? 'flex' : 'space-y-5'}`}>
            {wideSidebarLayout ? (
              <aside
                className="sticky top-20 flex shrink-0 self-start flex-col overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)] transition-[width] duration-300"
                style={{
                  width: sidebarOpen ? 296 : 82,
                  height: 'calc(100vh - 5.5rem)',
                  maxHeight: 'calc(100vh - 5.5rem)',
                }}
              >
                <div className={`border-b border-zinc-100 ${sidebarOpen ? 'p-5' : 'p-4'}`}>
                  <div className={`flex ${sidebarOpen ? 'items-start justify-between gap-3' : 'justify-center'}`}>
                    {sidebarOpen ? (
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Contenido web</p>
                        <p className="mt-2 text-sm font-medium text-zinc-600">
                          Navega por categorías y edita cada bloque desde modales.
                        </p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSidebarOpen((current) => !current)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100"
                      aria-label={sidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
                      title={sidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
                    >
                      {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-8">
                  {sidebarItems.map((item) => (
                    <SidebarButton
                      key={item.key}
                      active={activeSection === item.key}
                      collapsed={!sidebarOpen}
                      label={item.label}
                      description={item.description}
                      count={item.count}
                      icon={item.icon}
                      onClick={() => setActiveSection(item.key)}
                    />
                  ))}
                </div>
              </aside>
            ) : (
              <div className="flex flex-wrap gap-3">
                {sidebarItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      activeSection === item.key
                        ? 'border-primary bg-primary text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-6">
            {activeSection === 'general' && renderGeneralSection()}
            {activeSection === 'contact' && renderContactSection()}
            {activeSection === 'events' && renderEventsSection()}
            {activeSection === 'gallery' && renderGallerySection()}
            {activeSection === 'faq' && renderFaqSection()}
            </div>
          </div>
        </div>
      </SectionCard>

      <AboutEditorModal
        open={modalState?.type === 'about'}
        about={draft.about}
        onOpenChange={(open) => setModalState(open ? modalState : null)}
        onSave={(about) => setDraft((current) => (current ? { ...current, about } : current))}
      />

      {currentTeamMember ? (
        <TeamMemberEditorModal
          open={modalState?.type === 'team'}
          member={currentTeamMember}
          onOpenChange={(open) => setModalState(open ? modalState : null)}
          onSave={(member) => setDraft((current) => (current ? { ...current, teamMembers: replaceAt(current.teamMembers, modalState?.type === 'team' ? modalState.index : 0, member) } : current))}
          onDelete={() => setDraft((current) => (current ? { ...current, teamMembers: removeAt(current.teamMembers, modalState?.type === 'team' ? modalState.index : 0) } : current))}
          onUploadImage={handleUploadImage}
        />
      ) : null}

      <ContactEditorModal
        open={modalState?.type === 'contact'}
        contact={draft.contact}
        onOpenChange={(open) => setModalState(open ? modalState : null)}
        onSave={(contact) => setDraft((current) => (current ? { ...current, contact } : current))}
      />

      <EventsPageEditorModal
        open={modalState?.type === 'eventsPage'}
        content={draft.eventsPage}
        onOpenChange={(open) => setModalState(open ? modalState : null)}
        onSave={(eventsPage) => setDraft((current) => (current ? { ...current, eventsPage } : current))}
      />

      {currentPublicEvent ? (
        <SiteEventEditorModal
          open={modalState?.type === 'event' && modalState.kind === 'PUBLIC_PROGRAM'}
          item={currentPublicEvent}
          onOpenChange={(open) => setModalState(open ? modalState : null)}
          onSave={(item) => setDraft((current) => (current ? { ...current, publicEvents: replaceAt(current.publicEvents, modalState?.type === 'event' ? modalState.index : 0, item) } : current))}
          onDelete={() => setDraft((current) => (current ? { ...current, publicEvents: removeAt(current.publicEvents, modalState?.type === 'event' ? modalState.index : 0) } : current))}
          onUploadImage={handleUploadImage}
        />
      ) : null}

      {currentPrivateEvent ? (
        <SiteEventEditorModal
          open={modalState?.type === 'event' && modalState.kind === 'PRIVATE_TEMPLATE'}
          item={currentPrivateEvent}
          onOpenChange={(open) => setModalState(open ? modalState : null)}
          onSave={(item) => setDraft((current) => (current ? { ...current, privateEventTemplates: replaceAt(current.privateEventTemplates, modalState?.type === 'event' ? modalState.index : 0, item) } : current))}
          onDelete={() => setDraft((current) => (current ? { ...current, privateEventTemplates: removeAt(current.privateEventTemplates, modalState?.type === 'event' ? modalState.index : 0) } : current))}
          onUploadImage={handleUploadImage}
        />
      ) : null}

      <GalleryPageEditorModal
        open={modalState?.type === 'galleryPage'}
        content={draft.galleryPage}
        onOpenChange={(open) => setModalState(open ? modalState : null)}
        onSave={(galleryPage) => setDraft((current) => (current ? { ...current, galleryPage } : current))}
      />

      {currentGalleryItem ? (
        <GalleryItemEditorModal
          open={modalState?.type === 'galleryItem'}
          item={currentGalleryItem}
          onOpenChange={(open) => setModalState(open ? modalState : null)}
          onPositionSave={(item) => {
            if (!draft) return;
            const index = modalState?.type === 'galleryItem' ? modalState.index : 0;
            const nextDraft = {
              ...draft,
              galleryItems: replaceAt(draft.galleryItems, index, item),
            };
            setDraft(nextDraft);
          }}
          onSave={(item) => {
            if (!draft) return;
            const index = modalState?.type === 'galleryItem' ? modalState.index : 0;
            const nextDraft = {
              ...draft,
              galleryItems: replaceAt(draft.galleryItems, index, item),
            };
            setDraft(nextDraft);
          }}
          onDelete={() => {
            if (!draft) return;
            const index = modalState?.type === 'galleryItem' ? modalState.index : 0;
            const nextDraft = {
              ...draft,
              galleryItems: removeAt(draft.galleryItems, index),
            };
            setDraft(nextDraft);
          }}
          onUploadImage={handleUploadImage}
        />
      ) : null}

      {currentFaqCategory ? (
        <FaqCategoryEditorModal
          open={modalState?.type === 'faq'}
          category={currentFaqCategory}
          onOpenChange={(open) => setModalState(open ? modalState : null)}
          onSave={(category) => setDraft((current) => (current ? { ...current, faqCategories: replaceAt(current.faqCategories, modalState?.type === 'faq' ? modalState.index : 0, category) } : current))}
          onDelete={() => setDraft((current) => (current ? { ...current, faqCategories: removeAt(current.faqCategories, modalState?.type === 'faq' ? modalState.index : 0) } : current))}
        />
      ) : null}
    </>
  );
};

export default ContentManager;

