# PROMPT — AUDITORÍA, FIX Y OPTIMIZACIÓN DEL PANEL ADMIN DE MANDY'S BAR

> Stack real del proyecto: **React 18 + Vite + TypeScript** (apps/admin) · **Node.js + Express + Prisma** (backend) · **PostgreSQL en Supabase** · **Supabase Storage** (a integrar) · **JWT auth** · **Zod** validación · **NodeCache** server-side cache.
> Monorepo: `apps/admin`, `apps/client`, `backend`, `packages/*`.
> Habilidades aplicadas: `backend-skill`, `security-best-practices`, `optimizacion-estricta-concisa`, `webapp-testing`, `ui-ux-pro-max`, `compacto`.

---

## 0. ROL Y MODO DE TRABAJO

Actúa como **Senior Full-Stack Engineer + Security Reviewer + Performance Engineer** especializado en monorepos React/Express/Prisma/Supabase.

### 0.1 Lectura obligatoria antes de empezar (no skippable)

1. `buenas-practicas-desarrollo.md` — contrato del proyecto. Aplica las 26 secciones en cada cambio. Si algo aquí choca con la guía, **gana la guía**: detente y pregunta.
2. `INFORME_AUDITORIA_MANDYS.md` (raíz, si existe). Lee antes de auditar para no duplicar trabajo.
3. `README.md` raíz + `apps/admin/README.md`.
4. `apps/admin/src/lib/supabase.ts`, `backend/src/routes/uploadRoutes.ts`, `backend/src/modules/products/products.controller.ts`, `apps/admin/src/modules/products/hooks/useProducts.ts` — son los archivos núcleo del problema.

Reglas obligatorias (modo `optimizacion-estricta-concisa`):

- **Cero relleno**. No expliques lo obvio. No repitas lo que ya está bien.
- **Mínimo diff**. Conserva el estilo, naming y arquitectura existentes (`apps/admin/src/modules/<dominio>/{components,hooks,services}` y `backend/src/modules/<dominio>/<dominio>.{controller,routes}.ts`).
- **No rompas funcionalidad existente**. Antes de modificar un archivo, identifica qué imports lo consumen y verifica compatibilidad.
- **No introduzcas frameworks nuevos**. Usa lo que ya está: Prisma, Zod, NodeCache, multer, Supabase JS, React Query no — el proyecto usa hooks propios.
- **Nada de `any` nuevo**. Si encuentras `any`, reemplázalo con tipo correcto solo si está en zona afectada por tu cambio.
- **Cada cambio que toque DB o Storage debe ser idempotente y reversible** (migración o rollback documentado).
- **Cliente y admin son apps separadas.** Si un cambio toca contrato compartido (tipos `@mandys/shared`, endpoints, formatos de imagen), valida ambos lados. Build OK en `apps/admin` Y `apps/client` cuando aplique.
- **No silencies errores.** Logs en backend con detalle técnico, mensaje seguro y entendible al cliente. Nunca expongas stack traces ni códigos internos al frontend.
- **No reutilices identificadores únicos derivados de registros soft-deleted** (ej. `consecutivo_anual` en `Order`). Si un campo tiene `@unique`, asume colisión y manéjala.
- **No hardcodees URLs absolutas.** Usa rutas relativas `/api/...`, `/uploads/...` y helpers de `apps/admin/src/lib/api.ts`.

---

## 1. CONTEXTO DEL PROBLEMA (FUENTE DE VERDAD)

El usuario reporta tres síntomas y muchos problemas de origen desconocido. Tu primera tarea es **diagnosticar** antes de tocar código:

1. **Supabase no está totalmente conectado.**
   - Hoy `backend/src/routes/uploadRoutes.ts` guarda imágenes en disco local (`backend/uploads/`) vía `multer.diskStorage`. Devuelve URLs `/uploads/<archivo>.webp`. **No usa Supabase Storage.**
   - El cliente admin (`apps/admin/src/lib/supabase.ts`) solo se usa para Realtime de `orders` (`useRealtimeOrders.ts`). El resto de mutaciones van por la API Express + Prisma.
   - La DB sí está en Supabase Postgres (`DATABASE_URL` en `backend/.env`), pero el storage no.

2. **Crear producto: la imagen no persiste en Supabase.**
   - Flujo actual: admin → `POST /api/upload` → multer guarda en disco → backend devuelve URL local → admin guarda `imagen_url` con esa ruta.
   - Si el contenedor o servidor reinicia o se redespliega, las imágenes se pierden.

3. **Deshabilitar producto tarda muchos ms.**
   - Síntoma: al hacer toggle de `activo`, la página tarda en re-renderizar.
   - Hipótesis 1 (probable): `invalidateProductCache()` en `backend/src/modules/products/products.controller.ts` hace `productCache.flushAll()` en CADA mutación → la siguiente lectura admin (paginada) hace 4 queries en paralelo (`count`, `findMany`, `count activos`, `count inactivos`) sin caché.
   - Hipótesis 2: el frontend (`useProducts.ts → toggleProductActive`) hace optimistic update bien, pero algún `useEffect` en `ProductsTab.tsx` está disparando `fetchProducts` extra al cambiar estado.
   - Hipótesis 3: latencia de red Supabase Postgres + cold connection del pool Prisma.
   - **Mide antes de optimizar**: agrega logging temporal con `console.time`/`console.timeEnd` en `getAdminProducts` y en el handler `updateProduct` para confirmar dónde se gastan los ms.

---

## 2. OBJETIVO GENERAL

Entregar un panel admin donde:

- **Crear / editar / eliminar / deshabilitar productos** sea instantáneo en UI (optimistic) y persistente en Supabase Postgres + Supabase Storage.
- **Las imágenes** se suban directamente a un bucket de Supabase Storage (`product-images`, `gallery`, `events`, `users-avatars`) con políticas RLS correctas.
- **El toggle activo** complete su roundtrip en < 250 ms en condiciones normales.
- **No haya** caché stale ni invalidaciones masivas innecesarias.
- **Auth, sesión y sincronización** sean robustas: token JWT válido, refresh limpio, logout que invalida sesión backend.
- **Cero filtraciones de seguridad** (CORS, RLS, magic bytes ya validados, headers, rate-limit en endpoints sensibles).

---

## 3. AUDITORÍA OBLIGATORIA — FASE 1 (NO TOCAR CÓDIGO TODAVÍA)

Antes de escribir un solo cambio, genera un **`AUDIT_REPORT.md`** en la raíz del repo con:

### 3.1 Inventario backend
Lista por módulo (`backend/src/modules/<x>/`) los endpoints expuestos, el middleware aplicado, y si tienen:

- Validación Zod ✅/❌
- `authenticate` ✅/❌
- Rate limit ✅/❌
- Manejo de errores tipado ✅/❌
- Caché y su política de invalidación

### 3.2 Inventario frontend admin
Por cada `apps/admin/src/modules/<x>/`:

- Hooks que disparan fetch
- Servicios que tocan API
- Componentes que mutan estado servidor
- ¿Tiene optimistic update?
- ¿Hay `useEffect` con dependencias inestables que cause re-fetch?

### 3.3 Mapeo Supabase
Tabla con: recurso → DB Postgres ✅ → Storage ❌/✅ → Realtime ❌/✅. Marca qué falta conectar.

### 3.4 Top 10 problemas detectados
Ordenados por impacto (P0 = crítico, P1 = importante, P2 = mejora). Para cada uno: archivo:línea, síntoma observable, causa raíz, fix propuesto en 1 línea.

> **No avances a la Fase 2 sin entregar este reporte y esperar luz verde.**

---

## 4. FASE 2 — INTEGRACIÓN SUPABASE STORAGE (PERSISTENCIA DE IMÁGENES)

### 4.1 Backend (`backend/src/routes/uploadRoutes.ts` y nuevo `backend/src/lib/supabaseStorage.ts`)

Refactor obligatorio:

1. Crear `backend/src/lib/supabaseStorage.ts` con un singleton `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`. **Usa Service Role Key solo en backend, jamás en frontend.** Añade `SUPABASE_SERVICE_ROLE_KEY` a `.env.example` (vacío) y a `.env` real (no commitear).
2. Mantener multer **en memoria** (`multer.memoryStorage()`), NO en disco. Esto evita escribir/leer FS innecesariamente.
3. Validar magic bytes desde el buffer (adapta `imageValidator.ts` para aceptar `Buffer`).
4. Convertir a WebP en memoria (adapta `convertToWebp.ts` para aceptar `Buffer` y devolver `Buffer`).
5. Subir el `Buffer` al bucket con `supabase.storage.from(bucket).upload(path, buffer, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })`.
6. Devolver URL pública: `supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl`.
7. El endpoint debe aceptar `?bucket=product-images|gallery|events|users-avatars` y validarlo contra una whitelist server-side.
8. Path convention: `<bucket>/<yyyy>/<mm>/<uuid>.webp`.

### 4.2 Buckets y policies en Supabase

Crea un script `backend/scripts/setup-storage.ts` que (idempotentemente):

- Cree los buckets si no existen (`product-images`, `gallery`, `events`, `users-avatars`) como **public-read**.
- Aplique RLS policies SQL: `select` público, `insert/update/delete` solo para `service_role` (lo hace tu backend).
- Documente las políticas en `backend/scripts/storage-policies.sql` con comentarios.

### 4.3 Migración de imágenes existentes

Crea `backend/scripts/migrate-local-images-to-supabase.ts`:

- Lee `Product.imagen_url`, `GalleryItem.image_url`, `SiteEvent.image_url` que empiecen con `/uploads/...`.
- Sube cada archivo desde disco al bucket correspondiente.
- Actualiza el registro con la URL pública nueva.
- Logea progreso, errores recuperables y total migrado.
- Soporta `--dry-run`.

### 4.4 Frontend admin (`apps/admin/src/shared/api/uploadService.ts`)

- Mantén la interfaz pública (`uploadImage(file, token)`).
- Acepta segundo parámetro opcional `{ bucket?: 'product-images' | 'gallery' | 'events' | 'users-avatars' }`.
- Sigue subiendo al backend (no expongas service role al frontend), el backend hace el upload a Supabase.

---

## 5. FASE 3 — FIX DE PERFORMANCE EN MUTACIONES DE PRODUCTOS

> **Regla de `buenas-practicas` §15:** no optimices por intuición. Antes de aplicar 5.1–5.5 debes tener **medición real** (números antes) en `PERF_REPORT.md`. Si la medición demuestra que no hay problema, no toques nada y reporta.

Archivo: `backend/src/modules/products/products.controller.ts`.

### 5.1 Reemplazar `flushAll()` por invalidación dirigida

`invalidateProductCache()` actualmente borra TODA la caché en cualquier mutación. Esto es la causa más probable de la lentitud post-toggle.

Implementación correcta:

- Mantén dos namespaces: `public:*` y `admin:*`.
- En `updateProduct` cuando solo cambia `activo`/`destacado`/campos no estructurales: invalida solo `admin:*` y `public:list` pero **NO** las páginas paginadas individuales — actualízalas en memoria si están cacheadas, o márcalas como "pendientes de refresh perezoso".
- En `createProduct` y `deleteProduct` (cambian conteos): invalida todo lo paginado.

### 5.2 Reducir las 4 queries del listado admin

`getAdminProducts` hace `count + findMany + count(activos) + count(inactivos)`. Optimizaciones:

- Reemplaza los dos `count` de activos/inactivos por un único `groupBy` por `activo`. Una sola query.
- Mantén el `count` total + `findMany` (estos sí los necesitas).
- Resultado: 4 queries → 3 queries, todas en `Promise.all`.

### 5.3 Connection pool Prisma

Verifica que `DATABASE_URL` use `?pgbouncer=true&connection_limit=1` para serverless o `?connection_limit=10` para servidor persistente. Documenta cuál corresponde según tu deploy.

### 5.4 Endpoint dedicado de toggle

Considera (opcional, si la auditoría lo justifica) un `PATCH /api/products/:id/active` que **solo** actualice `activo` con un `update` mínimo y no invalide caché paginada. Esto baja latencia percibida.

### 5.5 Frontend — eliminar refetch innecesario

En `apps/admin/src/modules/products/components/ProductsTab.tsx`:

- Verifica que el `useEffect([currentPage, debouncedSearchQuery, fetchProducts])` no se dispare por `fetchProducts` cambiando de identidad. `fetchProducts` ya está en `useCallback` en el hook, así que su dep array debe ser estable. Si no lo es, arréglalo.
- Asegúrate que `toggleProductActive` **no** dispara `fetchProducts` después (ya hace optimistic). Confirma que `replaceProductInState` no causa cascada de renders.

---

## 6. FASE 4 — AUTH, SESIÓN Y SINCRONIZACIÓN

### 6.1 Backend

- Verifica que `authenticate` middleware (`backend/src/middlewares/auth.js`) maneje:
  - Token expirado → 401 con `code: 'TOKEN_EXPIRED'` para que el frontend pueda diferenciar.
  - Token inválido → 401 `code: 'TOKEN_INVALID'`.
  - Sin token → 401 `code: 'NO_TOKEN'`.
- Endpoint `POST /api/auth/refresh` (si no existe) que tome refresh token y devuelva nuevo access token. Si no quieres refresh tokens, documenta `JWT_EXPIRES_IN` largo (ej. 8h) + logout explícito.
- Endpoint `POST /api/auth/logout`: invalida server-side (lista negra de jti en Redis o tabla `revoked_tokens` con `expires_at`). Hoy probablemente no existe.
- Rate limit en `POST /api/auth/login` y `POST /api/auth/register`: 5 intentos / 15 min por IP.

### 6.2 Frontend admin (`apps/admin/src/providers/AuthContext`)

- Interceptor en `apps/admin/src/lib/api.ts` que detecte `401 TOKEN_EXPIRED` y haga refresh automático **una sola vez** (cuidado con loops).
- Logout limpia: token de localStorage, estado del context, suscripciones Supabase Realtime activas.
- Sincronización: si el admin tiene varias pestañas abiertas, el logout debe propagarse vía `BroadcastChannel('auth')` o `storage` event.

---

## 7. FASE 5 — SEGURIDAD (`security-best-practices` aplicada)

Revisa y corrige (si aplican):

1. **CORS**: solo orígenes permitidos (admin URL, client URL). Nada de `*`.
2. **Helmet**: añadir `helmet()` en `backend/src/index.ts` con CSP coherente para uploads.
3. **Rate limiting**: `express-rate-limit` en `/api/auth/*`, `/api/upload`, `/api/orders` (creación). Ya identificado.
4. **JWT**: `JWT_SECRET` mínimo 256 bits, no logear el token, no enviarlo en query string.
5. **Zod en TODO body de mutación**. Audita cada controller. Hoy productos sí valida; verifica orders, users, site-content, reservations.
6. **Authorization**: además de `authenticate`, usa middleware `requireRole('ADMIN' | 'STAFF')` en endpoints admin. Verifica que `productRoutes` admin estén protegidos por ambos.
7. **Supabase RLS** en tablas: aunque tu backend usa service role, activa RLS en todas las tablas para que si alguien expone el anon key por error, no pueda leer/escribir. Anon key solo debe poder leer lo público.
8. **Magic bytes** ya validados en uploads ✅.
9. **Sanitización de filename** ya hecha ✅. Reemplaza el filename por UUID en Supabase Storage (no exponer original).
10. **Logs**: nunca logear `password`, `token`, `JWT_SECRET`, `SERVICE_ROLE_KEY`. Audita `console.error` en controllers.
11. **`.env` y `.env.example`**: confirma que `.env` está en `.gitignore` (raíz y `backend/`). `.env.example` debe listar todas las claves vacías.
12. **Webhook secret**: `WEBHOOK_SECRET` se valida con `crypto.timingSafeEqual` en `webhookController.ts`. Verifica.
13. **Site-content y URLs editables por admin**: toda URL externa configurable desde admin (eventos, links de RRSS, banners) debe validarse server-side contra protocolo (`https:` / `http:` / `mailto:` / `tel:`) y normalizarse. Rutas internas deben mapear a rutas reales de la app, no a placeholders.
14. **`target="_blank"` en cualquier link**: agrega `rel="noopener noreferrer"` siempre, en admin y en client.
15. **Static serving**: confirma que `express.static('uploads')` (si existe) NO sirva fuera del directorio (`backend/uploads`). Tras migrar a Supabase Storage en Fase 2, **elimina** la ruta estática local de `backend/src/index.ts` para no dejar superficie expuesta.

---

## 8. FASE 6 — UI/UX (`ui-ux-pro-max` aplicada al admin de productos)

No rediseñes lo que funciona. Solo aplica mejoras quirúrgicas:

- **Feedback inmediato** en toggle activo: spinner pequeño en el switch durante < 250 ms; si excede, mostrar skeleton del card.
- **Toast de error** si falla el toggle, con botón "reintentar" que reaplica la mutación.
- **Estados vacíos** legibles: cuando no hay productos en el filtro, mostrar empty state con CTA "crear producto".
- **Skeleton loaders** en la primera carga, no spinner global.
- **A11y**: todos los `button` deben tener `aria-label`, los `input` `label`, contraste AA, navegación con teclado (Tab + Enter funcionan en cards).
- **Imagen preview**: al subir, mostrar preview local antes de confirmar upload (ahorra UX si la red falla).
- **Optimistic UI**: ya implementado en toggle. Extiéndelo a edición rápida de precio si aplica.

---

## 9. FASE 7 — TESTING (`webapp-testing` con Playwright)

Crea suite mínima en `tests/admin-products.spec.ts`:

1. Login admin → llega a dashboard.
2. Crear producto con imagen → aparece en lista, imagen URL apunta a `*.supabase.co/storage/...`.
3. Editar producto → cambios persisten tras reload.
4. Toggle activo → estado cambia, response < 500 ms (medido), recargar página → estado persiste.
5. Eliminar producto sin órdenes → desaparece. Eliminar producto con órdenes → se marca inactivo.
6. Subir imagen > 5 MB → error claro.
7. Subir archivo no-imagen renombrado a `.png` → rechazado por magic bytes.
8. Logout en una pestaña → otras pestañas se desloguean.
9. Token expirado → refresh transparente o logout limpio (según tu decisión en Fase 4).

Capturas con `webapp-testing` para cada caso: éxito y errores. Logs de consola del navegador adjuntos.

### 9.1 Smoke checklist por área tocada (de `buenas-practicas` §26)

Si un cambio toca el área, el smoke correspondiente es obligatorio antes de cerrar:

- Tocas auth → smoke de login admin + cliente.
- Tocas checkout, `orderService`, PDF u `orders` backend → smoke de pedidos completo (crear, pagar, descargar PDF, consecutivo).
- Tocas `events`, `reservations` o PDF de reserva → smoke de reservaciones.
- Tocas uploads, assets, static serving o `site-content` → smoke de imágenes (subir, ver en client público, eliminar).
- Tocas UI pública → build OK de `apps/client`.
- Tocas panel → build OK de `apps/admin`.
- Tocas endpoints o utilidades server → build + typecheck OK de `backend`.

---

## 10. FASE 8 — VERIFICACIÓN FINAL

Antes de declarar terminado:

- [ ] `npm run build` en `apps/admin` y `backend` sin warnings nuevos.
- [ ] `npm run lint` en ambos sin nuevos errores.
- [ ] `npm run typecheck` (o `tsc --noEmit`) limpio.
- [ ] Ejecutar `tests/admin-products.spec.ts` 100% verde.
- [ ] Auditoría de Lighthouse en admin: Performance > 80, Accessibility > 90.
- [ ] Medición real (con `console.time` o Network tab) de `PATCH /api/products/:id` y `GET /api/products?...` antes y después del fix. Documentar deltas en `PERF_REPORT.md`.
- [ ] Diff total revisado. Sin código muerto. Sin imports sueltos. Sin `console.log` de debug.

---

## 11. ENTREGABLES

1. `AUDIT_REPORT.md` (Fase 1).
2. Cambios de código aplicados (Fases 2–6).
3. `backend/scripts/setup-storage.ts` + `backend/scripts/storage-policies.sql`.
4. `backend/scripts/migrate-local-images-to-supabase.ts`.
5. `tests/admin-products.spec.ts`.
6. `PERF_REPORT.md` con números antes/después.
7. `SECURITY_FINDINGS.md` con hallazgos críticos y su estado (resuelto/pendiente).
8. Resumen final en chat: 1 párrafo por fase, lista de archivos modificados, riesgos residuales.

---

## 12. REGLAS DE COMUNICACIÓN

- Si una decisión tiene trade-off importante (ej. refresh token vs sesión larga), pregunta antes de implementar.
- Si encuentras un problema fuera del scope (ej. orders endpoint sin Zod), añádelo a `AUDIT_REPORT.md` como P1/P2 pero **no** lo arregles sin permiso.
- Si una hipótesis del usuario resulta falsa tras medir (ej. el toggle NO es lento por la caché), repórtalo y propón nueva línea de investigación.
- Respuestas en chat: máximo 8 líneas por avance. El detalle va a los .md.
- Commits: pequeños, atómicos, una intención por commit (refactor / fix / feat). No mezcles assets sin relación.

---

## 13. CHECKLIST DE ENTREGA FINAL (de `buenas-practicas` §24)

Antes de declarar terminado, marca cada uno:

- [ ] El cambio compila en `apps/admin`, `apps/client` (si tocó client) y `backend`.
- [ ] Typecheck limpio (`tsc --noEmit`).
- [ ] No rompiste rutas, imports ni contratos compartidos en `@mandys/shared`.
- [ ] Sin hardcodes evitables. Sin secretos en frontend. Sin `console.log` de debug.
- [ ] La solución sigue el patrón del repo (módulos por dominio, services + hooks + components).
- [ ] Mensajes de error: detalle técnico al log, mensaje seguro y entendible al usuario.
- [ ] Verificado con un comando o repro concreto, no de memoria.
- [ ] Smoke de áreas tocadas ejecutado (§9.1).
- [ ] `AUDIT_REPORT.md`, `PERF_REPORT.md` y `SECURITY_FINDINGS.md` actualizados.
