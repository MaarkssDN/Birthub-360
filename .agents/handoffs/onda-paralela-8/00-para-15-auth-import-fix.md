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

## Resolução
Agente 15 — Segurança Aplicada, 2026-11-11 (America/Sao_Paulo). Branch `agente-15/auth-import-fix` (nome da missão; a branch sugerida no contexto do handoff não foi reutilizada).

### O que mudou
- Confirmado que `src/lib/voice-hub/repositories/organizationRepository.js` (e `.ts`) não existe.
- `createTenant(name: string)` em `tenantRepository.ts:3` retorna `prisma.tenant.create({ data: { name } })` (Promise com `id`). Compatível com `await createTenant(companyName)` e o uso de `tenant.id` no signup.
- Import em `authService.ts` corrigido para `../repositories/tenantRepository.js`. Biome reordenou os imports do arquivo.
- Adicionado `src/lib/voice-hub/services/authService.test.ts` (Vitest, mesmo padrão de mocks dos services do voice-hub), cobrindo signup via `tenantRepository.createTenant`, rejeição de e-mail duplicado (sem criar tenant), login e refresh.
- Auditoria de imports relativos `.js` em `src/lib/voice-hub`: 320 conferidos, único quebrado era este.
- `subjectTokenizer.ts`: **não alterado**. `KmsTenantPepperProvider` é alias intencional de `KmsEnvelopeTenantKeyProvider` (comentário: "Nome canônico exigido em produção"), não duplicação de implementação. knip reporta os dois nomes; remover o alias quebraria o contrato canônico.

### PR
Aberto contra `main` nesta branch. Número e URL constam no commit de acompanhamento deste handoff, se já houver; caso contrário, no corpo do próprio PR.

### Validações
- `npm run typecheck`: passou (exit 0).
- Biome nos arquivos alterados (`biome check` lint + format em `authService.ts` e `authService.test.ts`): passou.
- `npm run lint` (`biome lint src`): exit 0, 828 warnings e 3 infos pré-existentes na main; nenhum nos arquivos desta correção.
- `npm run format:check` (`biome format src`): falha pré-existente na main (23 erros, arquivos de layout/landing/characters/prospecting/prisma-interceptors; nenhum desta correção). Não corrigido (fora de escopo).
- Testes unitários do caminho: 11/11 passaram em `src/lib/voice-hub/services/authService.test.ts`.
- `npm run coverage:unit` (suíte completa, SHA de trabalho sobre a main `5d75ffa9919145f22ae969c5ca3e2f032b2d050f`): 768 arquivos passaram, 1 falhou, 1 skipped; 5905 testes passaram, 1 falhou. A falha é pré-existente na main e fora deste escopo: `tests/unit/security/reencryptTargetsContract.test.ts` ("nenhum chamador desconhecido") espera `[]` e recebe `['src/lib/prisma-interceptors.ts']`. Reproduzida com as mudanças desta missão removidas (stash). Não alterado.
- Cobertura de `authService.ts` (código do caminho corrigido, medido no arquivo após os testes novos): statements 100%, branches 88.88%, functions 100%, lines 100% (meta de código novo ≥ 80% atendida). Agregado da suíte: statements 45.04%, branches 38.59%, functions 38.78%, lines 45.86% — acima dos pisos de `vitest.unit.config.ts` (28/25/23/29). Nenhum limite foi reduzido.
- Smoke `npx tsx -e "import('./src/lib/voice-hub/services/authService.ts')"` falhou por validação de env (`NODE_ENV`/`DATABASE_URL`) ao carregar o grafo de módulos, não pelo import corrigido. O teste unitário isolado cobre o caminho com mocks e não depende de segredos.
