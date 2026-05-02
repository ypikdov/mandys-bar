export type DatabaseIssueCode =
  | 'missing_database_url'
  | 'tenant_or_user_not_found'
  | 'auth_failed'
  | 'dns_failed'
  | 'timeout'
  | 'connection_failed';

type DatabaseErrorLike = {
  code?: unknown;
  meta?: {
    code?: unknown;
    message?: unknown;
  };
  message?: unknown;
  name?: unknown;
};

const asDatabaseError = (error: unknown): DatabaseErrorLike =>
  error && typeof error === 'object' ? (error as DatabaseErrorLike) : {};

const getDatabaseErrorCodes = (error: DatabaseErrorLike) =>
  [error.code, error.meta?.code].filter((code): code is string => typeof code === 'string');

const getDatabaseErrorMessage = (error: unknown, candidate: DatabaseErrorLike) =>
  [
    candidate.message,
    candidate.meta?.message,
    String(error ?? ''),
  ].filter((message): message is string => typeof message === 'string').join(' ');

export const classifyDatabaseError = (error: unknown): DatabaseIssueCode => {
  const candidate = asDatabaseError(error);
  const codes = getDatabaseErrorCodes(candidate);
  const message = getDatabaseErrorMessage(error, candidate);

  if (codes.includes('28P01') || /password authentication failed/i.test(message)) {
    return 'auth_failed';
  }

  if (
    codes.includes('XX000') ||
    /tenant(?:\/| or )user.*not found/i.test(message) ||
    /supabase.*tenant/i.test(message)
  ) {
    return 'tenant_or_user_not_found';
  }

  if (codes.includes('ENOTFOUND') || /getaddrinfo ENOTFOUND|ENOTFOUND/i.test(message)) {
    return 'dns_failed';
  }

  if (codes.includes('ETIMEDOUT') || codes.includes('ECONNREFUSED') || /timeout/i.test(message)) {
    return 'timeout';
  }

  return 'connection_failed';
};

export const getDatabaseProviderCode = (error: unknown) => {
  const candidate = asDatabaseError(error);
  const code = candidate.meta?.code ?? candidate.code;
  return typeof code === 'string' ? code : undefined;
};

export const isDatabaseUnavailableError = (error: unknown) => {
  const candidate = asDatabaseError(error);
  const codes = getDatabaseErrorCodes(candidate);
  const message = getDatabaseErrorMessage(error, candidate);
  const name = typeof candidate.name === 'string' ? candidate.name : '';

  return (
    name === 'PrismaClientInitializationError' ||
    codes.some(code => [
      'EACCES',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'P1000',
      'P1001',
      'P1002',
      'P1011',
      'P1017',
      'P2010',
      'SELF_SIGNED_CERT_IN_CHAIN',
      'XX000',
    ].includes(code)) ||
    /certificate|connection|database|ssl|tenant(?:\/| or )user|timeout|tls/i.test(message)
  );
};

export const getDatabaseUnavailableMessage = (reason: DatabaseIssueCode) => {
  switch (reason) {
    case 'missing_database_url':
      return 'Base de datos no configurada.';
    case 'tenant_or_user_not_found':
      return 'El endpoint de Supabase no reconoce el tenant o usuario configurado.';
    case 'auth_failed':
      return 'Credenciales de base de datos rechazadas.';
    case 'dns_failed':
      return 'No se pudo resolver el host de base de datos.';
    case 'timeout':
      return 'Tiempo de espera agotado conectando a la base de datos.';
    case 'connection_failed':
    default:
      return 'No se pudo conectar a la base de datos.';
  }
};
