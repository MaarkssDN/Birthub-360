/**
 * Domínios de cobertura com gate (MEL-46 / DEM-20261114-007, Onda 6 — Agente 08).
 *
 * Fonte única de verdade compartilhada por:
 *  - vitest.unit.config.ts → gera as chaves de `coverage.thresholds` (picomatch
 *    aceita brace expansion, então cada domínio vira UMA chave `{glob1,glob2,...}`
 *    cujo agregado é a união dos arquivos — mesmo cálculo que o Vitest faz);
 *  - scripts/ci/coverage-domain-report.mjs → imprime o mesmo agregado por domínio
 *    a partir do coverage-final.json (istanbul-lib-coverage, mesma semântica).
 *
 * Regra de calibração (mesma dos thresholds já existentes no config):
 * piso = baseline medido − margem pequena (~1-3pp). Não é meta de qualidade —
 * é o piso atual para impedir regressão enquanto a cobertura não é ampliada.
 * Ao subir cobertura real, subir o piso; nunca baixar sem justificativa aqui.
 *
 * Baseline: coverage/unit/coverage-final.json medido localmente em
 * 2026-11-15 (worktree agente/08-onda6-coverage-gate, origin/main @ 4437d3f80,
 * suíte unitária completa com `npm run coverage:unit`).
 */

export const COVERAGE_DOMAINS = {
  auth: {
    description:
      'Autenticação e autorização: libs de auth, middlewares de autenticação/' +
      'autorização, rotas e controllers de auth do voice-hub e do prospecção ' +
      'outbound, telas de login da feature auth.',
    globs: [
      'src/lib/auth/**',
      'src/lib/auth.ts',
      'src/lib/auth-client.ts',
      'src/bootstrap/auth.ts',
      'src/features/auth/**',
      'src/shared/middlewares/authenticateToken.ts',
      'src/shared/middlewares/authorization.ts',
      'src/lib/voice-hub/lib/auth-tokens.ts',
      'src/lib/voice-hub/routes/auth.routes.ts',
      'src/lib/voice-hub/controllers/auth.controller.ts',
      'src/features/prospecting/outbound/server/auth.ts',
      'src/features/prospecting/outbound/server/routes/auth.routes.ts',
    ],
    // Baseline 2026-11-15: lines 25.62 · statements 25.03 · branches 17.88 ·
    // functions 21.19 (21 arquivos). Piso agregado diluído pelas telas de login
    // (src/features/auth/components/** majoritariamente 0%) e por arquivos de
    // rota/bootstrap sem teste unitário — o núcleo backend (lib/auth/**,
    // middlewares, voice-hub auth.controller) já está em 58-95%. Piso mantido
    // como regressão do domínio inteiro; follow-up recomendado: testes das
    // telas de auth e do bootstrap para subir o piso.
    thresholds: {
      statements: 23,
      branches: 16,
      functions: 19,
      lines: 24,
    },
  },
  billing: {
    description:
      'Billing e usage: feature billing (domínio/aplicação/infra/presentation), ' +
      'billing do voice-hub (controller/repository/routes/service), tela de ' +
      'billing e serviço de billing de telefonia.',
    globs: [
      'src/features/billing/**',
      'src/lib/voice-hub/controllers/billing.controller.ts',
      'src/lib/voice-hub/repositories/billingRepository.ts',
      'src/lib/voice-hub/routes/billing.routes.ts',
      'src/lib/voice-hub/services/billingService.ts',
      'src/features/voice-hub/pages/Dashboard/Billing.tsx',
      'src/services/telephony/billing.service.ts',
    ],
    // Baseline 2026-11-15: lines 55.16 · statements 54.42 · branches 44.61 ·
    // functions 47.82 (12 arquivos) — domínio já bem coberto; piso ~1-2pp abaixo.
    thresholds: {
      statements: 53,
      branches: 43,
      functions: 46,
      lines: 53,
    },
  },
  tenancy: {
    description:
      'Isolamento de tenant: tenant-prisma, registry de scoping, interceptors ' +
      'do Prisma (injeção de organizationId/RLS), contextos de request, ' +
      'tenantGuard do outbox, rate limiter por tenant e repositories de tenant ' +
      'do voice-hub.',
    globs: [
      'src/lib/tenant-prisma.ts',
      'src/lib/tenant-scoping-registry.ts',
      'src/lib/prisma-interceptors.ts',
      'src/lib/context.ts',
      'src/lib/async-context.ts',
      'src/lib/queue/outbox/tenantGuard.ts',
      'src/shared/middlewares/tenantRateLimiter.ts',
      'src/lib/voice-hub/repositories/tenantRepository.ts',
      'src/lib/voice-hub/repositories/tenantAiConsentRepository.ts',
    ],
    // Baseline 2026-11-15: lines 78.94 · statements 79.03 · branches 66.47 ·
    // functions 76.31 (9 arquivos) — domínio mais bem coberto do repo; piso
    // ~1-2pp abaixo do baseline.
    thresholds: {
      statements: 77,
      branches: 64,
      functions: 74,
      lines: 77,
    },
  },
  ia: {
    description:
      'Fluxos de IA: núcleo de IA (src/lib/ai — gateway, embeddings, finops, ' +
      'guardrails), copiloto-ia, intelligence (agentes/enxame), ai-voice e os ' +
      'pontos de IA do voice-hub (controller/routes/aiConsent).',
    globs: [
      'src/lib/ai/**',
      'src/features/copiloto-ia/**',
      'src/features/intelligence/**',
      'src/features/ai-voice/**',
      'src/lib/voice-hub/controllers/ai.controller.ts',
      'src/lib/voice-hub/routes/ai.routes.ts',
      'src/lib/voice-hub/middlewares/aiConsent.ts',
    ],
    // Baseline 2026-11-15: lines 53.82 · statements 52.97 · branches 43.61 ·
    // functions 44.22 (275 arquivos) — agregado grande com cauda de UI/rotas
    // pouco testada; piso ~1-2pp abaixo do baseline.
    thresholds: {
      statements: 51,
      branches: 42,
      functions: 42,
      lines: 52,
    },
  },
};

/**
 * Chave de glob única por domínio para `coverage.thresholds` do Vitest.
 * Picomatch (usado pelo Vitest em resolveThresholds) expande braces, então
 * `{src/a/**,src/b.ts}` casa a união dos globs — o agregado cobrado é o do
 * domínio inteiro, não de cada glob isolado.
 */
export function domainThresholdKey(globs) {
  return `{${globs.join(',')}}`;
}
