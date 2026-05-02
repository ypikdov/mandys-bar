import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { classifyDatabaseError, getDatabaseProviderCode } from './databaseDiagnostics.js';

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

const connectionString = normalizeConnectionString(process.env.DIRECT_URL || process.env.DATABASE_URL);
const databaseCaCert = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n');
const rejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false');

if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DIRECT_URL o DATABASE_URL es obligatorio en producción');
}

const pool = new pg.Pool({ 
  connectionString,
  ssl: databaseCaCert
    ? { ca: databaseCaCert, rejectUnauthorized: true }
    : { rejectUnauthorized },
});



const adapter = new PrismaPg(pool);

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', {
    reason: classifyDatabaseError(err),
    providerCode: getDatabaseProviderCode(err),
  });
});

export const prisma = new PrismaClient({ adapter });

// Simple connection check on startup
prisma.$connect()
  .then(() => console.log('Successfully connected to database via Prisma'))
  .catch((err) => console.error('Failed to connect to database:', {
    reason: classifyDatabaseError(err),
    providerCode: getDatabaseProviderCode(err),
  }));

export default prisma;
