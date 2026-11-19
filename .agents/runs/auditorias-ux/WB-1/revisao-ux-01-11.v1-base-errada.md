# Revisão UX-01…UX-11 — Onda WB-1 (Agente 02A)

**Data:** 2026-11-18 · **Auditor:** Agente 02A — UX Research & Usability (perfil interno do 02)
**Base:** working tree atual (`agente/03-estabilizacao-tokens-v2` @ `a729ed80e` + WIP de outras frentes ignorado)
**Método:** leitura estática do código-fonte atual; sem execução do app. Evidência = `arquivo:linha` real lido nesta sessão.
**Fontes:** `.agents/runs/audit-2026-11-18/ux-completude.md` (achados originais), `.agents/runs/audit-2026-11-18/inventario-mestre.md` (DEBT-*), `.agents/experience/03-protocolo-auditoria-uxui.md` (metodologia/severidades).

> Escopo: auditoria READ-ONLY. Nenhum arquivo de produto foi alterado (diff restrito a `.agents/**`).
> Achados que dependem de módulo em NO-GO (cadência DEBT-0008…0011, IA DEBT-0012/0015) são marcados "bloqueado por <débito>" sem workaround.

## 1. Tabela de re-verificação dos 11 achados

| ID | Status | Severidade re-avaliada | Evidência (arquivo:linha) | Dono da correção | Bloqueio |
|---|---|---|---|---|---|
| UX-01 | **PARCIAL** | P1 (mantida) | Intent morto removido: `src/components/ui/CommandPalette.tsx:307-309` e `:324-325` (comentários "qa-opportunity removida / ctx-crm-create removido — no-op"). Criação manual continua inexistente: `src/components/CrmBoard.tsx` não tem handler de criação (só import Bitrix via `useCrmBoardController`/`BitrixImportModal`); `createLead` sem consumidor (`src/hooks/useDatabase.ts:176-183`); backend pronto: `POST /api/leads` em `src/features/crm/routes/lead.routes.ts:48` + `leadsDB.create` `src/lib/db.ts:127` + `LeadUseCases.createLead` (`src/features/crm/application/LeadUseCases.ts:66`) | Agente 04 (CRM) — UI do board em `src/components/CrmBoard.tsx` é compartilhado; requer coordenação 04 (domínio/form) + 02 (palette/fluxo) | DEBT-0024 (jornada CRM) |
| UX-02 | **CONFIRMADO** | P2 (mantida) | `src/features/sales-orchestration/components/PlaybooksHub.tsx:219-224` — `<Button variant="default" size="sm" className="w-full">Abrir Roteiros & Checklists</Button>` e `<Button variant="outline" size="sm"><ArrowUpRight/></Button>` **sem onClick**. Destino real existe: `/app/roteiros` → `RoteirosHub` (`src/components/layout/tabMeta.ts:187`) | Agente 17 (sales-orchestration não tem AGENTS.md local; módulo historicamente auditado pelo 17 — `docs/auditorias/dividas-tecnicas/DIVIDAS-AGENTE-17.md:10,20`). Alternativa aceitável: 02 se o 00 preferir tratar como micro-fix de UX | DEBT-0060 |
| UX-03 | **CONFIRMADO** | P2 (mantida) | `src/features/gamification/components/GamificationView.tsx:47-48` — `catch (err) { console.warn(...) }` sem estado de erro; `:210-214` — `rankings.length === 0` renderiza "Nenhuma atividade comercial registrada neste período" também quando a API falhou (rankingData permanece no default `:28-31`). Não há EmptyState de erro nem botão retry específico (só "Atualizar" genérico `:122-132`) | Agente 02 (gamification não tem AGENTS.md local; histórico de UX do módulo com o 02 — handoff `00-para-02-gamification-forecast-rbac`, RESOLVIDO) | DEBT-0033 |
| UX-04 | **REFUTADO** (defeito sanado por disclosure) | — (residual P3/higiene) | Score continua heurístico local por design (`WarRoomArenaView.tsx:116-128` keyword matching), mas a copy agora é honesta em todos os pontos: "Heurística local de treino" `:116-118`, badge "modo treino local" `:265`, subtítulo "Avaliação heurística local por SPIN, ROI e empatia — modo treino, sem persistência de XP" `:273-274`, toast "avaliada pela heurística de treino" `:229`, "Feedback de Treino (heurístico)" `:532`, "XP… não é persistido no perfil" `:240`, "nada foi gravado no perfil" `:649`. Critério do achado original ("se sugere IA, é defeito") não se aplica mais | N/A — sem correção de honestidade pendente. Avaliação por IA real dependeria de DEBT-0012/0015 → **bloqueado**, não propor workaround | DEBT-0012, DEBT-0015 (se IA real for desejada no futuro) |
| UX-05 | **PARCIAL** | P3 (mantida) | (a) Auth legada morta CONFIRMADA: `WelcomeScreen.tsx:1`, `LoginScreen.tsx:1`, `NewLoginScreen.tsx`, `LandingLoginSplitScreen.tsx`, `OrbitalSystem.tsx` existem em `src/features/auth/components/` mas nenhum import externo — só auto-referência (`LoginScreen.tsx:1→NewLoginScreen`, `WelcomeScreen.tsx:1→NewLoginScreen`); entrada real é `Landing360` (`src/App.tsx:51-52,118-131`). (b) SPA outbound morta CONFIRMADA: `src/features/prospecting/outbound/**` excluído do tsconfig (`tsconfig.json:43`), sem nenhum import fora da própria pasta; backend `/api/outbound` gated 503 (`src/bootstrap/routes.ts:212`, `unavailableLegacyModule('outbound')`). **Exceção:** `outbound/server/cnpj.ts` é reutilizado por `src/features/prospecting/services/duckdbCnpj.service.ts:15` — remoção deve preservar `server/` ou migrar o import. (c) PromptStudio **REFUTADO**: `PromptStudio.tsx` não existe mais; resta só comentário histórico em `src/components/layout/tabMeta.ts:71` | (a) Agente 01 ou 02 — remoção de código morto cross-domínio, decisão do 00. (b) Agente 05 (prospecting) | DEBT-0061 (não reativar outbound sem migração p/ organizationId+RLS), DEBT-0025 |
| UX-06 | **REFUTADO** (risco fail-open sanado) | residual P3 (higiene) | `src/features/cadence/services/selfDrivingCrm.service.ts:36` — construtor agora default `prismaOptOutRepository` (era InMemory na auditoria); `InMemoryOptOutRepository` só aparece em `clear()` para reset de testes (`:489`) e nos `__tests__`. **Residual:** `selfDrivingCrmService` (`:493`) não tem nenhum consumidor — zero imports fora de `features/cadence` e do barrel `selfDrivingCrm.service.ts` (só o contrato `src/shared/contracts/selfDrivingCrm.contract.ts`) | Agente 17 (cadence — `src/features/cadence/AGENTS.md`) para decidir remover ou conectar | DEBT-0008…0011 (cadência NO-GO) |
| UX-07 | **CONFIRMADO** | P2 (re-subida de P3) | `src/features/dashboard/components/SinglePageDashboard.tsx:82` — `const pipelineValue = overview?.pipelineValue ?? 0`; `:174-181` — `pipelineValue > 0 ? format(BRL) : 'R$ 0'`. Backend retorna `null` quando pipeline vazio: `src/features/analytics/application/AnalyticsUseCases.ts:173` (`pipeline.count > 0 ? pipeline.total : null`) e `src/features/analytics/analytics.service.ts:185`. Contrato documenta "—": `src/lib/db.ts:202-203`. `null` e `0` real são indistinguíveis na UI | Agente 02 (`src/features/dashboard/AGENTS.md` — dono explícito) | DEBT-0033 |
| UX-08 | **PARCIAL** (honestidade sanada; placeholders permanecem) | P3 (rebaixada) | 3/4 abas continuam não persistidas — comentário explícito `PillarSettingsPlaceholder.tsx:68-70` ("Somente a aba 'Ferramentas & Regras' tem contrato de backend — as demais abas… continuam placeholders visuais"). **Mas** o risco "admin acha que configurou" foi mitigado: badge "Pré-visualização" vs "Persistente" `:341-343`, banner "Pré-visualização — nada é salvo… não são gravados" `:386-403`, botão Salvar desabilitado fora da aba ferramentas com tooltip explicativo `:263-274`, e nota de que até "Ferramentas" é preferência sem enforcement `:405-425` | Agente 02 (`src/features/settings/AGENTS.md`) | — (persistência das outras abas = feature futura, não débito de honestidade) |
| UX-09 | **CONFIRMADO** | P2 (subida de P3) | `src/features/settings/components/Settings.tsx:205` — CardDescription "Dados da conta autenticada — somente leitura"; `:200-235` renderiza só nome/email/role/avatar, sem nenhum form de edição ou troca de senha self-service. Backend tem capacidade: better-auth `updateUser`/`changePassword` (`src/lib/auth.ts:311+`, uso em `src/features/auth/components/ChangePasswordGate.tsx:36,49`; `authClient` tipado em `src/lib/auth-client.ts:9`) — falta só UI | Agente 02 (settings) para a UI; troca de senha pode reaproveitar `authClient.changePassword` já existente | — |
| UX-10 | **CONFIRMADO** | P2 (mantida) | `src/components/CrmBoard.tsx:62-75` — `DEAL_COLUMNS` hardcoded com `'Piloto VTECH'`, `'Piloto Birthub 360 Profile'` (+Concluído/Cancelado), `'Piloto Logística'` (+Concluído/Cancelado); `STAGE_DISPLAY_LABELS` `:81-89` só traduz o rótulo, as chaves continuam nomes de pilotos de cliente. Schema já tem modelo dinâmico por org — `CrmPipeline`/`CrmPipelineStage` (`prisma/schema.prisma:1540-1578`, `@@unique([organizationId,name])`, `leadStatus LeadStatus?`) — mas o board agrupa por `lead.status` (enum `LeadStatus`, `schema.prisma:48-69`) e ignora `pipelineStageId` (`schema.prisma:677-678`) | Agente 04 (CRM) — decisão de produto necessária: migrar board p/ `CrmPipelineStage` ou parametrizar colunas por tenant | DEBT-0032; relacionado DEBT-0024 (mesma tela) |
| UX-11 | **CONFIRMADO** | P3 (mantida) | `src/features/crm/components/LeadDetailDrawer.tsx:184-186` — `catch { toast.error('Erro ao carregar detalhes do lead'); onClose(); }`: mensagem genérica não distingue 404 (lead inexistente/outro tenant) de falha de rede, e fecha o drawer silenciosamente | Agente 04 (`src/features/crm/AGENTS.md`) | DEBT-0065 |

**Placar:** CONFIRMADO = 6 (UX-02, UX-03, UX-07, UX-09, UX-10, UX-11) · PARCIAL = 3 (UX-01, UX-05, UX-08) · REFUTADO = 2 (UX-04, UX-06).

## 2. Achados novos durante a verificação

Nenhum achado P0/P1 novo. Observações menores (P3, registradas sem handoff dedicado):

1. **UX-N1 (P3):** `WarRoomArenaView.tsx:236` — `currentRoundIndex >= 2` encerra o duelo após 3 rounds, mas `SAMPLE_OBJECTIONS` tem 4 itens (`:28-53`); o 4º cenário nunca é usado no fluxo padrão de 3 rounds (só se `handleNextRound` for chamado além — impossível). Cosmético.
2. **UX-N2 (P3):** `PlaybooksHub.tsx:103,110` — KPIs "Tempo Médio de Rampa" e "Pessoas Impactadas" exibem string literal "Indisponível" (honesto, mas inconsistente com `formatMetric` usado nos demais). Já coberto pelo padrão `NO_API_SUBTITLE`; registrar apenas se o 17 tocar o arquivo.
3. **UX-N3 (P3):** Comentário obsoleto em `tabMeta.ts:71` menciona `PromptStudio.tsx` que não existe — risco de confundir auditorias futuras. Sugestão: atualizar o comentário na próxima passada do 02 em `tabMeta.ts` (sem urgência).

## 3. Plano de correção priorizado (P0→P3)

Ordem por prioridade do protocolo (jornada comercial > administrativa > interna) e por desbloqueio de NO-GO.

### P1

| # | Item | Correção mínima proposta | Teste de aceite | Dono | Bloqueio |
|---|---|---|---|---|---|
| 1 | UX-01 — criação manual de lead/oportunidade | (a) Consumir intent `open-create` no CrmBoard (ou rota dedicada `/app/crm/novo`) abrindo `LeadForm`/`DealForm` mínimo (empresa/contato existentes via autocomplete + status inicial + valor); (b) alternativa mínima aceitável já parcialmente aplicada: manter ação removida da palette e documentar que leads nascem de prospecção/promote/Bitrix — **decisão de produto pendente com o 00**. Backend `POST /api/leads` já existe e valida (`lead.routes.ts:48`, `leadSchema`) | E2E: palette/atalho → form → POST 201 → card aparece no Kanban; `npx tsc --noEmit` | 04 (form/domínio) + 02 (palette/fluxo) + 03 se novo componente UI | DEBT-0024; decisão de produto (criar vs. assumir prospecção-only) |

### P2

| # | Item | Correção mínima proposta | Teste de aceite | Dono | Bloqueio |
|---|---|---|---|---|---|
| 2 | UX-10 — colunas do funil Negócio hardcoded | Curto prazo: derivar `DEAL_COLUMNS` de `CrmPipelineStage` ativos do tenant (endpoint já existe? verificar `/api/crm/pipelines` — se não, handoff 04/01); fallback: esconder funil Negócio quando tenant não tiver pipeline configurado, em vez de mostrar estágios de pilotos. Manter `LeadStatus` como chave interna, mas rótulo/ordem via stage do pipeline | Tenant sem piloto: colunas exibem estágios do próprio pipeline ou empty state honesto; `npx tsc --noEmit` + teste de unidade do mapeamento | 04 | Depende de endpoint de pipelines por tenant (verificar com 04/01); DEBT-0032 |
| 3 | UX-02 — botão "Abrir Roteiros & Checklists" morto | `onClick={() => navigate('/app/roteiros')}` (rota existe — `tabMeta.ts:187`, `RoteirosHub`); idem botão arrow (`ArrowUpRight`) — decidir destino (detalhe do playbook se existir rota, senão remover o botão outline). Alternativa: `disabled` + title "Em breve" como já feito em "Novo Playbook" (`:55-62`) | Clique navega para `/app/roteiros`; teste e2e ou inspeção manual; `npx tsc --noEmit` | 17 (ou 02 — micro-fix) | DEBT-0060 |
| 4 | UX-07 — KPI pipeline `null` → "R$ 0" | Distinguir `null` de `0`: quando `overview?.pipelineValue == null` renderizar "—" (alinhado a `db.ts:202-203`); `0` real continua "R$ 0". Ajustar linha 82 para preservar null (`overview?.pipelineValue` sem `?? 0`) e o ternário em `:174` | Dashboard sem pipeline: KPI mostra "—"; com deals de R$ 0: "R$ 0"; `npx tsc --noEmit` | 02 | DEBT-0033 |
| 5 | UX-03 — erro de API como empty state | Adicionar estado `error` em `GamificationView`: `catch` seta flag; renderizar EmptyState de erro com mensagem PT-BR específica + botão "Tentar novamente" (mesmo padrão de `CrmBoard.tsx:592-599` e `SinglePageDashboard.tsx:100-131`) | Simular 500 no `/api/gamification/*`: tela mostra erro com retry, não "Nenhuma atividade"; `npx tsc --noEmit` | 02 | DEBT-0033 |
| 6 | UX-09 — perfil somente leitura | Fase 1 (mínima): form de edição de nome (`authClient.updateUser`) + troca de senha (`authClient.changePassword`) na aba Perfil; avatar: avaliar se better-auth `updateUser({image})` é aceito — se não, omitir e registrar limitação. Reusar padrões de `ChangePasswordGate.tsx` | Editar nome → persiste após reload; trocar senha → fluxo better-auth conclui; erros exibidos em PT-BR; `npx tsc --noEmit` | 02 (UI) — backend já existe | — |

### P3

| # | Item | Correção mínima proposta | Teste de aceite | Dono | Bloqueio |
|---|---|---|---|---|---|
| 7 | UX-11 — deep link `?lead=` inválido silencioso | No catch de `LeadDetailDrawer.tsx:184-186`: distinguir 404 ("Lead não encontrado ou sem acesso") de erro de rede ("Falha de conexão — tentar novamente" com retry) e **não** fechar o drawer no caso de erro de rede (manter estado de erro dentro do drawer) | `?lead=id-inexistente` → mensagem "não encontrado"; API offline → erro de rede com retry, drawer permanece; `npx tsc --noEmit` | 04 | DEBT-0065 |
| 8 | UX-05 — código morto | (a) `src/features/prospecting/outbound/**` (SPA): remover pasta **exceto** `server/` consumido por `duckdbCnpj.service.ts` (ou migrar o import p/ local canônico antes) — dono 05; backend `/api/outbound` já está gated 503 (DEBT-0061). (b) Auth components legadas (`WelcomeScreen`, `LoginScreen`, `NewLoginScreen`, `LandingLoginSplitScreen`, `OrbitalSystem` + CSS): remover após confirmar zero imports (verificado nesta auditoria) — dono a confirmar (01/02). (c) `PromptStudio.tsx`: já removido; só atualizar comentário `tabMeta.ts:71` | `npx tsc --noEmit` + `npm run build` verdes após remoção; grep sem referências | 05 (outbound) / 00 decide (auth) | DEBT-0061, DEBT-0025 |
| 9 | UX-06 — `SelfDrivingCrmService` órfão | Decisão do 17: remover serviço+contrato ou conectar a rotas reais **somente após** cadência sair do NO-GO. Hoje é código morto inócuo (opt-out default já é Prisma) | `grep selfDrivingCrm` sem consumidores, ou rota real com opt-out persistido | 17 | DEBT-0008…0011 (cadência NO-GO) — **não executar antes do desbloqueio** |
| 10 | UX-08 — 3/4 abas de settings placeholder | Não é correção de honestidade (já mitigada). Opções: (a) remover as abas não persistidas até haver backend; (b) manter como preview claramente sinalizado (estado atual). Decisão de produto com o 00 | Se (a): tabs inexistentes; se (b): estado atual documentado | 02 | — |
| 11 | UX-N1/N3 — cosméticos | 4º SAMPLE_OBJECTIONS inalcançável (usar 4 rounds ou remover item); atualizar comentário obsoleto `tabMeta.ts:71` | Inspeção | 02 | — |

## 4. Handoffs emitidos

Em `.agents/handoffs/onda-WB1/`:

| Handoff | Destinatário | Item |
|---|---|---|
| `02a-para-04-criacao-manual-lead-oportunidade.md` | 04 | UX-01 (P1) |
| `02a-para-04-funil-negocio-stages-hardcoded.md` | 04 | UX-10 (P2) |
| `02a-para-04-deadlink-lead-invalido.md` | 04 | UX-11 (P3) |
| `02a-para-17-playbooks-botao-roteiros-morto.md` | 17 | UX-02 (P2) |
| `02a-para-17-selfdrivingcrm-orfao.md` | 17 | UX-06 residual (P3, bloqueado NO-GO) |
| `02a-para-05-outbound-spa-codigo-morto.md` | 05 | UX-05b (P3) |
| `02a-para-00-codigo-morto-auth-promptstudio-triagem.md` | 00 | UX-05a/c — triagem de remoção cross-domínio |
| `00-para-24-revisao-auditoria-ux.md` | 24 | Revisão independente desta auditoria |

**Sem handoff (escopo Agente 02):** UX-03, UX-07, UX-08, UX-09, UX-N1/N3 — correções propostas ficam no plano §3 para missões futuras do 02.

## 5. Notas de verificação

- Nenhum arquivo fora de `.agents/**` foi modificado.
- O working tree continha WIP de outras frentes (deleções de handoffs, docker-compose) — ignorado conforme briefing.
- Branch de trabalho: `agente/03-estabilizacao-tokens-v2` (não a branch ideal `agente/02a-auditoria-ux-01-11` prevista na missão — execução ocorreu no worktree disponível; coordenador decide se requer cherry-pick dos artefatos `.agents/**`).
- Módulos backend NO-GO respeitados: nenhuma proposta de workaround para cadência (DEBT-0008…0011) ou IA (DEBT-0012/0015).
