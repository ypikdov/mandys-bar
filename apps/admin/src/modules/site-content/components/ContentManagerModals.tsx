import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mandys/ui';
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { z } from 'zod';
import type {
  AboutContent,
  ContactContent,
  EventsPageContent,
  GalleryContentItem,
  GalleryPageContent,
  SiteEvent,
  SiteFaqCategory,
  SiteTeamMember,
} from '@mandys/shared';
import { IMAGE_UPLOAD_ACCEPT } from '@/shared/api/uploadService';

const inputClassName =
  'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-black transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const textareaClassName = `${inputClassName} min-h-[120px] resize-y`;
const labelClassName = 'text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500';
const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const destructiveButtonClassName =
  'inline-flex min-w-[156px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50';
const panelClassName =
  'rounded-[26px] border border-zinc-200/90 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)]';
const softPanelClassName =
  'rounded-[26px] border border-zinc-200/90 bg-[#fffdfa] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]';

const aboutSchema = z.object({
  historyTitle: z.string().trim().min(1, 'El título de historia es obligatorio.'),
  historyParagraphs: z.array(z.string().trim().min(1)).min(1, 'Agrega al menos un párrafo.'),
  valuesTitleA: z.string().trim().min(1, 'El primer título es obligatorio.'),
  valuesBodyA: z.string().trim().min(1, 'El primer texto es obligatorio.'),
  valuesTitleB: z.string().trim().min(1, 'El segundo título es obligatorio.'),
  valuesBodyB: z.string().trim().min(1, 'El segundo texto es obligatorio.'),
  videoUrl: z.string().trim().min(1, 'La URL del video es obligatoria.'),
});

const teamMemberSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  role: z.string().trim().min(1, 'El rol es obligatorio.'),
  image: z.string().trim().min(1, 'La imagen es obligatoria.'),
  description: z.string().trim().min(1, 'La descripción es obligatoria.'),
});

const faqCategorySchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  items: z.array(
    z.object({
      question: z.string().trim().min(1, 'La pregunta es obligatoria.'),
      answer: z.string().trim().min(1, 'La respuesta es obligatoria.'),
    }),
  ).min(1, 'Agrega al menos una pregunta.'),
});

const contactSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  hours: z.array(z.string().trim().min(1)).min(1, 'Agrega al menos un horario.'),
  closedDayLabel: z.string().trim().min(1, 'El día cerrado es obligatorio.'),
  address: z.string().trim().min(1, 'La dirección es obligatoria.'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio.'),
  instagramUrl: z.string().trim().min(1, 'El enlace de Instagram es obligatorio.'),
  facebookUrl: z.string().trim().min(1, 'El enlace de Facebook es obligatorio.'),
});

const eventsPageSchema = z.object({
  publicTag: z.string().trim().min(1),
  publicTitle: z.string().trim().min(1),
  publicDescription: z.string().trim().min(1),
  privateTag: z.string().trim().min(1),
  privateTitle: z.string().trim().min(1),
  privateDescription: z.string().trim().min(1),
  privateButtonLabel: z.string().trim().min(1),
});

const galleryPageSchema = z.object({
  heroTag: z.string().trim().min(1),
  heroTitle: z.string().trim().min(1),
  heroAccent: z.string().trim().min(1),
  heroDescription: z.string().trim().min(1),
  ctaTitle: z.string().trim().min(1),
  ctaButtonLabel: z.string().trim().min(1),
});

const siteEventSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  kind: z.enum(['PUBLIC_PROGRAM', 'PRIVATE_TEMPLATE']),
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  subtitle: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  day_label: z.string().trim().optional().nullable(),
  display_date: z.string().trim().optional().nullable(),
  start_time: z.string().trim().optional().nullable(),
  image_url: z.string().trim().min(1, 'La imagen es obligatoria.'),
  price: z.number().nullable().optional(),
  order_index: z.number().int().nonnegative(),
  active: z.boolean(),
});

const galleryItemSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  alt_text: z.string().trim().min(1, 'El texto alternativo es obligatorio.'),
  category: z.string().trim().min(1, 'La categoría es obligatoria.'),
  image_url: z.string().trim().min(1, 'La imagen es obligatoria.'),
  rotation: z.number().int().nullable().optional(),
  aspect: z.string().trim().nullable().optional(),
  object_position: z.string().trim().nullable().optional(),
  order_index: z.number().int().nonnegative(),
  active: z.boolean(),
});

const galleryCategoryOptions = ['comida', 'bebida', 'lugar', 'eventos'] as const;
const galleryPositionOptions = [
  { value: 'center', label: 'Centro' },
  { value: 'top', label: 'Arriba' },
  { value: 'bottom', label: 'Abajo' },
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
] as const;

const normalizePositionValue = (value?: string | null) => {
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
    return 'scale-[1.08]';
  }
  if (normalized === 'center top' || normalized === 'center bottom') {
    return 'scale-[1.34]';
  }
  return 'scale-[1.2]';
};

const galleryCategoryLabelMap: Record<string, string> = {
  comida: 'Comida',
  bebida: 'Bebida',
  lugar: 'Lugar',
  eventos: 'Eventos',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();

const readIssues = (error: z.ZodError) => error.issues[0]?.message ?? 'Revisa los campos del formulario.';

const moveItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const replaceAt = <T,>(items: T[], index: number, nextItem: T) =>
  items.map((item, currentIndex) => (currentIndex === index ? nextItem : item));

const removeAt = <T,>(items: T[], index: number) => items.filter((_, currentIndex) => currentIndex !== index);

const parseLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean);

const ModalShell = ({
  open,
  onOpenChange,
  title,
  description,
  error,
  onSave,
  saveLabel = 'Guardar cambios',
  children,
  maxWidthClassName = 'max-w-4xl',
  modalWidth = 'min(1000px, calc(100vw - 3rem))',
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  error?: string | null;
  onSave: () => void;
  saveLabel?: string;
  children: ReactNode;
  maxWidthClassName?: string;
  modalWidth?: string;
  onDelete?: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={`max-w-none rounded-[32px] border border-zinc-200 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ${maxWidthClassName}`}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
      }}
      style={{
        left: '50%',
        top: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)',
        margin: 0,
        width: modalWidth,
        height: 'min(820px, calc(100vh - 4.5rem))',
        maxHeight: 'calc(100vh - 4.5rem)',
        overflow: 'hidden',
        boxShadow: '0 28px 88px rgba(15,23,42,0.18)',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
      }}
    >
      <div className="border-b border-zinc-100 px-6 py-5">
        <DialogHeader className="mx-auto max-w-3xl space-y-2 text-center">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-black">{title}</DialogTitle>
          <DialogDescription className="text-sm font-medium text-zinc-500">{description}</DialogDescription>
        </DialogHeader>
      </div>
      <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      <div className="border-t border-zinc-100 bg-white px-6 py-4 shadow-[0_-12px_28px_rgba(15,23,42,0.04)]">
        {error ? <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Esta acción eliminará este bloque del borrador actual. Podrás confirmar el cambio al guardar.')) {
                    onDelete();
                  }
                }}
                className={destructiveButtonClassName}
                translate="no"
                aria-label="Eliminar"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
                <span translate="no">Eliminar</span>
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onSave} className={primaryButtonClassName}>
              {saveLabel}
            </button>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: 'text' | 'number';
}) => (
  <label className="space-y-2" translate="no">
    <span className={labelClassName} translate="no">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      translate="no"
      className={`${inputClassName} ${readOnly ? 'bg-zinc-100 text-zinc-500' : ''}`}
    />
  </label>
);

const TextAreaField = ({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) => (
  <label className="space-y-2" translate="no">
    <span className={labelClassName} translate="no">{label}</span>
    <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={textareaClassName} translate="no" />
  </label>
);

const ToggleField = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
    />
    {label}
  </label>
);

const ImageUploader = ({
  imageUrl,
  objectPosition,
  onUpload,
  uploading,
}: {
  imageUrl?: string | null;
  objectPosition?: string | null;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) => {
  const src = resolveImageUrl(imageUrl);
  const imageScaleClassName = resolveObjectScaleClass(objectPosition);

  return (
    <div className="space-y-3">
      <span className={labelClassName}>Imagen</span>
      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.08)]">
        <div className="aspect-[16/10] bg-zinc-50">
          {src ? (
            <img
              src={src}
              alt=""
              className={`h-full w-full object-cover ${imageScaleClassName}`}
              style={{
                objectPosition: normalizeObjectPosition(objectPosition),
                transformOrigin: resolveObjectFocusOrigin(objectPosition),
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-300">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
      </div>
      <label className={secondaryButtonClassName}>
        {uploading ? <Upload className="h-4 w-4 animate-pulse" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Subiendo...' : 'Cambiar imagen'}
        <input
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await onUpload(file);
              event.target.value = '';
            }
          }}
        />
      </label>
    </div>
  );
};

const SectionCard = ({
  eyebrow,
  title,
  description,
  className = panelClassName,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <section className={className}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-black">{title}</h3>
        <p className="mt-2 text-sm font-medium text-zinc-500">{description}</p>
      </div>
      {actions}
    </div>
    {children}
  </section>
);

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
    <p className="mt-2 text-sm font-bold text-black">{value}</p>
  </div>
);

const SummaryRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="grid items-center gap-3 sm:grid-cols-[112px_1fr]">
    <span className="text-sm font-black uppercase tracking-[0.16em] text-zinc-700">{label}</span>
    {children}
  </div>
);

const editorShellClassName =
  'rounded-[30px] border border-zinc-200 bg-[#fffdfa] p-4 shadow-[0_24px_64px_rgba(15,23,42,0.1)]';
const editorPanelClassName =
  'rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)]';
const editorSoftPanelClassName =
  'rounded-[24px] border border-zinc-200 bg-[#fffaf4] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]';
const editorPanelLabelClassName = 'text-[11px] font-black uppercase tracking-[0.22em] text-primary';
const editorBlockTitleClassName = 'mt-1 text-lg font-black uppercase tracking-tight text-black';
const editorBlockHintClassName = 'mt-1 text-sm font-medium text-zinc-500';

const EditorPanel = ({
  label,
  title,
  hint,
  tone = 'default',
  children,
}: {
  label: string;
  title?: string;
  hint?: string;
  tone?: 'default' | 'soft';
  children: ReactNode;
}) => (
  <section className={tone === 'soft' ? editorSoftPanelClassName : editorPanelClassName}>
    <p className={editorPanelLabelClassName}>{label}</p>
    {title ? <h3 className={editorBlockTitleClassName}>{title}</h3> : null}
    {hint ? <p className={editorBlockHintClassName}>{hint}</p> : null}
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const EditorWorkbench = ({
  left,
  right,
  bottom,
  columnsClassName = 'xl:grid-cols-[1.08fr_0.78fr]',
}: {
  left: ReactNode;
  right: ReactNode;
  bottom?: ReactNode;
  columnsClassName?: string;
}) => (
  <div className={editorShellClassName}>
    <div className={`grid gap-5 ${columnsClassName}`}>
      {left}
      {right}
    </div>
    {bottom ? <div className="mt-5">{bottom}</div> : null}
  </div>
);

type UploadImageHandler = (file: File) => Promise<string>;

export const AboutEditorModal = ({
  open,
  about,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  about: AboutContent;
  onOpenChange: (open: boolean) => void;
  onSave: (about: AboutContent) => void;
}) => {
  const [draft, setDraft] = useState(about);
  const [historyText, setHistoryText] = useState(about.historyParagraphs.join('\n\n'));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(about);
    setHistoryText(about.historyParagraphs.join('\n\n'));
    setError(null);
  }, [about, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Acerca de"
      description="Controla historia, valores y video de la página Acerca de."
      error={error}
      modalWidth="min(960px, calc(100vw - 3rem))"
      onSave={() => {
        const parsed = aboutSchema.safeParse({
          ...draft,
          historyParagraphs: parseLines(historyText.replace(/\n\n+/g, '\n')),
        });
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
      maxWidthClassName="max-w-6xl"
    >
      <div className="space-y-6">
        <EditorWorkbench
          columnsClassName="xl:grid-cols-[1.12fr_0.7fr]"
          left={
            <EditorPanel label="Historia" title="Bloque principal" hint="Titulo y cuerpo editorial.">
              <Field
                label="Título historia"
                value={draft.historyTitle}
                onChange={(value) => setDraft((current) => ({ ...current, historyTitle: value }))}
              />
              <TextAreaField
                label="Párrafos de historia"
                value={historyText}
                onChange={setHistoryText}
                rows={7}
              />
            </EditorPanel>
          }
          right={
            <EditorPanel label="Video" title="Recurso visual" hint="Solo la URL embebible." tone="soft">
              <Field
                label="URL video"
                value={draft.videoUrl}
                onChange={(value) => setDraft((current) => ({ ...current, videoUrl: value }))}
              />
            </EditorPanel>
          }
          bottom={
            <EditorPanel label="Valores" title="Mensajes clave" hint="Los dos bloques visibles en Acerca de.">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                  <p className={labelClassName}>Valor 1</p>
                  <div className="mt-3 space-y-4">
                    <Field
                      label="Título valor 1"
                      value={draft.valuesTitleA}
                      onChange={(value) => setDraft((current) => ({ ...current, valuesTitleA: value }))}
                    />
                    <TextAreaField
                      label="Texto valor 1"
                      value={draft.valuesBodyA}
                      onChange={(value) => setDraft((current) => ({ ...current, valuesBodyA: value }))}
                      rows={4}
                    />
                  </div>
                </div>
                <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                  <p className={labelClassName}>Valor 2</p>
                  <div className="mt-3 space-y-4">
                    <Field
                      label="Título valor 2"
                      value={draft.valuesTitleB}
                      onChange={(value) => setDraft((current) => ({ ...current, valuesTitleB: value }))}
                    />
                    <TextAreaField
                      label="Texto valor 2"
                      value={draft.valuesBodyB}
                      onChange={(value) => setDraft((current) => ({ ...current, valuesBodyB: value }))}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </EditorPanel>
          }
        />
      </div>
    </ModalShell>
  );
};

export const TeamMemberEditorModal = ({
  open,
  member,
  onOpenChange,
  onSave,
  onDelete,
  onUploadImage,
}: {
  open: boolean;
  member: SiteTeamMember;
  onOpenChange: (open: boolean) => void;
  onSave: (member: SiteTeamMember) => void;
  onDelete: () => void;
  onUploadImage: UploadImageHandler;
}) => {
  const [draft, setDraft] = useState(member);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDraft(member);
    setError(null);
    setUploading(false);
  }, [member, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Integrante del equipo"
      description="Edita la tarjeta del equipo sin salir del flujo."
      error={error}
      onDelete={() => {
        onDelete();
        onOpenChange(false);
      }}
      onSave={() => {
        const parsed = teamMemberSchema.safeParse(draft);
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
    >
      <div className="space-y-6">
        <EditorWorkbench
          left={
            <EditorPanel label="Imagen" title="Retrato" hint="Foto principal y nombre visible.">
              <ImageUploader
                imageUrl={draft.image}
                uploading={uploading}
                onUpload={async (file) => {
                  setUploading(true);
                  setError(null);
                  try {
                    const url = await onUploadImage(file);
                    setDraft((current) => ({ ...current, image: url }));
                  } catch (uploadError) {
                    setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <Field label="Nombre" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />
            </EditorPanel>
          }
          right={
            <EditorPanel label="Resumen" title="Tarjeta visible" hint="Rol y vista rápida." tone="soft">
              <Field label="Rol" value={draft.role} onChange={(value) => setDraft((current) => ({ ...current, role: value }))} />
              <div className="flex items-center gap-4 rounded-[22px] border border-zinc-200 bg-white p-4">
                {draft.image ? <img src={resolveImageUrl(draft.image)} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : null}
                <div className="min-w-0">
                  <p className="truncate text-lg font-black uppercase tracking-tight text-black">{draft.name || 'Sin nombre'}</p>
                  <p className="mt-1 truncate text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">{draft.role || 'Sin rol'}</p>
                </div>
              </div>
            </EditorPanel>
          }
          bottom={
            <EditorPanel label="Descripción" title="Perfil" hint="Texto que aparece bajo la tarjeta.">
              <TextAreaField label="Descripción" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} rows={5} />
            </EditorPanel>
          }
        />
      </div>
    </ModalShell>
  );
};

export const ContactEditorModal = ({
  open,
  contact,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  contact: ContactContent;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: ContactContent) => void;
}) => {
  const [draft, setDraft] = useState(contact);
  const [hoursText, setHoursText] = useState(contact.hours.join('\n'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(contact);
    setHoursText(contact.hours.join('\n'));
    setError(null);
  }, [contact, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Contacto"
      description="Edita horarios, dirección y canales visibles del bloque de contacto."
      error={error}
      modalWidth="min(840px, calc(100vw - 3rem))"
      onSave={() => {
        const parsed = contactSchema.safeParse({
          ...draft,
          hours: parseLines(hoursText),
        });
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
    >
      <div className="space-y-6">
        <EditorWorkbench
          columnsClassName="xl:grid-cols-[0.9fr_1.1fr]"
          left={
            <EditorPanel label="Contacto" title="Datos visibles" hint="Solo lo esencial del bloque.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Field label="Título" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
                </div>
                <div>
                  <Field label="Teléfono" value={draft.phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} />
                </div>
                <div>
                  <Field label="Día cerrado" value={draft.closedDayLabel} onChange={(value) => setDraft((current) => ({ ...current, closedDayLabel: value }))} />
                </div>
                <div>
                  <Field label="Dirección" value={draft.address} onChange={(value) => setDraft((current) => ({ ...current, address: value }))} />
                </div>
              </div>
            </EditorPanel>
          }
          right={
            <EditorPanel label="Operación" title="Horarios y redes" hint="Horario visible y enlaces sociales." tone="soft">
              <div className="grid gap-4">
                <TextAreaField label="Horarios" value={hoursText} onChange={setHoursText} rows={5} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Instagram" value={draft.instagramUrl} onChange={(value) => setDraft((current) => ({ ...current, instagramUrl: value }))} />
                  <Field label="Facebook" value={draft.facebookUrl} onChange={(value) => setDraft((current) => ({ ...current, facebookUrl: value }))} />
                </div>
              </div>
            </EditorPanel>
          }
        />
      </div>
    </ModalShell>
  );
};

export const EventsPageEditorModal = ({
  open,
  content,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  content: EventsPageContent;
  onOpenChange: (open: boolean) => void;
  onSave: (content: EventsPageContent) => void;
}) => {
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(content);
    setError(null);
  }, [content, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Textos de eventos"
      description="Controla los textos base de eventos públicos y privados."
      error={error}
      onSave={() => {
        const parsed = eventsPageSchema.safeParse(draft);
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
      maxWidthClassName="max-w-5xl"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          eyebrow="Públicos"
          title="Bloque público"
          description="Administra el texto principal y la descripción visible para todo público."
        >
          <div className="space-y-4">
            <Field label="Tag eventos públicos" value={draft.publicTag} onChange={(value) => setDraft((current) => ({ ...current, publicTag: value }))} />
            <Field label="Título eventos públicos" value={draft.publicTitle} onChange={(value) => setDraft((current) => ({ ...current, publicTitle: value }))} />
            <TextAreaField label="Descripción eventos públicos" value={draft.publicDescription} onChange={(value) => setDraft((current) => ({ ...current, publicDescription: value }))} rows={7} />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Privados"
          title="Bloque privado"
          description="Agrupa el mensaje comercial y el botón del formulario privado."
          className={softPanelClassName}
        >
          <div className="space-y-4">
            <Field label="Tag eventos privados" value={draft.privateTag} onChange={(value) => setDraft((current) => ({ ...current, privateTag: value }))} />
            <Field label="Título eventos privados" value={draft.privateTitle} onChange={(value) => setDraft((current) => ({ ...current, privateTitle: value }))} />
            <TextAreaField label="Descripción eventos privados" value={draft.privateDescription} onChange={(value) => setDraft((current) => ({ ...current, privateDescription: value }))} rows={6} />
            <Field label="Texto botón eventos privados" value={draft.privateButtonLabel} onChange={(value) => setDraft((current) => ({ ...current, privateButtonLabel: value }))} />
          </div>
        </SectionCard>
      </div>
    </ModalShell>
  );
};

export const GalleryPageEditorModal = ({
  open,
  content,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  content: GalleryPageContent;
  onOpenChange: (open: boolean) => void;
  onSave: (content: GalleryPageContent) => void;
}) => {
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(content);
    setError(null);
  }, [content, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Título galería"
      description="Edita el título, acento y descripción principal de la galería pública."
      error={error}
      onSave={() => {
        const parsed = galleryPageSchema.safeParse(draft);
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
      maxWidthClassName="max-w-5xl"
    >
      <div className="grid gap-5">
        <SectionCard
          eyebrow="Título galería"
          title="Bloque principal"
          description="Concentra el mensaje visual superior de la página de galería."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tag" value={draft.heroTag} onChange={(value) => setDraft((current) => ({ ...current, heroTag: value }))} />
            <Field label="Acento" value={draft.heroAccent} onChange={(value) => setDraft((current) => ({ ...current, heroAccent: value }))} />
            <div className="md:col-span-2">
              <Field label="Título" value={draft.heroTitle} onChange={(value) => setDraft((current) => ({ ...current, heroTitle: value }))} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Descripción" value={draft.heroDescription} onChange={(value) => setDraft((current) => ({ ...current, heroDescription: value }))} rows={7} />
            </div>
          </div>
        </SectionCard>
      </div>
    </ModalShell>
  );
};

export const SiteEventEditorModal = ({
  open,
  item,
  onOpenChange,
  onSave,
  onDelete,
  onUploadImage,
}: {
  open: boolean;
  item: SiteEvent;
  onOpenChange: (open: boolean) => void;
  onSave: (item: SiteEvent) => void;
  onDelete: () => void;
  onUploadImage: UploadImageHandler;
}) => {
  const [draft, setDraft] = useState(item);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const isPrivate = draft.kind === 'PRIVATE_TEMPLATE';

  useEffect(() => {
    setDraft(item);
    setError(null);
    setUploading(false);
  }, [item, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isPrivate ? 'Evento privado' : 'Evento público'}
      description={isPrivate ? 'Edita el paquete privado y su imagen.' : 'Edita artista, fecha y portada del evento público.'}
      error={error}
      onDelete={() => {
        onDelete();
        onOpenChange(false);
      }}
      onSave={() => {
        const parsed = siteEventSchema.safeParse({
          ...draft,
          slug: draft.slug.trim() || slugify(draft.title),
        });
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
      maxWidthClassName="max-w-5xl"
    >
      <div className="space-y-6">
        <EditorWorkbench
          left={
            <EditorPanel label="Portada" title={isPrivate ? 'Imagen del paquete' : 'Imagen del evento'} hint="Visual principal y título.">
              <ImageUploader
                imageUrl={draft.image_url}
                uploading={uploading}
                onUpload={async (file) => {
                  setUploading(true);
                  setError(null);
                  try {
                    const url = await onUploadImage(file);
                    setDraft((current) => ({ ...current, image_url: url }));
                  } catch (uploadError) {
                    setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <Field label="Título" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
            </EditorPanel>
          }
          right={
            <EditorPanel label="Resumen" title="Estado rápido" hint="Solo los controles clave." tone="soft">
              <SummaryRow label="Tipo">
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-black">
                  {isPrivate ? 'Privado' : 'Público'}
                </div>
              </SummaryRow>
              <SummaryRow label="Orden">
                <input
                  type="number"
                  min={1}
                  value={String(draft.order_index + 1)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      order_index: Math.max(0, (Number(event.target.value) || 1) - 1),
                    }))
                  }
                  className={inputClassName}
                />
              </SummaryRow>
              <SummaryRow label="Visible">
                <ToggleField label={draft.active ? 'Visible en cliente' : 'Oculto en cliente'} checked={draft.active} onChange={(checked) => setDraft((current) => ({ ...current, active: checked }))} />
              </SummaryRow>
              {isPrivate ? (
                <SummaryRow label="Precio">
                  <input
                    type="number"
                    value={draft.price != null ? String(draft.price) : ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        price: event.target.value.trim() ? Number(event.target.value) : null,
                      }))
                    }
                    className={inputClassName}
                  />
                </SummaryRow>
              ) : (
                <>
                  <SummaryRow label="Día">
                    <input type="text" value={draft.day_label ?? ''} onChange={(event) => setDraft((current) => ({ ...current, day_label: event.target.value }))} className={inputClassName} />
                  </SummaryRow>
                  <SummaryRow label="Fecha">
                    <input type="text" value={draft.display_date ?? ''} onChange={(event) => setDraft((current) => ({ ...current, display_date: event.target.value }))} className={inputClassName} />
                  </SummaryRow>
                  <SummaryRow label="Hora">
                    <input type="text" value={draft.start_time ?? ''} onChange={(event) => setDraft((current) => ({ ...current, start_time: event.target.value }))} className={inputClassName} />
                  </SummaryRow>
                </>
              )}
            </EditorPanel>
          }
          bottom={
            <EditorPanel label="Contenido" title={isPrivate ? 'Descripción del paquete' : 'Contenido del evento'} hint={isPrivate ? 'Bloque comercial inferior.' : 'Subtítulo y descripción general.'}>
              <div className="space-y-4">
                {isPrivate ? null : (
                  <Field label="Subtítulo" value={draft.subtitle ?? ''} onChange={(value) => setDraft((current) => ({ ...current, subtitle: value }))} />
                )}
                <TextAreaField label="Descripción" value={draft.description ?? ''} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} rows={5} />
              </div>
            </EditorPanel>
          }
        />
      </div>
    </ModalShell>
  );
};

export const GalleryItemEditorModal = ({
  open,
  item,
  onOpenChange,
  onSave,
  onPositionSave,
  onDelete,
  onUploadImage,
}: {
  open: boolean;
  item: GalleryContentItem;
  onOpenChange: (open: boolean) => void;
  onSave: (item: GalleryContentItem) => void;
  onPositionSave?: (item: GalleryContentItem) => void;
  onDelete: () => void;
  onUploadImage: UploadImageHandler;
}) => {
  const [draft, setDraft] = useState(item);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDraft({
      ...item,
      object_position: normalizePositionValue(item.object_position),
    });
    setError(null);
    setUploading(false);
  }, [item, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Imagen de galería"
      description="Edita solo lo que afecta la tarjeta: título, visibilidad, categoría, posición y foto."
      error={error}
      onDelete={() => {
        onDelete();
        onOpenChange(false);
      }}
      onSave={() => {
        const parsed = galleryItemSchema.safeParse({
          ...draft,
          object_position: normalizePositionValue(draft.object_position),
        });
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
      maxWidthClassName="max-w-5xl"
    >
      <div className="space-y-6">
        <EditorWorkbench
          left={
            <EditorPanel label="Imagen" title="Visual principal" hint="Vista previa, carga y título.">
              <ImageUploader
                imageUrl={draft.image_url}
                objectPosition={draft.object_position}
                uploading={uploading}
                onUpload={async (file) => {
                  setUploading(true);
                  setError(null);
                  try {
                    const url = await onUploadImage(file);
                    setDraft((current) => ({ ...current, image_url: url }));
                  } catch (uploadError) {
                    setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <Field label="Título visible" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
            </EditorPanel>
          }
          right={
            <EditorPanel label="Resumen" title="Estado rápido" hint="Categoría, orden y visibilidad." tone="soft">
              <SummaryRow label="Categoría">
                <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className={inputClassName}>
                  {galleryCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {galleryCategoryLabelMap[option] ?? option}
                    </option>
                  ))}
                </select>
              </SummaryRow>
              <SummaryRow label="Orden">
                <input
                  type="number"
                  min={1}
                  value={String(draft.order_index + 1)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      order_index: Math.max(0, (Number(event.target.value) || 1) - 1),
                    }))
                  }
                  className={inputClassName}
                />
              </SummaryRow>
              <SummaryRow label="Visible">
                <ToggleField label={draft.active ? 'Visible en cliente' : 'Oculto en cliente'} checked={draft.active} onChange={(checked) => setDraft((current) => ({ ...current, active: checked }))} />
              </SummaryRow>
              <SummaryRow label="Posición">
                <select
                  value={normalizePositionValue(draft.object_position)}
                  onChange={(event) =>
                    setDraft((current) => {
                      const nextDraft = { ...current, object_position: normalizePositionValue(event.target.value) };
                      onPositionSave?.(nextDraft);
                      return nextDraft;
                    })
                  }
                  className={inputClassName}
                  translate="no"
                >
                  {galleryPositionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SummaryRow>
            </EditorPanel>
          }
          bottom={
            <EditorPanel label="Detalle" title="Datos de apoyo" hint="Texto alternativo y ajustes visuales.">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.7fr]">
                <Field label="Texto alternativo" value={draft.alt_text} onChange={(value) => setDraft((current) => ({ ...current, alt_text: value }))} />
                <label className="space-y-2">
                  <span className={labelClassName}>Formato</span>
                  <select value={draft.aspect ?? 'landscape'} onChange={(event) => setDraft((current) => ({ ...current, aspect: event.target.value }))} className={inputClassName}>
                    <option value="landscape">Horizontal</option>
                    <option value="portrait">Vertical</option>
                    <option value="square">Cuadrada</option>
                  </select>
                </label>
                <Field
                  label="Rotación"
                  type="number"
                  value={String(draft.rotation ?? 0)}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      rotation: Number.isFinite(Number(value)) ? Number(value) : 0,
                    }))
                  }
                />
              </div>
            </EditorPanel>
          }
        />
      </div>
    </ModalShell>
  );
};

export const FaqCategoryEditorModal = ({
  open,
  category,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  category: SiteFaqCategory;
  onOpenChange: (open: boolean) => void;
  onSave: (category: SiteFaqCategory) => void;
  onDelete: () => void;
}) => {
  const [draft, setDraft] = useState(category);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(category);
    setError(null);
  }, [category, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Categoría FAQ"
      description="Agrupa preguntas frecuentes y edítalas sin salir del panel."
      error={error}
      onDelete={() => {
        onDelete();
        onOpenChange(false);
      }}
      onSave={() => {
        const parsed = faqCategorySchema.safeParse(draft);
        if (!parsed.success) {
          setError(readIssues(parsed.error));
          return;
        }
        onSave(parsed.data);
        onOpenChange(false);
      }}
      maxWidthClassName="max-w-5xl"
    >
      <div className="space-y-5">
        <EditorWorkbench
          columnsClassName="xl:grid-cols-[0.95fr_0.65fr]"
          left={
            <EditorPanel label="Categoría" title="Bloque FAQ" hint="Título visible del grupo.">
              <Field label="Título de categoría" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
            </EditorPanel>
          }
          right={
            <EditorPanel label="Resumen" title="Estado rápido" hint="Conteo y acciones principales." tone="soft">
              <StatCard label="Preguntas" value={draft.items.length} />
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, items: [...current.items, { question: 'Nueva pregunta', answer: 'Nueva respuesta' }] }))}
                className={secondaryButtonClassName}
              >
                <Plus className="h-4 w-4" />
                Agregar pregunta
              </button>
            </EditorPanel>
          }
          bottom={
            <EditorPanel label="Preguntas" title="Lista editable" hint="Cada bloque concentra pregunta, respuesta y orden.">
              <div className="space-y-4">
                {draft.items.map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className={labelClassName}>Pregunta {index + 1}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setDraft((current) => ({ ...current, items: moveItem(current.items, index, -1) }))} disabled={index === 0} className={secondaryButtonClassName}>
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDraft((current) => ({ ...current, items: moveItem(current.items, index, 1) }))} disabled={index === draft.items.length - 1} className={secondaryButtonClassName}>
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDraft((current) => ({ ...current, items: removeAt(current.items, index) }))} disabled={draft.items.length === 1} className={destructiveButtonClassName}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                      <Field label="Texto pregunta" value={item.question} onChange={(value) => setDraft((current) => ({ ...current, items: replaceAt(current.items, index, { ...item, question: value }) }))} />
                      <TextAreaField label="Respuesta" value={item.answer} onChange={(value) => setDraft((current) => ({ ...current, items: replaceAt(current.items, index, { ...item, answer: value }) }))} rows={4} />
                    </div>
                  </div>
                ))}
              </div>
            </EditorPanel>
          }
        />
      </div>
    </ModalShell>
  );
};
