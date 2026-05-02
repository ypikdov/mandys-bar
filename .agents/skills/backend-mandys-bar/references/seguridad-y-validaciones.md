# Seguridad y validaciones

## JWT actual y limites del enfoque

- El backend autentica con Bearer token y `jsonwebtoken`.
- La firma sale de `backend/src/lib/jwtSecret.ts`.
- Cliente y admin dependen de token en almacenamiento web y header `Authorization`, no de cookie `HttpOnly`.
- Ventaja actual: flujo simple para SPA y menor friccion.
- Limite real: mayor superficie frente a XSS; cualquier cambio de auth debe revisar impacto en ambos paneles.

## `authenticate` / `authorize`

- Archivo fuente: `backend/src/middlewares/auth.ts`
- Reglas:
  - usa `AuthRequest` si vas a leer `req.user`
  - no asumas `req.user` en handlers sin `authenticate`
  - separa `401` de `403`
  - no amplíes roles por comodidad; define el minimo rol necesario

## Sanitizer y falsos positivos

- `requestSanitizer` vive en `backend/src/middlewares/security.ts`.
- Bloquea patrones SQL, NoSQL, XSS y template injection.
- Campos excluidos actuales:
  - `password`
  - `password_hash`
  - `token`
  - `observacion_pago`
  - `motivo_anulacion`
  - `detalles`
  - `details`
- Riesgo:
  - endurecer patrones puede bloquear contenido legitimo de admin o cliente
  - aflojarlo sin revisar rutas mutantes aumenta superficie de inyeccion

## Rate limiting

- `backend/src/middlewares/rateLimiter.ts`
  - `authRateLimiter`: ventana 15 min, identidad por IP + correo/email/username
  - `orderRateLimiter`: ventana 1 h, identidad por IP + `userId`
- `backend/src/routes/authRoutes.ts`
  - agrega un `authLimiter` adicional para `register` y `login`
- Si cambias auth o ordenes, revisa si el rate limit sigue teniendo sentido operativo.

## Validacion de imagenes

- `backend/src/routes/uploadRoutes.ts`
  - filtra por extension/mimetype
  - valida magic bytes
  - intenta convertir a WebP
- `backend/src/modules/reservations/reservations.routes.ts`
  - valida mimetype y tamaño para anulaciones
  - no replica la verificacion por magic bytes de la ruta general
- Si endureces uploads, revisa ambos caminos para no dejar una ruta mas debil que la otra.

## CSP / helmet / cors actuales

- `helmet()` activo en `backend/src/index.ts`
- CSP definida manualmente:
  - `imgSrc` permite `self`, `data`, `blob`, `http://localhost:3000`, `https:`
  - `connectSrc` permite frontend local y URLs de Supabase si existen
- `cors` restringe origenes a `FRONTEND_URL` y `http://localhost:5174`
- `credentials: true` esta activo
- `trust proxy` esta habilitado para `x-forwarded-proto`

## Reglas de no regresion

- No tocar secretos ni `.env` desde esta skill.
- No reemplazar secretos reales por placeholders.
- No abrir permisos sin necesidad funcional clara.
- No devolver stacks o detalles internos en produccion.
- No asumir que una respuesta 200 es segura si el contrato de auth/autorizacion queda mas amplio.

## Mini checklist para cualquier cambio backend

- Auth: ¿la ruta correcta exige autenticacion?
- Autorizacion: ¿el rol minimo sigue siendo correcto?
- Input: ¿se valida body/query/file y no rompe sanitizer?
- Response shape: ¿cliente y admin siguen recibiendo el mismo contrato esperado?
- Error handling: ¿401/403/400/500 siguen diferenciados y legibles?
- Impacto cross-panel: ¿hay que revisar cliente, admin, cache, realtime, uploads o seeds?
