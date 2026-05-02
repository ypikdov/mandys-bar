# Guía de despliegue — Mandy's Bar

Estrategia: **monorepo intacto + builds separados**. El cliente y el admin se suben a **dos dominios distintos** vía **Cloudflare Pages**. El backend va en un servicio aparte (VPS, Render, Railway, etc.) en `api.tudominio.com`.

```
┌──────────────────────┐        ┌──────────────────────┐
│  mandysbar.com       │        │  admin.mandysbarX.com│
│  (Cloudflare Pages)  │        │  (Cloudflare Pages)  │
│  apps/client/dist    │        │  apps/admin/dist     │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           │  fetch(VITE_API_BASE_URL)     │
           └───────────────┬───────────────┘
                           ▼
                ┌──────────────────────┐
                │  api.tudominio.com   │
                │  (VPS / Render / …)  │
                │  backend/dist        │
                └──────────────────────┘
```

---

## 1. Antes de buildear

### 1.1 Configurar `.env.production` en la raíz

Copia `.env.production.example` como `.env.production` en la raíz y rellena con la URL pública del backend:

```env
VITE_SUPABASE_URL=https://oelkfmiimwylqkecvhiz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_API_BASE_URL=https://api.tudominio.com
VITE_BACKEND_URL=https://api.tudominio.com
```

> **Importante:** ambos `apps/admin/vite.config.ts` y `apps/client/vite.config.ts` tienen `envDir: '../../'`, así que **leen el `.env.production` desde la raíz del repo**. No crees archivos `.env` dentro de `apps/admin` o `apps/client`.

### 1.2 Configurar CORS en el backend

En `backend/.env` (producción), agrega los dos dominios:

```env
NODE_ENV=production
CORS_ORIGINS=https://mandysbar.com,https://admin.mandysbarX.com
FRONTEND_URL=https://mandysbar.com
ADMIN_URL=https://admin.mandysbarX.com
```

Reemplaza con tus dominios reales.

---

## 2. Generar los builds

Desde la raíz del monorepo:

```bash
# Build de las dos apps de una vez
npm run build:all

# O por separado
npm run build:admin    # genera apps/admin/dist
npm run build:client   # genera apps/client/dist
```

Resultado:

- `apps/admin/dist/`  → carpeta lista para subir a `admin.tudominio.com`
- `apps/client/dist/` → carpeta lista para subir a `tudominio.com`

Cada `dist/` ya incluye `_redirects` (SPA fallback) y `_headers` (seguridad + caché) que **Cloudflare Pages aplica automáticamente**.

---

## 3. Desplegar a Cloudflare Pages

### Opción A — Subida directa (la más simple, sin Git)

Repite el proceso para **cliente** y luego para **admin**.

**Cliente:**
1. Entra a Cloudflare → Workers & Pages → **Create application** → **Pages** → **Upload assets**.
2. Nombre del proyecto: `mandys-client` (o el que prefieras).
3. Sube la carpeta **`apps/client/dist`** completa.
4. Cuando termine, ve a la pestaña **Custom domains** del proyecto.
5. Agrega `mandysbar.com` (o el dominio que registraste para el cliente). Cloudflare te guía para apuntar el DNS.

**Admin:**
1. Repite, pero con un nuevo proyecto `mandys-admin` y sube **`apps/admin/dist`**.
2. Custom domains → agrega `admin.mandysbarX.com` (o el dominio de admin).

### Opción B — Conectado a Git (recomendado a futuro)

Si tienes el repo en GitHub:
1. Cloudflare Pages → **Connect to Git** → selecciona el repo.
2. **Proyecto Cliente:**
   - Build command: `npm run build:client`
   - Build output: `apps/client/dist`
   - Root directory: `/` (raíz del repo)
   - Variables de entorno: copia `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`, `VITE_BACKEND_URL`.
3. **Proyecto Admin** (otro proyecto en Cloudflare):
   - Build command: `npm run build:admin`
   - Build output: `apps/admin/dist`
   - Mismas variables.

> Cada `git push` redespliega los dos proyectos automáticamente.

---

## 4. Desplegar el backend

El backend Express + Prisma **no va en Cloudflare Pages** (Pages es solo estáticos). Opciones:

| Hosting               | Tipo            | Notas                                                                 |
|-----------------------|-----------------|-----------------------------------------------------------------------|
| **Render**            | Node service    | Free tier con sleep; paid $7/mes. Despliegue desde Git.               |
| **Railway**           | Node service    | $5/mes mínimo. Muy simple.                                            |
| **Fly.io**            | Container       | Free tier limitado. Más control.                                      |
| **VPS (Hetzner/DO)**  | Servidor propio | $4–6/mes. PM2 + Nginx + Certbot. Más trabajo de setup.                |
| **Cloudflare Tunnel** | Túnel a casa    | Gratis si tienes una máquina siempre prendida. No es para producción real. |

**Pasos genéricos para cualquier opción:**

1. Variables de entorno en el panel del hosting (ver `backend/.env.example`):
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=...
   DIRECT_URL=...
   JWT_SECRET=<32+ chars random>
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   CORS_ORIGINS=https://mandysbar.com,https://admin.mandysbarX.com
   FRONTEND_URL=https://mandysbar.com
   ADMIN_URL=https://admin.mandysbarX.com
   ```
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Health check: `GET /api/health` (si existe).
5. Apunta el subdominio `api.tudominio.com` al backend (DNS A o CNAME según el host).
6. **HTTPS obligatorio**: el frontend en HTTPS no puede llamar a un backend HTTP (mixed content). Cloudflare Tunnel, Render, Railway dan HTTPS automático. En VPS usa Certbot.

---

## 5. Checklist final antes de salir a producción

- [ ] `.env.production` raíz con `VITE_API_BASE_URL` apuntando al backend público (HTTPS).
- [ ] `npm run build:all` corre sin errores.
- [ ] `apps/client/dist/_redirects` y `apps/admin/dist/_redirects` existen (los copia automáticamente desde `public/`).
- [ ] Backend desplegado y `https://api.tudominio.com/api/health` responde 200.
- [ ] `CORS_ORIGINS` del backend incluye **los dos dominios públicos exactos** (sin slash final).
- [ ] DNS de los tres dominios (cliente, admin, api) propagado.
- [ ] Cookies/JWT funcionan cross-origin (revisar `SameSite=None; Secure` si usas cookies).
- [ ] Supabase: en el dashboard, agrega los dos dominios públicos a la lista de redirect URLs.
- [ ] Probar flujo completo: login cliente, login admin, una operación que toque DB.
- [ ] Revisar consola del navegador en producción — debería estar limpia de errores CORS/CSP.

---

## 6. Comandos útiles

```bash
# Build separado
npm run build:admin
npm run build:client
npm run build:all

# Preview local de producción (probar antes de subir)
npm run preview:admin   # http://localhost:4173 (suele ser ese puerto)
npm run preview:client

# Lint
npm run lint
```

---

## 7. Troubleshooting

**"CORS error" en consola al cargar el frontend en producción**
→ El dominio no está en `CORS_ORIGINS` del backend. Revisa que esté **exactamente** igual (sin `/` al final, con `https://`, sin `www.` si no lo usas).

**"404 al recargar una ruta interna"** (ej. `/admin/dashboard` da 404)
→ Falta el SPA fallback. Verifica que `apps/admin/dist/_redirects` exista y contenga `/* /index.html 200`. Cloudflare Pages lo aplica solo.

**"Mixed content blocked"**
→ Frontend en HTTPS llamando a backend HTTP. El backend **debe** estar en HTTPS.

**El build de admin tarda mucho o falla por TS**
→ Revisa `apps/admin/tsc_errors.txt` (existe en la carpeta). Corrige errores TS antes de buildear.

**Variables de entorno no se aplican**
→ Vite las inlinea en build-time. Si cambias `.env.production`, hay que **rebuildear** y resubir.
