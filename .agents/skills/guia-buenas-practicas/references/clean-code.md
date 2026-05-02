# Clean Code — Prácticas 1 al 20

Referencia completa de las 20 primeras buenas prácticas, enfocadas en legibilidad, claridad y mantenimiento del código.

---

## Práctica 1 — Nombres que revelan intención

Los nombres de variables, funciones y clases deben responder: ¿qué es esto? ¿para qué sirve? Si necesitas un comentario para explicar el nombre, el nombre está mal.

**Mal:**
```php
$d = 7; // días transcurridos
function proc($a, $b) { return $a * $b; }
```

**Bien:**
```php
$diasTranscurridos = 7;
function calcularTotalVenta(float $precio, int $cantidad): float {
    return $precio * $cantidad;
}
```

---

## Práctica 2 — Evitar desinformación

No uses nombres que induzcan a error. Evita abreviaturas crípticas, nombres que sugieran un tipo diferente al real, o nombres casi idénticos.

**Mal:**
```python
lista_usuarios = {}   # Es un dict, no una lista
hp = calcular()       # ¿Qué es hp? ¿HorsePower? ¿HealthPoints?
```

**Bien:**
```python
mapa_usuarios_por_id = {}
horas_promedio = calcular_horas_promedio()
```

---

## Práctica 3 — Nombres pronunciables y buscables

Si no puedes pronunciar el nombre en voz alta, no lo uses. Los nombres buscables son preferibles a constantes numéricas sueltas.

**Mal:**
```javascript
const yyyymmdd = new Date();
for (let j = 0; j < 7; j++) { ... }
```

**Bien:**
```javascript
const fechaActual = new Date();
const DIAS_EN_SEMANA = 7;
for (let dia = 0; dia < DIAS_EN_SEMANA; dia++) { ... }
```

---

## Práctica 4 — Evitar codificaciones y prefijos húngaros

No uses prefijos de tipo (`strNombre`, `iContador`, `m_variable`). Los IDEs modernos ya muestran el tipo.

**Mal:**
```php
$strNombre = "Gerald";
$intEdad = 25;
private $m_conexion;
```

**Bien:**
```php
$nombre = "Gerald";
$edad = 25;
private $conexion;
```

---

## Práctica 5 — Una palabra por concepto

Elige una palabra para un concepto abstracto y úsala consistentemente. No mezcles `get`, `fetch`, `retrieve`, `obtener` para la misma operación.

**Mal:**
```javascript
class ProductoRepo {
    fetchProductos() { ... }
    obtenerUsuario(id) { ... }
    retrieveOrden(id) { ... }
}
```

**Bien:**
```javascript
class ProductoRepo {
    obtenerProductos() { ... }
    obtenerUsuario(id) { ... }
    obtenerOrden(id) { ... }
}
```

---

## Práctica 6 — Funciones pequeñas con una sola responsabilidad

Una función debe hacer **una sola cosa**, hacerla bien y solo esa. Si necesitas usar "y" para describir lo que hace, tiene más de una responsabilidad.

**Mal:**
```python
def procesar_pedido(pedido):
    # Valida
    if not pedido.get('cliente_id'):
        raise ValueError("Cliente requerido")
    # Calcula total
    total = sum(item['precio'] * item['cantidad'] for item in pedido['items'])
    # Guarda en BD
    db.save({'pedido': pedido, 'total': total})
    # Envía email
    enviar_email(pedido['email'], f"Tu pedido por {total} fue recibido")
```

**Bien:**
```python
def validar_pedido(pedido): ...
def calcular_total(items): ...
def guardar_pedido(pedido, total): ...
def notificar_cliente(email, total): ...

def procesar_pedido(pedido):
    validar_pedido(pedido)
    total = calcular_total(pedido['items'])
    guardar_pedido(pedido, total)
    notificar_cliente(pedido['email'], total)
```

---

## Práctica 7 — Pocos argumentos en funciones

Lo ideal es 0-2 argumentos. Con 3 ya hay que pensarlo. Con 4 o más, agrúpalos en un objeto/array.

**Mal:**
```php
function crearUsuario($nombre, $apellido, $email, $telefono, $rol, $activo) { ... }
```

**Bien:**
```php
function crearUsuario(array $datos): Usuario {
    // $datos = ['nombre', 'apellido', 'email', 'telefono', 'rol', 'activo']
}
```

---

## Práctica 8 — Evitar efectos secundarios ocultos

Una función con nombre `obtenerUsuario()` no debería modificar la sesión ni escribir en la BD. Los efectos secundarios ocultos crean bugs difíciles de rastrear.

**Mal:**
```javascript
function verificarContrasena(usuario, contrasena) {
    if (usuario.contrasena === hashear(contrasena)) {
        // Efecto secundario oculto:
        sesion.iniciar(usuario.id); // ¡Esto no debería estar aquí!
        return true;
    }
    return false;
}
```

**Bien:**
```javascript
function verificarContrasena(usuario, contrasena) {
    return usuario.contrasena === hashear(contrasena);
}

// El caller decide qué hacer con el resultado:
if (verificarContrasena(usuario, contrasena)) {
    sesion.iniciar(usuario.id);
}
```

---

## Práctica 9 — Retornos tempranos (Guard Clauses)

En lugar de anidar condicionales profundamente, retorna temprano cuando las precondiciones fallen. El "camino feliz" queda al final, limpio.

**Mal:**
```php
function procesarPago($monto, $tarjeta) {
    if ($monto > 0) {
        if ($tarjeta !== null) {
            if ($tarjeta->estaActiva()) {
                // ... lógica real aquí, muy adentro
                return true;
            }
        }
    }
    return false;
}
```

**Bien:**
```php
function procesarPago(float $monto, ?Tarjeta $tarjeta): bool {
    if ($monto <= 0) return false;
    if ($tarjeta === null) return false;
    if (!$tarjeta->estaActiva()) return false;

    // Lógica principal al nivel raíz, fácil de leer
    return $pasarela->cobrar($tarjeta, $monto);
}
```

---

## Práctica 10 — No usar flags como parámetros de comportamiento

Un parámetro booleano que cambia el comportamiento de la función es una señal de que deberían ser dos funciones distintas.

**Mal:**
```python
def renderizar_boton(texto, primario=False):
    if primario:
        return f'<button class="btn-primary">{texto}</button>'
    else:
        return f'<button class="btn-secondary">{texto}</button>'
```

**Bien:**
```python
def renderizar_boton_primario(texto): ...
def renderizar_boton_secundario(texto): ...
```

---

## Práctica 11 — DRY: No te repitas

Cada pieza de conocimiento debe tener una representación única en el sistema. La duplicación es la raíz de la mayoría de los bugs de mantenimiento.

**Mal:**
```javascript
// En checkout.js
const iva = precio * 0.13;
// En factura.js
const impuesto = subtotal * 0.13;
// En reportes.js
const gravamen = monto * 0.13;
```

**Bien:**
```javascript
// constants.js
export const TASA_IVA = 0.13;

// En todos lados:
import { TASA_IVA } from './constants';
const iva = precio * TASA_IVA;
```

---

## Práctica 12 — Comentarios que explican el "por qué", no el "qué"

El código debe ser tan claro que los comentarios que explican "qué hace" sean innecesarios. Los buenos comentarios explican intenciones, advertencias o decisiones no obvias.

**Mal:**
```php
// Incrementa el contador en 1
$contador++;

// Retorna el nombre del usuario
return $usuario->nombre;
```

**Bien:**
```php
// Usamos md5 por compatibilidad con el sistema legacy de pagos (no por seguridad)
$hash = md5($token);

// El límite de 500 proviene del contrato SLA con el proveedor externo
const MAX_PETICIONES_POR_HORA = 500;
```

---

## Práctica 13 — Eliminar código muerto

El código comentado, las funciones que nadie llama, las variables sin usar: elimínalos. Para eso existe el control de versiones. El código muerto confunde y desactualiza.

**Mal:**
```python
def calcular_descuento(precio, tipo):
    # if tipo == 'vip':
    #     return precio * 0.30
    # elif tipo == 'premium':
    #     return precio * 0.20
    return precio * 0.10
```

**Bien:**
```python
def calcular_descuento(precio):
    return precio * 0.10
# El historial de git guarda las versiones anteriores
```

---

## Práctica 14 — Formateo consistente

El formato del código comunica estructura. Usa un estándar consistente: indentación, espaciado, longitud de línea. Usa un linter/formatter automático.

**Herramientas recomendadas:**
- PHP: PHP-CS-Fixer, PHP_CodeSniffer (PSR-12)
- Python: Black, isort, flake8
- JavaScript: Prettier, ESLint

---

## Práctica 15 — Separación vertical de conceptos

Las variables se declaran cerca de donde se usan. Las funciones relacionadas van juntas. Las líneas en blanco separan conceptos distintos.

```javascript
// Las variables van justo antes de donde se necesitan
function calcularEnvio(pedido) {
    const peso = pedido.items.reduce((sum, item) => sum + item.peso, 0);
    const costoBase = peso * TARIFA_KG;

    const esEnvioUrgente = pedido.urgente;
    const recargo = esEnvioUrgente ? costoBase * 0.5 : 0;

    return costoBase + recargo;
}
```

---

## Práctica 16 — Evitar números mágicos

Los números literales sin contexto son un misterio. Nómbralos como constantes.

**Mal:**
```php
if ($intentos > 3) bloquearCuenta();
$precio *= 1.13;
```

**Bien:**
```php
const MAX_INTENTOS_LOGIN = 3;
const IVA_COSTA_RICA = 1.13;

if ($intentos > MAX_INTENTOS_LOGIN) bloquearCuenta();
$precio *= IVA_COSTA_RICA;
```

---

## Práctica 17 — Manejo explícito de errores

No uses códigos de retorno para señalizar errores. Usa excepciones con mensajes claros. Nunca capturas excepciones y las ignoras silenciosamente.

**Mal:**
```python
def abrir_archivo(ruta):
    try:
        return open(ruta)
    except:
        pass  # ← silenciar errores es el peor hábito
```

**Bien:**
```python
def abrir_archivo(ruta: str):
    try:
        return open(ruta, 'r', encoding='utf-8')
    except FileNotFoundError:
        raise FileNotFoundError(f"Archivo de configuración no encontrado: {ruta}")
    except PermissionError:
        raise PermissionError(f"Sin permisos de lectura para: {ruta}")
```

---

## Práctica 18 — Validación de entradas (Fail Fast)

Valida las entradas al inicio de la función. Si algo está mal, falla inmediatamente con un mensaje claro. No dejes que datos inválidos viajen profundo en el sistema.

```javascript
function transferir(monto, cuentaOrigen, cuentaDestino) {
    if (typeof monto !== 'number' || monto <= 0)
        throw new Error('El monto debe ser un número positivo');
    if (!cuentaOrigen || !cuentaDestino)
        throw new Error('Se requieren cuentas de origen y destino válidas');
    if (cuentaOrigen === cuentaDestino)
        throw new Error('No se puede transferir a la misma cuenta');

    // Lógica real aquí
}
```

---

## Práctica 19 — Inmutabilidad cuando sea posible

Prefiere datos inmutables. Evita modificar objetos recibidos como parámetros. Crea copias en lugar de mutar el original. Reduce bugs relacionados con estado compartido.

**Mal:**
```python
def aplicar_descuento(producto, porcentaje):
    producto['precio'] *= (1 - porcentaje)  # Muta el original
    return producto
```

**Bien:**
```python
def aplicar_descuento(producto: dict, porcentaje: float) -> dict:
    return {**producto, 'precio': producto['precio'] * (1 - porcentaje)}
```

---

## Práctica 20 — Ley de Demeter (no hables con extraños)

Un objeto solo debe conocer a sus colaboradores directos. Evita las cadenas largas de llamadas que acoplan objetos lejanos.

**Mal:**
```php
$ciudad = $pedido->getCliente()->getDireccion()->getCiudad()->getNombre();
```

**Bien:**
```php
// El Pedido expone lo que necesita directamente
$ciudad = $pedido->getCiudadEntrega();

// O si es necesario, delega:
class Pedido {
    public function getCiudadEntrega(): string {
        return $this->cliente->getCiudadPrincipal();
    }
}
```
