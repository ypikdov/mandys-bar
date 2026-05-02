#!/usr/bin/env python3
"""
Inicializador de Habilidades - Crea una nueva habilidad desde una plantilla en español.

Uso:
    inicializar_habilidad.py <nombre-habilidad> --path <ruta>

Ejemplos:
    inicializar_habilidad.py mi-nueva-habilidad --path habilidades/publicas
"""

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: [TODO: Explicación completa e informativa de lo que hace la habilidad y cuándo usarla. Incluye CUÁNDO usar esta habilidad: escenarios específicos, tipos de archivos o tareas que la activan.]
---

# {skill_title}

## Resumen

[TODO: 1-2 oraciones explicando qué permite hacer esta habilidad]

## Estructura de esta Habilidad

[TODO: Elige la estructura que mejor se adapte al propósito de esta habilidad. Patrones comunes:

**1. Basado en Flujo de Trabajo** (ideal para procesos secuenciales)
- Pasos paso a paso claros.
- Ejemplo: Habilidad de DOCX con "Lectura" → "Creación" → "Edición".

**2. Basado en Tareas** (ideal para colecciones de herramientas)
- Diferentes operaciones o capacidades.
- Ejemplo: Habilidad de PDF con "Unir" → "Dividir" → "Extraer Texto".

**3. Referencia/Guías** (ideal para estándares o especificaciones)
- Estándares de codificación o directrices de marca.

Elimina esta sección de "Estructura" cuando hayas terminado.]

## [TODO: Reemplazar con la primera sección principal]

[TODO: Añadir contenido aquí. Mira ejemplos en otras habilidades:
- Muestras de código
- Árboles de decisión para flujos complejos
- Ejemplos concretos con solicitudes reales de usuarios
- Referencias a scripts/plantillas/referencias según sea necesario]

## Recursos

Esta habilidad incluye directorios de recursos de ejemplo:

### scripts/
Código ejecutable (Python/Bash) que se puede ejecutar directamente.

### referencias/
Documentación y material de referencia para informar el proceso de Claude.

### activos/
Archivos que no se cargan al contexto, sino que se usan en la salida que Claude produce (plantillas, imágenes, etc.).

---

**Cualquier directorio no utilizado puede ser eliminado.**
"""

EXAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""
Script de ejemplo para {skill_name}

Este es un script de marcador de posición.
Reemplázalo con una implementación real o elíminalo si no es necesario.
"""

def main():
    print("Este es un script de ejemplo para {skill_name}")
    # TODO: Añadir lógica real aquí

if __name__ == "__main__":
    main()
'''

EXAMPLE_REFERENCE = """# Documentación de Referencia para {skill_title}

Este es un marcador de posición para documentación detallada.

## Cuándo usar documentos de referencia

Los documentos de referencia son ideales para:
- Documentación exhaustiva de APIs.
- Guías de flujos de trabajo detalladas.
- Procesos complejos de múltiples pasos.
- Información demasiado extensa para el SKILL.md principal.
"""

EXAMPLE_ASSET = """# Ejemplo de Archivo de Activo

Este marcador representa dónde se guardarían los archivos de activos.
Los activos NO se cargan en el contexto, se usan en la salida (plantillas, imágenes, fuentes).
"""


def title_case_skill_name(skill_name):
    """Convierte el nombre kebab-case a Title Case para visualización."""
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name, path):
    """
    Inicializa un nuevo directorio de habilidad con plantilla SKILL.md.
    """
    skill_dir = Path(path).resolve() / skill_name

    if skill_dir.exists():
        print(f"❌ Error: El directorio de la habilidad ya existe: {skill_dir}")
        return None

    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
        print(f"✅ Directorio creado: {skill_dir}")
    except Exception as e:
        print(f"❌ Error al crear directorio: {e}")
        return None

    skill_title = title_case_skill_name(skill_name)
    skill_content = SKILL_TEMPLATE.format(
        skill_name=skill_name,
        skill_title=skill_title
    )

    skill_md_path = skill_dir / 'SKILL.md'
    try:
        skill_md_path.write_text(skill_content, encoding='utf-8')
        print("✅ SKILL.md creado")
    except Exception as e:
        print(f"❌ Error al crear SKILL.md: {e}")
        return None

    try:
        # scripts/
        scripts_dir = skill_dir / 'scripts'
        scripts_dir.mkdir(exist_ok=True)
        example_script = scripts_dir / 'ejemplo.py'
        example_script.write_text(EXAMPLE_SCRIPT.format(skill_name=skill_name), encoding='utf-8')
        example_script.chmod(0o755)
        print("✅ scripts/ejemplo.py creado")

        # referencias/
        references_dir = skill_dir / 'referencias'
        references_dir.mkdir(exist_ok=True)
        example_reference = references_dir / 'referencia_api.md'
        example_reference.write_text(EXAMPLE_REFERENCE.format(skill_title=skill_title), encoding='utf-8')
        print("✅ referencias/referencia_api.md creado")

        # activos/
        assets_dir = skill_dir / 'activos'
        assets_dir.mkdir(exist_ok=True)
        example_asset = assets_dir / 'ejemplo_activo.txt'
        example_asset.write_text(EXAMPLE_ASSET, encoding='utf-8')
        print("✅ activos/ejemplo_activo.txt creado")
    except Exception as e:
        print(f"❌ Error al crear directorios de recursos: {e}")
        return None

    print(f"\n✅ Habilidad '{skill_name}' inicializada con éxito en {skill_dir}")
    print("\nPróximos pasos:")
    print("1. Edita SKILL.md para completar los TODOs.")
    print("2. Personaliza o elimina los ejemplos en scripts/, referencias/ y activos/.")

    return skill_dir


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Uso: inicializar_habilidad.py <nombre-habilidad> --path <ruta>")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    print(f"🚀 Inicializando habilidad: {skill_name}")
    print(f"   Ubicación: {path}\n")

    result = init_skill(skill_name, path)

    if result:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
