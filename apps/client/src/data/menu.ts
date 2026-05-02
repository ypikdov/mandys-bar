export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isFeatured?: boolean;
  salesCount?: number;
  createdAt?: string;
}

export const menuCategories = [
  "Todos",
  "Antojitos",
  "Casados",
  "Ensaladas",
  "Carnes",
  "Pastas",
  "Delicias",
  "Mariscos",
  "Vegetarianos",
  "Promociones",
  "Cervezas",
  "Cócteles",
  "Shots"
];

export const menuData: MenuItem[] = [
  {
    id: "snack-1",
    name: "NACHOS DE CARNE",
    description: "Crujientes totopos con carne mechada, frijoles molidos, queso fundido, pico de gallo y guacamole.",
    price: 4800,
    category: "Antojitos",
    image: "/images/menu/Nachos de carne.webp",
    isFeatured: true,
    salesCount: 150,
    createdAt: "2024-01-01T10:00:00Z"
  },
  {
    id: "snack-2",
    name: "CHIFRIJO MIXTO",
    description: "Tradicional chifrijo con arroz, frijoles tiernos, chicharrón, pico de gallo y chips.",
    price: 3800,
    category: "Antojitos",
    image: "/images/menu/Chifrijo mixto.webp",
    isFeatured: true,
    salesCount: 300,
    createdAt: "2024-01-05T10:00:00Z"
  },
  {
    id: "meal-1",
    name: "CASADO FAJITAS DE POLLO",
    description: "Arroz, frijoles, plátano maduro, picadillo, ensalada y exquisitas fajitas de pollo.",
    price: 4800,
    category: "Casados",
    image: "/images/menu/Casado de fajitas de pollo.webp",
    salesCount: 200,
    createdAt: "2024-02-10T10:00:00Z"
  },
  {
    id: "drink-1",
    name: "CÓCTEL DUENDE",
    description: "Nuestro cóctel insignia con infusión de maracuyá y un toque secreto de la casa.",
    price: 3800,
    category: "Cócteles",
    image: "/images/menu/Duende.webp",
    isFeatured: true,
    salesCount: 400,
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "drink-2",
    name: "MARGARITA DE FRESA",
    description: "Clásica margarita con fresas frescas, tequila premium y el toque cítrico perfecto.",
    price: 3500,
    category: "Cócteles",
    image: "/images/menu/Margarita de fresa.webp",
    salesCount: 250,
    createdAt: "2024-03-10T10:00:00Z"
  },
  {
    id: "snack-3",
    name: "CANASTA DE PATACONES",
    description: "Crujientes canastas de plátano verde rellenas de carne, pico de gallo y queso.",
    price: 3800,
    category: "Antojitos",
    image: "/images/menu/Canasta de patacones.webp"
  },
  {
    id: "snack-4",
    name: "PATACONES ARREGLADOS",
    description: "Patacones grandes acompañados de frijoles molidos, carne y queso fundido.",
    price: 4200,
    category: "Antojitos",
    image: "/images/menu/Patacones arreglados.webp"
  },
  {
    id: "snack-5",
    name: "FRITANGA",
    description: "Surtido variado de frituras tradicionales: yuca, patacones, chicharrón y carne.",
    price: 6500,
    category: "Antojitos",
    image: "/images/menu/Fritanga.webp"
  },
  {
    id: "snack-6",
    name: "SURTIDA MANDY'S",
    description: "La combinación perfecta para compartir con lo mejor de nuestra cocina.",
    price: 12000,
    category: "Antojitos",
    image: "/images/menu/Surtida Mandy_s.webp"
  },
  {
    id: "snack-7",
    name: "TORTILLA ALIÑADA",
    description: "Tortilla de maíz rellena con queso y aliñada con especias de la zona.",
    price: 2500,
    category: "Antojitos",
    image: "/images/menu/Tortilla aliñada.webp"
  },
  {
    id: "meal-2",
    name: "OLLA DE CARNE",
    description: "Sustancioso caldo de res con verduras frescas: yuca, plátano, papa y chayote.",
    price: 5500,
    category: "Casados",
    image: "/images/menu/Olla de carne.webp"
  },
  {
    id: "meat-2",
    name: "TACOS DE ARRACHERA",
    description: "Tortillas de maíz con finos cortes de arrachera, cebolla y cilantro.",
    price: 7500,
    category: "Carnes",
    image: "/images/menu/Tacos de arrachera.webp"
  },
  {
    id: "pasta-1",
    name: "SPAGUETTI EN SALSA ROJA",
    description: "Pasta al dente bañada en nuestra salsa de tomate artesanal y especias.",
    price: 4800,
    category: "Pastas",
    image: "/images/menu/Spaguetty en salsa roja.webp"
  },
  {
    id: "seafood-1",
    name: "CEVICHE PESCADO GRANDE",
    description: "Ceviche de pescado fresco marinado en limón con cebolla y culantro.",
    price: 6000,
    category: "Mariscos",
    image: "/images/menu/Ceviche de pescado grande.webp"
  },
  {
    id: "seafood-2",
    name: "CEVICHE PESCADO PEQUEÑO",
    description: "Nuestra clásica receta de ceviche en una porción ideal para entrada.",
    price: 3500,
    category: "Mariscos",
    image: "/images/menu/Ceviche de pescado pequeño.webp"
  },
  {
    id: "seafood-3",
    name: "DEDOS DE PESCADO",
    description: "Filete de pescado empanizado y frito, servido con papas fritas.",
    price: 4500,
    category: "Mariscos",
    image: "/images/menu/Dedos de pescado.webp"
  },
  {
    id: "seafood-4",
    name: "FILET AL AJILLO CAMARONES",
    description: "Filete de pescado al ajillo bañado en una rica salsa de camarones blancos.",
    price: 9500,
    category: "Mariscos",
    image: "/images/menu/Filet de pescado al ajillo en salsa de camarones blancas.webp"
  },
  {
    id: "drink-3",
    name: "MALIBÚ BREEZE",
    description: "Refrescante combinación de Malibú, jugo de piña y arándano.",
    price: 3800,
    category: "Cócteles",
    image: "/images/menu/Malibú Breeze.webp"
  },
  {
    id: "drink-4",
    name: "MARGARITA DE PITAHAYA",
    description: "Margarita exótica con el vibrante color y sabor de la pitahaya fresca.",
    price: 4200,
    category: "Cócteles",
    image: "/images/menu/Margarita de pitahaya.webp"
  },
  {
    id: "drink-5",
    name: "TEQUILA SUNRISE",
    description: "Tequila, jugo de naranja y granadina para un amanecer perfecto.",
    price: 3800,
    category: "Cócteles",
    image: "/images/menu/Tequila Sunrise.webp"
  },
  {
    id: "drink-6",
    name: "PIÑA COLADA",
    description: "La clásica mezcla de piña, crema de coco y ron blanco.",
    price: 4000,
    category: "Cócteles",
    image: "/images/menu/Piña colada.webp"
  },
  {
    id: "beer-1",
    name: "MANGOCHELADA",
    description: "Cerveza preparada con pulpa de mango, limón y sal.",
    price: 3500,
    category: "Cervezas",
    image: "/images/menu/Mangochelada.webp"
  },
  {
    id: "beer-2",
    name: "MICHELADA MEXICANA",
    description: "Cerveza con clamato, salsas oscuras y escarcha de chile.",
    price: 3200,
    category: "Cervezas",
    image: "/images/menu/Michelada mexicana.webp"
  }
];
