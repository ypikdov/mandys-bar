export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  description: string;
}

export const teamData: TeamMember[] = [
  {
    id: "1",
    name: "Carlos Rivera",
    role: "CHEF EJECUTIVO",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
    description: "Maestro culinario especializado en cocina fusión con más de 12 años de trayectoria. Pasión por los ingredientes locales y la técnica impecable.",
  },
  {
    id: "2",
    name: "Ana Soto",
    role: "HEAD BARTENDER",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
    description: "Experta en mixología de autor. Transforma sabores en experiencias sensoriales únicas detrás de la barra de Mandy's.",
  },
  {
    id: "3",
    name: "Luis Méndez",
    role: "GERENTE",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600",
    description: "Liderazgo enfocado en la excelencia operativa y la satisfacción total de nuestros clientes. Garantiza que cada visita sea memorable.",
  },
  {
    id: "4",
    name: "Sofía Castro",
    role: "EVENTOS",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
    description: "Coordinadora detallista dedicada a dar vida a tus celebraciones. Experta en transformar visiones en eventos realidad.",
  }
];
