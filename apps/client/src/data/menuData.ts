export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
}

export const categories: Category[] = [
  { id: "bocas", name: "Bocas" },
  { id: "fuertes", name: "Platos Fuertes" },
  { id: "hamburguesas", name: "Hamburguesas" },
  { id: "bebidas", name: "Bebidas" },
  { id: "cocteles", name: "Cócteles" },
];

export const products: Product[] = [
  // Bocas
  {
    id: "1",
    name: "Chifrijo Mandy's",
    description: "Arroz, frijoles tiernos, chicharros de la casa, pico de gallo y aguacate, servido con chips.",
    price: 4500,
    image: "https://images.unsplash.com/photo-1541544744-378ca6e5bb6a?auto=format&fit=crop&q=80&w=800",
    categoryId: "bocas",
  },
  {
    id: "2",
    name: "Patacones con Queso",
    description: "Patacones crujientes bañados en queso fundido y frijoles molidos.",
    price: 3500,
    image: "https://images.unsplash.com/photo-1625938146369-adc83368bda7?auto=format&fit=crop&q=80&w=800",
    categoryId: "bocas",
  },
  {
    id: "3",
    name: "Dados de Queso",
    description: "Cubos de queso frito acompañados de salsa de la casa.",
    price: 3800,
    image: "https://images.unsplash.com/photo-1563503934-8c8352514309?auto=format&fit=crop&q=80&w=800", // placeholder
    categoryId: "bocas",
  },

  // Platos Fuertes
  {
    id: "4",
    name: "Casado Típico",
    description: "Arroz, frijoles, ensalada, plátano maduro y opción de carne (pollo, res, pescado o chuleta).",
    price: 5500,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800",
    categoryId: "fuertes",
  },
  {
    id: "5",
    name: "Fajitas Mixtas",
    description: "Tiras de res y pollo salteadas con vegetales, acompañadas de tortillas.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&q=80&w=800",
    categoryId: "fuertes",
  },
  {
    id: "6",
    name: "Arroz con Camarones",
    description: "Arroz arreglado con camarones frescos, servido con papas fritas y ensalada.",
    price: 7500,
    image: "https://images.unsplash.com/photo-1559160581-44bd4b5e2978?auto=format&fit=crop&q=80&w=800", // placeholder
    categoryId: "fuertes",
  },

  // Hamburguesas
  {
    id: "7",
    name: "Hamburguesa Mandy's",
    description: "Torta de res artesanal, queso americano, tocineta, huevo frito, lechuga y tomate. Incluye papas.",
    price: 6000,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    categoryId: "hamburguesas",
  },
  {
    id: "8",
    name: "Hamburguesa de Pollo Crispy",
    description: "Pechuga de pollo empanizada, salsa tártara, lechuga y pepinillos. Incluye papas.",
    price: 5500,
    image: "https://images.unsplash.com/photo-1615297348927-4c07da1b822d?auto=format&fit=crop&q=80&w=800",
    categoryId: "hamburguesas",
  },

  // Bebidas
  {
    id: "9",
    name: "Cerveza Nacional",
    description: "Imperial, Pilsen o Bavaria (350ml).",
    price: 2000,
    image: "https://images.unsplash.com/photo-1571559388856-74df099ce663?auto=format&fit=crop&q=80&w=800",
    categoryId: "bebidas",
  },
  {
    id: "10",
    name: "Natural de Frutas",
    description: "Cas, Guanábana, Fresa o Maracuyá (en agua o leche).",
    price: 1500,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800",
    categoryId: "bebidas",
  },

  // Cócteles
  {
    id: "11",
    name: "Margarita",
    description: "Tequila, triple sec y jugo de limón, servido en las rocas o frozen.",
    price: 4000,
    image: "https://images.unsplash.com/photo-1560512823-8db035e23637?auto=format&fit=crop&q=80&w=800",
    categoryId: "cocteles",
  },
  {
    id: "12",
    name: "Mojito Cubano",
    description: "Ron blanco, hierbabuena, limón, azúcar y soda.",
    price: 3800,
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32d?auto=format&fit=crop&q=80&w=800",
    categoryId: "cocteles",
  },
];
