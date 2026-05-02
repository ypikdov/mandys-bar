---
name: backend-mandys-bar
description: Implementa, revisa y depura el backend real de Mandy's Bar cuando la tarea afecte endpoints, controladores, middlewares, auth/roles, uploads, Prisma/schema/seed, errores, validaciones, optimizacion backend, sincronizacion con panel cliente/admin o debugging de API. No la uses para tareas puramente frontend o diseno.
---

# Backend Mandy's Bar

1. Identificar el modulo afectado y ubicar primero la ruta viva en `backend/src/modules/*` o `backend/src/routes/*`.
2. Leer la ruta, su controlador y el flujo relacionado antes de editar; no tocar un controlador aislado sin ver quien lo monta desde `backend/src/index.ts`.
3. Validar el contrato con `apps/client` y/o `apps/admin` antes de cambiar payloads, errores, paginacion, roles o nombres de campos.
4. Aplicar las reglas obligatorias del repo.
5. Ejecutar los checks minimos segun el tipo de cambio.
6. Reportar impacto en cliente, admin, DB, cache, realtime, uploads y seeds cuando corresponda.

## Cargar referencias solo cuando aplique

- Leer [references/stack-y-arquitectura.md](references/stack-y-arquitectura.md) si vas a tocar `backend/src/index.ts`, montajes de rutas, Prisma, static assets, rutas legacy o si no esta claro cual archivo es la fuente de verdad.
- Leer [references/modulos-y-flujos.md](references/modulos-y-flujos.md) si cambias auth, productos, ordenes, reservaciones, site-content, uploads o cualquier flujo que cruce backend con `apps/client` o `apps/admin`.
- Leer [references/seguridad-y-validaciones.md](references/seguridad-y-validaciones.md) si tocas auth, permisos, middlewares, headers, sanitizer, rate limits, uploads, manejo de errores o datos sensibles.
- Leer [references/checks-operativos.md](references/checks-operativos.md) antes de validar, para elegir el scope correcto y revisar impactos en cliente/admin, realtime, cache o seeds.
- Ejecutar [scripts/validate_backend.ps1](scripts/validate_backend.ps1) cuando ya tengas un cambio backend o cuando necesites una verificacion rapida por scope (`core`, `prisma`, `uploads`, `content`, `full`).

## Reglas obligatorias

- Usar `AuthRequest` cuando consumas `req.user`.
- Proteger rutas administrativas con `authenticate` + `authorize(...)` cuando aplique.
- No romper contratos existentes con cliente/admin sin revisar primero las llamadas asociadas.
- No hardcodear secretos ni confiar en placeholders de `.env`.
- Mantener responses y errores consistentes; si cambias shape o status codes, documenta el impacto y revisa consumidores.
- Revisar si el cambio afecta cache, realtime, uploads o paginacion.
- Si tocas contenido publico, revisar sincronizacion con `site-content`, cache del cliente y fallback visual.
- Si tocas productos, pedidos, reservaciones o usuarios, revisar impacto en admin y cliente.
- No tomar `.d.ts`, `.js.map`, artefactos de build o rutas antiguas declarativas como fuente de verdad del backend activo.
