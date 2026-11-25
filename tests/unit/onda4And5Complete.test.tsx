// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { evaluatePullRequestDefinitionOfDone } from '../../src/lib/governance/dodValidator.js';
import { destroyZombieDatabaseConnections } from '../../src/lib/db/ephemeralDbCleanup.js';
import { auditPlaywrightTestForHardSleeps } from '../../src/lib/testing/webFirstAssertions.js';
import { runPartitionedRetentionCleanupJob } from '../../src/lib/db/retention/cleanup.job.js';
import {
  assertAuditLogOperationAllowed,
  BUILD_APPEND_ONLY_AUDIT_LOGS_TRIGGER_SQL,
} from '../../src/features/audit-logs/appendOnlyAuditTrigger.js';
import { resolveCompositeRateLimitKey } from '../../src/api/middlewares/rate-limit.js';
import { EntitlementPlanCacheChecker } from '../../src/features/billing/entitlements/checker.js';
import { computeOutboundWebhookBackoffWithJitter } from '../../src/features/webhooks/outbound/dispatcher.js';
import {
  CANONICAL_SEMANTIC_PALETTE,
  CANONICAL_TYPOGRAPHY_SCALE,
} from '../../src/components/index.js';
import { EmptyState } from '../../src/components/feedback/EmptyState.js';
import { auditTailwindArbitraryClasses } from '../../src/components/ui/semanticTokensValidator.js';
import { MotionWrapper } from '../../src/components/motion/MotionWrapper.js';
import { validateLandingImageDimensions } from '../../src/features/landing/clsImageGuard.js';
import { OnboardingChecklist } from '../../src/features/onboarding/ui/Checklist.js';
import { enqueueAsyncLeadScoringOnCreation } from '../../src/features/crm/scoring/scoring.engine.js';
import {
  formatUtcTaskToClientTimezone,
  normalizeTaskDateToUtcIso,
} from '../../src/features/crm/tasks/calendar.utils.js';
import { assignLeadRoundRobinAvailableOnly } from '../../src/features/crm/routing/round-robin.js';
import { detectDuplicateCrmContacts } from '../../src/features/crm/deduplication/dedup.service.js';
import { DailyAggregatedCohortService } from '../../src/features/crm/analytics/cohort.service.js';
import { mapBitrixPayloadWithTypedCustomFieldFallback } from '../../src/lib/integrations/bitrix/mapping/mapper.js';
import { reconcileGoogleCalendarDeletedEvents } from '../../src/lib/integrations/calendar/google.sync.js';
import { CachedCnpjEnrichmentService } from '../../src/lib/integrations/erp/cnpj.service.js';
import { VoiceAudioVisualizer } from '../../src/features/voice-hub/ui/Visualizer.js';
import { routeConversationByActiveCapacity } from '../../src/features/notifications/inbox/router.js';
import { buildSlidingWindowCopilotContext } from '../../src/features/ai-copilot/copilot.service.js';
import { analyzeCalibratedPtBrSentiment } from '../../src/lib/ai/nlp/sentiment.js';
import { auditCapacitorLeastPrivilegeConfig } from '../../src/mobile/plugins/permissionAuditor.js';
import { LeadListCompact } from '../../src/mobile/ui/LeadListCompact.js';
import { requestMicrophoneWithEducationalPrompt } from '../../src/mobile/native-audio/recorder.js';
import { sanitizeSentryMobileCrashEvent } from '../../src/mobile/telemetry/sentry.js';
import {
  CANONICAL_BUILDKIT_GHA_CACHE_SNIPPET,
  validateDockerBuildkitCacheConfig,
} from '../../src/lib/ci/buildkitCacheValidator.js';
import { normalizeHttpRouteForMetrics } from '../../src/lib/telemetry/routeCardinalityNormalizer.js';

const require = createRequire(import.meta.url);

describe('[Onda 4 & Onda 5] Validação integral dos 36 itens (P2 e P3)', () => {
  it('[03 · Nina] .dependency-cruiser.cjs possui regra bloqueante no-circular contra dependências circulares', () => {
    const depcruise = require(path.join(process.cwd(), '.dependency-cruiser.cjs')) as {
      forbidden: { name: string; severity: string; to?: { circular?: boolean } }[];
    };
    const noCircular = depcruise.forbidden.find((r) => r.name === 'no-circular');
    expect(noCircular).toBeDefined();
    expect(noCircular?.severity).toBe('error');
    expect(noCircular?.to?.circular).toBe(true);
  });

  it('[04 · Téo] destrói conexões zumbis no banco efêmero e fecha o pool', async () => {
    const res = await destroyZombieDatabaseConnections({
      databaseName: 'birthhub_test_ephemeral',
      port: {
        terminateIdleBackends: async () => 4,
        closePool: async () => {},
      },
    });
    expect(res).toEqual({ terminatedBackends: 4, poolClosed: true });
  });

  it('[05 · Luma] detecta page.waitForTimeout e valida suítes com web-first assertions', () => {
    expect(auditPlaywrightTestForHardSleeps('await page.waitForTimeout(3000);').compliant).toBe(
      false,
    );
    expect(
      auditPlaywrightTestForHardSleeps('await expect(page.getByRole("button")).toBeVisible();')
        .compliant,
    ).toBe(true);
  });

  it('[15 · Olavo] particiona expurgo de dados em lotes com pausas de 500ms', async () => {
    let calls = 0;
    const pauses: number[] = [];
    const res = await runPartitionedRetentionCleanupJob({
      tenantId: 'tenant-1',
      cutoffDate: new Date('2025-01-01T00:00:00Z'),
      batchSize: 100,
      pauseMs: 500,
      sleepFn: async (ms) => {
        pauses.push(ms);
      },
      port: {
        async deleteExpiredChunk() {
          calls += 1;
          return calls === 1 ? 100 : 40;
        },
      },
    });
    expect(res.totalDeleted).toBe(140);
    expect(res.batchesExecuted).toBe(2);
    expect(pauses).toEqual([500]);
  });

  it('[18 · Ayla] trigger PostgreSQL torna audit_logs estritamente append-only', () => {
    expect(BUILD_APPEND_ONLY_AUDIT_LOGS_TRIGGER_SQL).toContain('BEFORE UPDATE OR DELETE ON "AuditLog"');
    expect(() => assertAuditLogOperationAllowed('UPDATE')).toThrow(/append-only/);
    expect(() => assertAuditLogOperationAllowed('DELETE')).toThrow(/append-only/);
    expect(() => assertAuditLogOperationAllowed('INSERT')).not.toThrow();
  });

  it('[25 · Tália] rate limiting inteligente prioriza Token/ApiKey corporativa além do IP', () => {
    const corp = resolveCompositeRateLimitKey({
      ipAddress: '200.10.20.30',
      tenantId: 'tenant-corp',
      apiKeyId: 'key-prod-1',
    });
    expect(corp.tier).toBe('CORPORATE_API_KEY');
    expect(corp.key).toBe('rl:corp:tenant-corp:key:key-prod-1');
  });

  it('[27 · Vic] invalida imediatamente o cache de plano no Redis após upgrade via webhook', async () => {
    const store = new Map<string, unknown>();
    const checker = new EntitlementPlanCacheChecker(
      {
        get: async (k) => (store.get(k) as never) ?? null,
        set: async (k, v) => {
          store.set(k, v);
        },
        del: async (k) => {
          store.delete(k);
        },
      },
      async (tenantId) => ({
        tenantId,
        planCode: 'STARTER',
        maxSeats: 5,
        maxMonthlyAiTokens: 100_000,
      }),
    );

    const initial = await checker.getEntitlements('t-1');
    expect(initial.planCode).toBe('STARTER');

    const upgraded = await checker.invalidateAndRefreshOnPlanUpgrade('t-1', {
      tenantId: 't-1',
      planCode: 'ENTERPRISE',
      maxSeats: 100,
      maxMonthlyAiTokens: 5_000_000,
    });
    expect(upgraded.planCode).toBe('ENTERPRISE');
    expect((await checker.getEntitlements('t-1')).planCode).toBe('ENTERPRISE');
  });

  it('[29 · Lia] aplica exponential backoff com jitter nos webhooks outbound', () => {
    const delay1 = computeOutboundWebhookBackoffWithJitter(1, {
      baseDelayMs: 1_000,
      randomFn: () => 0.5,
    });
    const delay3 = computeOutboundWebhookBackoffWithJitter(3, {
      baseDelayMs: 1_000,
      randomFn: () => 0.5,
    });
    expect(delay1).toBeGreaterThanOrEqual(500);
    expect(delay3).toBeGreaterThan(delay1);
  });

  it('[30 · Violeta, 32 · Ema, 33 · Célia, 35 · Mia, 36 · Léo, 37 · Suri] UX, EmptyState, Tokens, Motion, CLS e Onboarding', () => {
    expect(CANONICAL_TYPOGRAPHY_SCALE.displayHero).toContain('font-extrabold');
    expect(CANONICAL_SEMANTIC_PALETTE.brandPrimary).toContain('bg-indigo-600');

    const onAction = vi.fn();
    render(
      <EmptyState
        title="Nenhum lead encontrado"
        description="Importe uma planilha ou crie seu primeiro lead."
        actionLabel="Criar Lead"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByTestId('empty-state-primary-action'));
    expect(onAction).toHaveBeenCalledTimes(1);

    expect(auditTailwindArbitraryClasses('bg-[#ff00aa] text-[13px]').valid).toBe(false);
    expect(auditTailwindArbitraryClasses('bg-indigo-600 text-sm').valid).toBe(true);

    render(
      <MotionWrapper>
        <span>Conteúdo com Reduced Motion</span>
      </MotionWrapper>,
    );
    expect(screen.getByTestId('accessible-motion-wrapper')).toBeDefined();

    expect(
      validateLandingImageDimensions([{ src: '/hero.webp', alt: 'Hero', width: 1200, height: 630 }])
        .clsSafe,
    ).toBe(true);
    expect(
      validateLandingImageDimensions([{ src: '/broken.webp', alt: 'Sem dimensão' }]).clsSafe,
    ).toBe(false);

    globalThis.localStorage.clear();
    const { unmount } = render(
      <OnboardingChecklist
        tenantId="t-1"
        userId="u-1"
        steps={[{ id: 'step-bitrix', label: 'Conectar Bitrix24' }]}
      />,
    );
    const checkbox = screen.getByTestId('onboarding-step-step-bitrix') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    unmount();

    // Simula F5 (reload): novo mount recupera estado do localStorage
    render(
      <OnboardingChecklist
        tenantId="t-1"
        userId="u-1"
        steps={[{ id: 'step-bitrix', label: 'Conectar Bitrix24' }]}
      />,
    );
    expect((screen.getByTestId('onboarding-step-step-bitrix') as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it('[43 · Amon, 45 · Otto, 47 · Dante, 48 · Jade, 49 · Malu] Lead Scoring async, UTC tasks, Round-Robin férias, Dedup E.164/fonética e Coorte agregada', async () => {
    const scoringRes = await enqueueAsyncLeadScoringOnCreation({
      tenantId: 'tenant-1',
      leadId: 'lead-77',
      queue: { enqueue: async () => ({ jobId: 'job-score-77' }) },
    });
    expect(scoringRes.queued).toBe(true);
    expect(scoringRes.idempotencyKey).toBe('lead-score:tenant-1:lead-77');

    const utcIso = normalizeTaskDateToUtcIso('2026-11-20T15:00:00-03:00');
    expect(utcIso).toBe('2026-11-20T18:00:00.000Z');
    expect(formatUtcTaskToClientTimezone(utcIso, 'America/Sao_Paulo')).toContain('15:00');

    const routing = assignLeadRoundRobinAvailableOnly({
      lastAssignedIndex: -1,
      candidates: [
        { id: 'rep-vacation', name: 'Carlos', active: true, onVacation: true },
        { id: 'rep-available', name: 'Fernanda', active: true, onVacation: false },
      ],
    });
    expect(routing.assignedRep.id).toBe('rep-available');

    const dups = detectDuplicateCrmContacts([
      { id: 'c1', name: 'Raphael Souza', phone: '(11) 98888-7777', email: 'a@empresa.com' },
      { id: 'c2', name: 'Outro Nome', phone: '+55 11 98888-7777', email: 'b@empresa.com' },
      { id: 'c3', name: 'Rafael Sousa', phone: '(21) 97777-6666', email: 'c@empresa.com' },
    ]);
    expect(dups).toEqual([
      { primaryId: 'c1', duplicateId: 'c2', reason: 'PHONE_E164' },
      { primaryId: 'c1', duplicateId: 'c3', reason: 'PHONETIC_NAME' },
    ]);

    const cohortSvc = new DailyAggregatedCohortService({
      readPreAggregatedRollups: async () => [
        {
          tenantId: 't-1',
          cohortMonth: '2026-10',
          activeCustomers: 100,
          retainedCustomers: 94,
          mrrCents: 5_000_000,
          churnedCents: 300_000,
        },
      ],
    });
    const cohort = await cohortSvc.getCommercialCohortReport('t-1');
    expect(cohort.usedPreAggregatedTable).toBe(true);
    expect(cohort.rows[0].retentionRatePct).toBe(94);
  });

  it('[54 · Rita, 57 · Nico, 58 · Elisa] Fallback Bitrix UF_CRM, Google Calendar sync e Cache CNPJ 30 dias', async () => {
    const mapped = mapBitrixPayloadWithTypedCustomFieldFallback(
      { UF_CRM_ACTIVE: 'Y' },
      [
        {
          bitrixFieldKey: 'UF_CRM_DELETED_FIELD',
          internalFieldKey: 'customSegment',
          type: 'string',
          fallbackValue: 'N/A',
        },
        {
          bitrixFieldKey: 'UF_CRM_ACTIVE',
          internalFieldKey: 'isActive',
          type: 'boolean',
          fallbackValue: false,
        },
      ],
    );
    expect(mapped.mapped).toEqual({ customSegment: 'N/A', isActive: true });
    expect(mapped.missingOrOrphanFields).toEqual(['UF_CRM_DELETED_FIELD']);

    const calSync = reconcileGoogleCalendarDeletedEvents({
      localMeetings: [
        { localId: 'm1', externalGoogleEventId: 'g-deleted', status: 'SCHEDULED' },
        { localId: 'm2', externalGoogleEventId: 'g-active', status: 'SCHEDULED' },
      ],
      remoteEvents: [{ id: 'g-active', status: 'confirmed' }],
    });
    expect(calSync.cancelledLocalIds).toEqual(['m1']);
    expect(calSync.activeLocalIds).toEqual(['m2']);

    let providerCalls = 0;
    const cnpjSvc = new CachedCnpjEnrichmentService(async (cnpj) => {
      providerCalls += 1;
      return { cnpj, razaoSocial: 'Birth Hub Tecnologia S.A.', situacaoCadastral: 'ATIVA' };
    });
    const first = await cnpjSvc.lookupCnpj('20.540.912/0001-63', 1_000_000);
    const second = await cnpjSvc.lookupCnpj('20540912000163', 1_000_000 + 5 * 86_400_000);
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(providerCalls).toBe(1);
  });

  it('[65 · Lena, 66 · Kiko, 74 · Luca, 75 · Yara, 79 · Mina] Voice Visualizer, Inbox Router, Copilot Window, Sentimento PT-BR e Promptfoo', () => {
    render(
      <VoiceAudioVisualizer sampleRateHz={48000} rmsAmplitude={0.42} trackMutedByOs={false} />,
    );
    expect(screen.getByTestId('voice-audio-visualizer').getAttribute('data-capturing')).toBe(
      'true',
    );

    const routed = routeConversationByActiveCapacity([
      { operatorId: 'op-busy', online: true, activeChatsCount: 8, maxConcurrentChats: 10 },
      { operatorId: 'op-free', online: true, activeChatsCount: 1, maxConcurrentChats: 10 },
    ]);
    expect(routed.operatorId).toBe('op-free');

    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Mensagem comercial número ${i + 1}`,
    }));
    const windowed = buildSlidingWindowCopilotContext({ messages, windowSize: 4 });
    expect(windowed.summarizedOlderCount).toBe(6);
    expect(windowed.contextMessages).toHaveLength(5); // 1 resumo + 4 recentes

    const sarcastic = analyzeCalibratedPtBrSentiment(
      'O atendimento foi excelente, só que não! Uma enrolação total.',
    );
    expect(sarcastic.sentiment).toBe('NEGATIVE');
    expect(sarcastic.matchedColloquialisms).toContain('sarcasmo_ou_ironia');

    const promptfooYaml = readFileSync(
      path.join(process.cwd(), 'tests/evals/promptfoo.config.yaml'),
      'utf-8',
    );
    expect(promptfooYaml).toContain('CPF_RAW');
  });

  it('[81 · Enzo, 82 · Davi, 86 · Alana, 87 · Tomás, 89 · Zico] Mobile permissions, Android R8, Compact UI <360px, Mic prompt e Sentry PII', async () => {
    const capConfig = readFileSync(path.join(process.cwd(), 'capacitor.config.ts'), 'utf-8');
    expect(auditCapacitorLeastPrivilegeConfig(capConfig).compliant).toBe(true);

    const gradle = readFileSync(path.join(process.cwd(), 'android/app/build.gradle'), 'utf-8');
    expect(gradle).toContain('minifyEnabled true');
    expect(gradle).toContain('proguard-android-optimize.txt');

    render(
      <LeadListCompact
        leads={[
          {
            id: 'l-1',
            name: 'Dra. Helena Albuquerque',
            company: 'Instituto Oncológico Paulista',
            stageLabel: 'Negociação',
          },
        ]}
      />,
    );
    expect(screen.getByTestId('mobile-lead-list-compact').className).toContain('overflow-x-hidden');

    const micRes = await requestMicrophoneWithEducationalPrompt({
      showEducationalModal: async () => ({ userAcceptedExplanation: true }),
      requestOsMicrophonePermission: async () => 'granted',
    });
    expect(micRes.educationalModalShown).toBe(true);
    expect(micRes.status).toBe('granted');

    const sanitizedCrash = sanitizeSentryMobileCrashEvent({
      message: 'Erro ao salvar paciente maria@clinica.com.br CPF 111.222.333-44 leadName=MariaSilva',
      user: { id: 'usr-1', email: 'maria@clinica.com.br', name: 'Maria Silva', cpf: '111.222.333-44' },
    });
    expect(sanitizedCrash.message).toBe(
      'Erro ao salvar paciente [EMAIL_REDACTED] CPF [CPF_REDACTED] leadName=[NAME_REDACTED]',
    );
    expect(sanitizedCrash.user?.email).toBeUndefined();
    expect(sanitizedCrash.user?.name).toBeUndefined();
  });

  it('[94 · Tess, 95 · Íon, 01 · Ória, 39 · Tina] BuildKit Cache, OpenTelemetry Cardinalidade, DoD Automático e Manual Tailwind v4', () => {
    expect(validateDockerBuildkitCacheConfig(CANONICAL_BUILDKIT_GHA_CACHE_SNIPPET).valid).toBe(
      true,
    );

    expect(
      normalizeHttpRouteForMetrics('/api/leads/550e8400-e29b-41d4-a716-446655440000/activities/9912'),
    ).toBe('/api/leads/:id/activities/:id');

    const dodOk = evaluatePullRequestDefinitionOfDone({
      prNumber: 495,
      headSha: 'abc1234',
      typecheckPassed: true,
      lintPassed: true,
      unitTestsPassed: true,
      architectureCheckPassed: true,
      independentReviewStatus: 'APROVADO',
      reviewedSha: 'abc1234',
    });
    expect(dodOk.readyToMerge).toBe(true);

    const tokensDoc = readFileSync(
      path.join(process.cwd(), 'identidade-visual/tokens.md'),
      'utf-8',
    );
    expect(tokensDoc).toContain('Tailwind CSS v4');
    expect(tokensDoc).toContain('@theme');
  });
});
