import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../src/lib/prisma.js';
import { uploadImageBuffer, type ImageBucket } from '../src/lib/supabaseStorage.js';
import { convertBufferToWebp } from '../src/utils/convertToWebp.js';
import { isValidImageBuffer } from '../src/utils/imageValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const isDryRun = process.argv.includes('--dry-run');

type MigrationItem = {
  model: 'product' | 'galleryItem' | 'siteEvent' | 'user';
  id: string;
  field: 'imagen_url' | 'image_url' | 'foto_perfil';
  url: string | null;
  bucket: ImageBucket;
};

const toLocalPath = (url: string) => {
  if (!url.startsWith('/uploads/')) return null;
  return path.join(uploadsDir, url.replace('/uploads/', ''));
};

const migrateOne = async (item: MigrationItem) => {
  if (!item.url) return 'skip-empty';

  const filePath = toLocalPath(item.url);
  if (!filePath) return 'skip-non-local';

  const originalBuffer = await fs.readFile(filePath);
  if (!isValidImageBuffer(originalBuffer)) {
    throw new Error(`archivo invalido: ${filePath}`);
  }

  if (isDryRun) {
    console.log(`[dry-run] ${item.model}.${item.id} ${item.url} -> ${item.bucket}`);
    return 'dry-run';
  }

  const webpBuffer = await convertBufferToWebp(originalBuffer);
  const uploaded = await uploadImageBuffer(item.bucket, webpBuffer);

  if (item.model === 'product') {
    await prisma.product.update({ where: { id: item.id }, data: { imagen_url: uploaded.url } });
  } else if (item.model === 'galleryItem') {
    await prisma.galleryItem.update({ where: { id: item.id }, data: { image_url: uploaded.url } });
  } else if (item.model === 'siteEvent') {
    await prisma.siteEvent.update({ where: { id: item.id }, data: { image_url: uploaded.url } });
  } else {
    await prisma.user.update({ where: { id: item.id }, data: { foto_perfil: uploaded.url } });
  }

  console.log(`[migrated] ${item.model}.${item.id} -> ${uploaded.url}`);
  return 'migrated';
};

const main = async () => {
  const [products, galleryItems, siteEvents, users] = await Promise.all([
    prisma.product.findMany({ where: { imagen_url: { startsWith: '/uploads/' } }, select: { id: true, imagen_url: true } }),
    prisma.galleryItem.findMany({ where: { image_url: { startsWith: '/uploads/' } }, select: { id: true, image_url: true } }),
    prisma.siteEvent.findMany({ where: { image_url: { startsWith: '/uploads/' } }, select: { id: true, image_url: true } }),
    prisma.user.findMany({ where: { foto_perfil: { startsWith: '/uploads/' } }, select: { id: true, foto_perfil: true } }),
  ]);

  const items: MigrationItem[] = [
    ...products.map((item) => ({
      model: 'product' as const,
      id: item.id,
      field: 'imagen_url' as const,
      url: item.imagen_url,
      bucket: 'product-images' as const,
    })),
    ...galleryItems.map((item) => ({
      model: 'galleryItem' as const,
      id: item.id,
      field: 'image_url' as const,
      url: item.image_url,
      bucket: 'gallery' as const,
    })),
    ...siteEvents.map((item) => ({
      model: 'siteEvent' as const,
      id: item.id,
      field: 'image_url' as const,
      url: item.image_url,
      bucket: 'events' as const,
    })),
    ...users.map((item) => ({
      model: 'user' as const,
      id: item.id,
      field: 'foto_perfil' as const,
      url: item.foto_perfil,
      bucket: 'users-avatars' as const,
    })),
  ];

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await migrateOne(item);
      if (result === 'migrated' || result === 'dry-run') migrated += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      console.error(`[failed] ${item.model}.${item.id}`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`[summary] total=${items.length} migrated=${migrated} skipped=${skipped} failed=${failed}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
