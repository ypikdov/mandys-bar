# PERF_REPORT - Productos admin

Fecha: 2026-04-30

## Alcance

Se reviso la ruta critica reportada: deshabilitar producto y recargar/listar productos en el panel admin.

## Medicion disponible

Medicion real contra backend local conectado a la base de datos:

- Login admin: 1435 ms.
- Listado admin antes de cache: 1079-1119 ms.
- Listado admin despues de cache caliente en arranque: 22 ms primera llamada medida, 3-4 ms llamadas siguientes.
- `PATCH /api/products/:id/active`: 155-172 ms.
- Rollback del mismo endpoint: 150-169 ms.
- Listado admin despues de activar/desactivar: 3-6 ms.
- Preflight navegador `OPTIONS /api/products/:id/active`: 204.
- `Access-Control-Allow-Methods`: `GET,POST,PUT,PATCH,DELETE,OPTIONS`.

## Evidencia de codigo antes

- `getAdminProducts` ejecutaba 4 queries para cada pagina con filtros:
  - `count(where)`
  - `findMany(where)`
  - `count({ activo: true })`
  - `count({ activo: false })`
- Cada `createProduct`, `updateProduct` y `deleteProduct` llamaba `productCache.flushAll()`.

## Cambio aplicado

- `getAdminProducts` ahora ejecuta 3 queries:
  - `count(where)`
  - `findMany(where)`
  - `groupBy({ by: ['activo'] })`
- La cache de productos ya no usa `flushAll()`.
- Se invalidan solo prefijos de productos:
  - `products:public:list`
  - `products:public:list_json`
  - `products:admin:list`
  - `products:public_page`
  - `products:admin_page`
- Se agrego `PATCH /api/products/:id/active` para cambiar solo `activo`, sin pasar por el update completo de producto.
- El panel admin usa el endpoint especifico y mantiene el optimistic update.
- El spinner del toggle aparece solo si la respuesta supera 180 ms, evitando una sensacion de lentitud en respuestas rapidas.
- CORS ahora permite `PATCH` para que el navegador pueda completar el preflight.
- El backend ahora calienta cache admin al arrancar.
- El listado admin paginado se construye desde cache en memoria, no desde 3 consultas remotas por request.
- Al activar/desactivar, se parchea la cache admin y solo se invalida la cache publica.

## Resultado esperado

- Menos carga por listado admin paginado.
- Toggle activo conserva optimistic update en UI y evita invalidacion masiva interna.
- Menor probabilidad de recalculo innecesario del resumen activo/inactivo.

## Verificacion

- Backend build: OK.
- Admin build: OK.
- Client build: OK.
- Smoke API: `PATCH /api/products/:id/active` 200 en 155-172 ms.
- Smoke API: listado admin cacheado en 3-22 ms.
- Smoke CORS: `OPTIONS /api/products/:id/active` 204 con `PATCH` permitido.

## Pendiente para cerrar performance

Validacion visual recomendada en navegador autenticado:

1. Abrir DevTools Network en admin productos.
2. Confirmar que al alternar `activo` se llama `PATCH /api/products/:id/active`.
3. Medir siguiente `GET /api/products/admin?...`.
4. Objetivo practico: UI inmediata, listado admin < 50 ms cacheado, roundtrip de escritura < 250 ms en condiciones normales.
