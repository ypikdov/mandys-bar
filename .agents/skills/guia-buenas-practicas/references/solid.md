# Principios SOLID — Prácticas 21 al 30

Los cinco principios SOLID son la columna vertebral del diseño orientado a objetos. Reducen el acoplamiento, aumentan la cohesión y hacen el código extensible sin ser frágil.

---

## Práctica 21 — S: Single Responsibility Principle (SRP)

**Una clase debe tener una sola razón para cambiar.**

Si una clase tiene que cambiar cuando cambia la lógica de negocio Y cuando cambia la presentación Y cuando cambia la persistencia, tiene demasiadas responsabilidades.

**Mal:**
```php
class Usuario {
    public function guardarEnBD(): void { ... }          // Persistencia
    public function enviarEmailBienvenida(): void { ... } // Notificaciones
    public function renderizarHTML(): string { ... }      // Presentación
    public function calcularNivel(): string { ... }       // Negocio
}
```

**Bien:**
```php
class Usuario {
    public function calcularNivel(): string { ... }  // Solo negocio
}
class UsuarioRepositorio {
    public function guardar(Usuario $u): void { ... }
}
class UsuarioMailer {
    public function enviarBienvenida(Usuario $u): void { ... }
}
class UsuarioRenderer {
    public function renderizar(Usuario $u): string { ... }
}
```

**Señales de alerta SRP:**
- La clase tiene más de 200 líneas
- El nombre es genérico: `Manager`, `Helper`, `Utils`, `Handler`
- El constructor recibe 5+ dependencias

---

## Práctica 22 — O: Open/Closed Principle (OCP)

**Las entidades deben estar abiertas a extensión pero cerradas a modificación.**

Cuando agregas un nuevo comportamiento, deberías poder hacerlo sin tocar el código existente. El mecanismo habitual es la abstracción (interfaces/clases abstractas).

**Mal:**
```python
def calcular_descuento(tipo_cliente, precio):
    if tipo_cliente == 'normal':
        return precio
    elif tipo_cliente == 'vip':
        return precio * 0.85
    elif tipo_cliente == 'premium':      # Cada nuevo tipo requiere modificar esta función
        return precio * 0.70
```

**Bien:**
```python
from abc import ABC, abstractmethod

class EstrategiaDescuento(ABC):
    @abstractmethod
    def aplicar(self, precio: float) -> float: ...

class SinDescuento(EstrategiaDescuento):
    def aplicar(self, precio): return precio

class DescuentoVIP(EstrategiaDescuento):
    def aplicar(self, precio): return precio * 0.85

class DescuentoPremium(EstrategiaDescuento):
    def aplicar(self, precio): return precio * 0.70

# Para agregar un nuevo tipo: solo crear una nueva clase, sin tocar lo existente
def calcular_precio_final(estrategia: EstrategiaDescuento, precio: float) -> float:
    return estrategia.aplicar(precio)
```

---

## Práctica 23 — L: Liskov Substitution Principle (LSP)

**Los subtipos deben ser sustituibles por sus tipos base.**

Si reemplazas un objeto por uno de su subclase y el programa se rompe, violaste LSP. La herencia debe representar una relación "es un" real, no una reutilización de código conveniente.

**Mal:**
```javascript
class Rectangulo {
    setAlto(h) { this.alto = h; }
    setAncho(w) { this.ancho = w; }
    area() { return this.alto * this.ancho; }
}

class Cuadrado extends Rectangulo {
    // Viola LSP: cambiar el alto también cambia el ancho
    setAlto(h) { this.alto = h; this.ancho = h; }
    setAncho(w) { this.alto = w; this.ancho = w; }
}

// Este código falla con Cuadrado aunque espera un Rectangulo:
function probarRectangulo(rect) {
    rect.setAlto(5);
    rect.setAncho(4);
    console.assert(rect.area() === 20); // Falla con Cuadrado
}
```

**Bien:**
```javascript
class Figura {
    area() { throw new Error('Implementar en subclase'); }
}
class Rectangulo extends Figura {
    constructor(alto, ancho) { super(); this.alto = alto; this.ancho = ancho; }
    area() { return this.alto * this.ancho; }
}
class Cuadrado extends Figura {
    constructor(lado) { super(); this.lado = lado; }
    area() { return this.lado ** 2; }
}
```

**Señales de alerta LSP:**
- El método de la subclase lanza `NotImplementedException`
- La subclase tiene condicionales `if (this instanceof SubClase)`
- Tienes que "verificar el tipo" antes de llamar métodos de la subclase

---

## Práctica 24 — I: Interface Segregation Principle (ISP)

**Los clientes no deben depender de interfaces que no usan.**

Prefiere muchas interfaces pequeñas y específicas sobre una sola interfaz grande y genérica.

**Mal:**
```php
interface Animal {
    public function comer(): void;
    public function dormir(): void;
    public function volar(): void;  // ¿Y los perros?
    public function nadar(): void;  // ¿Y los pájaros?
    public function correr(): void;
}

class Perro implements Animal {
    public function volar(): void {
        throw new \Exception("Los perros no vuelan"); // Viola ISP
    }
}
```

**Bien:**
```php
interface Comedor    { public function comer(): void; }
interface Dormidor   { public function dormir(): void; }
interface Volador    { public function volar(): void; }
interface Nadador    { public function nadar(): void; }
interface Corredor   { public function correr(): void; }

class Perro implements Comedor, Dormidor, Corredor, Nadador { ... }
class Aguila implements Comedor, Dormidor, Volador, Corredor { ... }
class Pez implements Comedor, Nadador { ... }
```

---

## Práctica 25 — D: Dependency Inversion Principle (DIP)

**Depende de abstracciones, no de implementaciones concretas.**

Los módulos de alto nivel no deben depender de los de bajo nivel. Ambos deben depender de abstracciones. Esto hace que el código sea fácil de testear y de cambiar.

**Mal:**
```python
class ReporteVentas:
    def __init__(self):
        self.db = MySQLConexion()  # Acoplado a MySQL concreto

    def generar(self):
        datos = self.db.query("SELECT * FROM ventas")
        ...
```

**Bien:**
```python
from abc import ABC, abstractmethod

class RepositorioVentas(ABC):
    @abstractmethod
    def obtener_todas(self) -> list: ...

class MySQLRepositorioVentas(RepositorioVentas):
    def obtener_todas(self): ...

class PostgresRepositorioVentas(RepositorioVentas):
    def obtener_todas(self): ...

class ReporteVentas:
    def __init__(self, repositorio: RepositorioVentas):  # Inyección de dependencia
        self.repositorio = repositorio

    def generar(self):
        datos = self.repositorio.obtener_todas()
        ...

# Para producción:
reporte = ReporteVentas(MySQLRepositorioVentas())
# Para tests:
reporte = ReporteVentas(MockRepositorioVentas())
```

---

## Práctica 26 — Composición sobre herencia

Favorece la composición de comportamientos sobre la herencia de implementación. La herencia crea acoplamiento vertical rígido; la composición es flexible.

**Señal de abuso de herencia:**
```php
class Animal { }
class AnimalConPatas extends Animal { }
class AnimalConPatasQueCorre extends AnimalConPatas { }
class AnimalConPatasQueCorreYNada extends AnimalConPatasQueCorre { }
// ¡La jerarquía explota!
```

**Con composición:**
```php
class Animal {
    private array $habilidades = [];

    public function agregarHabilidad(Habilidad $h): void {
        $this->habilidades[] = $h;
    }
}

$perro = new Animal();
$perro->agregarHabilidad(new HabilidadCorrer());
$perro->agregarHabilidad(new HabilidadNadar());
```

---

## Práctica 27 — Inyección de dependencias (Dependency Injection)

No uses `new` dentro de clases para crear sus dependencias. Recíbelas desde afuera. Esto hace la clase testeable y el comportamiento intercambiable.

```javascript
// Mal: la clase crea sus propias dependencias
class ServicioNotificacion {
    constructor() {
        this.mailer = new MailerSMTP();    // Acoplado
        this.logger = new FileLogger();     // Acoplado
    }
}

// Bien: las dependencias se inyectan
class ServicioNotificacion {
    constructor(mailer, logger) {
        this.mailer = mailer;
        this.logger = logger;
    }
}

// El caller decide qué implementaciones usar
const servicio = new ServicioNotificacion(
    new MailerSendGrid(),
    new CloudLogger()
);
```

---

## Práctica 28 — Evitar estado global

El estado global crea acoplamiento invisible entre módulos lejanos. Dos funciones que no se conocen pueden interferir entre sí a través del estado global.

**Problemas del estado global:**
- Es difícil de rastrear quién lo modifica
- Los tests se vuelven dependientes del orden de ejecución
- Los bugs son no-deterministas

**Alternativas:**
- Pasa el estado como parámetro
- Usa inyección de dependencias
- Usa patrones como Context o Registry con alcance controlado

---

## Práctica 29 — Cohesión alta

Una clase es cohesiva cuando todos sus métodos usan la mayoría de sus atributos. Si tienes métodos que solo usan 1 o 2 de los 10 atributos, esos métodos probablemente pertenecen a otra clase.

**Métrica práctica:** Si puedes dividir la clase en dos y cada mitad "se lleva" sus propios atributos y métodos, la clase original tenía baja cohesión.

---

## Práctica 30 — Acoplamiento bajo

El acoplamiento mide cuánto sabe una clase sobre el interior de otras. El objetivo es que las clases se comuniquen a través de interfaces estables, no a través del conocimiento de implementaciones internas.

**Tipos de acoplamiento (del peor al mejor):**
1. **Acoplamiento de contenido** — Una clase modifica directamente los datos internos de otra (el peor)
2. **Acoplamiento común** — Ambas clases comparten estado global
3. **Acoplamiento de control** — Una clase le dice a otra cómo funcionar (flags)
4. **Acoplamiento de datos** — Solo se pasan datos primitivos (el mejor para clases acopladas)
5. **Sin acoplamiento** — Comunicación a través de mensajes/eventos (ideal)
