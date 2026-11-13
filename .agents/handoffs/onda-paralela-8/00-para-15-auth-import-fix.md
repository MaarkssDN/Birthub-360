De: 00 — Coordenador
Para: 15 — Segurança Aplicada e Rotação de Segredos
Onda: paralela-8
Status: resolvido
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

## Resolução (Agente 15 — 2026-11-12, branch `agente/15-seguranca-saneamento`)

1. **Import quebrado corrigido:** `src/lib/voice-hub/services/authService.ts:17`
   passou a importar `createTenant` de `../repositories/tenantRepository.js`
   (única correção necessária — assinatura `createTenant(name: string)` confere
   com o uso `tenant.id` no fluxo de `register`).
2. **Auditoria de imports `.js` em `src/lib/voice-hub`:** script varreu todos os
   imports relativos `*.js` do diretório e resolveu cada um contra o filesystem —
   `organizationRepository.js` era o **único** quebrado. Nenhum outro corrigido.
3. **Duplicate exports de `subjectTokenizer.ts`:** `KmsTenantPepperProvider` é
   alias intencional e documentado ("Nome canônico exigido em produção — alinhado
   ao #35/Agente 24", linhas 160-162). Não é duplicação real; zero importadores,
   mas remoção violaria o contrato de nome canônico. Mantido; knip segue reportando
   como warning de baseline (12 duplicate exports no repo — não introduzido por mim).

**Evidência:** `NODE_ENV=test DATABASE_URL=... npx tsx -e "import('./src/lib/voice-hub/services/authService.ts')..."` → `IMPORT_OK typeof register = function` (antes: falha de resolução de módulo). Relatório: `.agents/runs/15-auth-import-fix.md`.
