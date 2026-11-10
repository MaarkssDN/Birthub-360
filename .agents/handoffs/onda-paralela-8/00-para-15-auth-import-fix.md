De: 00 — Coordenador
Para: 15 — Segurança Aplicada e Rotação de Segredos
Onda: paralela-8
Status: aberto
Prioridade: bloqueador (import quebrado em caminho de auth)

## Problema
`src/lib/voice-hub/services/authService.ts:17` importa `createTenant` de `../repositories/organizationRepository.js` — módulo que NÃO existe em `src/lib/voice-hub/repositories/` (listagem real: agentRepository, apiKeyRepository, auditLogRepository, billingRepository, birthhub360CallResultRepository, callLogRepository, metricRepository, notificationRepository, roleRepository, sessionRepository, settingRepository, tenantRepository, userRepository, webhookEndpointRepository). A função `createTenant` existe em `tenantRepository.ts:3`. O import quebra em runtime no fluxo de signup (`auth.controller.ts` consome authService). tsconfig exclui `src/lib/voice-hub`, então o typecheck não detecta.

Adicional: knip reporta duplicate exports em `src/lib/security/subjectTokenizer.ts` (`KmsEnvelopeTenantKeyProvider`, `KmsTenantPepperProvider`).

## Evidência
`ls src/lib/voice-hub/repositories/` (sem organizationRepository); `grep -rn "organizationRepository" src` → apenas o import quebrado.

## Alteração necessária
1. Corrigir o import para `../repositories/tenantRepository.js` e validar a assinatura de `createTenant` (nome, retorno, async) contra o uso em `authService.ts:44`.
2. Verificar se há outros imports `.js` quebrados no diretório voice-hub e corrigir os comprovados.
3. Resolver duplicate exports de `subjectTokenizer.ts` se forem duplicação real.

## Teste esperado
Smoke test: `npx tsx -e "import('./src/lib/voice-hub/services/authService.ts').then(()=>console.log('OK'))"` ou teste existente do controller; `npx biome lint` nos arquivos; relatório dos imports `.js` auditados.

## Contexto
Worktree: `.claude/worktrees/ag-15`, branch `agente/15-auth-import-fix`. Não alterar `.env`/segredos. Atenção LGPD: não logar PII.
