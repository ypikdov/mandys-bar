/**
 * Script de migración: convierte todas las imágenes existentes a WebP
 * y actualiza las referencias en la base de datos.
 *
 * Uso: npx tsx src/scripts/migrate-to-webp.ts
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { prisma } from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');

const CONVERTIBLE_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif', '.avif', '.heic', '.heif',
]);

async function convertFile(filePath: string): Promise<string | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webp' || !CONVERTIBLE_EXTS.has(ext)) return null;

  const webpPath = filePath.replace(/\.[^.]+$/, '.webp');
  try {
    await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
    await fs.unlink(filePath);
    return webpPath;
  } catch (err) {
    console.error(`  ❌ Error convirtiendo ${path.basename(filePath)}:`, err);
    return null;
  }
}

async function scanAndConvertFiles(dir: string): Promise<Map<string, string>> {
  const renames = new Map<string, string>(); // oldFilename → newFilename
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    console.log(`  Directorio no encontrado: ${dir}`);
    return renames;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      const subRenames = await scanAndConvertFiles(fullPath);
      for (const [k, v] of subRenames) renames.set(k, v);
      continue;
    }

    const newPath = await convertFile(fullPath);
    if (newPath) {
      // Guardar mapeo relativo a uploads/
      const relOld = path.relative(UPLOAD_DIR, fullPath);
      const relNew = path.relative(UPLOAD_DIR, newPath);
      renames.set(relOld, relNew);
      console.log(`  ✅ ${relOld} → ${relNew}`);
    }
  }

  return renames;
}

function replaceUrlInString(value: string, renames: Map<string, string>): string {
  let result = value;
  for (const [oldFile, newFile] of renames) {
    // Reemplazar tanto rutas con /uploads/ como nombres directos
    result = result.replaceAll(`/uploads/${oldFile}`, `/uploads/${newFile}`);
    result = result.replaceAll(oldFile, newFile);
  }
  return result;
}

async function updateDatabase(renames: Map<string, string>) {
  if (renames.size === 0) {
    console.log('\n📦 No hay renombramientos — la base de datos no necesita cambios.');
    return;
  }

  console.log('\n📦 Actualizando base de datos...');

  // 1. Products — imagen_url
  const products = await prisma.product.findMany({ where: { imagen_url: { not: null } } });
  for (const p of products) {
    const updated = replaceUrlInString(p.imagen_url!, renames);
    if (updated !== p.imagen_url) {
      await prisma.product.update({ where: { id: p.id }, data: { imagen_url: updated } });
      console.log(`  products.${p.nombre}: ${p.imagen_url} → ${updated}`);
    }
  }

  // 2. Users — foto_perfil
  const users = await prisma.user.findMany({ where: { foto_perfil: { not: null } } });
  for (const u of users) {
    const updated = replaceUrlInString(u.foto_perfil!, renames);
    if (updated !== u.foto_perfil) {
      await prisma.user.update({ where: { id: u.id }, data: { foto_perfil: updated } });
      console.log(`  users.${u.nombre}: ${u.foto_perfil} → ${updated}`);
    }
  }

  // 3. GalleryItems — image_url
  const gallery = await prisma.galleryItem.findMany();
  for (const g of gallery) {
    const updated = replaceUrlInString(g.image_url, renames);
    if (updated !== g.image_url) {
      await prisma.galleryItem.update({ where: { id: g.id }, data: { image_url: updated } });
      console.log(`  gallery.${g.title}: ${g.image_url} → ${updated}`);
    }
  }

  // 4. SiteEvents — image_url
  const events = await prisma.siteEvent.findMany({ where: { image_url: { not: null } } });
  for (const e of events) {
    const updated = replaceUrlInString(e.image_url!, renames);
    if (updated !== e.image_url) {
      await prisma.siteEvent.update({ where: { id: e.id }, data: { image_url: updated } });
      console.log(`  site_events.${e.title}: ${e.image_url} → ${updated}`);
    }
  }

  // 5. Reservations — imagen_anulacion
  const reservations = await prisma.reservation.findMany({ where: { imagen_anulacion: { not: null } } });
  for (const r of reservations) {
    const updated = replaceUrlInString(r.imagen_anulacion!, renames);
    if (updated !== r.imagen_anulacion) {
      await prisma.reservation.update({ where: { id: r.id }, data: { imagen_anulacion: updated } });
      console.log(`  reservations.${r.consecutivo_reserva}: ${r.imagen_anulacion} → ${updated}`);
    }
  }

  // 6. SiteSettings — value (JSON que puede contener URLs de imágenes)
  const settings = await prisma.siteSetting.findMany();
  for (const s of settings) {
    const original = JSON.stringify(s.value);
    const updated = replaceUrlInString(original, renames);
    if (updated !== original) {
      await prisma.siteSetting.update({
        where: { id: s.id },
        data: { value: JSON.parse(updated) },
      });
      console.log(`  site_settings.${s.key}: URLs actualizadas`);
    }
  }
}

async function main() {
  console.log('🖼️  Migración de imágenes a WebP');
  console.log(`📁 Directorio: ${UPLOAD_DIR}\n`);
  console.log('🔄 Convirtiendo archivos...');

  const renames = await scanAndConvertFiles(UPLOAD_DIR);

  console.log(`\n📊 Total convertidos: ${renames.size}`);

  await updateDatabase(renames);

  console.log('\n✅ Migración completada.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});
