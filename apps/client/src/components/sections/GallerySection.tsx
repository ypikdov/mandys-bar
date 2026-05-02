const images = [
  "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1466978913421-dad938661b5b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1563503934-8c8352514309?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1560512823-8db035e23637?auto=format&fit=crop&q=80&w=600",
];

export const GallerySection = () => {
  return (
    <section id="gallery" className="py-16 bg-orange-50/50 dark:bg-zinc-900/50">
      <div className="container px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-primary font-sans">Galería</h2>
          <p className="text-muted-foreground">Un vistazo a nuestros mejores momentos.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {images.map((src, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-xl bg-muted shadow-md">
              <img
                src={src}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
