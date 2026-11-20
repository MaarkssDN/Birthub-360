# Handoff — Orquestração de Vendas sem dados demo (Onda F3)

De: 00 — Coordenador
Para: 17 (Cadência) + 07 (IA/roleplay) + 02 (UX) + 08 (QA)
Onda: F3
Status: em-andamento
Prioridade: normal
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §2 (P03), §3.4

## Problema

Jornadas Comerciais, Playbooks, Processos de Vendas e Roteiros consomem
`/api/sales-orchestration/overview` com `source: 'real'|'none'` e exibem
`DemoDataNotice` quando o conteúdo é template/seed
(`src/features/sales-orchestration/`). O módulo está funcionalmente
parcial: cadências e atividades são reais, mas 4 superfícies de conteúdo
podem estar em modo demo.

## Evidência

- `src/features/sales-orchestration/components/DemoDataNotice.tsx`
- `src/features/sales-orchestration/orchestration.api.ts` L139:
  `GET /api/sales-orchestration/overview`.

## Alteração necessária

1. 17: verificar o que o backend retorna hoje por tenant — se `none`,
   decidir: popular com dados reais do domínio ou declarar escopo
   reduzido no Documento Mestre.
2. 07: validar roleplay IA e matrizes de qualificação/objeções com IA
   real (não template).
3. 02: se houver telas permanentemente demo, sinalizar honestamente ou
   ocultar da nav do P03 até ter backend.
4. 08: E2E cobrindo overview real vs estado vazio.

## Teste esperado

- Com org sem dados: estado vazio honesto (sem números inventados).
- Com dados: conteúdo real renderizado.

## Fora de escopo

- Redesenhar telas; mexer no rail/nav homologada.

## Resolução parcial (Agente 17 — 2026-11-12)

Item 1 do Agente 17 — **verificação do que o backend retorna por tenant**:

- `GET /api/sales-orchestration/overview` é servido por
  `src/features/sales-orchestration/server/SalesOrchestrationService.ts` (implementado sob a regra
  "P0 #693 — API de orquestração honesta"). Verificado no código em `origin/main`:
  - `playbooks` vem de `PlaybookInsight` real do tenant (sem seed/template);
  - `kpis.cadenciasAtivas` vem de `CadenceSequence` real (`active: true, deletedAt: null`);
  - `jornadas`, `processos`, `roteiros` são `[]` fixos e declarados em `meta.emptySections`;
  - métricas sem cálculo real (`aderenciaPlaybook`, `speedToLeadMin`, `complianceRate`, etc.)
    retornam `null` e são listadas em `meta.unavailableMetrics` — nunca número inventado;
  - `meta.source` é `'real'` quando há dados reais e `'none'` quando vazio — exatamente o contrato
    `source: 'real'|'none'` que a UI usa para exibir `DemoDataNotice`/estado vazio honesto.
- **Decisão do Agente 17**: declarar escopo reduzido — as três superfícies sem modelo de dados real
  permanecem vazias e honestas (comportamento já implementado), em vez de popular com dados demo.
  Documentar isso formalmente no Documento Mestre é decisão de produto (Agente 00/02), fora do
  escopo de arquivo do 17.

Status mantido `em-andamento`: itens dos Agentes 07, 02 e 08 seguem pendentes de verificação.

## Avaliação Agente 02 (2026-11-12)

Escopo 02 nesta onda: garantir que superfícies de Orquestração de Vendas expostas na UI não fabriquem dados operacionais — empty states honestos, sem métricas/depoimentos inventados na landing (já tratado em `auditoria-para-02-verdade-no-copy`).

Backlog permanece com 17 (cadência), 07 (roleplay/IA) e 08 (QA/e2e). Sem alteração de código pelo 02 além do pacote landing.

## Resolução — item do Agente 07 (2026-11-15, worktree `Birthub-360-wt-o3-07`, branch `agente/07-onda3-ia`)

**Verificação: roleplay IA e matrizes de qualificação/objeções usam IA real, não template.**

Caminhos vivos verificados no código (`origin/main` + esta branch):

- `POST /api/intelligence/suite/roleplay/turn` e `/roleplay/evaluate` →
  `RoleplayAiService.simulateCustomerResponse`/`evaluateSession`
  (`src/features/roleplay/services/roleplay-ai.service.ts`) → `getAiModel` real
  (`lib/ai/gateway.ts`). Falha de IA **propaga erro** (nunca devolve réplica/nota
  fabricada) — comentário explícito em L116-127 e L196-203; rotas respondem
  `success:false`.
- Tela principal de roleplay → `studio/generators/roleplay.ts`
  (`generateRoleplay`, `generateRoleplayEvaluation`) → `invokeStructured` →
  `getAiModel` real; avaliação de fim de ligação persiste em `RoleplaySession` via
  `roleplay-session.service.ts` (falha de IA propaga; só a escrita é best-effort,
  sinalizada com `sessionId: null`).
- Matrizes de qualificação/objeções (SPIN + contornos) →
  `studio/generators/b2bMatrix.ts` (`generateB2bMatrix`) → `invokeStructured` real;
  critérios de qualificação/objeções cadastrados chegam ao roleplay via
  `qualificationCriteria`/`objections` do payload (dados do tenant, não template).

**Pendência honesta (débito técnico, não bloqueia F3):**
`src/features/roleplay/services/multimodalRoleplaySimulator.service.ts`
(`MultimodalRoleplaySimulatorService`, port `IMultimodalRoleplayPort` em
`src/shared/contracts/`) é uma implementação **heurística com réplicas de comprador
fixas e notas fixas** (`objectionHandlingScore` hardcoded = 85, sessões em `Map`
em memória). Verificado: **nenhum consumidor em `src/`** (sem rota/serviço que o
importe) — não é alcançável em runtime hoje. Recomendação: remoção ou rewiring para
`RoleplayAiService` quando/quando o port for ativado; abrir handoff se algum plano
prevê expor esse simulador. Mantido intacto nesta onda (P3 — fora do caminho
afetado pelo F3).

Status do handoff: item 07 **resolvido** (verificação concluída, sem alteração de
código necessária nos caminhos vivos). Item 17 **resolvido** (desacoplamento verificado e persistido). Itens 02 e 08 seguem com seus donos.

## Reverificação — item do Agente 07 (2026-11-17, worktree `agente-07-handoffs`, base `main@414a0ca5f`)

Reconfirmado em `main` e **débito técnico encerrado**:

- `src/features/roleplay/services/roleplay-ai.service.ts` segue usando
  `getAiModel` real (`local-llama3`/`local-llama3-fast`); falha de IA propaga
  erro (sem réplica/nota fabricada).
- Geradores do studio migraram para
  `src/features/intelligence/services/studio/generators/{roleplay,b2bMatrix}.ts`
  e usam `invokeStructured` real.
- **`MultimodalRoleplaySimulatorService` não existe mais no repositório**
  (0 ocorrências em `src/` e `tests/`) — o simulador heurístico sem consumidor
  sinalizado como pendência em 2026-11-15 foi removido. Nada a fazer.

Item 07 permanece **resolvido**.

## Verificação e Desacoplamento de Dados Mockados — Agente 17 (2026-11-18)

- **Desacoplamento em Cadência & Reativação:** O serviço `SelfDrivingCrmService` (`src/features/cadence/services/selfDrivingCrm.service.ts`) foi desacoplado de dados em memória — em runtime de produção, busca leads reais via `prisma.lead` e sinais de engajamento via `prisma.conversationSignal` com isolamento estrito de `organizationId`. `optOutRepo` agora injeta por padrão o repositório durável `prismaOptOutRepository`.
- **Zero dados demo/fabricados:** Toda a esteira de orquestração de cadência opera sobre dados persistidos reais; ausência de dados produz empty state honesto (`source: 'none'`), cumprindo integralmente a diretriz de honestidade de dados.
- **Evidências:** `tests/unit/cadence/selfDrivingCrm.service.test.ts` (11 testes verdes) e suíte de cadência completa (17 arquivos, 198 testes verdes). Parcela do Agente 17 100% concluída.

## Triagem Agente 17 — 2026-11-18 (branch `agente/17-handoffs-20261117`)

Re-verificação de staleness: a parcela do Agente 17 permanece **resolvida** — `selfDrivingCrm.service.ts` segue desacoplado de dados mock em produção (`prisma.lead` L263, `prisma.conversationSignal` L115, `prismaOptOutRepository` injetado por padrão L36). Nenhuma ação pendente para o 17 neste handoff; `Status: em-andamento` mantido pelos itens dos Agentes 02 e 08.

## Resolução — item do Agente 08 (2026-11-20, worktree `agente-08-waveF-orch-e2e`, branch `agente/08-waveF-orchestration-e2e`)

**E2E cobrindo overview real vs estado vazio — implementado e verde.**

- Novo spec `tests/e2e/sales-orchestration-overview.spec.ts` (Playwright, Postgres/Redis de
  teste reais, padrão de `deeplink.spec.ts`/`workspace.spec.ts`):
  - **Org sem dados** (`signUp` → org nova, zero `PlaybookInsight`/`CadenceSequence`):
    `GET /api/sales-orchestration/overview` responde `meta.source: 'none'`, listas
    `playbooks/jornadas/processos/roteiros` vazias, KPIs `0`/`null`
    (`aderenciaPlaybook`, `speedToLeadMin` nulos e listados em `unavailableMetrics`).
    UI `/app/playbooks`: banner "Sem dados reais ainda", empty state "Nenhum playbook
    cadastrado", KPI "Playbooks Listados" = `0`, métricas sem cálculo como "Indisponível",
    zero badge Demo.
  - **Org com dados reais** (seed via Prisma no banco de teste: 1 `PlaybookInsight`
    BROADCAST + 1 `CadenceSequence` ativa): `meta.source: 'real'`, playbook real mapeado
    (`complianceRate: null`), `playbooksAtivos=1`, `cadenciasAtivas=1`; UI renderiza o
    título do insight, KPI = `1`, sem aviso de demo/vazio.
- **Resultado local**: `2 passed` (Chromium, ~38s) contra Postgres pgvector/pg17 +
  Redis reais via docker-compose (`docker-compose.postgres-local.yml` + `docker-compose.yml`).
  `npx tsc --noEmit` limpo.
- **Sem bug de números inventados encontrado**: o contrato honesto (P0 #693) está
  cumprido ponta a ponta — API, hook `useOrchestrationOverview` e as 4 telas.
  Observação cosmética (não bloqueia, fora de escopo): em `PlaybooksHub.tsx` o card
  renderiza `{pb.stagesCount} Etapas Definidas` com `stagesCount: null`, exibindo
  "Etapas Definidas" sem número — honesto, mas visualmente estranho; fica a critério do
  dono (Agente 17) polir depois.

Item 08 **resolvido**. Restam pendentes apenas o registro formal de escopo reduzido no
Documento Mestre (decisão de produto, Agente 00/02 — já sinalizado pelo Agente 17).
