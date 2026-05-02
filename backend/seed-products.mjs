import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=require\b/, '');

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const menuProducts = [
  { nombre: "NACHOS DE CARNE", descripcion: "Crujientes totopos con carne mechada, frijoles molidos, queso fundido, pico de gallo y guacamole.", precio_con_iva: 4800, categoria: "Antojitos", imagen_url: "/images/menu/Nachos de carne.webp", destacado: true },
  { nombre: "CHIFRIJO MIXTO", descripcion: "Tradicional chifrijo con arroz, frijoles tiernos, chicharron, pico de gallo y chips.", precio_con_iva: 3800, categoria: "Antojitos", imagen_url: "/images/menu/Chifrijo mixto.webp", destacado: true },
  { nombre: "CANASTA DE PATACONES", descripcion: "Crujientes canastas de platano verde rellenas de carne, pico de gallo y queso.", precio_con_iva: 3800, categoria: "Antojitos", imagen_url: "/images/menu/Canasta de patacones.webp" },
  { nombre: "PATACONES ARREGLADOS", descripcion: "Patacones grandes acompanados de frijoles molidos, carne y queso fundido.", precio_con_iva: 4200, categoria: "Antojitos", imagen_url: "/images/menu/Patacones arreglados.webp" },
  { nombre: "FRITANGA", descripcion: "Surtido variado de frituras tradicionales: yuca, patacones, chicharron y carne.", precio_con_iva: 6500, categoria: "Antojitos", imagen_url: "/images/menu/Fritanga.webp" },
  { nombre: "SURTIDA MANDY'S", descripcion: "La combinacion perfecta para compartir con lo mejor de nuestra cocina.", precio_con_iva: 12000, categoria: "Antojitos", imagen_url: "/images/menu/Surtida Mandy_s.webp" },
  { nombre: "TORTILLA ALINADA", descripcion: "Tortilla de maiz rellena con queso y alinada con especias de la zona.", precio_con_iva: 2500, categoria: "Antojitos", imagen_url: "/images/menu/Tortilla aliñada.webp" },
  { nombre: "CASADO FAJITAS DE POLLO", descripcion: "Arroz, frijoles, platano maduro, picadillo, ensalada y fajitas de pollo.", precio_con_iva: 4800, categoria: "Casados", imagen_url: "/images/menu/Casado de fajitas de pollo.webp" },
  { nombre: "OLLA DE CARNE", descripcion: "Sustancioso caldo de res con verduras frescas: yuca, platano, papa y chayote.", precio_con_iva: 5500, categoria: "Casados", imagen_url: "/images/menu/Olla de carne.webp" },
  { nombre: "TACOS DE ARRACHERA", descripcion: "Tortillas de maiz con finos cortes de arrachera, cebolla y cilantro.", precio_con_iva: 7500, categoria: "Carnes", imagen_url: "/images/menu/Tacos de arrachera.webp" },
  { nombre: "SPAGUETTI EN SALSA ROJA", descripcion: "Pasta al dente banada en nuestra salsa de tomate artesanal y especias.", precio_con_iva: 4800, categoria: "Pastas", imagen_url: "/images/menu/Spaguetty en salsa roja.webp" },
  { nombre: "CEVICHE PESCADO GRANDE", descripcion: "Ceviche de pescado fresco marinado en limon con cebolla y culantro.", precio_con_iva: 6000, categoria: "Mariscos", imagen_url: "/images/menu/Ceviche de pescado grande.webp" },
  { nombre: "CEVICHE PESCADO PEQUENO", descripcion: "Nuestra clasica receta de ceviche en una porcion ideal para entrada.", precio_con_iva: 3500, categoria: "Mariscos", imagen_url: "/images/menu/Ceviche de pescado pequeño.webp" },
  { nombre: "DEDOS DE PESCADO", descripcion: "Filete de pescado empanizado y frito, servido con papas fritas.", precio_con_iva: 4500, categoria: "Mariscos", imagen_url: "/images/menu/Dedos de pescado.webp" },
  { nombre: "FILET AL AJILLO CAMARONES", descripcion: "Filete de pescado al ajillo banado en salsa de camarones blancos.", precio_con_iva: 9500, categoria: "Mariscos", imagen_url: "/images/menu/Filet de pescado al ajillo en salsa de camarones blancas.webp" },
  { nombre: "COCTEL DUENDE", descripcion: "Coctel insignia con infusion de maracuya y un toque secreto de la casa.", precio_con_iva: 3800, categoria: "Cocteles", imagen_url: "/images/menu/Duende.webp", destacado: true },
  { nombre: "MARGARITA DE FRESA", descripcion: "Margarita con fresas frescas, tequila premium y el toque citrico perfecto.", precio_con_iva: 3500, categoria: "Cocteles", imagen_url: "/images/menu/Margarita de fresa.webp" },
  { nombre: "MALIBU BREEZE", descripcion: "Refrescante combinacion de Malibu, jugo de pina y arandano.", precio_con_iva: 3800, categoria: "Cocteles", imagen_url: "/images/menu/Malibú Breeze.webp" },
  { nombre: "MARGARITA DE PITAHAYA", descripcion: "Margarita exotica con el color y sabor de la pitahaya fresca.", precio_con_iva: 4200, categoria: "Cocteles", imagen_url: "/images/menu/Margarita de pitahaya.webp" },
  { nombre: "TEQUILA SUNRISE", descripcion: "Tequila, jugo de naranja y granadina para un amanecer perfecto.", precio_con_iva: 3800, categoria: "Cocteles", imagen_url: "/images/menu/Tequila Sunrise.webp" },
  { nombre: "PINA COLADA", descripcion: "Mezcla clasica de pina, crema de coco y ron blanco.", precio_con_iva: 4000, categoria: "Cocteles", imagen_url: "/images/menu/Piña colada.webp" },
  { nombre: "MANGOCHELADA", descripcion: "Cerveza preparada con pulpa de mango, limon y sal.", precio_con_iva: 3500, categoria: "Cervezas", imagen_url: "/images/menu/Mangochelada.webp" },
  { nombre: "MICHELADA MEXICANA", descripcion: "Cerveza con clamato, salsas oscuras y escarcha de chile.", precio_con_iva: 3200, categoria: "Cervezas", imagen_url: "/images/menu/Michelada mexicana.webp" },
];

async function main() {
  console.log("Seeding products...");
  const client = await pool.connect();

  try {
    let inserted = 0;
    let updated = 0;

    for (const product of menuProducts) {
      const existing = await client.query('SELECT id FROM products WHERE nombre = $1', [product.nombre]);

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE products
           SET descripcion = $1, precio_con_iva = $2, categoria = $3, imagen_url = $4, destacado = $5, activo = true, updated_at = NOW()
           WHERE nombre = $6`,
          [
            product.descripcion,
            product.precio_con_iva,
            product.categoria,
            product.imagen_url,
            Boolean(product.destacado),
            product.nombre,
          ],
        );
        updated++;
        continue;
      }

      await client.query(
        `INSERT INTO products (id, nombre, descripcion, precio_con_iva, categoria, imagen_url, destacado, activo, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
        [
          product.nombre,
          product.descripcion,
          product.precio_con_iva,
          product.categoria,
          product.imagen_url,
          Boolean(product.destacado),
        ],
      );
      inserted++;
    }

    console.log(`Seed completo: ${inserted} insertados, ${updated} actualizados.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
