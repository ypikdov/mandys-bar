import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const IMAGE_BUCKETS = [
  'product-images',
  'gallery',
  'events',
  'users-avatars',
] as const;

export type ImageBucket = (typeof IMAGE_BUCKETS)[number];

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let storageClient: SupabaseClient | null = null;

export const isImageBucket = (value: unknown): value is ImageBucket =>
  typeof value === 'string' && IMAGE_BUCKETS.includes(value as ImageBucket);

export const isSupabaseStorageConfigured = () =>
  Boolean(supabaseUrl && serviceRoleKey);

export const getSupabaseStorageClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias para Storage.');
  }

  if (!storageClient) {
    storageClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return storageClient;
};

export const buildImageObjectPath = (bucket: ImageBucket) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}/${randomUUID()}.webp`;
};

export const uploadImageBuffer = async (
  bucket: ImageBucket,
  buffer: Buffer,
) => {
  const client = getSupabaseStorageClient();
  const objectPath = buildImageObjectPath(bucket);

  const { error } = await client.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return {
    url: data.publicUrl,
    bucket,
    path: objectPath,
    filename: objectPath.split('/').at(-1) ?? objectPath,
  };
};
