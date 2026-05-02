/**
 * Hook de dominio — Productos
 *
 * Encapsula estado + lógica de red para gestión de productos.
 * Obtiene el token de AuthContext internamente.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthContext';
import * as productService from '@/modules/products/services/productService';
import * as uploadService from '@/shared/api/uploadService';
import type { Product, CreateProductPayload, UpdateProductPayload, PaginationMeta } from '@mandys/shared';
import { DEFAULT_PAGINATION, type ListQueryOptions } from '@/shared/api/pagination';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  summary: productService.ProductsSummary;
  fetchProducts: (options?: ListQueryOptions) => Promise<void>;
  createProduct: (payload: CreateProductPayload) => Promise<void>;
  updateProduct: (productId: string, payload: UpdateProductPayload) => Promise<void>;
  toggleProductActive: (productId: string, nextActive: boolean) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  uploadProductImage: (file: File) => Promise<string>;
}

export function useProducts(): UseProductsReturn {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [summary, setSummary] = useState<productService.ProductsSummary>({
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
  });
  const productsRef = useRef<Product[]>([]);
  const fetchRequestIdRef = useRef(0);
  const lastFetchOptions = useRef<ListQueryOptions>({ page: 1, limit: 10, sort: 'featured' });

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const setProductsState = useCallback(
    (value: Product[] | ((prevProducts: Product[]) => Product[])) => {
      setProducts((prevProducts) => {
        const nextProducts =
          typeof value === 'function'
            ? (value as (prevProducts: Product[]) => Product[])(prevProducts)
            : value;

        productsRef.current = nextProducts;
        return nextProducts;
      });
    },
    [],
  );

  const replaceProductInState = useCallback((updatedProduct: Product) => {
    const previousProduct = productsRef.current.find((product) => product.id === updatedProduct.id);

    if (!previousProduct) {
      return;
    }

    if (previousProduct.activo !== updatedProduct.activo) {
      setSummary((prevSummary) => ({
        ...prevSummary,
        activeItems: prevSummary.activeItems + (updatedProduct.activo ? 1 : -1),
        inactiveItems: prevSummary.inactiveItems + (updatedProduct.activo ? -1 : 1),
      }));
    }

    setProductsState((prevProducts) =>
      prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
    );
  }, [setProductsState]);

  const fetchProducts = useCallback(async (options?: ListQueryOptions) => {
    if (!token) return;
    const requestId = ++fetchRequestIdRef.current;
    lastFetchOptions.current = { ...lastFetchOptions.current, ...(options ?? {}) };
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getAllProducts(token, lastFetchOptions.current);
      if (requestId !== fetchRequestIdRef.current) return;
      setProductsState(data.items);
      setPagination(data.pagination);
      setSummary(data.summary ?? {
        totalItems: data.pagination.totalItems,
        activeItems: 0,
        inactiveItems: 0,
      });
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      if (requestId !== fetchRequestIdRef.current) return;
      setIsLoading(false);
    }
  }, [setProductsState, token]);

  const createProduct = useCallback(async (payload: CreateProductPayload) => {
    if (!token) return;
    try {
      await productService.createProduct(payload, token);
      await fetchProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [token, fetchProducts]);

  const updateProduct = useCallback(async (productId: string, payload: UpdateProductPayload) => {
    if (!token) return;
    try {
      const updatedProduct = await productService.updateProduct(productId, payload, token);
      replaceProductInState(updatedProduct);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [replaceProductInState, token]);

  const toggleProductActive = useCallback(async (productId: string, nextActive: boolean) => {
    if (!token) return;

    const previousProduct = productsRef.current.find((product) => product.id === productId);
    if (!previousProduct) return;

    replaceProductInState({ ...previousProduct, activo: nextActive });

    try {
      const updatedProduct = await productService.updateProductActive(productId, nextActive, token);
      replaceProductInState(updatedProduct);
    } catch (err) {
      replaceProductInState(previousProduct);
      const message = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(message);
    }
  }, [replaceProductInState, token]);

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
    return uploadService.uploadImage(file, token, { bucket: 'product-images' });
  }, [token]);

  return {
    products,
    isLoading,
    error,
    pagination,
    summary,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    uploadProductImage,
  };
}

