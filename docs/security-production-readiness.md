# Mandy's Bar - Seguridad y Preparacion para Produccion

Actualizado: 2026-04-22

## Modelo de amenazas resumido

Activos principales:
- Cuentas de clientes y personal administrativo.
- Tokens JWT y secretos de webhook.
- Pedidos, reservas, comprobantes, datos de contacto y documentos de usuario.
- Imagenes subidas desde el panel administrativo y flujos de contenido del sitio.

Limites de confianza:
- Navegador cliente y panel admin hacia API Express.
- API Express hacia Postgres/Supabase.
- API Express hacia almacenamiento local de uploads.
- Webhooks externos hacia rutas `/api/webhooks`.

Amenazas relevantes:
- Uso de secretos debiles o compartidos para firmar JWT.
- Conexion a base de datos con TLS sin verificacion en produccion.
- Acceso no autorizado a rutas administrativas o datos de otros usuarios.
- Registro publico de cuentas sin validacion administrativa previa.
- Carga de archivos no validos o pesados desde administracion.
- Inconsistencia entre datos de usuario, pedidos y reservas por fallas de sincronizacion DB/API.
- Dependencia operativa de una sola persona en archivos sensibles de autenticacion.

Mitigaciones aplicadas:
- `JWT_SECRET` es obligatorio en produccion y debe tener al menos 32 caracteres.
- En desarrollo, si falta `JWT_SECRET`, se usa un secreto temporal por proceso en lugar de un fallback fijo conocido.
- Postgres verifica TLS por defecto en produccion y permite `DATABASE_CA_CERT` para CA explicita.
- `/api/readyz` reporta fallos de base de datos con codigos clasificados y sin exponer cadenas de conexion.
- `/api/site-content/public` entrega `defaultSiteContent` con estado 200 y header `X-Mandys-Data-Source: fallback` si la base de datos no esta disponible.
- Los endpoints administrativos de contenido web devuelven 503 con razon redacted cuando la base de datos no esta disponible; no simulan persistencia si no pueden guardar en Postgres.
- Mensajes visibles de autenticacion, usuarios, productos, pedidos y reservas quedan en espanol consistente.
- `POST /api/auth/register` queda deshabilitado: las cuentas de clientes y personal se crean desde el panel por rol `ADMIN`.
- La creacion de personal y cambios de rol quedan limitados en backend a `ADMIN`; `MANAGER` conserva lectura operativa donde corresponde.
- Exportacion Excel carga `xlsx` bajo demanda para reducir el peso inicial de cliente/admin.
- Los artefactos crudos del ownership map quedan fuera de git.

## Estado actual de Supabase/Postgres

Validacion local del 2026-04-22:
- `SELECT 1` contra la cadena configurada falla con `tenant_or_user_not_found`.
- El pooler configurado responde, pero no reconoce el tenant o usuario.
- El host directo `db.<project-ref>.supabase.co` no resuelve desde este entorno.
- `/api/site-content/public` queda operativo en fallback con 22 elementos de galeria.
- `/api/readyz` queda correctamente en 503 hasta que se configure una cadena valida.

Conclusion:
- El bloqueo restante no esta en TypeScript, Prisma ni el render del frontend.
- Para certificar sincronizacion real admin/cliente se debe reemplazar `DATABASE_URL` y `DIRECT_URL` locales/produccion por cadenas vigentes desde Supabase Dashboard.
- Si esas credenciales ya circularon fuera del equipo o quedaron en historial, se deben rotar antes de produccion.

## Ownership y bus factor

El ownership map detecto bus factor 1 en archivos sensibles de autenticacion. No hay codigo sensible huerfano, pero la propiedad real esta concentrada en una sola identidad.

Riesgo pendiente:
- Si esa persona no esta disponible, los cambios de auth, sesion y control de acceso quedan sin revisor alterno.

Recomendacion:
- Definir `CODEOWNERS` cuando exista al menos una segunda cuenta GitHub responsable.
- Exigir revision de cambios en `apps/*/src/**/auth/**`, `backend/src/controllers/authController.ts`, `backend/src/middlewares/auth.ts` y rutas administrativas.

## Checklist de produccion

- Configurar `DATABASE_URL` y `DIRECT_URL` validos desde Supabase Dashboard.
- Mantener `DATABASE_SSL_REJECT_UNAUTHORIZED=true` en produccion.
- Definir `DATABASE_CA_CERT` si el proveedor o red intermedia requiere una CA explicita.
- Definir `JWT_SECRET` aleatorio de 32+ caracteres.
- Validar `/api/readyz` contra la base real antes de operar; debe responder `READY`.
- Revisar CI/GitHub Actions cuando el repositorio sea accesible desde el conector GitHub.
