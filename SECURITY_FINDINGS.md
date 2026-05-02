# SECURITY_FINDINGS - Panel admin Mandy's Bar

Fecha: 2026-04-29

## Resueltos

| Prioridad | Hallazgo | Estado |
|---|---|---|
| P0 | Upload de imagenes usaba disco local y exponia rutas `/uploads` como fuente principal. | Resuelto para nuevos uploads: Supabase Storage via backend si `SUPABASE_SERVICE_ROLE_KEY` esta configurado. |
| P0 | `/api/upload` no tenia rate limit especifico. | Resuelto con `express-rate-limit` por usuario/IP. |
| P0 | `/api/upload` no separaba permisos por tipo de recurso. | Resuelto con whitelist de buckets y restriccion: `product-images`, `gallery`, `events` solo ADMIN/MANAGER; `users-avatars` para usuario autenticado. |
| P1 | Validacion de imagen dependia de archivo en disco. | Resuelto: magic bytes desde `Buffer` antes de convertir/subir. |
| P1 | Auth devolvia error generico para token invalido/expirado. | Resuelto: `NO_TOKEN`, `TOKEN_EXPIRED`, `TOKEN_INVALID` con HTTP 401. |
| P1 | Sesion admin podia quedar zombie tras 401. | Resuelto: `apiFetch` limpia localStorage y `AuthContext` sincroniza logout local/multitab. |

## Pendientes

| Prioridad | Hallazgo | Riesgo | Accion recomendada |
|---|---|---|---|
| P1 | `backend/src/index.ts` aun sirve `/uploads`. | Superficie local legacy. | Quitar cuando termine migracion de imagenes historicas. |
| P1 | Anulaciones de reservas siguen usando multer local. | Imagenes de anulacion no persistentes. | Migrar flujo a Supabase Storage. |
| P1 | No hay logout server-side con blacklist. | Token robado sigue valido hasta expirar. | Implementar `jti` + tabla/Redis de tokens revocados o reducir TTL. |
| P1 | No hay refresh token. | UX depende del TTL actual. | Decidir entre refresh tokens o sesion larga documentada. |
| P2 | Orders create usa validacion manual, no Zod formal. | Mayor riesgo de payload inconsistente. | Crear schema Zod de pedido y centralizar validacion. |
| P2 | Site-content uploads usan bucket `gallery` generico en UI. | Organizacion de Storage menos precisa. | Pasar bucket por tipo de modal: `gallery` vs `events`. |

## Secretos y entorno

- `SUPABASE_SERVICE_ROLE_KEY` se agrego solo a `backend/.env.example`.
- No se escribio ningun secreto real.
- Para activar Storage real hay que agregar `SUPABASE_SERVICE_ROLE_KEY` en `backend/.env` local/produccion.

## Verificacion

- `npm.cmd run build` en backend: OK.
- `npm.cmd run build -w @mandys/admin`: OK.
- `npm.cmd run build -w @mandys/client`: OK.
- Typecheck directo de `backend/scripts/setup-storage.ts` y `backend/scripts/migrate-local-images-to-supabase.ts`: OK.
- Backend compilado iniciado con `npm.cmd start` en puerto 3000: OK.
- Smoke HTTP: `/api/healthz` 200, cliente `/menu` 200, admin `/` 200.
