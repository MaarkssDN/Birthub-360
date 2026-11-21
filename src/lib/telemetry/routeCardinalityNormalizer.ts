const UUID_SEGMENT_REGEX =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;
const CUID_OR_LONG_ID_SEGMENT_REGEX = /\/(?:c[a-z0-9]{20,32}|[a-z0-9_-]{20,64})(?=\/|$)/gi;
const NUMERIC_ID_SEGMENT_REGEX = /\/\d+(?=\/|$)/g;

/**
 * [95 · Íon] Normaliza rotas HTTP com identificadores dinâmicos (`/api/leads/550e8400-...`)
 * para o template canônico (`/api/leads/:id`) antes de registrar labels no OpenTelemetry/Prometheus,
 * prevenindo explosão de cardinalidade.
 */
export function normalizeHttpRouteForMetrics(rawPath: string): string {
  const withoutQuery = rawPath.split('?')[0] || '/';
  return withoutQuery
    .replace(UUID_SEGMENT_REGEX, '/:id')
    .replace(CUID_OR_LONG_ID_SEGMENT_REGEX, '/:id')
    .replace(NUMERIC_ID_SEGMENT_REGEX, '/:id');
}
