/**
 * ProductsTab — Feature Component (Orquestador)
 *
 * Compone los sub-componentes de la vista de productos.
 * Responsabilidades:
 * - Estado local de UI (búsqueda, paginación, edición, upload, creación)
 * - Handlers de negocio (crear, editar, eliminar, toggle activo, guardar, upload imagen)
 * - Inicialización de datos (useProducts)
 *
 * Rendering delegado a: ProductAdminCard, OrdersPagination (reutilizado).
 */

import { SectionCard } from '@mandys/ui';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, RotateCw, Plus, X, Check, Upload, RotateCw as Spinner } from 'lucide-react';
import { useProducts } from '@/modules/products/hooks/useProducts';
import type { Product } from '@mandys/shared';
import { IMAGE_UPLOAD_ACCEPT } from '@/shared/api/uploadService';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

// Sub-componentes
import { ProductAdminCard } from './ProductAdminCard';
import { OrdersPagination } from '@/modules/orders/components/OrdersPagination';

interface ProductsTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Categorías conocidas del menú de Mandy's
const CATEGORIAS = [
  'Hamburguesas',
  'Wraps',
  'Picaderas',
  'Ensaladas',
  'Postres',
  'Bebidas',
  'Cócteles',
  'Otros',
];

const ITEMS_PER_PAGE = 10;

export const ProductsTab: React.FC<ProductsTabProps> = ({ onSuccess, onError }) => {
  const {
    products,
    isLoading,
    pagination,
    summary,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    uploadProductImage,
  } = useProducts();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const productsTopRef = useRef<HTMLDivElement>(null);
  const hasMountedPageRef = useRef(false);

  // Product editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; descripcion: string; precio_con_iva: number; categoria: string; imagen_url: string; destacado: boolean }>({
    nombre: '', descripcion: '', precio_con_iva: 0, categoria: '', imagen_url: '', destacado: false,
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const pendingToggleIdsRef = useRef<Set<string>>(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New product creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: '',
    descripcion: '',
    precio_con_iva: 0,
    categoria: CATEGORIAS[0],
    imagen_url: '',
    destacado: false,
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);

  useEffect(() => {
    fetchProducts({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      q: debouncedSearchQuery,
      sort: 'featured',
    });
  }, [currentPage, debouncedSearchQuery, fetchProducts]);

  useEffect(() => {
    if (!hasMountedPageRef.current) {
      hasMountedPageRef.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      productsTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, [currentPage]);

  const currentProducts = products;
  const productTotalPages = pagination.totalPages;

  // --- Editing Handlers ---
  const startEditing = useCallback((product: Product) => {
    setEditingProductId(product.id);
    setEditForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio_con_iva: product.precio_con_iva,
      categoria: product.categoria || '',
      imagen_url: product.imagen_url || '',
      destacado: product.destacado ?? false,
    });
    setImagePreview(product.imagen_url || null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingProductId(null);
    setImagePreview(null);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setEditForm((prev) => ({ ...prev, imagen_url: imageUrl }));
    } catch (err) {
      onError('Error subiendo imagen: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProduct = useCallback(async () => {
    if (!editingProductId) return;
    setSavingProduct(true);
    try {
      await updateProduct(editingProductId, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        precio_con_iva: Number(editForm.precio_con_iva),
        categoria: editForm.categoria,
        imagen_url: editForm.imagen_url || null,
        destacado: editForm.destacado,
      });
      setEditingProductId(null);
      setImagePreview(null);
      onSuccess('Producto actualizado correctamente');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSavingProduct(false);
    }
  }, [editForm, editingProductId, onError, onSuccess, updateProduct]);

  const handleDeleteProduct = useCallback(async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${productName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProduct(productId);
      onSuccess(`"${productName}" eliminado correctamente`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [deleteProduct, onError, onSuccess]);

  // --- Toggle Active/Inactive ---
  const handleToggleActive = useCallback(async (product: Product) => {
    if (pendingToggleIdsRef.current.has(product.id)) return;

    pendingToggleIdsRef.current.add(product.id);
    const pendingTimer = window.setTimeout(() => {
      setTogglingProductId(product.id);
    }, 180);

    try {
      await toggleProductActive(product.id, !product.activo);
      onSuccess(`"${product.nombre}" ${product.activo ? 'desactivado' : 'activado'} correctamente`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      window.clearTimeout(pendingTimer);
      pendingToggleIdsRef.current.delete(product.id);
      setTogglingProductId(null);
    }
  }, [onError, onSuccess, toggleProductActive]);

  // --- Create Product Handlers ---
  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setCreateImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingCreateImage(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setCreateForm((prev) => ({ ...prev, imagen_url: imageUrl }));
    } catch (err) {
      onError('Error subiendo imagen: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setUploadingCreateImage(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!createForm.nombre.trim()) {
      onError('El nombre del producto es obligatorio');
      return;
    }
    if (createForm.precio_con_iva <= 0) {
      onError('El precio debe ser mayor a 0');
      return;
    }

    setCreatingProduct(true);
    try {
      await createProduct({
        nombre: createForm.nombre.trim(),
        descripcion: createForm.descripcion.trim() || null,
        precio_con_iva: Number(createForm.precio_con_iva),
        categoria: createForm.categoria,
        imagen_url: createForm.imagen_url || undefined,
        destacado: createForm.destacado,
      });
      onSuccess(`"${createForm.nombre}" creado correctamente`);
      setShowCreateForm(false);
      setCreateForm({ nombre: '', descripcion: '', precio_con_iva: 0, categoria: CATEGORIAS[0], imagen_url: '', destacado: false });
      setCreateImagePreview(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCreatingProduct(false);
    }
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setCreateForm({ nombre: '', descripcion: '', precio_con_iva: 0, categoria: CATEGORIAS[0], imagen_url: '', destacado: false });
    setCreateImagePreview(null);
  };

  return (
    <SectionCard
      title="Catálogo de Productos"
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex h-11 items-center gap-2 rounded-[16px] bg-primary px-4 text-sm font-black text-white transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="h-11 w-full rounded-[16px] border border-zinc-200 bg-white pl-9 pr-4 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-64"
            />
          </div>
          <button onClick={() => fetchProducts({ page: currentPage, limit: ITEMS_PER_PAGE, q: debouncedSearchQuery, sort: 'featured' })} className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900" title="Refrescar">
            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      }
    >
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept={IMAGE_UPLOAD_ACCEPT} className="hidden" onChange={handleImageUpload} aria-label="Subir imagen" title="Subir imagen" />
      <input ref={createFileInputRef} type="file" accept={IMAGE_UPLOAD_ACCEPT} className="hidden" onChange={handleCreateImageUpload} aria-label="Subir imagen de nuevo producto" title="Subir imagen de nuevo producto" />

      {/* ── Formulario de Nuevo Producto ── */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Crear Nuevo Producto
            </h3>
            <button onClick={cancelCreate} className="p-1.5 hover:bg-zinc-200 rounded-lg transition">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Imagen */}
            <div
              onClick={() => createFileInputRef.current?.click()}
              className="h-44 rounded-xl bg-zinc-100 border-2 border-dashed border-zinc-300 hover:border-primary cursor-pointer overflow-hidden flex items-center justify-center transition-colors relative group/img"
            >
              {uploadingCreateImage ? (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <Spinner className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-bold">Subiendo...</span>
                </div>
              ) : createImagePreview || createForm.imagen_url ? (
                <>
                  <img src={createImagePreview || createForm.imagen_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-bold">Cambiar imagen</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <Upload className="w-8 h-8" />
                  <span className="text-xs font-bold">Seleccionar imagen</span>
                  <span className="text-[10px] text-zinc-400">JPG, PNG, WEBP (máx 5MB)</span>
                </div>
              )}
            </div>

            {/* Campos */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nombre *</label>
                <input
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Hamburguesa Clásica"
                  className="w-full bg-white border border-zinc-200 text-black rounded-lg px-3 py-2.5 font-bold text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Precio con IVA (₡) *</label>
                  <input
                    type="number"
                    value={createForm.precio_con_iva || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, precio_con_iva: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full bg-white border border-zinc-200 text-black rounded-lg px-3 py-2.5 font-bold text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Categoría *</label>
                  <select
                    value={createForm.categoria}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 text-black rounded-lg px-3 py-2.5 font-bold text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Descripcion</label>
                <textarea
                  value={createForm.descripcion}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Describe el producto para el menu publico"
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <label className="inline-flex items-center gap-3 text-sm font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={createForm.destacado}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, destacado: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                Mostrar como destacado
              </label>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={cancelCreate}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-xs uppercase tracking-wide transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateProduct}
              disabled={creatingProduct || uploadingCreateImage}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-xs uppercase tracking-wide flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {creatingProduct ? <Spinner className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {creatingProduct ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </div>
      )}

      <div ref={productsTopRef} className="scroll-mt-24" data-admin-products-top="true">
        {/* Contadores */}
        <div className="grid gap-3 px-5 py-4 text-xs font-black text-zinc-500 sm:grid-cols-3">
          <span className="rounded-[16px] border border-zinc-200 bg-zinc-50 px-4 py-3">{summary.totalItems} productos totales</span>
          <span className="rounded-[16px] border border-green-200 bg-green-50 px-4 py-3 text-green-700">{summary.activeItems} activos</span>
          <span className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-red-600">{summary.inactiveItems} inactivos</span>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 md:grid-cols-2 xl:grid-cols-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}>
          {currentProducts.length === 0 && !isLoading && (
            <div className="col-span-full px-6 py-12 text-center text-zinc-500">No se encontraron productos.</div>
          )}
          {currentProducts.map((p) => (
            <ProductAdminCard
              key={p.id}
              product={p}
              isEditing={editingProductId === p.id}
              editForm={editForm}
              uploadingImage={uploadingImage}
              imagePreview={imagePreview}
              savingProduct={savingProduct}
              isTogglingActive={togglingProductId === p.id}
              fileInputRef={fileInputRef}
              startEditing={startEditing}
              cancelEditing={cancelEditing}
              onDeleteProduct={handleDeleteProduct}
              onSaveProduct={saveProduct}
              onToggleActive={handleToggleActive}
              setEditForm={setEditForm}
              categorias={CATEGORIAS}
            />
          ))}
        </div>
      </div>

      {/* Paginación (reutilizada desde orders) */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={productTotalPages}
        onPageChange={setCurrentPage}
      />
    </SectionCard>
  );
};

export default ProductsTab;
