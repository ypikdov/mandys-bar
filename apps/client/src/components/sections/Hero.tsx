import { Button } from "@mandys/ui";

export const Hero = () => {
  return (
    <section id="home" className="relative h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1920")',
        }}
      >
        <div className="absolute inset-0 bg-black/60" /> {/* Overlay */}
      </div>

      {/* Content */}
      <div className="container relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        {/* Logo Placeholder (or actual logo if available later) */}
        <div className="mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-primary bg-black/50 p-2 backdrop-blur-sm">
           {/* <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover rounded-full" /> */}
           <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-primary">M</div>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Mandy's Bar & Restaurante
        </h1>
        <p className="mb-8 max-w-lg text-lg text-gray-200 sm:text-xl">
          El mejor ambiente y la mejor comida en Cañas, Guanacaste.
        </p>

        <div className="flex gap-4">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver Menú
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-black hover:bg-white/90"
             onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
          >
            Hacer Pedido
          </Button>
        </div>
      </div>
    </section>
  );
};
