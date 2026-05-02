import { randomBytes } from 'crypto';

let cachedJwtSecret: string | undefined;

export const getJwtSigningSecret = () => {
  if (cachedJwtSecret) return cachedJwtSecret;

  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    if (process.env.NODE_ENV === 'production' && configuredSecret.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
    }

    cachedJwtSecret = configuredSecret;
    return cachedJwtSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }

  cachedJwtSecret = randomBytes(32).toString('hex');
  console.warn('JWT_SECRET no está definido; usando un secreto temporal de desarrollo para este proceso');
  return cachedJwtSecret;
};
