import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  getSupabaseStorageClient,
  IMAGE_BUCKETS,
} from '../src/lib/supabaseStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeConnectionString = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return value.replace(/[?&]sslmode=require\b/, '');
  }
};

const ensureBuckets = async () => {
  const supabase = getSupabaseStorageClient();

  for (const bucket of IMAGE_BUCKETS) {
    const { data: existing, error: getError } = await supabase.storage.getBucket(bucket);
    if (existing && !getError) {
      console.log(`[storage] bucket existe: ${bucket}`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/webp'],
    });

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`[storage] no se pudo crear bucket ${bucket}: ${error.message}`);
    }

    console.log(`[storage] bucket listo: ${bucket}`);
  }
};

const applyPolicies = async () => {
  const connectionString = normalizeConnectionString(process.env.DIRECT_URL || process.env.DATABASE_URL);
  if (!connectionString) {
    console.warn('[storage] DATABASE_URL/DIRECT_URL no configurada; aplica storage-policies.sql manualmente.');
    return;
  }

  const databaseCaCert = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n');
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false');

  const pool = new pg.Pool({
    connectionString,
    ssl: databaseCaCert
      ? { ca: databaseCaCert, rejectUnauthorized: true }
      : { rejectUnauthorized },
  });

  try {
    const sql = await fs.readFile(path.join(__dirname, 'storage-policies.sql'), 'utf8');
    await pool.query(sql);
    console.log('[storage] policies listas');
  } finally {
    await pool.end();
  }
};

const main = async () => {
  await ensureBuckets();
  await applyPolicies();
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
