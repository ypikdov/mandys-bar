export const AboutSection = () => {
  return (
    <section id="about" className="py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-xl lg:aspect-auto lg:h-[500px]">
             <img 
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800"
                alt="Interior del restaurante"
                className="h-full w-full object-cover"
             />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Nuestra Historia</h2>
              <p className="text-muted-foreground text-lg">
                Mandy's Bar & Restaurante nació con la visión de ofrecer en Cañas un lugar diferente, donde la buena comida se une con el mejor ambiente.
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <h3 className="font-bold text-xl text-primary">Misión</h3>
                    <p className="text-sm text-muted-foreground">
                        Brindar experiencias gastronómicas memorables con un servicio cálido y eficiente.
                    </p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-xl text-primary">Visión</h3>
                    <p className="text-sm text-muted-foreground">
                        Ser el referente de entretenimiento y gastronomía en Guanacaste.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
