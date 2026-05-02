import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const slides = [
  {
    title: "EQUILIBRIO EN CADA BOCADO",
    subtitle: "Platos ricos en proteínas y frescura, ideales para quienes buscan cuidarse sin renunciar al sabor.",
    bgImage: "/images/paisajes/paisaje_1_nuevo.webp",
    circles: [
      "/images/paisaje_1/paisaje_1_1.webp",
      "/images/paisaje_1/paisaje_1_2.webp",
      "/images/paisaje_1/paisaje_1_3.webp",
      "/images/paisaje_1/paisaje_1_4.webp"
    ]
  },
  {
    title: "COCTELERÍA Y BEBIDAS ARTESANALES",
    subtitle: "Redescubre el placer de brindar con nuestras creaciones: mojito de fresa con hierbabuena del huerto, piña colada al estilo tropical y el emblemático cóctel Duende con infusión de maracuyá.",
    bgImage: "/images/paisajes/paisaje_2_nuevo.webp",
    circles: [
      "/images/paisaje_2/paisaje_2_1.webp",
      "/images/paisaje_2/paisaje_2_2.webp"
    ]
  },
  {
    title: "CELEBRA MOMENTOS INOLVIDABLES",
    subtitle: "En Mandy's nos especializamos en convertir tus celebraciones en recuerdos imborrables. Desde cumpleaños hasta cenas corporativas y eventos temáticos.",
    bgImage: "/images/paisajes/paisajes 3.webp",
    circles: [
      "/images/paisajes_3/paisaje_3_1.webp",
      "/images/paisajes_3/paisaje_3_2.webp",
      "/images/paisajes_3/paisaje_3_3.webp"
    ]
  }
];

export const Home = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  return (
    <div className="w-full overflow-hidden bg-zinc-900 relative" style={{ height: 'calc(100dvh - 80px)' }}>
       <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div 
              key={index}
              className="flex-[0_0_100%] min-w-0 relative h-full bg-cover bg-[center_top_35%] flex items-center"
              style={{ backgroundImage: `url('${slide.bgImage}')` }}
            >
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/50"></div>

              <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-8">
                
                {/* Left Text Block - Mockup style: Dark box, no rounded corners, no button */}
                <div className="bg-black/80 p-8 md:p-12 w-full md:w-[60%] lg:w-[45%] border-l-2 border-primary/20">
                  <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-white mb-6 uppercase leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-base md:text-lg text-white font-medium leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Right Circular Images Block */}
                <div className="hidden lg:flex relative w-1/2 h-[600px] items-center justify-center">
                  {slide.circles.map((img, i) => {
                    // Zigzag cascade to ensure images never overlap vertically regardless of count
                    const positions = [
                      "top-[0%] right-[30%] w-[180px] h-[180px]",    // 0: Top leftish
                      "top-[25%] right-[5%] w-[220px] h-[220px]",    // 1: Mid right
                      "top-[50%] right-[35%] w-[200px] h-[200px]",   // 2: Mid bottom leftish
                      "top-[70%] right-[10%] w-[180px] h-[180px]"    // 3: Bottom rightish
                    ];
                    
                    if(i >= positions.length) return null;

                    return (
                      <div 
                        key={i} 
                        className={`absolute ${positions[i]} rounded-full border-[6px] border-black overflow-hidden shadow-2xl transition-transform hover:scale-105`}
                      >
                        <img src={img} alt={`Highlight ${i}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-12 md:left-24 z-20 flex items-center gap-2">
        <div 
          className="text-white cursor-pointer hover:bg-white/20 p-2 rounded-full transition-colors"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Siguiente panel"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
        <div className="flex gap-2 bg-black/50 p-2 rounded-full backdrop-blur-sm">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === selectedIndex ? "w-8 bg-primary" : "w-4 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
