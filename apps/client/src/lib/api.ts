/**
 * API Client centralizado para Mandy's Bar
 * 
 * Wrapper sobre fetch que agrega automáticamente:
 * - Encabezado CSRF (X-Requested-With)
 * - Encabezado Authorization (JWT)
 * - Content-Type para JSON
 * 
 * Principio de Agnosticismo de Dependencias: si se cambia
 * el cliente HTTP, solo se edita este archivo.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const hasApiSuffix = (value: string) => /\/api\/?$/.test(value);
const isProxyableEndpoint = (value: string) => /^\/(api|uploads|images)(\/|$)/.test(value);

const buildUrl = (endpoint: string) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const normalizedBase = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  let normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  if (import.meta.env.DEV && normalizedBase.startsWith('http') && isProxyableEndpoint(normalizedEndpoint)) {
    return normalizedEndpoint;
  }

  if (hasApiSuffix(normalizedBase) && normalizedEndpoint === '/api') {
    return normalizedBase;
  }

  if (hasApiSuffix(normalizedBase) && normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = normalizedEndpoint.slice(4);
  }

  return `${normalizedBase}${normalizedEndpoint}`;
};

interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** Si es true, no agrega Content-Type (útil para FormData) */
  isFormData?: boolean;
}

/**
 * Realiza una petición HTTP segura al backend.
 * Agrega automáticamente headers de seguridad (CSRF, Auth).
 */
export const apiFetch = async (
  endpoint: string,
  token?: string | null,
  options: ApiRequestOptions = {}
): Promise<Response> => {
  const { headers = {}, isFormData = false, ...restOptions } = options;

  const secureHeaders: Record<string, string> = {
    // Encabezado CSRF obligatorio para peticiones mutantes
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  // Agregar Authorization si hay token
  if (token) {
    secureHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Agregar Content-Type solo si no es FormData
  if (!isFormData && !secureHeaders['Content-Type']) {
    secureHeaders['Content-Type'] = 'application/json';
  }

  const url = buildUrl(endpoint);

  return fetch(url, {
    ...restOptions,
    headers: secureHeaders,
  });
};

export const readApiJson = async <T = unknown>(response: Response): Promise<T> => {
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    if (response.ok) {
      throw new Error('El servidor devolvio una respuesta invalida.');
    }

    return {} as T;
  }
};

/**
 * Shorthand para GET requests
 */
export const apiGet = (endpoint: string, token?: string | null) =>
  apiFetch(endpoint, token, { method: 'GET' });

/**
 * Shorthand para POST requests con JSON body
 */
export const apiPost = (endpoint: string, body: unknown, token?: string | null) =>
  apiFetch(endpoint, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

/**
 * Shorthand para PUT requests con JSON body
 */
export const apiPut = (endpoint: string, body: unknown, token?: string | null) =>
  apiFetch(endpoint, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

/**
 * Shorthand para DELETE requests
 */
export const apiDelete = (endpoint: string, token?: string | null, body?: unknown) =>
  apiFetch(endpoint, token, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

/**
 * Para subida de archivos (FormData)
 */
export const apiUpload = (endpoint: string, formData: FormData, token?: string | null) =>
  apiFetch(endpoint, token, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
