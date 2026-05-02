# Stack y arquitectura

## Entry point real

- `backend/src/index.ts` es el punto de entrada operativo.
- Monta rutas para `auth`, `orders`, `products`, `users`, `upload`, `profile`, `webhooks`, `reservations` y `site-content`.
- Tambien define:
  - `helmet` + CSP
  - `cors`
  - `requestSanitizer`
  - `authRateLimiter` y `orderRateLimiter`
  - static mounts `/uploads` y `/images`
  - `healthz` y `readyz`
  - warm-up de cache publica para productos y site-content

## Modulos principales

- `backend/src/modules/products`
  - `products.routes.ts`
  - `products.controller.ts`
- `backend/src/modules/orders`
  - `orders.routes.ts`
  - `orders.controller.ts`
- `backend/src/modules/reservations`
  - `reservations.routes.ts`
  - `reservations.controller.ts`
- `backend/src/modules/users`
  - `users.routes.ts`
  - `users.controller.ts`
- `backend/src/modules/site-content`
  - `site-content.routes.ts`
  - `site-content.controller.ts`
  - `site-content.defaults.ts`

## Rutas legacy en `backend/src/routes/*`

Rutas vivas que siguen fuera de `modules/*`:

- `authRoutes.ts`
- `uploadRoutes.ts`
- `profileRoutes.ts`
- `webhookRoutes.ts`

Artefactos como `productRoutes.d.ts`, `orderRoutes.d.ts`, `userRoutes.d.ts` no son la fuente viva del backend. Son residuos de compilacion o de estructura anterior y no deben guiar cambios nuevos.

## Middlewares clave

- `backend/src/middlewares/auth.ts`
  - define `AuthRequest`
  - `authenticate`
  - `authorize`
- `backend/src/middlewares/security.ts`
  - `enforceHttps`
  - `requestSanitizer`
  - `globalErrorHandler`
  - `additionalSecurityHeaders`
- `backend/src/middlewares/rateLimiter.ts`
  - `authRateLimiter`
  - `orderRateLimiter`

## Prisma

- Schema principal: `backend/prisma/schema.prisma`
- Seed actual: `backend/prisma/seed.ts`
- Cliente generado: `backend/src/generated/client/*`
- Acceso runtime: `backend/src/lib/prisma.ts`

Modelos de negocio que cruzan con frontend/admin:

- `User`
- `Product`
- `Order` + `OrderItem`
- `Reservation`
- `SiteSetting`
- `SiteEvent`
- `GalleryItem`
- `ContentRevision`

## Assets estaticos y uploads

- `/uploads`
  - servido desde `backend/uploads`
  - usado para imagenes subidas en runtime
- `/images`
  - servido desde `backend/public/images`
  - durante `backend` build/start se sincroniza desde `apps/client/public/images` via `backend/scripts/sync-client-images.mjs`

## Fuente de verdad y zonas mixtas

Fuente de verdad operativa:

- Productos, ordenes, reservaciones, usuarios y site-content viven en PostgreSQL via Prisma y se exponen por la API backend.

Mezclas que requieren cuidado:

- `apps/client/src/services/api/productService.ts` mantiene fallback estatico desde `menuData`; un fallo backend puede quedar oculto por ese catalogo local.
- `apps/client/src/modules/site-content/services/siteContentService.ts` cachea `site-content` en `localStorage`.
- `apps/client/src/modules/site-content/hooks/useSiteContentRealtime.ts` refresca por Supabase realtime.
- `apps/admin/src/modules/orders/hooks/useRealtimeOrders.ts` y `apps/client/src/modules/orders/hooks/useRealtimeOrders.ts` dependen de Supabase para reflejar cambios de ordenes.
- Imagenes de marca viven en `apps/client/public/images`, pero el backend tambien las sirve tras sincronizacion al construir o arrancar.

Cuando un bug parece "solo frontend", confirma primero si viene de una de estas capas mixtas antes de tocar la UI.
