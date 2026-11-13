import pino from 'pino';
import { maskPiiInText } from './security/piiMask.js';

const isProduction = process.env.NODE_ENV === 'production';
const lokiHost = process.env.LOKI_HOST;

// Só ativa pino-loki em produção se LOKI_HOST estiver explicitamente configurado (ex: docker-compose local).
// Em ambientes de cloud como Railway / Kubernetes sem Loki dedicado, o pino grava JSON diretamente no stdout,
// evitando crash por erro de resolução de DNS 'ENOTFOUND loki'.
const getTransport = () => {
  if (lokiHost) {
    return {
      target: 'pino-loki',
      options: {
        batching: true,
        interval: 5,
        host: lokiHost,
      },
    };
  }
  if (!isProduction) {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }
  return undefined; // Standard JSON output to stdout in production
};

/**
 * Caminhos redigidos pelo pino (exportado para o teste de redaction usar a config REAL).
 * Cada credencial aparece no topo e na forma `*.campo` (um nível de aninhamento).
 */
export const LOGGER_REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
  'cookie',
  'credential',
  'credentials',
  'bearerToken',
  'idToken',
  'privateKey',
  'client_secret',
  'access_token',
  'refresh_token',
  '*.password',
  '*.token',
  '*.secret',
  '*.authorization',
  '*.cookie',
  '*.credential',
  '*.credentials',
  '*.bearerToken',
  '*.idToken',
  '*.privateKey',
  '*.client_secret',
  '*.access_token',
  '*.refresh_token',
  '*.headers.authorization',
  '*.headers.Authorization',
  'err.config.headers.authorization',
  'err.config.headers.Authorization',
  '*.config.headers.authorization',
  '*.config.headers.Authorization',
  'err.response.data.token',
  'err.response.data.accessToken',
  'err.response.data.refreshToken',
  '*.response.data.token',
  '*.response.data.accessToken',
  '*.apiKey',
  '*.api_key',
  // Credenciais de integração (Setting integration.*, ver
  // src/lib/integrations/integrationSettings.repository.ts) — Onda 52, Agente 15.
  'botToken',
  'appSecret',
  'appPassword',
  'webhookUrl',
  '*.botToken',
  '*.appSecret',
  '*.appPassword',
  '*.webhookUrl',
  '*.accessToken',
  // Credenciais de integração/rotação (parecer 24 do #102): topo + um nível
  // (`refreshToken` no topo já estava acima).
  '*.refreshToken',
  'apiKey',
  'clientSecret',
  '*.clientSecret',
  'webhookSecret',
  '*.webhookSecret',
  'authToken',
  '*.authToken',
  'appKey',
  '*.appKey',
  'cpf',
  '*.cpf',
  'email',
  '*.email',
  'url',
  '*.url',
  'resetUrl',
  '*.resetUrl',
  'verificationUrl',
  '*.verificationUrl',
  'creditCard',
  '*.creditCard',
  'cardNumber',
  '*.cardNumber',
];

// Heurística barata: PII sempre contém '@' ou dígitos. Evita regex em toda string logada.
const PII_HINT = /[@\d]/;
const MAX_SANITIZE_DEPTH = 6;

/**
 * Sanitiza PII em texto livre de logs (DEM-20261113-002 / MEL-04).
 * O `redact` do pino cobre campos por caminho; esta função cobre PII embutida
 * em strings livres — mensagem, err.message, err.stack e payloads aninhados.
 * Exportada para teste.
 */
export function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') {
    return PII_HINT.test(value) ? maskPiiInText(value) : value;
  }
  if (value === null || typeof value !== 'object' || depth >= MAX_SANITIZE_DEPTH) {
    return value;
  }
  if (value instanceof Error) {
    value.message = sanitizeLogValue(value.message, depth + 1) as string;
    if (typeof value.stack === 'string') {
      value.stack = sanitizeLogValue(value.stack, depth + 1) as string;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, depth + 1));
  }
  // Só recursa em objetos plain — Date, Buffer, Map, Set e instâncias de
  // classe (Prisma, SDKs) devem chegar ao serializer intactos. Iterar
  // Object.entries neles produziria {} ou {"0":..} e apagaria dados de log.
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = sanitizeLogValue(val, depth + 1);
  }
  return out;
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  hooks: {
    logMethod(args, method) {
      for (let i = 0; i < args.length; i++) {
        args[i] = sanitizeLogValue(args[i]);
      }
      return method.apply(this, args);
    },
  },
  redact: {
    paths: LOGGER_REDACT_PATHS,
    censor: '[REDACTED]',
  },
  transport: getTransport(),
  base: {
    env: process.env.NODE_ENV,
    service: 'birthhub360-api',
  },
});
