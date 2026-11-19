# Revisão UX-01…UX-11 — Onda WB-1 (Agente 02A) — **v2**

**Data:** 2026-11-18 (v1, base errada) · **v2:** 2026-11-18 (reauditoria sobre `main`)
**Auditor:** Agente 02A — UX Research & Usability (perfil interno do 02)
**Base auditada (v2):** `main @ 8b40cdb902e9cbe938ed7066579a20760bf199e9` ("fix(merge): resolve conflict in Leva 3 handoffs"), lida no worktree limpo `C:\Github\birthub-360-audit-main` — **somente leitura de código**.
**Versão anterior (v1):** preservada em `revisao-ux-01-11.v1-base-errada.md` — auditou `agente/03-estabilizacao-tokens-v2 @ a729ed80e` por engano; **descartada como base** após parecer REPROVADO do Agente 24 (A-01…A-05).
**Método:** leitura estática do código-fonte em `main`; sem execução do app. Toda evidência `arquivo:linha` abaixo foi re-verificada nesta sessão contra o worktree de `main`.
**Fontes:** `.agents/runs/audit-2026-11-18/ux-completude.md` (achados originais UX-01…UX-11), `.agents/runs/audit-2026-11-18/inventario-mestre.md` (DEBT-*), `.agents/experience/03-protocolo-auditoria-uxui.md` (metodologia/severidades/schema de achado).

> Escopo: auditoria READ-ONLY. Nenhum arquivo de produto foi alterado; escrita restrita a `.agents/**` no repo principal.
> Achados que dependem de módulo em NO-GO (cadência DEBT-0008…0011, IA DEBT-0012/0015) são marcados "bloqueado por <débito>" sem workaround.
> **Nota de formato (A-05):** este relatório é um **delta de re-verificação** dos IDs canônicos `UX-NN`/`DEBT-*` da fonte `ux-completude.md`. Os campos completos do schema §3 do protocolo (Dimensão D1–D12, Rota, Componente, Descrição, Impacto, Status canônico, Relacionado) são preenchidos por achado nas seções detalhadas abaixo; a tabela §1 resume os campos de triagem.

## 1. Tabela de re-verificação dos 11 achados (base: main @ 8b40cdb90)

| ID | Status | Severidade re-avaliada | Evidência (arquivo:linha em main) | Dono da correção | Bloqueio |
|---|---|---|---|---|---|
| UX-01 | **CONFIRMADO** | P1 (mantida) | `src/components/ui/CommandPalette.tsx:307-312` (`qa-opportunity` → `navigateAndClose('crm', {type:'open-create'})`) e `:330-335` (`ctx-crm-create`, idem) **ainda existem em main** — a remoção vista na v1 existia só na branch errada. Nenhum consumidor do intent `open-create` no CRM: grep por `open-create`/`PaletteIntent` em `src/components/CrmBoard.tsx`, `src/components/CrmBoardToolbar.tsx`, `src/hooks/useCrmBoardController.ts`, `src/hooks/useCrmBoardUrlParams.ts` → **zero ocorrências**. Criação manual continua inexistente; backend pronto: `POST /api/leads` (`src/features/crm/routes/lead.routes.ts:48`, montado em `src/bootstrap/routes.ts:105`), `LeadUseCases.createLead` (`src/features/crm/application/LeadUseCases.ts:66`), `leadsDB.create` (`src/lib/db.ts:127`), `useLeads().createLead` (`src/hooks/useDatabase.ts:176-183`) — sem consumidor de UI | **04** (domínio/form no board) + **03** (dono de `src/components/ui/**` — CommandPalette; `src/components/ui/AGENTS.md`) + decisão do **00** sobre `CrmBoard.tsx` (sem AGENTS.md local em `src/components/` raiz — propriedade ambígua, ver A-04) | DEBT-0024 (jornada CRM); decisão de produto pendente |
| UX-02 | **CONFIRMADO** | P2 (mantida) | `src/features/sales-orchestration/components/PlaybooksHub.tsx:219-224` — `<Button variant="default" size="sm" className="w-full">Abrir Roteiros & Checklists</Button>` (:220) e `<Button variant="outline" size="sm"><ArrowUpRight/></Button>` (:222-224) **sem onClick** (grep `onClick` no arquivo só acha `:135`, filtro de categoria). Destino real existe: `/app/roteiros` → `RoteirosHub` (`src/components/layout/tabMeta.ts` — dono 02 via `src/components/layout/AGENTS.md`) | **Dono a definir** — `src/features/sales-orchestration/**` **não tem AGENTS.md local**; atribuição anterior ao 17 era inferência por histórico (`docs/auditorias/dividas-tecnicas/DIVIDAS-AGENTE-17.md`). Escalar ao **00** para decisão formal; alternativa: micro-fix de UX pelo 02 | DEBT-0060 |
| UX-03 | **CONFIRMADO** | P2 (mantida) | `src/features/gamification/components/GamificationView.tsx:47-48` — `catch (err) { console.warn('[GamificationView] Erro ao carregar dados:', err); }` sem estado de erro; `:210-214` — `rankings.length === 0` renderiza "Nenhuma atividade comercial registrada neste período…" também quando a API falhou (rankingData permanece no default `:28-31`). Sem EmptyState de erro; único botão é "Atualizar" genérico `:131` | **Dono a definir** — `src/features/gamification/**` **não tem AGENTS.md local**; prompt do 02 não inclui o módulo no escopo principal. Escalar ao **00**; se o 00 atribuir UX de erro genérica, o 02 executa | DEBT-0033 |
| UX-04 | **REFUTADO** (defeito sanado por disclosure) | — (residual P3/higiene) | Score continua heurístico local por design (`WarRoomArenaView.tsx:116-118` "Heurística local de treino (sem IA)", keyword matching `:120-193`), mas a copy é honesta em todos os pontos: `:116-118`, badge "modo treino local" `:265`, subtítulo "Avaliação heurística local por SPIN, ROI e empatia — modo treino, sem persistência de XP" `:273-274`, toast "avaliada pela heurística de treino" `:229`, "Feedback de Treino (heurístico)" `:532`, "nada foi gravado no perfil" `:648-649`. Critério do achado original ("se sugere IA, é defeito") não se aplica | N/A — sem correção de honestidade pendente. Avaliação por IA real dependeria de DEBT-0012/0015 → **bloqueado**, não propor workaround | DEBT-0012, DEBT-0015 (se IA real for desejada no futuro) |
| UX-05 | **PARCIAL** | P3 (mantida) | (a) Auth legada morta CONFIRMADA em produção: `src/features/auth/components/{WelcomeScreen,LoginScreen,NewLoginScreen,LandingLoginSplitScreen,OrbitalSystem}*` existem, mas **nenhum import de produção** — as únicas referências fora da pasta são comentários (`src/App.tsx:82-91`, `src/components/ui/sign-in-page.tsx:11`, `src/config/brand.ts:30`); entrada real é `Landing360` (`src/App.tsx:51-52,118-131`). **Correção A-03:** há consumidor em testes — `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx:19` importa `NewLoginScreen`. (b) SPA outbound morta CONFIRMADA: `src/features/prospecting/outbound/**` excluída do tsconfig (`tsconfig.json:43`), backend `/api/outbound` gated 503 (`src/bootstrap/routes.ts:212`, `unavailableLegacyModule('outbound')`). **Correção A-03:** testes consomem módulos da pasta — `tests/unit/features/prospecting/outbound/tenantScope.test.ts`, `tests/unit/features/prospecting/outbound/labels.a11y.test.tsx`, `tests/unit/features/prospecting/services/leadSearch.service.test.ts`. **Exceção:** `outbound/server/cnpj.ts` é reutilizado por `src/features/prospecting/services/duckdbCnpj.service.ts:15` — remoção deve preservar `server/` ou migrar o import. (c) PromptStudio **REFUTADO**: componente não existe; resta comentário histórico `src/components/layout/tabMeta.ts:71` | (a) **00 decide o dono** — `src/features/auth/**` não tem AGENTS.md local; candidatos 01/02. Incluir Agente 08 (testes). (b) **05** (`src/features/prospecting/AGENTS.md`) + Agente 08 para os testes | DEBT-0061 (não reativar outbound sem migração p/ organizationId+RLS), DEBT-0025 |
| UX-06 | **REFUTADO** (risco fail-open sanado) | residual P3 (higiene) | `src/features/cadence/services/selfDrivingCrm.service.ts:36` — construtor default `prismaOptOutRepository`; `InMemoryOptOutRepository` só aparece no reset de `clear()` (`:485-490`, `:489`) e nos `__tests__`. Singleton `selfDrivingCrmService` em `:493`; contrato `src/shared/contracts/selfDrivingCrm.contract.ts`. **Correção A-02:** "zero imports" era falso — **sem consumidor de produção**, mas consumido por testes: `tests/unit/cadence/selfDrivingCrm.service.test.ts:3,21` e `tests/integration/onda03ComprehensiveFlow.integration.test.ts:3,25` (importam o serviço e chamam `clear()`/`seedLead`/etc.) | **17** (`src/features/cadence/AGENTS.md` — dono explícito) para decidir remover ou conectar; remoção exige atualizar/remover os 2 arquivos de teste → coordenar **Agente 08** | DEBT-0008…0011 (cadência NO-GO) |
| UX-07 | **CONFIRMADO** | P2 (re-subida de P3) | `src/features/dashboard/components/SinglePageDashboard.tsx:82` — `const pipelineValue = overview?.pipelineValue ?? 0`; `:174-180` — `pipelineValue > 0 ? format(BRL) : 'R$ 0'`. Backend retorna `null` sem pipeline: `src/features/analytics/application/AnalyticsUseCases.ts:173` (`pipeline.count > 0 ? pipeline.total : null`) e `src/features/analytics/analytics.service.ts:185`. Contrato documenta "—": `src/lib/db.ts:202-203`. `null` e `0` real são indistinguíveis na UI | **02** (`src/features/dashboard/AGENTS.md` — dono explícito) | DEBT-0033 |
| UX-08 | **PARCIAL** (honestidade sanada; placeholders permanecem) | P3 (rebaixada) | 3/4 abas continuam não persistidas — comentário explícito `src/features/settings/components/PillarSettingsPlaceholder.tsx:68-70` ("Somente a aba 'Ferramentas & Regras' tem contrato de backend — as demais abas… continuam placeholders visuais"). **Mas** o risco "admin acha que configurou" foi mitigado: badge "Pré-visualização" vs "Persistente" `:341-343` | **02** (`src/features/settings/AGENTS.md` — dono explícito) | — (persistência das outras abas = feature futura, não débito de honestidade) |
| UX-09 | **CONFIRMADO** | P2 (subida de P3) | `src/features/settings/components/Settings.tsx:205` — CardDescription "Dados da conta autenticada — somente leitura"; `:200-235` renderiza só nome/email/role/avatar, sem form de edição ou troca de senha self-service. Backend tem capacidade: better-auth `updateUser`/`changePassword` (uso em `src/features/auth/components/ChangePasswordGate.tsx`; `authClient` tipado em `src/lib/auth-client.ts`) — falta só UI | **02** (settings) para a UI; backend já existe | — |
| UX-10 | **CONFIRMADO** | P2 (mantida) | `src/components/CrmBoard.tsx:62-75` — `DEAL_COLUMNS` hardcoded com `'Piloto VTECH'` (:66), `'Piloto Birthub 360 Profile'` (+Concluído/Cancelado :67-69), `'Piloto Logística'` (+Concluído/Cancelado :70-72); `STAGE_DISPLAY_LABELS` `:81-89` só traduz o rótulo; colunas aplicadas em `:105`; agrupamento por `lead.status` em `:515-518`. Schema tem modelo dinâmico por org — `CrmPipeline` (`prisma/schema.prisma:1536-1556`, `@@unique([organizationId,name])`, `entity`, `active`) e `CrmPipelineStage` (`:1558-1578`, `leadStatus LeadStatus?`, `isWon/isLost`); `Lead.pipelineStageId` existe (`:677-678`, índice `:729,742`). **Correção A-04:** endpoint **existe** — `GET /pipelines` em `src/features/crm360/routes/crm360.routes.ts:22-25`, montado em `/api/crm` (`src/bootstrap/routes.ts:111`) → `/api/crm/pipelines`, tenant-scoped via `organizationId` (`src/features/crm360/presentation/Crm360Controller.ts:86-89`, `PrismaCrm360Repository.getPipelines` `:329-338`). **Nuance:** `getPipelines` chama `ensureDefaultPipelines(organizationId)` — o endpoint auto-semeia pipelines default por tenant; a correção pode não depender de schema novo | **Ambíguo — decisão do 00**: `CrmBoard.tsx` não tem AGENTS.md local em `src/components/` (só `layout/` e `ui/` têm); histórico registra dúvida (`backlog-5/03-para-04-analytics-contraste-temas.md` — "se confirmado que pertence ao 04"). Handoff primário ao **04** (domínio CRM), com coordenação 02/03 conforme decisão | DEBT-0032; relacionado DEBT-0024 (mesma tela) |
| UX-11 | **CONFIRMADO** | P3 (mantida) | `src/features/crm/components/LeadDetailDrawer.tsx:184-186` — `catch { toast.error('Erro ao carregar detalhes do lead'); onClose(); }`: mensagem genérica não distingue 404 (lead inexistente/outro tenant) de falha de rede, e fecha o drawer silenciosamente | **04** (`src/features/crm/AGENTS.md` — dono explícito) | DEBT-0065 |

**Placar v2 (base main @ 8b40cdb90):** CONFIRMADO = 7 (UX-01, UX-02, UX-03, UX-07, UX-09, UX-10, UX-11) · PARCIAL = 2 (UX-05, UX-08) · REFUTADO = 2 (UX-04, UX-06).

**Delta vs v1:** UX-01 subiu PARCIAL→CONFIRMADO (intents `open-create`/`qa-opportunity`/`ctx-crm-create` ainda presentes em `main` — a remoção era só da branch errada); UX-02/UX-03 mantêm CONFIRMADO mas com dono rebaixado para "a definir" (sem AGENTS.md local); UX-05/UX-06 evidências corrigidas para incluir consumidores em `tests/**`; UX-10 ganhou evidência do endpoint existente.

## 2. Achados novos durante a verificação (formato completo do protocolo §3)

```
ID:            UX-N1 (sequencial desta re-auditoria; sem colisão com UX-NN canônicos)
Dimensão:      D6 — Estados e feedback / D10 — Jornada (cosmético)
Rota:          /app/gamification (War Room Arena)
Componente:    src/features/gamification/components/WarRoomArenaView.tsx:28-53, :236, :525
Descrição:     SAMPLE_OBJECTIONS tem 4 cenários (:28-53), mas o fluxo padrão encerra após 3 rounds
               (`currentRoundIndex >= 2` em :236 → botão "Finalizar Duelo" :525). O 4º item só seria
               alcançado via `SAMPLE_OBJECTIONS[currentRoundIndex % length]` (:72) se houvesse um
               4º round — impossível no fluxo atual.
Impacto:       nenhum funcional; conteúdo de treino ligeiramente maior que o usado. Cosmético.
Status:        aberto
Relacionado:   UX-03/UX-04 (mesmo módulo gamification — tratar junto se o módulo for auditado)
```

```
ID:            UX-N2
Dimensão:      D6 — Estados e feedback (consistência de copy)
Rota:          /app/playbooks (hub de playbooks)
Componente:    src/features/sales-orchestration/components/PlaybooksHub.tsx:103, :110
Descrição:     KPIs "Tempo Médio de Rampa" e "Pessoas Impactadas" exibem string literal "Indisponível"
               (honesto), enquanto os demais KPIs usam `formatMetric`/subtitle `NO_API_SUBTITLE` (:26, :98, :105, :112).
Impacto:       inconsistência visual mínima; já coberto pelo padrão NO_API_SUBTITLE.
Status:        aberto
Relacionado:   UX-02 (mesmo arquivo — registrar junto se o 00 atribuir o módulo)
```

```
ID:            UX-N3
Dimensão:      D3 — Navegação e descoberta (higiene documental)
Rota:          global (metadados de navegação)
Componente:    src/components/layout/tabMeta.ts:71
Descrição:     Comentário obsoleto menciona `PromptStudio.tsx` "componente órfão sem rota" — o
               componente não existe mais (ver UX-05c). Risco de confundir auditorias futuras.
Impacto:       nenhum funcional; apenas ruído documental.
Status:        aberto
Relacionado:   UX-05c, DEBT-0025
```

Nenhum achado P0/P1 novo nesta re-auditoria.

## 3. Plano de correção priorizado (P0→P3) — atualizado para main

Ordem por prioridade do protocolo (jornada comercial > administrativa > interna) e por desbloqueio de NO-GO.

### P1

| # | Item | Correção mínima proposta | Teste de aceite | Dono | Bloqueio |
|---|---|---|---|---|---|
| 1 | UX-01 — criação manual de lead/oportunidade | **Decisão do 00 sobre dono de `CrmBoard.tsx`** (sem AGENTS.md local — propriedade ambígua entre 02/04/03). (a) Se decidido implementar: consumir intent `open-create` no board (ou rota dedicada `/app/crm/novo`) abrindo form mínimo (empresa/contato via autocomplete + status inicial + valor); **re-adicionar "Nova oportunidade" na CommandPalette é arquivo do Agente 03** (`src/components/ui/AGENTS.md`) — hoje as ações `qa-opportunity`/`ctx-crm-create` JÁ EXISTEM em main e navegam para `crm` com intent sem consumidor, ou seja, o gap é só o consumidor, não a ação. (b) Alternativa mínima: assumir leads nascem só de prospecção/promote/Bitrix e remover/desabilitar as ações da palette (03) — **decisão de produto pendente**. Backend `POST /api/leads` já existe e valida (`lead.routes.ts:48`, `leadSchema`) | E2E: ação de criação → form → POST 201 → card aparece no Kanban; ou (b) palette sem ação morta; `npx tsc --noEmit` | 04 (form/domínio) + **03** (CommandPalette) + 00 (dono de CrmBoard.tsx) | DEBT-0024; decisão de produto (criar vs. assumir prospecção-only) |

### P2

| # | Item | Correção mínima proposta | Teste de aceite | Dono | Bloqueio |
|---|---|---|---|---|---|
| 2 | UX-10 — colunas do funil Negócio hardcoded | `GET /api/crm/pipelines` **já existe** (`crm360.routes.ts:22-25`, montado `routes.ts:111`) e é tenant-scoped — **não depende de schema novo**. Curto prazo: derivar `DEAL_COLUMNS` dos `CrmPipelineStage` do tenant via esse endpoint; atenção à nuance `ensureDefaultPipelines` (endpoint auto-semeia defaults — decidir se o board deve exibir o pipeline default semeado ou exigir pipeline configurado); fallback: empty state honesto quando tenant não tiver pipeline configurado, em vez de estágios de pilotos. Manter `LeadStatus` como chave interna na transição; rótulo/ordem via stage | Tenant sem pipeline de pilotos: colunas exibem estágios do próprio tenant ou empty state; `npx tsc --noEmit` + teste de unidade do mapeamento colunas←stages | **00 decide dono de CrmBoard.tsx**; handoff primário 04 (domínio CRM), coordenação 02/03 conforme decisão | DEBT-0032; relacionado DEBT-0024 |
| 3 | UX-02 — botão "Abrir Roteiros & Checklists" morto | `onClick={() => navigate('/app/roteiros')}` (rota existe — `tabMeta.ts`, `RoteirosHub`); idem botão `ArrowUpRight` — decidir destino (detalhe do playbook se existir rota, senão remover ou `disabled`+title "Em breve" como "Novo Playbook" `:55-62`). **Dono a definir pelo 00** (sem AGENTS.md local em sales-orchestration) | Clique navega para `/app/roteiros`; `npx tsc --noEmit` + smoke e2e | 00 decide (candidatos: 17 por histórico, 02 por ser micro-fix de UX) | DEBT-0060 |
| 4 | UX-07 — KPI pipeline `null` → "R$ 0" | Distinguir `null` de `0`: quando `overview?.pipelineValue == null` renderizar "—" (alinhado a `db.ts:202-203`); `0` real continua "R$ 0". Ajustar `:82` para preservar null (remover `?? 0`) e o ternário em `:174-180` | Dashboard sem pipeline: KPI mostra "—"; com deals de R$ 0: "R$ 0"; `npx tsc --noEmit` | 02 | DEBT-0033 |
| 5 | UX-03 — erro de API como empty state | Adicionar estado `error` em `GamificationView`: `catch` (:47-48) seta flag; renderizar EmptyState de erro com mensagem PT-BR específica + botão "Tentar novamente" (mesmo padrão de `CrmBoard.tsx` e `SinglePageDashboard.tsx`). **Dono a definir pelo 00** (sem AGENTS.md local em gamification) | Simular 500 no `/api/gamification/*`: tela mostra erro com retry, não "Nenhuma atividade"; `npx tsc --noEmit` | 00 decide (02 se atribuído como UX genérica) | DEBT-0033 |
| 6 | UX-09 — perfil somente leitura | Fase 1 (mínima): form de edição de nome (`authClient.updateUser`) + troca de senha (`authClient.changePassword`) na aba Perfil; avatar: avaliar se better-auth `updateUser({image})` é aceito — se não, omitir e registrar limitação. Reusar padrões de `ChangePasswordGate.tsx` | Editar nome → persiste após reload; trocar senha → fluxo better-auth conclui; erros em PT-BR; `npx tsc --noEmit` | 02 (UI) — backend já existe | — |

### P3

| # | Item | Correção mínima proposta | Teste de aceite | Dono | Bloqueio |
|---|---|---|---|---|---|
| 7 | UX-11 — deep link `?lead=` inválido silencioso | No catch de `LeadDetailDrawer.tsx:184-186`: distinguir 404 ("Lead não encontrado ou sem acesso") de erro de rede ("Falha de conexão — tentar novamente" com retry) e **não** fechar o drawer no caso de erro de rede | `?lead=id-inexistente` → "não encontrado"; API offline → erro de rede com retry, drawer permanece; `npx tsc --noEmit` | 04 | DEBT-0065 |
| 8 | UX-05 — código morto | (a) `src/features/prospecting/outbound/**` (SPA): remover pasta **exceto** `server/` consumido por `duckdbCnpj.service.ts:15` (ou migrar o import antes) — dono **05**; **mapear e remover/atualizar os 3 arquivos de teste** que importam módulos da pasta (`tenantScope.test.ts`, `labels.a11y.test.tsx`, `leadSearch.service.test.ts`) → coordenar **Agente 08**. Backend `/api/outbound` já gated 503 (DEBT-0061). (b) Auth components legadas: remover após confirmar — **há 1 teste consumidor** `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx:19` → coordenar **Agente 08**; dono da remoção **decidido pelo 00** (auth não tem AGENTS.md local). (c) `PromptStudio.tsx`: já removido; só atualizar comentário `tabMeta.ts:71` (dono 02) | `npx tsc --noEmit` + `npm run build` + `vitest` (testes afetados removidos/ajustados) verdes; grep sem referências | 05 (outbound) / 00 decide (auth) / 08 (testes) | DEBT-0061, DEBT-0025 |
| 9 | UX-06 — `SelfDrivingCrmService` órfão | Decisão do **17**: remover serviço+contrato+barrel **e os 2 arquivos de teste consumidores** (`tests/unit/cadence/selfDrivingCrm.service.test.ts`, `tests/integration/onda03ComprehensiveFlow.integration.test.ts` — este último também testa outras coisas, avaliar escopo da remoção) ou conectar a rotas reais **somente após** cadência sair do NO-GO → coordenar **Agente 08** para os testes | `grep selfDrivingCrm` sem consumidores de produção; `vitest` verde após remoção/ajuste; ou rota real com opt-out persistido | 17 (+ 08 para testes) | DEBT-0008…0011 (cadência NO-GO) — **não executar antes do desbloqueio** |
| 10 | UX-08 — 3/4 abas de settings placeholder | Não é correção de honestidade (já mitigada). Opções: (a) remover as abas não persistidas até haver backend; (b) manter como preview sinalizado (estado atual). Decisão de produto com o 00 | Se (a): tabs inexistentes; se (b): estado atual documentado | 02 | — |
| 11 | UX-N1/N2/N3 — cosméticos | 4º SAMPLE_OBJECTIONS inalcançável (usar 4 rounds ou remover item — gamification, dono a definir); KPIs "Indisponível" literais em PlaybooksHub (sales-orchestration, dono a definir); atualizar comentário obsoleto `tabMeta.ts:71` (02) | Inspeção | 00 decide para N1/N2; 02 para N3 | — |

## 4. Handoffs emitidos/atualizados

Em `.agents/handoffs/onda-WB1/` (atualizados na v2):

| Handoff | Destinatário | Item | Mudança na v2 |
|---|---|---|---|
| `02a-para-04-criacao-manual-lead-oportunidade.md` | 04 (+03, +00) | UX-01 (P1) | Status→CONFIRMADO; palette é arquivo do 03 e as ações JÁ EXISTEM em main — gap é só o consumidor; CrmBoard sem AGENTS.md → decisão do 00 |
| `02a-para-04-funil-negocio-stages-hardcoded.md` | 04 (+00) | UX-10 (P2) | Endpoint `/api/crm/pipelines` confirmado existente — sem dependência de schema; nuance `ensureDefaultPipelines`; ambiguidade de dono de CrmBoard registrada |
| `02a-para-04-deadlink-lead-invalido.md` | 04 | UX-11 (P3) | Inalterado (linhas reconfirmadas em main) |
| `02a-para-17-playbooks-botao-roteiros-morto.md` | 17 (dono a definir) | UX-02 (P2) | Dono marcado "a definir pelo 00" (sem AGENTS.md local) |
| `02a-para-17-selfdrivingcrm-orfao.md` | 17 (+08) | UX-06 residual (P3, bloqueado NO-GO) | Evidência corrigida: "sem consumidor de produção; consumido por 2 arquivos de teste"; inclui decisão sobre testes e coordenação com 08 |
| `02a-para-05-outbound-spa-codigo-morto.md` | 05 (+08) | UX-05b (P3) | Inclui 3 arquivos de teste consumidores e coordenação com 08 |
| `02a-para-00-codigo-morto-auth-promptstudio-triagem.md` | 00 (+08) | UX-05a/c — triagem | Inclui `NewLoginScreen.contactCards.test.tsx:19` como consumidor a remover/atualizar com 08 |
| `00-para-24-revisao-auditoria-ux.md` | 24 | Re-revisão da v2 | Atualizado solicitando re-revisão sobre main |

**Sem handoff (escopo Agente 02):** UX-07, UX-08, UX-09, UX-N3 — correções propostas ficam no plano §3 para missões futuras do 02. UX-03 e UX-N1/N2 dependem de decisão de dono do 00 (módulos sem AGENTS.md local) — registrados no plano, sem handoff prematuro.

**Decisões escaladas ao 00 (novas na v2):**
1. Dono de `src/components/CrmBoard.tsx` (sem AGENTS.md local — afeta UX-01 e UX-10).
2. Dono de `src/features/gamification/**` (afeta UX-03, UX-N1).
3. Dono de `src/features/sales-orchestration/**` (afeta UX-02, UX-N2).
4. Dono da remoção de `src/features/auth/components/**` legados (afeta UX-05a).

## 5. Notas de verificação

- Nenhum arquivo fora de `.agents/**` foi modificado. Código lido somente no worktree `C:\Github\birthub-360-audit-main` (main @ 8b40cdb90).
- Versão anterior preservada em `revisao-ux-01-11.v1-base-errada.md` para rastreabilidade (auditava branch errada).
- Todos os caminhos de evidência acima foram verificados contra `main`; onde a v1 citava linhas de outra branch, os números foram re-obtidos em main (ex.: UX-10 `CrmBoard.tsx:62-75` e UX-11 `LeadDetailDrawer.tsx:184-186` coincidem; `selfDrivingCrm.service.ts` `:36`/`:489`/`:493` coincidem).
- Módulos backend NO-GO respeitados: nenhuma proposta de workaround para cadência (DEBT-0008…0011) ou IA (DEBT-0012/0015).
- Respostas aos achados do parecer 24: **A-01** resolvido (toda evidência re-verificada em main; UX-01→CONFIRMADO); **A-02** resolvido (UX-06 inclui testes + `clear()` InMemory); **A-03** resolvido (UX-05 inclui testes de auth e outbound); **A-04** resolvido (donos corrigidos: CommandPalette→03, CrmBoard ambíguo→00, gamification/sales-orchestration→"dono a definir", endpoint `/api/crm/pipelines` confirmado); **A-05** resolvido (schema de achado completo aplicado a UX-N1…N3 e campos por achado na tabela).

---
*Auditor: Agente 02A · v2 base `main @ 8b40cdb902e9cbe938ed7066579a20760bf199e9` · Data: 2026-11-18 · Reauditoria após parecer REPROVADO do Agente 24.*
*v1 (descartada como base): `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.v1-base-errada.md`.*
*Parecer v1: `.agents/reviews/24-revisao-auditoria-ux-wb1-20261118.md` (A-01…A-05).*
*Re-revisão solicitada: `.agents/handoffs/onda-WB1/00-para-24-revisao-auditoria-ux.md` (atualizado).*
*Execução read-only: zero alterações em código de produto; escrita restrita a `.agents/**`.*
