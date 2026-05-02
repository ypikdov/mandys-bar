# Lecciones aprendidas — Mandy's Bar

> Memoria persistente del proyecto. Se carga al inicio de cada tarea no trivial.
> Añadir lecciones al final, jamás borrar; consolidar cuando sea necesario.
> Skill que la gestiona: `aprender-de-errores`.

## Índice por tags

(actualizar a mano al añadir nuevas lecciones)

- `#monorepo` → L01
- `#deploy` → L01, L02
- `#cloudflare-pages` → L02
- `#spa-fallback` → L02
- `#vite` → L02

## Lecciones

## L01 — Mandy's Bar es un monorepo con workspaces; admin y client NO se separan físicamente
**Fecha:** 2026-04-30
**Tags:** #monorepo #workspaces #deploy #arquitectura
**Contexto:** El usuario pidió "separar las dos carpetas panel admin y panel cliente" en la carpeta padre `Paginas web/` para subir dos dominios distintos.
**Error:** La intuición inicial podría ser copiar `apps/admin/` y `apps/client/` como proyectos independientes hermanos del monorepo.
**Causa raíz:** El proyecto usa `npm workspaces` (`"workspaces": ["packages/*", "apps/*"]` en el `package.json` raíz). `apps/admin` y `apps/client` comparten `backend/`, `packages/@mandys/shared`, `packages/@mandys/ui`, `node_modules` raíz, configs y `.env`. Separarlos físicamente implica duplicar todo eso o reconfigurar dependencias — rompe el monorepo y crea dos fuentes de verdad para el mismo backend.
**Solución aplicada:** Mantener el monorepo intacto. Para servir dos dominios distintos basta con generar dos `dist/` (`apps/admin/dist` y `apps/client/dist`) y subirlos a dos hostings/proyectos separados, apuntando ambos al mismo backend público vía `VITE_API_BASE_URL`. La base de datos también es única.
**Regla a futuro:** Antes de "separar carpetas" en este proyecto, verificar que no sea un workspace compartido. Para deploy a múltiples dominios, siempre la estrategia es **un build por app + hostings separados + un solo backend + una sola base de datos**, nunca duplicar el código.

## L02 — Cloudflare Pages devuelve 404 al recargar rutas profundas si falta `_redirects`
**Fecha:** 2026-04-30
**Tags:** #deploy #cloudflare-pages #spa-fallback #vite
**Contexto:** Se preparó el deploy de `apps/admin` y `apps/client` a Cloudflare Pages como dos proyectos separados.
**Error:** Sin configuración extra, recargar una URL profunda (ej. `/admin/orders`, `/menu/categoria-x`) en producción devuelve 404 directo del CDN.
**Causa raíz:** Cloudflare Pages sirve estáticos uno-a-uno y no reenvía a `index.html` automáticamente. Una SPA Vite necesita SPA fallback explícito.
**Solución aplicada:** Se creó `apps/admin/public/_redirects` y `apps/client/public/_redirects` con la regla `/* /index.html 200`. Vite copia `public/` al `dist/` durante el build, así que se aplica solo en cada deploy. Adicionalmente se añadió `_headers` con cabeceras de seguridad y caché de assets con hash.
**Regla a futuro:** Toda SPA Vite que se vaya a desplegar a Cloudflare Pages debe tener `public/_redirects` con `/* /index.html 200` antes del primer build. Verificar esto como parte del checklist de `DEPLOY.md` antes de subir.

## Archivadas

(lecciones que ya no aplican porque el código/contexto cambió; se mueven aquí en lugar de borrarse)
