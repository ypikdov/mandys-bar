# Checks operativos

Usa el script local de la skill para validacion rapida:

- `.\agents\skills\backend-mandys-bar\scripts\validate_backend.ps1 -Scope core`
- `.\agents\skills\backend-mandys-bar\scripts\validate_backend.ps1 -Scope prisma`
- `.\agents\skills\backend-mandys-bar\scripts\validate_backend.ps1 -Scope uploads`
- `.\agents\skills\backend-mandys-bar\scripts\validate_backend.ps1 -Scope content`
- `.\agents\skills\backend-mandys-bar\scripts\validate_backend.ps1 -Scope full`

Checks base del repo:

- Compilacion backend sin emitir artefactos: `node_modules/.bin/tsc.cmd -p backend/tsconfig.json --noEmit --pretty false`
- Prisma validate: `node_modules/.bin/prisma.cmd validate --schema backend/prisma/schema.prisma`
- Revision de rutas montadas: `backend/src/index.ts`
- Revision de contrato cruzado: `apps/client` y `apps/admin` que consumen la ruta

| Tipo de cambio | Scope recomendado | Que debes revisar ademas | Resultado esperado |
| --- | --- | --- | --- |
| Endpoint nuevo | `core` | montaje en `index.ts`, ruta, controlador, consumidores en cliente/admin, shape de errores | ruta accesible, contrato claro, sin romper consumidores existentes |
| Cambio en schema Prisma | `prisma` y luego `core` | `schema.prisma`, seed, tipos compartidos, queries afectadas, backfill/manual migration plan | schema valido y flujo backend compila con el modelo nuevo |
| Cambio en auth | `core` | `auth.ts`, `authRoutes.ts`, `profileRoutes.ts`, roles, 401/403, storage/token en cliente/admin | auth consistente y sin ampliar permisos accidentalmente |
| Cambio en uploads | `uploads` y luego `core` si cambia contrato | `uploadRoutes.ts`, `convertToWebp.ts`, mount `/uploads`, formularios admin/cliente, tamanos y mimetypes | subida valida, URL publica estable, validacion de archivo intacta |
| Cambio en contenido web | `content` y luego `core` si cambias contrato | `site-content.routes/controller`, cache del cliente, realtime, drafts/publicacion, fallback visual | admin y cliente reflejan el mismo contenido sin drift |
| Cambio en ordenes/productos/reservas | `core`; suma `prisma` si tocas DB | paginacion, filtros, estados, realtime, hooks cliente/admin, efectos sobre perfil/checkout | ambos paneles siguen sincronizados y sin paginas o estados vacios falsos |

Cuándo revisar extras:

- Realtime: cuando cambies ordenes o `site-content`.
- Cache: cuando cambies productos publicos, galeria o contenido publico.
- Uploads: cuando cambies cualquier campo `*_url`, perfil, productos, galeria o anulaciones.
- Seeds: cuando agregues campos obligatorios, nuevas secciones de contenido o categorias base.
