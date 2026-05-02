/**
 * Hook de dominio — Productos
 *
 * Encapsula estado + lógica de red para gestión de productos.
 * Obtiene el token de AuthContext internamente.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as productService from '@/services/api/productService';
import * as uploadService from '@/services/api/uploadService';
import type { Product, UpdateProductPayload } from '@mandys/shared';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  updateProduct: (productId: string, payload: UpdateProductPayload) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  uploadProductImage: (file: File) => Promise<string>;
}

export function useProducts(): UseProductsReturn {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getAllProducts(token);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updateProduct = useCallback(async (productId: string, payload: UpdateProductPayload) => {
    if (!token) return;
    try {
      await productService.updateProduct(productId, payload, token);
      await fetchProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, fetchProducts]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!token) return;
    try {
      await productService.deleteProduct(productId, token);
      await fetchProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, fetchProducts]);

  const uploadProductImage = useCallback(async (file: File): Promise<string> => {
    if (!token) throw new Error('No autenticado');
    return uploadService.uploadImage(file, token);
  }, [token]);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    updateProduct,
    deleteProduct,
    uploadProductImage,
  };
}
