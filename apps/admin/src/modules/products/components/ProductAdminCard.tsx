/**
 * ProductAdminCard — Sub-componente visual
 *
 * Tarjeta de producto para el panel admin con dos modos:
 * - VIEW: muestra imagen, nombre, categoría, precio, estado activo/inactivo con toggle
 * - EDIT: formulario inline con upload de imagen, nombre, precio, categoría y botones guardar/cancelar
 *
 * Usa React.memo para evitar re-renders innecesarios.
 */

import React, { useState } from 'react';
import {
  Pencil, Trash2, Upload, RotateCw,
  Check, X, Image as ImageIcon, ToggleLeft, ToggleRight,
} from 'lucide-react';
import type { Product } from '@mandys/shared';
import { IMAGE_UPLOAD_ACCEPT } from '@/shared/api/uploadService';

interface ProductAdminCardProps {
  product: Product;
  isEditing: boolean;
  editForm: { nombre: string; descripcion: string; precio_con_iva: number; categoria: string; imagen_url: string; destacado: boolean };
  uploadingImage: boolean;
  imagePreview: string | null;
  savingProduct: boolean;
  isTogglingActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  categorias: string[];
  startEditing: (p: Product) => void;
  cancelEditing: () => void;
  onDeleteProduct: (id: string, name: string) => void;
  onSaveProduct: () => void;
  onToggleActive: (product: Product) => void;
  setEditForm: React.Dispatch<React.SetStateAction<{ nombre: string; descripcion: string; precio_con_iva: number; categoria: string; imagen_url: string; destacado: boolean }>>;
}

/**
 * Resuelve la URL de la imagen manejando casos de:
 * - URL absoluta (https://...)
 * - Ruta relativa con slash (/uploads/...)
 * - Ruta relativa sin slash (uploads/...)
 * - Solo nombre de archivo (imagen.jpg)
 */
function resolveImageUrl(path?: string | null) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return path;
  if (path.startsWith('/uploads/')) return path;
  if (path.startsWith('/images/')) return path;
  if (path.startsWith('uploads/')) return `/${path}`;
  if (path.startsWith('images/')) return `/${path}`;
  return `/uploads/${path}`;
}

export const ProductAdminCard = React.memo(({
  product: p, isEditing, editForm, uploadingImage, imagePreview, savingProduct, isTogglingActive, fileInputRef,
  categorias, startEditing, cancelEditing, onDeleteProduct, onSaveProduct, onToggleActive, setEditForm,
}: ProductAdminCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Resetear error si cambia el producto
  React.useEffect(() => {
    setImageError(false);
  }, [p.imagen_url, imagePreview]);

  return (
    <div className={`admin-product-card group relative rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_20px_48px_rgba(15,23,42,0.08)] ${!p.activo ? 'opacity-60' : ''}`}>
      {isEditing ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 rounded-xl bg-zinc-100 border-2 border-dashed border-zinc-300 hover:border-primary cursor-pointer overflow-hidden flex items-center justify-center transition-colors relative group/img"
          >
            {uploadingImage ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <RotateCw className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-bold">Subiendo...</span>
              </div>
            ) : (imagePreview || editForm.imagen_url) && !imageError ? (
              <>
                <img 
                  src={imagePreview || resolveImageUrl(editForm.imagen_url)} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-bold">Cambiar imagen</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-zinc-400">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs font-bold">{imageError ? 'Error al cargar' : 'Subir imagen'}</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={IMAGE_UPLOAD_ACCEPT}
              onChange={() => setImageError(false)}
            />
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={editForm.nombre}
              onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
              className="w-full px-3 py-2 text-sm font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Nombre del producto"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">₡</span>
                <input
                  type="number"
                  value={editForm.precio_con_iva}
                  onChange={e => setEditForm({ ...editForm, precio_con_iva: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2 text-sm font-black text-primary bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <select
                value={editForm.categoria}
                onChange={e => setEditForm({ ...editForm, categoria: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <textarea
              value={editForm.descripcion}
              onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
              rows={3}
              className="w-full resize-none px-3 py-2 text-sm font-medium bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Descripcion del producto"
            />
            <label className="inline-flex items-center gap-3 text-sm font-bold text-zinc-700">
              <input
                type="checkbox"
                checked={editForm.destacado}
                onChange={e => setEditForm({ ...editForm, destacado: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              Mostrar como destacado
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onSaveProduct}
              disabled={savingProduct || uploadingImage}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {savingProduct ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {savingProduct ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={cancelEditing}
              className="px-4 py-2.5 bg-zinc-100 text-zinc-500 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-100">
            {p.imagen_url && !imageError ? (
              <img
                src={resolveImageUrl(p.imagen_url)}
                alt={p.nombre}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                onError={() => setImageError(true)}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-zinc-300" />
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="line-clamp-2 text-sm font-black leading-tight text-zinc-900">{p.nombre}</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase rounded-full tracking-wide">
                    {p.categoria}
                  </span>
                  {p.destacado && (
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full tracking-wide">
                      Destacado
                    </span>
                  )}
                </div>
                {p.descripcion && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{p.descripcion}</p>
                )}
              </div>
              <button
                onClick={() => onToggleActive(p)}
                disabled={isTogglingActive}
                className={`rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${p.activo ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-300'}`}
                aria-label={p.activo ? 'Desactivar producto' : 'Activar producto'}
              >
                {isTogglingActive ? (
                  <RotateCw className="w-5 h-5 animate-spin" />
                ) : p.activo ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-lg font-black text-primary">₡{p.precio_con_iva.toLocaleString()}</p>
              
              <div className="flex items-center gap-1.5 opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(p)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  aria-label="Editar producto"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteProduct(p.id, p.nombre)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.product !== nextProps.product) return false;
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  if (prevProps.isTogglingActive !== nextProps.isTogglingActive) return false;

  if (!prevProps.isEditing && !nextProps.isEditing) {
    return true;
  }

  return (
    prevProps.editForm === nextProps.editForm &&
    prevProps.uploadingImage === nextProps.uploadingImage &&
    prevProps.imagePreview === nextProps.imagePreview &&
    prevProps.savingProduct === nextProps.savingProduct &&
    prevProps.categorias === nextProps.categorias
  );
});

ProductAdminCard.displayName = 'ProductAdminCard';
