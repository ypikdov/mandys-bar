---
name: creador-de-habilidades-es
description: Guía para crear habilidades efectivas en español. Esta habilidad debe usarse cuando el usuario quiera crear una nueva habilidad (o actualizar una existente) que extienda las capacidades de Claude con conocimiento especializado, flujos de trabajo o integraciones de herramientas, todo documentado en español.
---

# Creador de Habilidades (Español)

Esta habilidad proporciona orientación para crear habilidades efectivas documentadas en español.

## Sobre las Habilidades

Las habilidades son paquetes modulares e independientes que extienden las capacidades de Claude al proporcionar conocimiento especializado, flujos de trabajo y herramientas. Piensa en ellas como "guías de inducción" para dominios o tareas específicas: transforman a Claude de un agente de propósito general en uno especializado equipado con conocimiento procedimental que ningún modelo puede poseer plenamente.

### Lo que las Habilidades Proporcionan

1. **Flujos de trabajo especializados**: Procedimientos de múltiples pasos para dominios específicos.
2. **Integraciones de herramientas**: Instrucciones para trabajar con formatos de archivo o APIs específicas.
3. **Experiencia de dominio**: Conocimiento específico de la empresa, esquemas, lógica de negocio.
4. **Recursos empaquetados**: Scripts, referencias y activos para tareas complejas y repetitivas.

## Principios Fundamentales

### La Concisión es Clave

La ventana de contexto es un bien público. Las habilidades comparten este espacio con todo lo demás que Claude necesita: el prompt del sistema, el historial de conversación y la solicitud del usuario.

**Suposición por defecto: Claude ya es muy inteligente.** Solo añade contexto que Claude aún no tenga. Cuestiona cada pieza de información: "¿Realmente Claude necesita esta explicación?" y "¿Este párrafo justifica su costo en tokens?".

Prefiere ejemplos concisos sobre explicaciones verbosas.

### Establecer Grados de Libertad Apropiados

Ajusta el nivel de especificidad según la fragilidad y variabilidad de la tarea:

- **Libertad Alta (instrucciones de texto)**: Úsala cuando varios enfoques son válidos o las decisiones dependen del contexto.
- **Libertad Media (pseudocódigo o scripts con parámetros)**: Úsala cuando existe un patrón preferido pero se acepta cierta variación.
- **Libertad Baja (scripts específicos)**: Úsala cuando las operaciones son frágiles o la consistencia es crítica.

### Anatomía de una Habilidad

Cada habilidad consiste en un archivo `SKILL.md` obligatorio y recursos opcionales:

```
nombre-habilidad/
├── SKILL.md (obligatorio)
│   ├── Metadatos YAML (frontmatter)
│   └── Instrucciones en Markdown
└── Recursos (opcionales)
    ├── scripts/       - Código ejecutable (Python/Bash)
    ├── referencias/   - Documentación cargada según sea necesario
    └── activos/       - Archivos usados en la salida (plantillas, iconos)
```

## Proceso de Creación de Habilidades

1. **Entender la habilidad con ejemplos concretos**: Define para qué se usará.
2. **Planificar los contenidos reutilizables**: Identifica qué scripts o plantillas ayudarán.
3. **Inicializar la habilidad**: Crea la estructura de directorios.
4. **Editar la habilidad**: Escribe el `SKILL.md` y desarrolla los recursos.
5. **Empaquetar la habilidad**: Genera el archivo `.skill` para distribución.

## Guía de Referencia

Para más detalles sobre patrones específicos, consulta:

- **Flujos de trabajo**: [flujos.md](referencias/flujos.md) para procesos secuenciales.
- **Patrones de salida**: [patrones-salida.md](referencias/patrones-salida.md) para estándares de calidad.
