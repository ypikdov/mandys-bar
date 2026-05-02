import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Seguridad Avanzada para Mandy's Bar
 * Implementa protección contra inyección, CSRF y forzado de HTTPS
 */

// ─────────────────────────────────────────────────────────
// 1. ENFORCE HTTPS (Rechaza tráfico no cifrado en producción)
// ─────────────────────────────────────────────────────────
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Permitir solicitudes preflight (OPTIONS) para que CORS funcione
  if (req.method === 'OPTIONS') {
    return next();
  }

  // En desarrollo local, permitir HTTP
  if (!isProduction) return next();

  // Verificar si la solicitud es HTTPS.
  // req.secure es true si la conexión es TLS. Si estamos detrás de un Load Balancer (como AWS o Vercel),
  // leemos 'x-forwarded-proto'.
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  // Condición estricta: si el protocolo detectado es explícitamente HTTP (y no secure), rechazamos.
  if (!isSecure || req.protocol === 'http') {
    console.warn(`[SECURITY] Solicitud HTTP rechazada desde IP: ${req.ip} - ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
      error: 'Se requiere una conexión segura (HTTPS). Las solicitudes HTTP no están permitidas en este entorno.',
      code: 'HTTPS_REQUIRED'
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────
// 2. REQUEST SANITIZER (Filtrado de caracteres peligrosos)
// ─────────────────────────────────────────────────────────

/**
 * Patrones peligrosos que indican intentos de inyección SQL/NoSQL/XSS
 * No afecta a campos que legítimamente podrían contener estos caracteres 
 * (como passwords, que nunca se insertan directamente en queries gracias a bcrypt)
 */
const INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE|UNION|TRUNCATE)\b\s)/i,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,  // OR 1=1, AND 1=1
  /((^|\s)--(?=\s|$)|\/\*|\*\/)/,        // SQL comments reales, evita falsos positivos con '#'
  /(<script[\s>]|<\/script>|javascript:|(?:^|[\s"'`<{/(])on\w+\s*=)/i, // XSS patterns reales, evita falsos positivos como "controls="
  /(\$\{|`.*`)/,                          // Template injection
  /(\{\s*\$\w+)/,                         // NoSQL injection ($gt, $ne, etc.)
];

/** Campos que se excluyen de la sanitización (passwords, contenido libre) */
const SANITIZE_EXCLUDE_FIELDS = ['password', 'password_hash', 'token', 'observacion_pago', 'motivo_anulacion', 'detalles', 'details'];

/**
 * Verifica recursivamente si un valor contiene patrones de inyección
 */
const containsInjectionPattern = (value: unknown, fieldName: string = ''): boolean => {
  // Excluir campos que pueden contener contenido libre
  if (SANITIZE_EXCLUDE_FIELDS.includes(fieldName.toLowerCase())) return false;

  if (typeof value === 'string') {
    return INJECTION_PATTERNS.some(pattern => pattern.test(value));
  }
  
  if (Array.isArray(value)) {
    return value.some(item => containsInjectionPattern(item, fieldName));
  }
  
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, val]) => containsInjectionPattern(val, key)
    );
  }
  
  return false;
};

export const requestSanitizer = (req: Request, res: Response, next: NextFunction) => {
  // Verificar body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (containsInjectionPattern(value, key)) {
        console.warn(
          `[SECURITY] Intento de inyección bloqueado - IP: ${req.ip}, ` +
          `Ruta: ${req.method} ${req.originalUrl}, Campo: ${key}`
        );
        return res.status(400).json({
          error: 'La solicitud contiene caracteres o patrones no permitidos.',
          code: 'INJECTION_BLOCKED'
        });
      }
    }
  }

  // Verificar query params
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (containsInjectionPattern(value, key)) {
        console.warn(
          `[SECURITY] Intento de inyección en query params - IP: ${req.ip}, ` +
          `Ruta: ${req.method} ${req.originalUrl}, Param: ${key}`
        );
        return res.status(400).json({
          error: 'Los parámetros de consulta contienen patrones no permitidos.',
          code: 'INJECTION_BLOCKED'
        });
      }
    }
  }

  next();
};

// ─────────────────────────────────────────────────────────
// 3. CSRF PROTECTION (Defense-in-depth para SPA con JWT)
// ─────────────────────────────────────────────────────────

/**
 * Dado que la app usa JWT vía Authorization header (no cookies),
 * el riesgo de CSRF es inherentemente bajo. Sin embargo, como defensa
 * en profundidad, verificamos que las peticiones mutantes (POST/PUT/DELETE)
 * incluyan un encabezado personalizado que los navegadores no envían 
 * automáticamente en solicitudes cross-origin.
 */
const CSRF_HEADER_NAME = 'x-requested-with';
const CSRF_HEADER_VALUE = 'XMLHttpRequest';

/** Rutas exentas de CSRF check (webhooks, health checks) */
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks',
  '/api/healthz',
  '/api/readyz'
];

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Solo verificar métodos mutantes (GET/HEAD/OPTIONS son seguros)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // Verificar si la ruta está exenta
  const isExempt = CSRF_EXEMPT_PATHS.some(path => req.originalUrl.startsWith(path));
  if (isExempt) return next();

  // Si la petición lleva un Bearer token en Authorization, el riesgo de CSRF
  // es inherentemente nulo (los browsers no agregan este header automáticamente).
  // Solo exigimos X-Requested-With para peticiones SIN token de autorización.
  const hasAuthorizationBearer = req.headers.authorization?.startsWith('Bearer ');
  if (hasAuthorizationBearer) return next();

  // Para peticiones sin JWT (login, registro, etc.), verificar X-Requested-With
  const headerValue = req.headers[CSRF_HEADER_NAME];
  if (headerValue !== CSRF_HEADER_VALUE) {
    console.warn(
      `[SECURITY] Solicitud sin encabezado CSRF - IP: ${req.ip}, ` +
      `Ruta: ${req.method} ${req.originalUrl}`
    );
    return res.status(403).json({
      error: 'Solicitud rechazada: falta encabezado de seguridad.',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────
// 4. GLOBAL ERROR HANDLER (Evita fugas de información)
// ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as Request & { id?: string }).id || 'unknown';
  
  // Loguear el error completo en el servidor
  console.error(`[ERROR][${requestId}] ${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  // Respuesta genérica al cliente (sin detalles de stack trace)
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    error: 'Ha ocurrido un error interno en el servidor.',
    ...(isProduction ? {} : { details: err.message }),
    requestId
  });
};

// ─────────────────────────────────────────────────────────
// 5. SECURITY HEADERS ADICIONALES
// ─────────────────────────────────────────────────────────

export const additionalSecurityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Prevenir que el navegador adivine el Content-Type (evita ataques MIME sniffing)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevenir que la página sea embebida en iframes de otros dominios (clickjacking)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Activar protección XSS del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy: no enviar referer a terceros
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy: restringir APIs del navegador
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};
