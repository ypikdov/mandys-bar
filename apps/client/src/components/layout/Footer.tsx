export function Footer() {
  return (
    <footer className="bg-black py-4 border-t border-zinc-900 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-zinc-400 text-sm">
        <p>© 2026 Mandy's Bar & Restaurante. Todos los derechos reservados.</p>
        <div className="flex gap-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">
            Política de Privacidad
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Términos de Servicio
          </a>
        </div>
      </div>
    </footer>
  );
}
