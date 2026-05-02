# Screaming Architecture

## Objetivo
La estructura del proyecto debe "gritar" el negocio:

- `orders`
- `products`
- `reservations`
- `users`
- `staff`
- `site-content`
- `auth`

No debe gritar frameworks ni capas sueltas como `controllers`, `routes`, `features`, `services` como eje principal.

## Backend

```text
backend/
  src/
    app/
      server.ts
      routes.ts
      middlewares/
    shared/
      db/
      http/
      auth/
      validation/
      utils/
      types/
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.routes.ts
        auth.schemas.ts
      orders/
        orders.controller.ts
        orders.routes.ts
      products/
        products.controller.ts
        products.routes.ts
      reservations/
        reservations.controller.ts
        reservations.routes.ts
      users/
        users.controller.ts
        users.routes.ts
      site-content/
        site-content.controller.ts
        site-content.routes.ts
        site-content.defaults.ts
```

## Admin

```text
apps/admin/src/
  app/
    App.tsx
    routes/
    providers/
    layouts/
  shared/
    api/
    lib/
    ui/
    hooks/
    utils/
    types/
  modules/
    auth/
      pages/
      components/
      services/
      hooks/
    orders/
      components/
      services/
      hooks/
    products/
      components/
      services/
      hooks/
    reservations/
      components/
      services/
      hooks/
    users/
      components/
      services/
      hooks/
    staff/
      components/
      services/
      hooks/
    site-content/
      components/
      services/
      hooks/
```

## Client

```text
apps/client/src/
  app/
    App.tsx
    routes/
    providers/
    layouts/
  shared/
    api/
    lib/
    ui/
    hooks/
    utils/
    types/
  modules/
    auth/
      components/
      services/
      hooks/
    cart/
      components/
      hooks/
    menu/
      pages/
      components/
      services/
      hooks/
    about/
      pages/
      components/
    contact/
      pages/
      components/
    events/
      pages/
      components/
      hooks/
    gallery/
      pages/
      components/
    orders/
      components/
      hooks/
    reservations/
      components/
      hooks/
      services/
    profile/
      pages/
      services/
      hooks/
    site-content/
      services/
      hooks/
      providers/
```

## Mapeo Actual -> Objetivo

### Backend

- `backend/src/controllers/productController.ts` -> `backend/src/modules/products/products.controller.ts`
- `backend/src/routes/productRoutes.ts` -> `backend/src/modules/products/products.routes.ts`
- `backend/src/controllers/ordersController.ts` -> `backend/src/modules/orders/orders.controller.ts`
- `backend/src/routes/orderRoutes.ts` -> `backend/src/modules/orders/orders.routes.ts`
- `backend/src/controllers/reservationsController.ts` -> `backend/src/modules/reservations/reservations.controller.ts`
- `backend/src/routes/reservationRoutes.ts` -> `backend/src/modules/reservations/reservations.routes.ts`
- `backend/src/controllers/userController.ts` -> `backend/src/modules/users/users.controller.ts`
- `backend/src/routes/userRoutes.ts` -> `backend/src/modules/users/users.routes.ts`
- `backend/src/controllers/siteContentController.ts` -> `backend/src/modules/site-content/site-content.controller.ts`
- `backend/src/routes/siteContentRoutes.ts` -> `backend/src/modules/site-content/site-content.routes.ts`
- `backend/src/siteContent/defaults.ts` -> `backend/src/modules/site-content/site-content.defaults.ts`

### Admin

- `apps/admin/src/features/orders/*` -> `apps/admin/src/modules/orders/*`
- `apps/admin/src/features/products/*` -> `apps/admin/src/modules/products/*`
- `apps/admin/src/features/reservations/*` -> `apps/admin/src/modules/reservations/*`
- `apps/admin/src/features/staff/*` -> `apps/admin/src/modules/staff/*`
- `apps/admin/src/features/users/*` -> `apps/admin/src/modules/users/*`
- `apps/admin/src/features/site-content/*` -> `apps/admin/src/modules/site-content/*`
- `apps/admin/src/features/catalog/*` -> dividir entre `modules/products` y `shared/api`

### Client

- `apps/client/src/pages/Menu.tsx` -> `apps/client/src/modules/menu/pages/MenuPage.tsx`
- `apps/client/src/pages/About.tsx` -> `apps/client/src/modules/about/pages/AboutPage.tsx`
- `apps/client/src/pages/Contact.tsx` -> `apps/client/src/modules/contact/pages/ContactPage.tsx`
- `apps/client/src/pages/Events.tsx` -> `apps/client/src/modules/events/pages/EventsPage.tsx`
- `apps/client/src/pages/Gallery.tsx` -> `apps/client/src/modules/gallery/pages/GalleryPage.tsx`
- `apps/client/src/features/menu/*` -> `apps/client/src/modules/menu/*`
- `apps/client/src/features/auth/*` -> `apps/client/src/modules/auth/*`
- `apps/client/src/features/cart/*` -> `apps/client/src/modules/cart/*`
- `apps/client/src/features/orders/*` -> `apps/client/src/modules/orders/*`
- `apps/client/src/features/reservations/*` -> `apps/client/src/modules/reservations/*`
- `apps/client/src/providers/SiteContentContext.tsx` -> `apps/client/src/modules/site-content/providers/SiteContentProvider.tsx`
- `apps/client/src/services/api/siteContentService.ts` -> `apps/client/src/modules/site-content/services/siteContentService.ts`

## Regla de Refactor

1. Primero mover por dominio.
2. Despues limpiar imports.
3. Despues crear `index.ts` por modulo si hace falta.
4. No mezclar refactor estructural con cambios funcionales nuevos.

## Primera Fase Recomendada

1. `site-content`
2. `products`
3. `reservations`
4. `orders`
5. `users/staff`
6. `auth`

Esa secuencia minimiza conflictos porque ya son los dominios que hoy tienen mayor cruce entre admin, client y backend.
