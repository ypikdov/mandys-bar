import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as rfs from 'rotating-file-stream';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import productRoutes from './modules/products/products.routes.js';
import userRoutes from './modules/users/users.routes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import reservationRoutes from './modules/reservations/reservations.routes.js';
import siteContentRoutes from './modules/site-content/site-content.routes.js';
import { primeAdminProductsCache, primePublicProductsCache } from './modules/products/products.controller.js';
import { primePublicSiteContentCache } from './modules/site-content/site-content.controller.js';
import { authRateLimiter, orderRateLimiter } from './middlewares/rateLimiter.js';
import { enforceHttps, requestSanitizer, globalErrorHandler, additionalSecurityHeaders } from './middlewares/security.js';
import { classifyDatabaseError, getDatabaseProviderCode } from './lib/databaseDiagnostics.js';
import prisma from './lib/prisma.js';

dotenv.config();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_WS_URL = SUPABASE_URL
  ? SUPABASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
  : undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

const splitEnvList = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const getOriginFromUrl = (value?: string) => {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const uniqueStrings = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const devOrigins = isProduction
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

const allowedOrigins = uniqueStrings([
  ...splitEnvList(process.env.CORS_ORIGINS),
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  ...devOrigins,
]);

const supabaseOrigin = getOriginFromUrl(SUPABASE_URL);

const cspDirectives = () => {
  const directives: Record<string, string[]> = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
    scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: uniqueStrings([
      "'self'",
      'data:',
      'blob:',
      supabaseOrigin,
      ...(isProduction ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']),
    ]),
    connectSrc: uniqueStrings([
      "'self'",
      SUPABASE_URL,
      SUPABASE_WS_URL,
      ...allowedOrigins,
      ...(isProduction ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']),
    ]),
  };

  if (isProduction) {
    directives.upgradeInsecureRequests = [];
  }

  return directives;
};

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

if (!isProduction && !fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOADS_DIR, 'anulaciones'), { recursive: true });
}

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  size: '100M',
  path: LOGS_DIR,
  maxFiles: 14,
});

app.use(enforceHttps);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives(),
    },
  }),
);
app.use(additionalSecurityHeaders);

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen CORS no permitido.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Mandy-Signature', 'X-Mandy-Timestamp'],
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: '256kb',
    verify: (req, _res, buffer) => {
      const expressReq = req as express.Request;

      if (expressReq.originalUrl.startsWith('/api/webhooks')) {
        expressReq.rawBody = Buffer.from(buffer);
      }
    },
  }),
);

app.use('/api/webhooks', webhookRoutes);
app.use(requestSanitizer);

morgan.token('id', (req) => (req as express.Request).id ?? '-');
app.use(
  morgan(
    ':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]',
    { stream: accessLogStream },
  ),
);

if (!isProduction && fs.existsSync(UPLOADS_DIR)) {
  app.use('/uploads', express.static(UPLOADS_DIR));
}

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/orders', orderRateLimiter, orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/site-content', siteContentRoutes);

app.get('/api/healthz', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.get('/api/readyz', async (_req, res) => {
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    return res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      reason: 'missing_database_url',
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'READY', database: 'CONNECTED' });
  } catch (error) {
    return res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      reason: classifyDatabaseError(error),
      providerCode: getDatabaseProviderCode(error),
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use(globalErrorHandler);

export const primeWarmCaches = async () => {
  await Promise.allSettled([
    primePublicSiteContentCache(),
    primePublicProductsCache(),
    primeAdminProductsCache(),
  ]);
};

export default app;
