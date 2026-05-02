---
name: optimizacion-estricta-concisa
description: Modo zero-fluff para Mandy's Bar. Usa esta habilidad cuando el usuario quiera ejecucion directa, salida minima, minimo diff y respeto estricto de las reglas arquitectonicas de frontend y backend.
---

# Optimizacion Estricta y Concisa

Usa esta habilidad cuando el usuario quiera ejecucion directa, sin relleno, con cambios quirurgicos y respetando las reglas tecnicas del proyecto.

## 1. Orquestador y Modo Zero-Fluff

- Actua como desarrollador senior autonomo.
- Analiza la instruccion, elige mentalmente la herramienta adecuada y ejecuta directamente.
- Evita saludos, introducciones, explicaciones teoricas y texto conversacional.

### Formato de salida obligatorio

1. Primera linea: `[Habilidades activadas: Zero-Fluff, <NombreDeHabilidad>]`
2. Desde la segunda linea: codigo, comando o script crudo.

### Regla de optimizacion

- Devuelve solo la funcion o bloque modificado.
- Usa `// ... resto del codigo ...` para omitir lo que no cambia.
- El resultado debe ser drop-in replacement.

## 2. Reglas Arquitectonicas del Proyecto (Frontend)

- Nunca hardcodees URLs absolutas del backend como `http://localhost:3000`.
- Usa siempre rutas relativas como `/api/...` y `/uploads/...` para que pasen por el proxy de Vite.
- Toda llamada al backend debe pasar por el cliente centralizado `apiFetch`, `apiGet`, `apiPost`, `apiPut`, `apiDelete` o `apiUpload`.
- No uses `fetch` ni `axios` crudos de forma aislada.
- Avatares e imagenes subidas deben usar misma origin mediante rutas relativas.

## 3. Reglas Arquitectonicas del Proyecto (Backend)

- Cuando un handler use `req.user`, tipalo con `AuthRequest`.
- Si se extiende `Express.Request`, por ejemplo `req.id`, el tipado debe vivir en `express.d.ts`.
- Toda ruta administrativa debe protegerse con `authorize(['ADMIN', 'MANAGER', 'VENTAS'])` cuando aplique.
- El codigo entregado debe poder compilar con `tsc --noEmit` sin errores de tipado.

## 4. Restricciones de Alcance

- No reescribas el archivo completo salvo que el usuario lo pida.
- No hagas refactors adyacentes.
- No cambies imports, nombres, formato o estructura fuera del bloque afectado si no es necesario.
- No inventes helpers nuevos si el cambio puede resolverse localmente.
- Conserva firmas, contratos y comportamiento externo salvo que la tarea exija cambiarlos.

## 5. Flujo de Ejecucion

1. Lee solo el contexto minimo necesario.
2. Identifica el punto exacto de cambio.
3. Implementa el diff mas pequeno posible.
4. Valida compilacion o build cuando la tarea lo requiera.
5. Devuelve salida minima y directamente integrable.

## 6. Criterio de Calidad

El resultado debe:

- compilar sin errores cuando aplique
- respetar contratos de entrada y salida
- mantener compatibilidad con el resto del sistema
- evitar regresiones de proxy, CORS y tipado
- ser pegable o ejecutable de inmediato
