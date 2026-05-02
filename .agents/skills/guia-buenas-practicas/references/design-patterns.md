# Patrones de Diseño — Prácticas 31 al 50

Los patrones de diseño son soluciones probadas a problemas recurrentes de diseño de software. No son código a copiar sino vocabulario compartido y plantillas de solución.

---

## Patrones Creacionales (cómo se crean los objetos)

### Práctica 31 — Singleton

**Problema:** Necesitas exactamente una instancia de una clase (configuración, conexión a BD, logger).
**Solución:** La clase controla su propia instanciación.

```php
class Configuracion {
    private static ?self $instancia = null;

    private function __construct(private array $datos) {}

    public static function getInstance(): self {
        if (self::$instancia === null) {
            self::$instancia = new self(include 'config.php');
        }
        return self::$instancia;
    }

    public function get(string $clave): mixed {
        return $this->datos[$clave] ?? null;
    }
}

// Uso:
$db_host = Configuracion::getInstance()->get('db_host');
```

**Cuándo usarlo:** Logger, conexión a BD, cache en memoria, configuración de app.
**Cuándo NO:** Si necesitas testear con diferentes instancias → usa DI.

---

### Práctica 32 — Factory Method

**Problema:** Necesitas crear objetos pero el código cliente no debe conocer la clase concreta.
**Solución:** Define una interfaz para crear objetos; las subclases deciden qué clase instanciar.

```python
from abc import ABC, abstractmethod

class Notificador(ABC):
    @abstractmethod
    def enviar(self, mensaje: str): ...

class NotificadorEmail(Notificador):
    def enviar(self, mensaje): print(f"Email: {mensaje}")

class NotificadorSMS(Notificador):
    def enviar(self, mensaje): print(f"SMS: {mensaje}")

class NotificadorWhatsApp(Notificador):
    def enviar(self, mensaje): print(f"WhatsApp: {mensaje}")

def crear_notificador(canal: str) -> Notificador:
    fabricas = {
        'email': NotificadorEmail,
        'sms': NotificadorSMS,
        'whatsapp': NotificadorWhatsApp,
    }
    if canal not in fabricas:
        raise ValueError(f"Canal desconocido: {canal}")
    return fabricas[canal]()

# El cliente no sabe qué clase concreta se usa
notificador = crear_notificador('whatsapp')
notificador.enviar("Tu pedido llegó")
```

---

### Práctica 33 — Abstract Factory

**Problema:** Necesitas crear familias de objetos relacionados sin especificar sus clases concretas.
**Solución:** Una fábrica abstracta que produce familias de objetos compatibles.

```javascript
// Familia "Tema Oscuro" vs "Tema Claro"
class TemaOscuro {
    crearBoton() { return new BotonOscuro(); }
    crearInput() { return new InputOscuro(); }
}
class TemaClaro {
    crearBoton() { return new BotonClaro(); }
    crearInput() { return new InputClaro(); }
}

// La UI usa la fábrica sin conocer el tema concreto
function renderizarFormulario(tema) {
    const boton = tema.crearBoton();
    const input = tema.crearInput();
    boton.render();
    input.render();
}
```

---

### Práctica 34 — Builder

**Problema:** Crear objetos complejos con muchos parámetros opcionales.
**Solución:** Separar la construcción de la representación. Permite construir paso a paso.

```php
class ConsultaSQL {
    private string $tabla = '';
    private array $columnas = ['*'];
    private array $condiciones = [];
    private ?int $limite = null;

    public static function desde(string $tabla): self {
        $q = new self();
        $q->tabla = $tabla;
        return $q;
    }
    public function seleccionar(array $columnas): self {
        $this->columnas = $columnas;
        return $this;
    }
    public function donde(string $condicion): self {
        $this->condiciones[] = $condicion;
        return $this;
    }
    public function limite(int $n): self {
        $this->limite = $n;
        return $this;
    }
    public function construir(): string {
        $sql = "SELECT " . implode(', ', $this->columnas) . " FROM {$this->tabla}";
        if ($this->condiciones)
            $sql .= " WHERE " . implode(' AND ', $this->condiciones);
        if ($this->limite)
            $sql .= " LIMIT {$this->limite}";
        return $sql;
    }
}

// Uso fluido y legible:
$sql = ConsultaSQL::desde('pedidos')
    ->seleccionar(['id', 'total', 'estado'])
    ->donde('estado = "pendiente"')
    ->donde('total > 1000')
    ->limite(50)
    ->construir();
```

---

### Práctica 35 — Prototype

**Problema:** Crear copias de objetos sin depender de sus clases concretas.
**Solución:** Los objetos implementan un método `clonar()`.

```python
import copy

class ConfiguracionServidor:
    def __init__(self, host, puerto, max_conexiones):
        self.host = host
        self.puerto = puerto
        self.max_conexiones = max_conexiones
        self.opciones_avanzadas = {}

    def clonar(self) -> 'ConfiguracionServidor':
        return copy.deepcopy(self)

# Crear una configuración base y clonarla para variaciones
base = ConfiguracionServidor('localhost', 8080, 100)
produccion = base.clonar()
produccion.host = 'prod.miapp.com'
produccion.max_conexiones = 1000
```

---

## Patrones Estructurales (cómo se organizan los objetos)

### Práctica 36 — Adapter

**Problema:** Integrar código con interfaces incompatibles (especialmente código legacy o APIs externas).
**Solución:** Un adaptador envuelve la interfaz existente y expone la que esperamos.

```javascript
// API externa de pagos con interfaz diferente a la nuestra
class PagoStripeExterno {
    charge(amountCents, currency, cardToken) { ... }
}

// La interfaz que espera nuestro sistema
class AdaptadorStripe {
    constructor() {
        this.stripe = new PagoStripeExterno();
    }
    // Adapta nuestra interfaz a la de Stripe
    cobrar(monto, tarjeta) {
        const centavos = Math.round(monto * 100);
        return this.stripe.charge(centavos, 'USD', tarjeta.token);
    }
}

// Nuestro código solo conoce la interfaz adaptada
const pasarela = new AdaptadorStripe();
pasarela.cobrar(99.99, tarjeta);
```

---

### Práctica 37 — Decorator

**Problema:** Agregar responsabilidades a un objeto dinámicamente, sin modificar su clase.
**Solución:** Envolver el objeto en decoradores que agregan comportamiento.

```php
interface Logger {
    public function log(string $mensaje): void;
}

class LoggerConsola implements Logger {
    public function log(string $mensaje): void {
        echo $mensaje . "\n";
    }
}

class LoggerConTimestamp implements Logger {
    public function __construct(private Logger $logger) {}
    public function log(string $mensaje): void {
        $this->logger->log("[" . date('Y-m-d H:i:s') . "] " . $mensaje);
    }
}

class LoggerConNivel implements Logger {
    public function __construct(private Logger $logger, private string $nivel) {}
    public function log(string $mensaje): void {
        $this->logger->log("[{$this->nivel}] " . $mensaje);
    }
}

// Composición dinámica de comportamientos:
$logger = new LoggerConNivel(
    new LoggerConTimestamp(
        new LoggerConsola()
    ),
    'ERROR'
);
$logger->log("Fallo la conexión a BD");
// Output: [ERROR] [2024-01-15 10:30:00] Fallo la conexión a BD
```

---

### Práctica 38 — Facade

**Problema:** Un subsistema complejo con muchas clases y pasos. El cliente no debería conocer todos los detalles.
**Solución:** Una fachada que expone una interfaz simple para el caso de uso más común.

```python
# Subsistema complejo
class ProcesadorPago: ...
class ValidadorTarjeta: ...
class ServicioFraude: ...
class NotificadorTransaccion: ...
class BitacoraFinanciera: ...

# Fachada que simplifica el caso de uso principal
class PasarelaPago:
    def __init__(self):
        self._procesador = ProcesadorPago()
        self._validador = ValidadorTarjeta()
        self._fraude = ServicioFraude()
        self._notificador = NotificadorTransaccion()
        self._bitacora = BitacoraFinanciera()

    def cobrar(self, tarjeta, monto) -> bool:
        if not self._validador.validar(tarjeta):
            return False
        if self._fraude.es_sospechoso(tarjeta, monto):
            return False
        resultado = self._procesador.procesar(tarjeta, monto)
        self._notificador.notificar(resultado)
        self._bitacora.registrar(resultado)
        return resultado.exitoso

# El cliente usa una interfaz simple
pasarela = PasarelaPago()
pasarela.cobrar(tarjeta, 150.00)
```

---

### Práctica 39 — Proxy

**Problema:** Controlar acceso a un objeto, agregar lazy loading, logging o caché.
**Solución:** Un proxy con la misma interfaz que el objeto real, que intercepta las llamadas.

```javascript
class ImagenReal {
    constructor(url) { this.url = url; this.cargar(); }
    cargar() { console.log(`Cargando imagen: ${this.url}`); }
    mostrar() { console.log(`Mostrando: ${this.url}`); }
}

// Proxy con lazy loading
class ImagenProxy {
    constructor(url) { this.url = url; this._imagen = null; }
    mostrar() {
        if (!this._imagen) {
            this._imagen = new ImagenReal(this.url);  // Carga solo cuando se necesita
        }
        this._imagen.mostrar();
    }
}
```

---

### Práctica 40 — Composite

**Problema:** Tratar objetos individuales y composiciones de objetos de manera uniforme (árboles).
**Solución:** Tanto el nodo hoja como el nodo compuesto implementan la misma interfaz.

```php
interface ComponenteMenu {
    public function mostrar(int $nivel = 0): void;
}

class ItemMenu implements ComponenteMenu {
    public function __construct(private string $nombre, private string $url) {}
    public function mostrar(int $nivel = 0): void {
        echo str_repeat('  ', $nivel) . "- {$this->nombre} ({$this->url})\n";
    }
}

class SubMenu implements ComponenteMenu {
    private array $hijos = [];
    public function __construct(private string $nombre) {}
    public function agregar(ComponenteMenu $c): void { $this->hijos[] = $c; }
    public function mostrar(int $nivel = 0): void {
        echo str_repeat('  ', $nivel) . "+ {$this->nombre}\n";
        foreach ($this->hijos as $hijo) $hijo->mostrar($nivel + 1);
    }
}
```

---

## Patrones de Comportamiento (cómo interactúan los objetos)

### Práctica 41 — Strategy

**Problema:** Familia de algoritmos intercambiables. Seleccionar uno en tiempo de ejecución.
**Solución:** Encapsular cada algoritmo en su propia clase con una interfaz común.

```python
from abc import ABC, abstractmethod

class EstrategiaOrdenamiento(ABC):
    @abstractmethod
    def ordenar(self, datos: list) -> list: ...

class OrdenamientoBurbuja(EstrategiaOrdenamiento):
    def ordenar(self, datos): ... # implementación

class OrdenamientoRapido(EstrategiaOrdenamiento):
    def ordenar(self, datos): ... # implementación

class Ordenador:
    def __init__(self, estrategia: EstrategiaOrdenamiento):
        self.estrategia = estrategia

    def cambiar_estrategia(self, estrategia: EstrategiaOrdenamiento):
        self.estrategia = estrategia

    def ordenar(self, datos: list) -> list:
        return self.estrategia.ordenar(datos)
```

---

### Práctica 42 — Observer

**Problema:** Cuando un objeto cambia de estado, otros objetos deben ser notificados automáticamente.
**Solución:** El sujeto mantiene una lista de observadores y los notifica ante cambios.

```javascript
class EventoInventario {
    constructor() { this.observadores = []; }

    suscribir(observador) { this.observadores.push(observador); }

    notificar(evento) {
        this.observadores.forEach(obs => obs.actualizar(evento));
    }

    registrarMovimiento(producto, cantidad) {
        // Lógica de negocio
        this.notificar({ tipo: 'MOVIMIENTO', producto, cantidad });
    }
}

class AlertaStockBajo {
    actualizar(evento) {
        if (evento.cantidad < 5)
            console.log(`⚠️ Stock bajo: ${evento.producto}`);
    }
}

class ActualizadorReporte {
    actualizar(evento) { /* actualizar reporte */ }
}
```

---

### Práctica 43 — Command

**Problema:** Encapsular una operación como un objeto. Soportar deshacer/rehacer, colas, logs.
**Solución:** Cada operación es un objeto `Comando` con método `ejecutar()` y opcionalmente `deshacer()`.

```php
interface Comando {
    public function ejecutar(): void;
    public function deshacer(): void;
}

class ComandoMoverArchivo implements Comando {
    public function __construct(
        private string $origen,
        private string $destino
    ) {}

    public function ejecutar(): void {
        rename($this->origen, $this->destino);
    }

    public function deshacer(): void {
        rename($this->destino, $this->origen);
    }
}

class HistorialComandos {
    private array $historial = [];

    public function ejecutar(Comando $cmd): void {
        $cmd->ejecutar();
        $this->historial[] = $cmd;
    }

    public function deshacer(): void {
        $cmd = array_pop($this->historial);
        $cmd?->deshacer();
    }
}
```

---

### Práctica 44 — Template Method

**Problema:** Un algoritmo con pasos fijos pero algunos pasos son variables según el contexto.
**Solución:** La clase base define el esqueleto; las subclases implementan los pasos variables.

```python
from abc import ABC, abstractmethod

class GeneradorReporte(ABC):
    # Template method: define el algoritmo completo
    def generar(self) -> str:
        datos = self.obtener_datos()
        datos_procesados = self.procesar(datos)
        return self.formatear(datos_procesados)

    @abstractmethod
    def obtener_datos(self) -> list: ...

    def procesar(self, datos: list) -> list:
        return datos  # Implementación por defecto (override opcional)

    @abstractmethod
    def formatear(self, datos: list) -> str: ...

class ReportePDF(GeneradorReporte):
    def obtener_datos(self): return db.query("SELECT * FROM ventas")
    def formatear(self, datos): return pdf_lib.crear(datos)

class ReporteCSV(GeneradorReporte):
    def obtener_datos(self): return db.query("SELECT * FROM ventas")
    def formatear(self, datos): return '\n'.join([','.join(row) for row in datos])
```

---

### Práctica 45 — State

**Problema:** Un objeto cuyo comportamiento cambia según su estado interno.
**Solución:** Encapsular cada estado en una clase separada.

```javascript
// En lugar de condicionales por estado:
class PedidoConEstado {
    constructor() { this.estado = new EstadoPendiente(this); }
    setEstado(estado) { this.estado = estado; }
    confirmar() { this.estado.confirmar(); }
    cancelar() { this.estado.cancelar(); }
    entregar() { this.estado.entregar(); }
}

class EstadoPendiente {
    confirmar() { this.pedido.setEstado(new EstadoConfirmado(this.pedido)); }
    cancelar() { this.pedido.setEstado(new EstadoCancelado(this.pedido)); }
    entregar() { throw new Error("No se puede entregar un pedido pendiente"); }
}
```

---

### Práctica 46 — Chain of Responsibility

**Problema:** Una solicitud debe pasar por múltiples manejadores. Cada uno decide si la procesa o la pasa al siguiente.
**Solución:** Cadena de manejadores enlazados.

```php
abstract class ManejadorValidacion {
    private ?self $siguiente = null;

    public function setSiguiente(self $siguiente): self {
        $this->siguiente = $siguiente;
        return $siguiente;
    }

    public function manejar(array $datos): ?string {
        if ($this->siguiente) return $this->siguiente->manejar($datos);
        return null; // Sin errores
    }
}

class ValidadorEmail extends ManejadorValidacion {
    public function manejar(array $datos): ?string {
        if (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL))
            return "Email inválido";
        return parent::manejar($datos);
    }
}

class ValidadorEdad extends ManejadorValidacion {
    public function manejar(array $datos): ?string {
        if ($datos['edad'] < 18)
            return "Debe ser mayor de edad";
        return parent::manejar($datos);
    }
}
```

---

### Práctica 47 — Iterator

**Problema:** Recorrer una colección sin exponer su implementación interna.
**Solución:** Un iterador que sabe cómo recorrer la colección.

Todos los lenguajes modernos tienen iteradores nativos. En Python usa `__iter__`/`__next__`, en PHP implementa `Iterator`, en JS usa `Symbol.iterator`.

---

### Práctica 48 — Mediator

**Problema:** Muchos objetos que se conocen entre sí crean acoplamiento en malla. Un chat donde cada usuario conoce a todos los demás.
**Solución:** Un mediador central que coordina la comunicación. Los objetos solo conocen al mediador.

```javascript
class SalaChat {
    constructor() { this.participantes = []; }
    registrar(usuario) { this.participantes.push(usuario); }
    difundir(mensaje, emisor) {
        this.participantes
            .filter(p => p !== emisor)
            .forEach(p => p.recibir(mensaje, emisor.nombre));
    }
}

class Usuario {
    constructor(nombre, sala) { this.nombre = nombre; this.sala = sala; }
    enviar(mensaje) { this.sala.difundir(mensaje, this); }
    recibir(mensaje, de) { console.log(`[${de}] → ${this.nombre}: ${mensaje}`); }
}
```

---

### Práctica 49 — Repository

**Problema:** Mezclar lógica de negocio con acceso a datos hace el código difícil de testear.
**Solución:** El repositorio abstrae el acceso a datos detrás de una interfaz orientada al dominio.

```python
class RepositorioProducto(ABC):
    @abstractmethod
    def buscar_por_id(self, id: int) -> Producto: ...
    @abstractmethod
    def guardar(self, producto: Producto) -> None: ...
    @abstractmethod
    def buscar_por_categoria(self, categoria: str) -> list[Producto]: ...

class MySQLRepositorioProducto(RepositorioProducto):
    def buscar_por_id(self, id): return db.query("SELECT * FROM productos WHERE id=?", id)
    # ...

# El servicio solo conoce la abstracción, no MySQL
class ServicioProducto:
    def __init__(self, repo: RepositorioProducto):
        self.repo = repo
```

---

### Práctica 50 — Event Sourcing (patrón avanzado)

**Problema:** Necesitas auditoría completa de cambios o poder "rebobinar" el estado.
**Solución:** En lugar de guardar el estado actual, guardar todos los eventos que lo produjeron.

```javascript
// En lugar de: { saldo: 500 }
// Guardas: [
//   { tipo: 'DEPOSITO', monto: 1000, fecha: '...' },
//   { tipo: 'RETIRO', monto: 300, fecha: '...' },
//   { tipo: 'RETIRO', monto: 200, fecha: '...' },
// ]
// El saldo se recalcula reproduciendo los eventos

class CuentaBancaria {
    constructor() { this.eventos = []; }

    depositar(monto) { this.eventos.push({ tipo: 'DEPOSITO', monto, fecha: new Date() }); }
    retirar(monto)   { this.eventos.push({ tipo: 'RETIRO', monto, fecha: new Date() }); }

    get saldo() {
        return this.eventos.reduce((saldo, e) =>
            e.tipo === 'DEPOSITO' ? saldo + e.monto : saldo - e.monto, 0);
    }
}
```
