/**
 * API Client centralizado para Mandy's Bar
 *
 * Wrapper sobre fetch que agrega automáticamente:
 * - Encabezado Authorization (JWT)
 * - Content-Type para JSON
 *
 * Principio de Agnosticismo de Dependencias: si se cambia
 * el cliente HTTP, solo se edita este archivo.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AUTH_TOKEN_KEY = 'mandys_auth_token';
const AUTH_USER_KEY = 'mandys_auth_user';
const AUTH_LOGOUT_EVENT = 'mandys_auth_logout';

const hasApiSuffix = (value: string) => /\/api\/?$/.test(value);
const isProxyableEndpoint = (value: string) => /^\/(api|uploads)(\/|$)/.test(value);

/**
 * Normaliza la URL combinando la base y el endpoint evitando dobles slashes.
 */
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
 * Agrega automáticamente headers de autenticación y formato.
 * Prioriza el token pasado por argumento sobre el de localStorage.
 */
export async function apiFetch(
  endpoint: string,
  tokenOverride?: string | null,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { headers, isFormData: isFormDataOverride = false, ...restOptions } = options;
  const token = tokenOverride ?? localStorage.getItem(AUTH_TOKEN_KEY);

  const isFormData = isFormDataOverride || restOptions.body instanceof FormData;
  const secureHeaders: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (token) {
    secureHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Solo agregar application/json si no es FormData y no se ha especificado otro
  if (!isFormData && !secureHeaders['Content-Type']) {
    secureHeaders['Content-Type'] = 'application/json';
  }

  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    ...restOptions,
    headers: secureHeaders,
  });

  if (response.status === 401) {
    const payload = await response.clone().json().catch(() => null) as { code?: string } | null;
    if (payload?.code === 'TOKEN_EXPIRED' || payload?.code === 'TOKEN_INVALID' || payload?.code === 'NO_TOKEN') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }
  }

  return response;
}

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
 * Shorthand para PATCH requests con JSON body
 */
export const apiPatch = (endpoint: string, body: unknown, token?: string | null) =>
  apiFetch(endpoint, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

/**
 * Shorthand para DELETE requests
 * Soportamos (endpoint, body, token) para ser consistente con POST/PUT
 */
export const apiDelete = (endpoint: string, body?: unknown, token?: string | null) =>
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
