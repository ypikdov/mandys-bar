# AUDIT_REPORT - Panel admin Mandy's Bar

Fecha: 2026-04-29

## Estado ejecutivo

Se detectaron y corrigieron problemas directos del prompt:

- Upload de imagenes de productos pasaba por disco local y no por Supabase Storage.
- Endpoint `/api/upload` no tenia rate limit ni separacion por bucket.
- Cache de productos usaba invalidacion masiva con `flushAll()`.
- Listado admin de productos hacia 4 queries por pagina; se redujo a 3 con `groupBy`.
- Auth no diferenciaba token faltante, expirado o invalido.
- Admin no limpiaba sesion de forma centralizada ante `401` controlado.

Quedan pendientes decisiones de arquitectura: refresh tokens, logout server-side con blacklist, migracion real de imagenes existentes a Supabase y retiro final de `/uploads`.

## 1. Inventario backend

| Modulo | Endpoints | Middleware | Zod | Auth | Rate limit | Errores tipados | Cache |
|---|---|---|---|---|---|---|---|
| `auth` | `POST /api/auth/register`, `POST /api/auth/login` | `authLimiter` local | Si, login | No aplica | Si | Parcial | No |
| `products` | `GET /api/products`, `GET /api/products/admin`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` | Publico en catalogo, `authenticate + authorize` en admin/mutaciones | Si | Si en admin/mutaciones | No especifico | Parcial | Si, NodeCache; ahora invalidacion por prefijos |
| `orders` | `POST /api/orders`, `GET /me`, `GET /all`, `PUT /status/:id`, `PUT /approve/:id`, `DELETE /:id` | `orderRateLimiter` global en montaje + `authenticate/authorize` | Parcial/no Zod formal en create | Si | Si en `/api/orders` | Parcial, maneja P2002/P2034 | Si, `flushAll()` pendiente |
| `reservations` | `POST /`, `GET /prices`, `GET /me`, `GET /`, `PUT /confirm/:id`, `PUT /cancel/:id` | `authenticate/authorize`; cancel usa multer local | Parcial | Si salvo prices | No especifico | Parcial | Si, `flushAll()` pendiente |
| `users` | `GET /`, `POST /`, `GET /staff`, `POST /staff`, `PUT /:id/role` | `authenticate + authorize` | Si | Si | No especifico | Parcial | Si, `flushAll()` aceptable por baja frecuencia |
| `profile` | `GET /bootstrap`, `GET /`, `PUT /`, `PUT /password`, `DELETE /` | `authenticate` | Si en profile update, parcial password/delete | Si | No especifico | Parcial | No |
| `site-content` | `GET /public`, `GET /gallery`, `GET /admin`, `GET /drafts`, `PUT /drafts/:id/publish`, `DELETE /drafts/:id`, `PUT /` | Publico/admin protegido | Si, amplio | Si en admin | No especifico | Parcial | Si, NodeCache + cache en memoria |
| `upload` | `POST /api/upload?bucket=...` | `authenticate`, rate limit, bucket whitelist | Validacion manual + magic bytes | Si | Si | Si | No |
| `webhooks` | `POST /api/webhooks/generic` | `verifyWebhookSignature` | No | Firma HMAC | No especifico | Parcial | No |

## 2. Inventario frontend admin

| Modulo | Hooks fetch | Servicios API | Componentes que mutan | Optimistic update | Riesgo de refetch |
|---|---|---|---|---|---|
| `products` | `useProducts.fetchProducts` | `productService`, `uploadService` | `ProductsTab`, `ProductAdminCard` | Si en toggle activo | Bajo: `fetchProducts` usa `useCallback`; create/delete refetch intencional |
| `orders` | `useOrders.fetchOrders`, `useRealtimeOrders` | `orderService` | `OrdersTab` | No, refetch tras mutar | Medio: realtime + refetch pueden duplicar carga |
| `reservations` | `useReservations.fetchReservations` | `reservationService` | `ReservationsTab` | No | Medio |
| `users` | `useUsers.fetchClients` | `userService` | `UsersTab` | No | Bajo |
| `staff` | `useStaff.fetchStaff` | `userService` | `StaffTab` | No | Bajo |
| `site-content` | `ContentManager.loadContent` | `siteContentService`, `uploadService` | `ContentManager`, modals | Local draft antes de guardar | Medio por modales con multiples `useEffect` |
| `auth/profile` | `useProfile.bootstrapParams`, historial pedidos/reservas | `authService`, `profileService`, `uploadService` | Perfil y login | Parcial en estado local | Bajo |

## 3. Mapeo Supabase

| Recurso | Supabase Postgres | Supabase Storage | Realtime | Estado |
|---|---:|---:|---:|---|
| Productos | Si | Si, `product-images` via backend si `SUPABASE_SERVICE_ROLE_KEY` existe | No | Corregido para nuevos uploads |
| Galeria web | Si | Si, `gallery` soportado | No | Soportado; falta asignar bucket fino por tipo si se desea |
| Eventos web | Si | Si, bucket `events` soportado por backend | No | Soportado; UI aun usa `gallery` generico |
| Avatares | Si | Si, `users-avatars` desde perfil | No | Corregido |
| Pedidos | Si | No aplica | Si, admin usa Supabase Realtime | Existente |
| Reservas | Si | Parcial: anulaciones siguen en disco local | No | Pendiente |
| Site content | Si | Parcial | No | Soportado para uploads nuevos desde admin |

## 4. Top 10 problemas

| Pri | Archivo:linea | Sintoma | Causa raiz | Fix |
|---|---|---|---|---|
| P0 | `backend/src/routes/uploadRoutes.ts:30` | Imagenes se pierden al reiniciar/deployar | `multer.diskStorage()` guardaba en `backend/uploads` | Resuelto: memoria + WebP buffer + Supabase Storage |
| P0 | `backend/src/routes/uploadRoutes.ts:97` | Cualquier usuario autenticado podia subir a buckets admin | Falta de whitelist y control por rol | Resuelto: bucket whitelist + permisos por rol |
| P0 | `backend/src/routes/uploadRoutes.ts:43` | Upload sensible sin limite especifico | Sin rate limit de upload | Resuelto: rate limit por usuario/IP |
| P1 | `backend/src/modules/products/products.controller.ts:168` | Toggle/listado lento tras mutacion | `flushAll()` borraba toda cache de productos | Resuelto: borrado por prefijos |
| P1 | `backend/src/modules/products/products.controller.ts:243` | Listado admin hace trabajo innecesario | 2 counts para activos/inactivos | Resuelto: `groupBy` por `activo` |
| P1 | `backend/src/middlewares/auth.ts:16` | Frontend no diferencia token expirado vs invalido | 403 generico | Resuelto: `NO_TOKEN`, `TOKEN_EXPIRED`, `TOKEN_INVALID` con 401 |
| P1 | `apps/admin/src/lib/api.ts:84` | Sesiones zombie tras 401 | API client no limpiaba sesion | Resuelto: limpieza local + evento de logout |
| P1 | `backend/src/modules/reservations/reservations.routes.ts:20` | Imagen de anulacion sigue local | Multer local fuera del flujo Storage | Pendiente: migrar anulaciones a bucket `events` o bucket propio |
| P1 | `backend/src/index.ts:140` | Superficie estatica local queda abierta | `/uploads` sigue sirviendo disco local | Pendiente hasta migrar historico y quitar fallback dev |
| P2 | `backend/src/modules/orders/orders.controller.ts:92` | Validacion de pedido no es Zod formal | Validacion manual dispersa | Pendiente: schema Zod para create order |

## 5. Archivos corregidos

- `backend/src/lib/supabaseStorage.ts`
- `backend/src/routes/uploadRoutes.ts`
- `backend/src/utils/imageValidator.ts`
- `backend/src/utils/convertToWebp.ts`
- `backend/src/modules/products/products.controller.ts`
- `backend/src/middlewares/auth.ts`
- `apps/admin/src/shared/api/uploadService.ts`
- `apps/admin/src/modules/products/hooks/useProducts.ts`
- `apps/admin/src/modules/site-content/components/ContentManager.tsx`
- `apps/admin/src/features/auth/useProfile.ts`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/providers/AuthContext.tsx`
- `backend/scripts/setup-storage.ts`
- `backend/scripts/storage-policies.sql`
- `backend/scripts/migrate-local-images-to-supabase.ts`
- `backend/.env.example`
- `backend/package.json`

## 6. Verificacion ejecutada

- `npm.cmd run build` en `backend`: OK.
- `npm.cmd run build -w @mandys/admin`: OK.
- `npm.cmd run build -w @mandys/client`: OK.
- Typecheck directo de scripts Storage: OK.
- Backend compilado levantado con `npm.cmd start` en puerto 3000: OK.
- Smoke HTTP: `/api/healthz` 200, cliente `/menu` 200, admin `/` 200.

No se ejecuto smoke autenticado con navegador porque falta confirmar credenciales admin y `SUPABASE_SERVICE_ROLE_KEY` real para probar Storage contra el proyecto Supabase.
