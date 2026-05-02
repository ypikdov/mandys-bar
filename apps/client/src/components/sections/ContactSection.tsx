import { MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react";
import { Button } from "@mandys/ui";

export const ContactSection = () => {
  return (
    <section id="contact" className="py-16 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Info */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary font-sans">Contáctanos</h2>
              <p className="text-muted-foreground text-lg">
                Estamos listos para atenderte. ¡Visítanos o haz tu pedido!
              </p>
            </div>

            <div className="space-y-6 text-lg">
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-bold">Dirección</h3>
                  <p className="text-muted-foreground">Cañas, Guanacaste. 100m norte del Parque Central.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-bold">Horario</h3>
                  <p className="text-muted-foreground">Lunes a Domingo: 11:00 AM - 11:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-bold">Teléfono / WhatsApp</h3>
                  <p className="text-muted-foreground">+506 8666-1940</p>
                   <Button variant="link" className="p-0 h-auto text-primary" onClick={() => window.open("https://wa.me/50686661940", "_blank")}>
                      Enviar mensaje
                   </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" size="icon" className="rounded-full">
                    <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Instagram className="h-5 w-5" />
                </Button>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="h-[400px] w-full overflow-hidden rounded-xl bg-gray-200 border shadow-inner">
             <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15701.81524316694!2d-85.09916695!3d10.43574165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f9ffec3a57753e9%3A0xe5c754637e6b0c2e!2sCa%C3%B1as%2C%20Guanacaste!5e0!3m2!1ses!2scr!4v1709141234567!5m2!1ses!2scr" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Mandy's Bar Location"
             />
          </div>
        </div>
      </div>
    </section>
  );
};
