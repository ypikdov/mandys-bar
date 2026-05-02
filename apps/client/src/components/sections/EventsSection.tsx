import { Card, CardContent } from '@mandys/ui';


const events = [
  {
    title: "Música en Vivo",
    date: "Todos los Viernes y Sábados",
    description: "Disfruta de los mejores artistas locales en un ambiente increíble.",
    image: "https://images.unsplash.com/photo-1459749411177-0473ef7161cf?auto=format&fit=crop&q=80&w=800", 
  },
  {
    title: "Karaoke Night",
    date: "Jueves 8:00 PM",
    description: "¡Ven a cantar tus canciones favoritas y gana premios!",
    image: "https://images.unsplash.com/photo-1621112904887-419379ce6824?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Partidos en Pantalla Gigante",
    date: "Eventos Deportivos Importantes",
    description: "Vive la pasión del fútbol y otros deportes con nuestras promos especiales.",
    image: "https://images.unsplash.com/photo-1518175510657-198188165c71?auto=format&fit=crop&q=80&w=800",
  },
];

export const EventsSection = () => {
  return (
    <section id="events" className="py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Próximos Eventos</h2>
          <p className="text-muted-foreground">No te pierdas de nuestras actividades semanales.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <Card key={index} className="overflow-hidden bg-muted/40 border-none shadow-sm">
                <div className="aspect-video w-full overflow-hidden">
                    <img 
                        src={event.image} 
                        alt={event.title} 
                        className="h-full w-full object-cover transition-transform hover:scale-105 duration-500"
                    />
                </div>
                <CardContent className="p-6">
                    <p className="text-sm font-semibold text-primary mb-2">{event.date}</p>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-muted-foreground">{event.description}</p>
                </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
