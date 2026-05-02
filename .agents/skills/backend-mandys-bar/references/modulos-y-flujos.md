# Modulos y flujos

## Auth / login / register / profile

- Ruta de entrada:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET|PUT|DELETE /api/profile`
  - `GET /api/profile/bootstrap`
  - `PUT /api/profile/password`
- Ruta/controlador:
  - `backend/src/routes/authRoutes.ts`
  - `backend/src/controllers/authController.ts`
  - `backend/src/routes/profileRoutes.ts` (handlers inline)
- Dependencia de DB:
  - `User`
  - `Order`
  - `Reservation`
- Consumidores directos:
  - `apps/client` auth, perfil, checkout y reutilizacion de datos de usuario
  - `apps/admin` login y flujos de gestion de usuarios/personal
- Riesgos tipicos:
  - cambiar shape del token o de `req.user`
  - romper `bootstrap` de perfil
  - alterar mensajes 401/403 que usa el frontend
  - olvidar `AuthRequest`
  - endurecer validacion sin revisar sanitizer o rate limits

## Productos admin/public

- Ruta de entrada:
  - `GET /api/products`
  - `GET /api/products/admin`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id`
- Ruta/controlador:
  - `backend/src/modules/products/products.routes.ts`
  - `backend/src/modules/products/products.controller.ts`
- Dependencia de DB:
  - `Product`
  - relacion con `OrderItem`
- Consumidores directos:
  - `apps/client/src/services/api/productService.ts`
  - paginas de menu/catalogo en `apps/client`
  - `apps/admin/src/modules/products/*`
- Riesgos tipicos:
  - cambiar paginacion, categorias o sort y romper cliente/admin
  - romper `activo`/`destacado`
  - olvidar que el cliente aun tiene fallback desde `menuData`
  - devolver un payload que ya no calza con `@mandys/shared`

## Ordenes admin/public + realtime

- Ruta de entrada:
  - `POST /api/orders`
  - `GET /api/orders/me`
  - `GET /api/orders/all`
  - `PUT /api/orders/status/:id`
  - `PUT /api/orders/approve/:id`
  - `DELETE /api/orders/:id`
- Ruta/controlador:
  - `backend/src/modules/orders/orders.routes.ts`
  - `backend/src/modules/orders/orders.controller.ts`
- Dependencia de DB:
  - `Order`
  - `OrderItem`
  - `AccountingLog`
  - `ShadowSale`
  - `ShadowDailyRevenue`
- Consumidores directos:
  - `apps/client` checkout, historial, perfil y estado de ordenes
  - `apps/admin` historial y gestion operativa
  - realtime por Supabase en cliente y admin
- Riesgos tipicos:
  - romper proteccion de ownership en `/me`
  - romper transiciones de estado o aprobacion de pago
  - dejar desalineado el realtime
  - cambiar filtros/paginacion y causar paginas vacias en admin o cliente

## Reservaciones + confirmacion/anulacion

- Ruta de entrada:
  - `POST /api/reservations`
  - `GET /api/reservations/prices`
  - `GET /api/reservations/me`
  - `GET /api/reservations`
  - `PUT /api/reservations/confirm/:id`
  - `PUT /api/reservations/cancel/:id`
- Ruta/controlador:
  - `backend/src/modules/reservations/reservations.routes.ts`
  - `backend/src/modules/reservations/reservations.controller.ts`
- Dependencia de DB:
  - `Reservation`
- Consumidores directos:
  - `apps/client` reservas y perfil
  - `apps/admin` reservaciones
- Riesgos tipicos:
  - transiciones de estado invalidas
  - romper campos de pago o anulacion
  - dejar inconsistente la evidencia de anulacion (`imagen_anulacion`)
  - cambiar precios/eventos sin revisar UX del cliente

## Contenido web editable + publicacion

- Ruta de entrada:
  - `GET /api/site-content/public`
  - `GET /api/site-content/gallery`
  - `GET /api/site-content/admin`
  - `GET /api/site-content/drafts`
  - `PUT /api/site-content/drafts/:id/publish`
  - `DELETE /api/site-content/drafts/:id`
  - `PUT /api/site-content`
- Ruta/controlador:
  - `backend/src/modules/site-content/site-content.routes.ts`
  - `backend/src/modules/site-content/site-content.controller.ts`
- Dependencia de DB:
  - `SiteSetting`
  - `SiteEvent`
  - `GalleryItem`
  - `ContentRevision`
- Consumidores directos:
  - paginas publicas en `apps/client`
  - `apps/admin/src/modules/site-content/*`
  - realtime del cliente via Supabase para `site_settings`, `site_events`, `gallery_items`
- Riesgos tipicos:
  - publicar sin invalidar cache
  - romper el contrato de galeria/eventos
  - dejar admin y cliente leyendo estados distintos
  - asumir que el fallback visual reemplaza a la DB

## Uploads de imagenes

- Ruta de entrada:
  - `POST /api/upload`
  - `PUT /api/reservations/cancel/:id` con `imagen_anulacion`
- Ruta/controlador:
  - `backend/src/routes/uploadRoutes.ts`
  - `backend/src/utils/convertToWebp.ts`
  - `backend/src/modules/reservations/reservations.routes.ts`
- Dependencia de DB:
  - indirecta; las URLs terminan persistidas en `User`, `Product`, `GalleryItem`, `SiteEvent`, `SiteSetting` o `Reservation`
- Consumidores directos:
  - `apps/admin` productos, contenido web y otros formularios con imagen
  - `apps/client` foto de perfil u otras vistas que leen URLs resultantes
- Riesgos tipicos:
  - cambiar el nombre del campo `image`
  - romper `5MB` o los mimetypes permitidos
  - dejar una URL publica incompatible con `/uploads`
  - olvidar validar magic bytes o tratar distinta la ruta de anulaciones
