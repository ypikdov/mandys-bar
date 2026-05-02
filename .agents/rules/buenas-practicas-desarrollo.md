---
trigger: always_on
source:
  repo: https://github.com/reiarseni/guia-de-buenas-practicas
  adapted_for: Mandy's Bar
---

# Buenas Practicas de Desarrollo

Guia base siempre activa para el proyecto Mandy's Bar. Esta version reemplaza la anterior y toma como referencia la guia de buenas practicas de `reiarseni`, adaptada al stack y a la arquitectura real del proyecto.

## 1. Principios generales

- Prioriza codigo legible, simple y explicable.
- Prefiere soluciones pequenas y estables sobre abstracciones innecesarias.
- Cada modulo debe tener una responsabilidad clara.
- Si una pieza de codigo cuesta explicarla, probablemente necesita simplificarse.
- No mezcles logica de UI, logica de negocio y acceso a datos en el mismo lugar.

## 2. Reglas del frontend

- No hardcodees URLs absolutas como `http://localhost:3000`.
- Usa siempre rutas relativas `/api/...`, `/uploads/...`, `/images/...`.
- Toda llamada HTTP debe pasar por los clientes/helpers centrales del proyecto.
- No introduzcas `fetch` o `axios` sueltos si ya existe una capa de servicios.
- Todo componente debe contemplar estados `loading`, `error`, `empty` y `success`.
- Si un bloque visual supera aproximadamente 20-30 lineas o se repite, extraelo a componente.
- Usa nombres de props y handlers descriptivos: `onConfirmOrder`, `reservationStatusLabel`, `handleUploadError`.
- Evita efectos secundarios ocultos en `useEffect`, setters y memos.
- Si un cambio afecta admin y cliente, valida ambos lados.

## 3. Reglas del backend

- Controllers: reciben request, validan entrada, delegan a servicios o helpers y responden.
- No pongas logica compleja de negocio mezclada con formato de respuesta HTTP.
- Si una ruta consume `req.user`, debe estar correctamente tipada.
- Protege rutas administrativas con autorizacion explicita cuando corresponda.
- Nunca expongas errores internos crudos al cliente.
- Valida entrada antes de tocar base de datos, storage o archivos.
- Si una operacion puede colisionar por concurrencia, usa transaccion, retry o bloqueo apropiado.
- No dependas de valores soft-deleted para generar identificadores unicos.

## 4. Base de datos y persistencia

- Usa nombres de entidades y campos claros.
- No dupliques reglas de negocio en varios endpoints.
- Toda consulta con riesgo de crecimiento debe pensar en paginacion, filtros o indices.
- Si hay unicidad, asumela a nivel de base de datos y maneja el error correctamente.
- No reutilices identificadores derivados de registros eliminados si siguen ocupando una constraint unica.
- Los cambios de schema deben mantener compatibilidad con el codigo activo o incluir su ajuste completo.

## 5. Clean Code adaptado

### Legibilidad

- Usa nombres completos y semanticos.
- Evita abreviaturas opacas.
- Un bloque debe poder leerse sin comentarios en la mayoria de los casos.

### SOLID aplicado

- Single Responsibility: cada modulo, hook o helper debe hacer una cosa principal.
- Open/Closed: extiende sin romper contratos existentes.
- Dependency Inversion: depende de helpers e interfaces, no de implementaciones dispersas.

### DRY

- Si repites logica dos veces, evalua extraerla.
- Si repites JSX, validacion o transformacion en varias pantallas, centralizala.

### KISS

- La solucion correcta suele ser la mas directa que respeta la arquitectura.
- No introduzcas patrones complejos si un helper bien nombrado resuelve el problema.

## 6. Comentarios y documentacion

- Los comentarios deben explicar el por que, no el que.
- No uses comentarios para maquillar codigo confuso.
- Documenta decisiones no obvias, reglas de negocio, limites del sistema y dependencias delicadas.
- Si agregas un flujo complejo, deja trazabilidad en `docs/` cuando el cambio lo justifique.

## 7. Errores y manejo defensivo

- Nunca silencies errores.
- Si no puedes resolver un error localmente, propaga una respuesta clara y segura.
- El usuario debe recibir mensajes utiles; los detalles tecnicos deben ir a logs.
- No uses `alert()` como salida principal en flujos importantes si ya existe UI para feedback.
- En frontend, evita que un dato invalido rompa navegacion, layout o links.

## 8. Seguridad minima obligatoria

- No confies en input del cliente.
- Sanitiza URLs, rutas, HTML y archivos segun el contexto.
- No expongas secretos en frontend ni los subas al repo.
- Todo acceso administrativo debe pasar por auth y roles.
- No abras superficies innecesarias en static serving, uploads o enlaces externos.
- Usa `noopener noreferrer` en `_blank` cuando corresponda.

## 9. Testing y verificacion

- Antes de cerrar un cambio, corre la validacion mas pequena que pruebe el fix real.
- Para frontend: build del workspace afectado y, cuando aplique, smoke visual o navegador.
- Para backend: build, typecheck o repro dirigido del endpoint tocado.
- Si el bug afecta cliente y admin, no valides solo uno.
- No des por bueno un fix sin una verificacion concreta.

## 10. Control de versiones

- Usa commits pequenos y con intencion clara.
- No mezcles en un mismo commit: refactor, feature, fix y assets irrelevantes.
- Antes de borrar o mover codigo, entiende por que existia.
- Si hay un worktree sucio, preserva los cambios ajenos.
- Los nombres de ramas y commits deben permitir entender el cambio sin leer todo el diff.

## 11. Dependencias y configuracion

- No agregues dependencias si el stack actual ya resuelve el problema.
- Si una libreria entra al proyecto, debe tener un uso claro y sostenido.
- Centraliza configuracion en variables de entorno o archivos de config del repo.
- No hardcodees secretos, tokens ni credenciales.
- Toda configuracion por ambiente debe ser explicita y documentada.

## 12. Refactor y deuda tecnica

- Refactoriza cuando mejore claridad, duplicacion o estabilidad real.
- No hagas refactor cosmetico dentro de un fix sensible si no es necesario.
- Si detectas deuda tecnica fuera del alcance, dejas constancia, no la mezclas.
- Reduce complejidad ciclomática antes de seguir anidando condiciones y excepciones.

## 13. Revision de codigo

- Todo cambio debe poder explicarse por objetivo, riesgo y verificacion.
- Si una decision no es obvia, deja el razonamiento en el codigo o en docs.
- Prioriza correccion, seguridad y mantenibilidad sobre preferencias esteticas.
- No apruebes mentalmente codigo que compila pero es fragil.

## 14. Logging, observabilidad y errores

- Loggea fallos utiles para diagnostico, no ruido.
- Nunca expongas stack traces internos al usuario final.
- Los mensajes de error deben separar:
  - detalle tecnico para logs
  - mensaje entendible para UI o API
- Si una operacion critica falla, debe quedar trazabilidad suficiente.

## 15. Performance y escalabilidad

- No optimices por intuicion; optimiza donde hay evidencia.
- Evita renderizados, consultas o transformaciones repetidas sin necesidad.
- Si un flujo crece en volumen, piensa desde el inicio en paginacion, cache o particion de carga.
- Cualquier mejora de performance no debe romper claridad ni consistencia.

## 16. Accesibilidad frontend

- Toda accion importante debe ser usable con teclado cuando aplique.
- Botones, links, inputs y modales deben tener etiquetas claras.
- No dependas solo del color para comunicar estado o error.
- Mantén contraste suficiente entre texto y fondo.
- Las imagenes relevantes deben tener `alt` util; las decorativas deben marcarse como decorativas.
- Los mensajes de error de formularios deben ser visibles, especificos y cercanos al campo.
- Evita layouts que se rompan en zoom o en pantallas pequenas.

## 17. Naming y convenciones

- Usa nombres en ingles o espanol, pero no mezcles estilos arbitrariamente dentro del mismo modulo.
- Variables: descriptivas y semanticas.
- Funciones: verbo + objetivo (`createOrderPdf`, `normalizeNavbarLink`, `validateReservationInput`).
- Componentes React: PascalCase.
- Hooks: prefijo `use`.
- Archivos de utilidades: nombres claros por dominio, no genericos tipo `helpers2` o `misc`.
- Evita abreviaturas opacas salvo siglas ampliamente conocidas.

## 18. Branching, PR y colaboracion

- Una rama debe representar un objetivo tecnico claro.
- Un PR debe tener alcance acotado y explicable.
- Antes de abrir PR, confirma build y validacion minima del area afectada.
- El titulo del PR debe describir el cambio real, no el proceso.
- Toda revision debe responder estas preguntas:
  - que problema resuelve
  - que riesgo introduce
  - como se verifico
- Si el cambio es visual, adjunta evidencia visual cuando tenga sentido.

## 19. Migraciones, seeds y datos de prueba

- Cambios de base de datos deben ser reproducibles.
- No modifiques schema sin contemplar migracion, seed o compatibilidad del codigo.
- Los seeds deben ser idempotentes o claramente seguros de rerun cuando sea posible.
- No mezcles datos de prueba improvisados con seeds del proyecto sin justificarlo.
- Todo cambio que afecte identificadores, relaciones o constraints debe revisarse con especial cuidado.

## 20. Checklist de seguridad especifico para Mandy's Bar

### Auth y sesiones

- No confies en el rol enviado por frontend.
- Verifica auth y autorizacion en backend, no solo en UI.
- No filtres datos sensibles segun supuestos del cliente.
- Los mensajes de error de login no deben filtrar detalles internos de infraestructura.

### Uploads e imagenes

- Valida tipo, extension, tamano y contenido basico del archivo.
- No sirvas rutas arbitrarias desde disco.
- Usa nombres controlados o normalizados al persistir archivos.
- No permitas que una imagen subida rompa el layout o inserte contenido ejecutable.

### PDFs y comprobantes

- No insertes datos del usuario en PDFs sin normalizacion basica.
- Todo texto externo debe tolerar contenido largo sin romper el layout.
- No generes enlaces externos inseguros dentro de PDFs o pantallas de descarga.
- Si un comprobante refleja estado de pago, debe salir de una fuente confiable del sistema.

### Site content y enlaces externos

- Toda URL editable por admin debe validarse y normalizarse.
- Links externos solo con protocolos permitidos.
- Rutas internas deben mapear a rutas reales de la app.
- Evita placeholders engañosos que se comporten como links reales inseguros.

## 21. Documentacion tecnica minima

- Documenta reglas de negocio, contratos sensibles y decisiones estructurales.
- Si agregas un flujo importante, deja una fuente unica de verdad en `docs/` cuando aplique.
- README, guias internas y reglas deben permanecer alineadas con el codigo real.

## 22. CI, calidad automatica y consistencia

- Todo proyecto debe poder validar build al menos en cliente, admin y backend cuando aplique.
- Usa linters, typecheck y builds como barrera minima de calidad.
- Si un cambio rompe CI, se corrige antes de considerarlo terminado.
- Automatiza chequeos repetitivos antes de convertirlos en disciplina manual.

## 23. Convenciones de trabajo

- Haz cambios pequenos, atomicos y explicables.
- No mezcles refactor, feature y fix si no es necesario.
- Respeta cambios previos del usuario en un worktree sucio.
- No borres codigo sin entender por que existia.
- Si una dependencia externa cambia, encapsula el impacto en un helper o adapter.

## 24. Checklist rapido antes de entregar

- El cambio compila.
- No rompiste rutas ni imports.
- No agregaste hardcodes evitables.
- La solucion sigue el patron del repo.
- El mensaje de error es seguro y entendible.
- El comportamiento fue verificado con un comando o repro concreto.

## 25. Aplicacion directa a Mandy's Bar

- Cliente y admin son apps separadas: piensa siempre en ambos contextos.
- PDFs, uploads, auth, pedidos, reservaciones y site-content son zonas sensibles.
- Evita depender de assets o rutas que solo funcionen en desarrollo local.
- Si un cambio toca experiencia visual, valida movil y escritorio cuando el flujo lo requiera.
- Si un cambio toca pedidos o reservaciones, valida tambien consecutivos, estado y descarga de comprobantes.

## 26. Checklist operativo especifico del proyecto

- Cliente build OK cuando tocas UI publica.
- Admin build OK cuando tocas panel o flujos internos.
- Backend build/typecheck OK cuando tocas endpoints, controladores o utilidades de servidor.
- Smoke de login si cambias auth.
- Smoke de pedidos si cambias checkout, orderService, PDF o backend de orders.
- Smoke de reservaciones si cambias events, reservations, PDF o backend de reservations.
- Smoke de imagenes si cambias uploads, assets, rutas estaticas o site-content.
