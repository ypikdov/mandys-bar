# Automatización y Calidad — Prácticas 51 al 60

Las últimas 10 prácticas cubren testing, CI/CD, documentación y refactoring: las herramientas que mantienen el código saludable a largo plazo.

---

## Práctica 51 — Pruebas unitarias

Cada unidad de lógica (función o clase) debe tener tests que validen su comportamiento. Los tests unitarios son rápidos, aislados y deterministas.

**Estructura AAA (Arrange, Act, Assert):**

```php
class CalculadoraDescuentoTest extends TestCase {
    public function test_descuento_vip_es_15_por_ciento(): void {
        // Arrange: prepara el contexto
        $calculadora = new CalculadoraDescuento();
        $precio = 100.0;

        // Act: ejecuta la acción
        $resultado = $calculadora->calcular($precio, 'vip');

        // Assert: verifica el resultado
        $this->assertEquals(85.0, $resultado);
    }

    public function test_precio_cero_no_aplica_descuento(): void {
        $calculadora = new CalculadoraDescuento();
        $this->assertEquals(0.0, $calculadora->calcular(0, 'vip'));
    }

    public function test_tipo_desconocido_lanza_excepcion(): void {
        $this->expectException(InvalidArgumentException::class);
        (new CalculadoraDescuento())->calcular(100, 'inexistente');
    }
}
```

**Reglas de buen test unitario:**
- Un test verifica una sola cosa
- El nombre describe exactamente qué se prueba
- No depende de otros tests (no tiene estado compartido)
- No toca la red ni el sistema de archivos

---

## Práctica 52 — Test-Driven Development (TDD)

Escribe el test antes que el código. El ciclo es: **Red → Green → Refactor**.

1. **Red**: Escribe un test que falle (el código aún no existe)
2. **Green**: Escribe el código mínimo para pasar el test
3. **Refactor**: Limpia el código sin romper el test

**Beneficios reales del TDD:**
- Te fuerza a pensar en la interfaz antes que en la implementación
- Los tests son documentación ejecutable del comportamiento esperado
- El refactoring se vuelve seguro porque tienes una red de seguridad

---

## Práctica 53 — Mocks y stubs para aislar dependencias

Cuando una unidad depende de servicios externos (BD, API, email), usa dobles de prueba para aislarla.

```python
from unittest.mock import Mock, patch
import pytest

class ServicioRegistro:
    def __init__(self, repo_usuarios, mailer):
        self.repo = repo_usuarios
        self.mailer = mailer

    def registrar(self, datos: dict) -> dict:
        usuario = self.repo.crear(datos)
        self.mailer.enviar_bienvenida(usuario['email'])
        return usuario

def test_registrar_usuario_envia_email_bienvenida():
    # Arrange: crear mocks
    mock_repo = Mock()
    mock_repo.crear.return_value = {'id': 1, 'email': 'test@example.com'}
    mock_mailer = Mock()

    servicio = ServicioRegistro(mock_repo, mock_mailer)

    # Act
    servicio.registrar({'nombre': 'Gerald', 'email': 'test@example.com'})

    # Assert: verificar interacciones
    mock_mailer.enviar_bienvenida.assert_called_once_with('test@example.com')
```

---

## Práctica 54 — Cobertura de código

La cobertura mide qué porcentaje del código es ejecutado por los tests. No es una métrica de calidad absoluta, pero sí una alarma cuando cae.

**Herramientas:**
- PHP: PHPUnit + Xdebug (`phpunit --coverage-html=coverage/`)
- Python: pytest-cov (`pytest --cov=src --cov-report=html`)
- JavaScript: Jest (`jest --coverage`)

**Metas razonables:**
- Lógica de negocio crítica: 90%+
- Utilidades y helpers: 80%+
- Controladores HTTP: 70%+
- No busques el 100% — los getters triviales no necesitan tests

**Trampa común:** El 80% de cobertura puede significar que las 20 líneas no cubiertas son exactamente los casos de error más importantes.

---

## Práctica 55 — Tests de integración y end-to-end

Los tests unitarios verifican piezas. Los tests de integración verifican que las piezas funcionen juntas. Los tests E2E simulan el comportamiento del usuario real.

```javascript
// Test de integración: verifica el flujo completo de un endpoint
describe('POST /api/pedidos', () => {
    it('crea un pedido y retorna 201', async () => {
        const respuesta = await request(app)
            .post('/api/pedidos')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productos: [{ id: 1, cantidad: 2 }],
                direccion: 'San José, Costa Rica'
            });

        expect(respuesta.status).toBe(201);
        expect(respuesta.body).toHaveProperty('id');
        expect(respuesta.body.estado).toBe('pendiente');

        // Verifica que el pedido realmente se guardó en la BD de prueba
        const pedidoEnBD = await PedidoModel.findById(respuesta.body.id);
        expect(pedidoEnBD).not.toBeNull();
    });
});
```

---

## Práctica 56 — Integración y entrega continua (CI/CD)

Automatiza la validación del código en cada push. Un pipeline típico:

```yaml
# .github/workflows/ci.yml (GitHub Actions)
name: CI

on: [push, pull_request]

jobs:
  calidad:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Instalar dependencias
        run: composer install --no-dev

      - name: Análisis estático
        run: vendor/bin/phpstan analyse src --level=8

      - name: Estilo de código
        run: vendor/bin/php-cs-fixer fix --dry-run --diff

      - name: Tests
        run: vendor/bin/phpunit --coverage-clover coverage.xml

      - name: Verificar cobertura mínima
        run: |
          COBERTURA=$(php -r "...")
          if [ "$COBERTURA" -lt "80" ]; then exit 1; fi
```

**Principio clave:** Si el pipeline falla, nadie hace merge hasta que esté verde. El código roto no llega a main.

---

## Práctica 57 — Análisis estático de código

El análisis estático encuentra bugs antes de ejecutar el código. Es el compilador de seguridad de los lenguajes dinámicos.

**Herramientas esenciales:**

| Lenguaje | Herramienta | Qué detecta |
|---|---|---|
| PHP | PHPStan nivel 8+ | Tipos incorrectos, métodos inexistentes, null access |
| PHP | Psalm | Similar a PHPStan, más estricto |
| Python | mypy | Errores de tipos con type hints |
| Python | pylint | Errores de estilo, variables no usadas, complejidad |
| JavaScript | TypeScript | Tipos en JS, errores en tiempo de compilación |
| JavaScript | ESLint | Errores comunes, anti-patterns |

**Configuración recomendada PHP (phpstan.neon):**
```yaml
parameters:
    level: 8
    paths:
        - src
    checkMissingIterableValueType: true
    checkUninitializedProperties: true
```

---

## Práctica 58 — Documentación como código

La documentación más valiosa es la que se actualiza automáticamente con el código. Los comentarios de tipo DocBlock generan documentación y potencian el autocompletado del IDE.

```php
/**
 * Calcula el precio final de un producto aplicando descuentos e impuestos.
 *
 * @param float $precioBase  Precio sin impuestos ni descuentos (en CRC)
 * @param string $tipoCliente 'normal', 'vip', o 'premium'
 * @param bool $aplicarIVA   Si true, agrega el 13% de IVA al precio final
 *
 * @return float Precio final redondeado a 2 decimales
 *
 * @throws \InvalidArgumentException Si $tipoCliente no es un valor válido
 *
 * @example
 * $precio = calcularPrecioFinal(1000.0, 'vip', true);
 * // Retorna: 959.50 (15% descuento + 13% IVA)
 */
function calcularPrecioFinal(float $precioBase, string $tipoCliente, bool $aplicarIVA): float {
```

---

## Práctica 59 — Refactoring seguro

El refactoring es mejorar la estructura interna del código sin cambiar su comportamiento externo. La clave es tener tests antes de refactorizar.

**Técnicas de refactoring más comunes:**

| Técnica | Cuándo usarla |
|---|---|
| Extract Method | Función muy larga → extraer fragmento con nombre descriptivo |
| Extract Class | Clase con demasiadas responsabilidades |
| Rename Variable/Method | Nombre confuso o engañoso |
| Inline Variable | Variable que solo se usa una vez y no clarifica nada |
| Replace Conditional with Polymorphism | if/switch por tipo → patrón Strategy o State |
| Introduce Parameter Object | 4+ parámetros relacionados → agrupar en clase/dict |
| Move Method | Método que usa más datos de otra clase que de la propia |
| Extract Interface | Clase con múltiples clientes que usan subconjuntos distintos |

**Proceso seguro:**
1. Verifica que los tests existentes pasan (verde)
2. Haz el refactoring en pasos pequeños
3. Ejecuta los tests después de cada paso
4. Si algo se rompe, revierte inmediatamente

---

## Práctica 60 — Code Review sistemático

El code review no es solo buscar bugs. Es transferencia de conocimiento, mantenimiento de estándares y mentoring.

**Checklist de reviewer:**

```
✅ Funcionalidad
   □ ¿El código hace lo que dice el ticket?
   □ ¿Maneja casos borde y errores?

✅ Clean Code
   □ ¿Los nombres son descriptivos?
   □ ¿Las funciones tienen una sola responsabilidad?
   □ ¿Hay código duplicado que debería extraerse?

✅ SOLID y Arquitectura
   □ ¿Las nuevas clases tienen responsabilidad única?
   □ ¿Hay dependencias directas que deberían ser abstractas?
   □ ¿Se rompió alguna abstracción existente?

✅ Seguridad
   □ ¿Se validan y sanean las entradas del usuario?
   □ ¿Hay secretos o credenciales hardcodeadas?
   □ ¿Hay vulnerabilidades SQL injection / XSS?

✅ Tests
   □ ¿Los tests cubren los casos principales y los bordes?
   □ ¿Los tests son legibles y tienen buenos nombres?

✅ Performance
   □ ¿Hay queries N+1 o bucles innecesarios?
   □ ¿Hay operaciones costosas que deberían ser async/cache?
```

**Cultura de code review:**
- Critica el código, nunca a la persona
- Explica el "por qué" de cada sugerencia
- Distingue entre "debe cambiar" (bug/seguridad) y "sugiero" (estilo/preferencia)
- El autor siempre tiene la última palabra en decisiones de diseño (con justificación)
```
