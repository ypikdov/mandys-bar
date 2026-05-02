# Flujos de Trabajo en Habilidades

Esta guía describe cómo diseñar flujos de trabajo de múltiples pasos para que Claude los siga de manera consistente.

## Patrón de Pasos Secuenciales

Usa este formato para procesos que deben seguir un orden estricto:

1. **Investigación**: Analiza el estado actual del archivo...
2. **Planificación**: Define los cambios necesarios...
3. **Ejecución**: Aplica los cambios usando las herramientas...
4. **Verificación**: Ejecuta los tests para confirmar...

## Lógica Condicional

Describe bifurcaciones en el proceso basándote en el estado o la respuesta de una herramienta:

- **Si el archivo no existe**: Crea un nuevo archivo con el contenido...
- **Si el archivo ya existe**: Verifica si contiene la función `X`...
- **Si ocurre un error de linting**: Identifica el ID del error y corrígelo...

## Bucles de Iteración

Define ciclos claros para tareas repetitivas:

1. Identifica el siguiente ítem en la lista.
2. Procesa el ítem según la Guía [X].
3. Si quedan más ítems, vuelve al paso 1. De lo contrario, procede a la Verificación.
