import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@mandys/ui';
import { Play, UsersRound, UtensilsCrossed } from "lucide-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { teamData } from "@/data/team";
import { faqData } from "@/data/faq";
import { useSiteContent } from "@/modules/site-content/providers/SiteContentProvider";
import { sanitizeExternalUrl } from "@/lib/utils";

const fallbackAbout = {
  historyTitle: "TODO IMPORTA",
  historyParagraphs: [
    "En Mandy's Bar & Restaurante, creemos que la grandeza de un plato reside en los detalles.",
    "Nuestra filosofía se basa en el respeto por los ingredientes y la pasión por la cocina auténtica.",
    "Seleccionamos cuidadosamente productos de proximidad, apoyando a productores locales para garantizar la máxima frescura. Cada receta es elaborada desde cero, buscando siempre el equilibrio perfecto que despierte los sentidos.",
    "Más que un restaurante, somos un espacio donde las historias se comparten, los brindis se multiplican y cada comida se convierte en una celebración de la gastronomía y la buena compañía.",
  ],
  valuesTitleA: "Todo es personal",
  valuesBodyA: "Nuestra atención al cliente no es un proceso, es una oportunidad para conectar. Nos esforzamos por conocer a nuestros visitantes y hacerles sentir en casa.",
  valuesTitleB: "Hecho desde cero",
  valuesBodyB: "Rechazamos los atajos. Nuestras salsas, marinados y bases para cocteles son preparados diariamente en nuestra cocina, garantizando sabores únicos e inigualables.",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&mute=1",
};

const HistorySection = () => {
  const { content } = useSiteContent();
  const about = content?.about ?? fallbackAbout;
  const videoUrl = sanitizeExternalUrl(about.videoUrl, fallbackAbout.videoUrl);

  return (
    <section className="bg-[#f7f4ef] px-4 py-9 md:px-8 md:py-11" data-about-history-layout>
      <div className="mx-auto max-w-[1180px]">
        <article className="rounded-[1.35rem] bg-black px-8 py-8 text-white shadow-[0_18px_42px_rgba(0,0,0,0.16)] md:px-12 md:py-9 lg:px-14">
          <div className="mb-5 flex items-center gap-5">
            <span className="h-11 w-1 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="text-3xl font-black uppercase leading-none tracking-normal md:text-4xl">
              {about.historyTitle}
            </h2>
          </div>
          <div className="max-w-[930px] space-y-2.5 text-base font-medium leading-7 text-white/90">
            {about.historyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <article className="rounded-[1.35rem] bg-black px-7 py-7 text-white shadow-[0_18px_42px_rgba(0,0,0,0.14)] md:px-9 md:py-8">
            <div className="grid grid-cols-[2.75rem_1fr] gap-4">
              <UsersRound className="mt-1 h-9 w-9 text-primary" strokeWidth={2.2} aria-hidden="true" />
              <div>
                <h3 className="text-2xl font-black uppercase leading-tight tracking-normal">{about.valuesTitleA}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-white/88 md:text-[15px]">{about.valuesBodyA}</p>
              </div>
            </div>

            <div className="my-6 h-px bg-white/28" />

            <div className="grid grid-cols-[2.75rem_1fr] gap-4">
              <UtensilsCrossed className="mt-1 h-9 w-9 text-primary" strokeWidth={2.2} aria-hidden="true" />
              <div>
                <h3 className="text-2xl font-black uppercase leading-tight tracking-normal">{about.valuesTitleB}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-white/88 md:text-[15px]">{about.valuesBodyB}</p>
              </div>
            </div>
          </article>

          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver video de la historia de Mandy's Bar"
            className="group relative h-[300px] overflow-hidden rounded-[1.35rem] bg-black shadow-[0_18px_42px_rgba(0,0,0,0.16)] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-primary/45 md:h-[335px]"
          >
            <img
              src="/images/event_party.jpg"
              alt="Plato servido en Mandy's Bar & Restaurante"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-black/15 transition-colors duration-300 group-hover:bg-black/25" aria-hidden="true" />
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white bg-black/10 text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-[1px] transition-transform duration-300 group-hover:scale-105 md:h-24 md:w-24">
                <Play className="ml-1 h-10 w-10 fill-current md:h-12 md:w-12" strokeWidth={1.8} />
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

const resolveImageUrl = (path?: string | null) => {
  if (!path) return "/images/placeholder.jpg";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const TeamSection = () => {
  const { content } = useSiteContent();
  const teamMembers = content?.teamMembers?.length ? content.teamMembers : teamData;

  return (
    <div className="py-24 bg-[#fdfbf7]">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col items-center mb-20">
          <span className="text-primary font-bold tracking-[0.3em] uppercase mb-4 text-sm">El corazon de Mandy's</span>
          <h2 className="text-5xl md:text-6xl font-black text-center uppercase tracking-tighter text-black">Conoce al equipo</h2>
          <div className="w-24 h-1.5 bg-primary mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {teamMembers.map((member) => (
            <div key={member.id} className="group flex flex-col h-full bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 border border-zinc-100">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={resolveImageUrl((member as any).image_url || member.image)} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              <div className="p-8 flex flex-col flex-1 bg-black transition-colors duration-500">
                <div className="flex-1">
                  <span className="text-primary font-black text-xs tracking-[0.2em] uppercase mb-2 block">{member.role}</span>
                  <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight leading-none">{member.name}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">{member.description}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-primary transition-all duration-500">
                  <span className="text-xs font-bold tracking-widest uppercase">Perfil</span>
                  <div className="w-8 h-[2px] bg-primary"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const { content } = useSiteContent();
  const faqCategories = content?.faqCategories?.length ? content.faqCategories : faqData;

  return (
    <div className="py-20 bg-black text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-4xl font-black text-center mb-16 uppercase tracking-wide">Preguntas Frecuentes</h2>
        <div className="space-y-8">
          {faqCategories.map((category, idx) => (
            <div key={`${category.title}-${idx}`} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 border-b border-zinc-800 pb-4">{category.title}</h3>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {category.items.map((item, itemIdx) => (
                  <AccordionItem key={`${item.question}-${itemIdx}`} value={`item-${idx}-${itemIdx}`} className="border-b-0 border-zinc-800 bg-zinc-950/50 rounded-lg px-4 mb-2 overflow-hidden">
                    <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors text-left py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 text-base leading-relaxed pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const About = () => (
  <div className="flex flex-col">
    <Routes>
      <Route path="/" element={<Navigate to="historia" replace />} />
      <Route path="historia" element={<HistorySection />} />
      <Route path="equipo" element={<TeamSection />} />
      <Route path="faq" element={<FAQSection />} />
    </Routes>
  </div>
);
