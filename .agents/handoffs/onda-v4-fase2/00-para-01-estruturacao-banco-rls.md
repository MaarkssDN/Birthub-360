De: 00 — Coordenador
Para: 01 — Plataforma, Segurança e Dados
Onda: v4-fase2
Status: bloqueado (dependência de alinhamento arquitetural sob Scope Freeze do Release)
Prioridade: bloqueador
Bloqueador-ref: B-10 (Isolamento Real de Dados / RLS)
Sprint destino: Sprint 01 - Fase 02

## Problema
A especificação definitiva V4 ([BIRTHUB360_MODELO_DADOS.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_MODELO_DADOS.md)) define 21 entidades centrais para o ciclo de receita. Atualmente, `prisma/schema.prisma` possui `Organization`, `Company`, `Contact`, `User` e `AuditLog`, mas não possui as entidades estruturais do core de vendas e previsão:
- `pipelines` e `pipeline_stages`
- `deals` e `deal_stage_history`
- `proposals` e `proposal_versions`
- `market_dossiers` e `icp_profiles`
- `cadences`, `cadence_steps` e `cadence_enrollments`
- `voice_calls` e `chat_messages`
- `agent_execution_logs`

## Arquivo(s) envolvido(s)
- `prisma/schema.prisma`
- `prisma/migrations/**`

## Evidência
Busca no schema confirmou ausência de `model Deal` e `model Proposal`. A aplicação de RLS nas tabelas comerciais requer que o schema Prisma reflita as entidades canônicas com `organization_id UUID NOT NULL`.

## Alteração necessária
1. Atualizar `prisma/schema.prisma` adicionando as models conforme o contrato fechado do [BIRTHUB360_MODELO_DADOS.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_MODELO_DADOS.md).
2. Gerar migração Prisma versionada contendo:
   - Índices compostos por `(organization_id, ...)`
   - Ativação de RLS em todas as tabelas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`)
   - Criação da política `AS RESTRICTIVE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);`
3. Executar `npx prisma validate` e `npx prisma generate`.

## Teste esperado
- Validação do schema sem erros sintáticos.
- Teste unitário de query garantindo que a variável de sessão `app.current_tenant_id` filtra corretamente os registros e barra acesso cruzado.

## Contexto adicional
Alinhamento obrigatório com AGENTS.md (Regra 15 - Propriedade exclusiva do Agente 01).


## Avaliação de Governança (Agente 00 / 01 — 2026-11-10)
- **Status Real:** BLOQUEADO / SOB AVALIAÇÃO DE PRODUTO.
- **Diagnóstico:** O banco de dados já possui modelos maduros e em produção para o core comercial (`CrmPipeline`, `CrmPipelineStage`, `CrmDealItem`, `CopilotoDealHealthSnapshot`, `CadenceSequence`, `CadenceRun`, `VoiceCallLog`, `Lead`, `LeadStageHistory`) com isolamento multi-tenant (`organizationId`). Criar entidades sobrepostas (`model Deal`, `model Proposal`) sem migração de transição desestruturaria o runtime atual e violaria o Scope Freeze (`AGENTS.md` §23) e as Regras 7 e 10.
- **Encaminhamento:** Demanda arquivada como evolução da Fase 02 em branch isolada autorizada pelo Supervisor, sem intervenção direta destrutiva na `main`.

## Avaliação de Estrutura/RLS (Agente 01 — 2026-11-14, branch `agente/01-onda1-handoffs`)

Re-verificação do gap real entre `BIRTHUB360_MODELO_DADOS.md` (21 entidades) e
`prisma/schema.prisma` atual. **Conclusão: a premissa do handoff está
desatualizada** — o schema canônico já cobre funcionalmente quase todas as
entidades; criar `Deal`/`Proposal`/`Pipeline`/`Stage` literais duplicaria o que
já existe e segue a avaliação de governança acima (BLOQUEADO mantido).

### Mapeamento spec V4 → model canônico

| # | Entidade spec V4 | Equivalente canônico | Status |
|---|---|---|---|
| 1 | `organizations` | `Organization` (L941) | ✅ existe |
| 2 | `users` | `User` (L892, `organizationId` direto) | ✅ existe |
| 3 | `module_access` | `ModuleAccessGrant` (L3404) | ✅ existe |
| 4 | `audit_logs` | `AuditLog` (L875, `actorId`/`tenantId`/`entity`) | ✅ existe |
| 5 | `companies` | `Company` (L195) | ✅ existe |
| 6 | `contacts` | `Contact` (L468) | ✅ existe |
| 7 | `pipelines` | `CrmPipeline` (L1535) | ✅ existe |
| 8 | `stages` | `CrmPipelineStage` (L1557) | ✅ existe |
| 9 | `deals` | **`Lead` (L576)** — oportunidade = Lead + `amount`/`probability`/`expectedCloseAt`/`status` (Fechado_Ganho/Perdido) + `LeadStageHistory`; `CrmDealItem` (L1607) é item de linha, não a oportunidade | ⚠️ semântica diferente — ver gap G1 |
| 10 | `deal_stage_history` | `LeadStageHistory` (L1143, append-only com stageName desnormalizado) | ✅ equivalente funcional |
| 11 | `proposals` | `CrmCommercialDocument` type=`Proposta` (L1633, `publicToken`, view tracking CYC-005) | ✅ equivalente funcional |
| 12 | `proposal_versions` | `CrmCommercialDocumentVersion` (L3822, `@@unique(documentId, versionNumber)`, snapshot JSON) | ✅ existe |
| 13 | `market_dossiers` | `AccountIntelligenceSnapshot` (L1264, por conta, versionado) + `AccountSignal`/`DecisionMaker`/`IntelligenceEvidence`; `MarketIntelligenceDataset` (L317) é catálogo GLOBAL, não dossier do tenant | ⚠️ parcial — ver gap G2 |
| 14 | `org_chart_nodes` | `DecisionMaker` (L1333 — buyingRole/seniority/status verificado por Company+Contact) | ⚠️ parcial — ver gap G3 |
| 15 | `cadences` | `CadenceSequence` (L3583) | ✅ existe |
| 16 | `cadence_steps` | `CadenceSequence.touches` (**Json embutido**, não tabela) | ⚠️ parcial — ver gap G4 |
| 17 | `cadence_enrollments` | `MultichannelCadenceEnrollment` (L3793) + `CadenceRun` (L3614, estado vivo) + `CadenceTouchAttempt` | ✅ equivalente funcional |
| 18 | `voice_calls` | `VoiceCallLog` (L3131), `CallLog` (L5350), `ThreeCXCallEvent` (L3920), `CallAttempt` (L5585) | ✅ existe |
| 19 | `chat_messages` | `WhatsAppMessage` (L2249) | ✅ existe |
| 20 | `forecast_snapshots` | `ForecastSnapshot` (L1176, append-only semanal) | ✅ existe |
| 21 | `agent_execution_logs` | `AgentExecution` (L4426) + `AILog` (L1860) | ✅ existe |

### Status de RLS

- `rls-coverage.test.ts` → **6/6 verde** (2026-11-14): 100% dos models
  classificados (TENANT_SCOPED/GLOBAL_CATALOG/SYSTEM_INTERNAL), ENABLE+FORCE+
  CREATE POLICY em todas as tabelas, sem `WITH CHECK (true)` em tenant-scoped.
- Estilo da policy difere da spec: o schema usa `CREATE POLICY ... AS PERMISSIVE
  USING ("organizationId" = current_setting('app.current_tenant_id', true))`
  (padrão `tenant_isolation` consolidado), não o `AS RESTRICTIVE ... ::uuid` do
  documento V4. Funcionalmente equivalente para isolamento; uniformizar o estilo
  seria refactor cosmético de alto risco (todas as migrations) — **não
  recomendado** sem demanda explícita.
- Exceções de nomenclatura já existentes: `DocumentEmbedding.tenantId` e
  `AuditLog.tenantId` guardam o mesmo valor de `organizationId` (confirmado —
  ver handoff `onda-s1/00-para-01-documentembedding-sem-policy-rls.md`).

### Gaps reais residuais (sem inventar escopo — decisão de produto necessária)

- **G1 — `deals` sem entidade própria:** se a spec V4 exige campos de negócio
  que `Lead` não carrega (ex.: moeda por deal, produtos estruturados além de
  `CrmDealItem`, hierarquia deal≠lead), é decisão de produto criar `Deal` ou
  estender `Lead`. Criar `model Deal` paralelo hoje = duplicação (rejeitado).
- **G2 — dossier no nível da conta, não da organização:** `market_dossiers` da
  spec pode ser atendido por `AccountIntelligenceSnapshot`; se o V4 espera um
  dossiê consolidado por tenant, falta model — a definir com Produto.
- **G3 — `org_chart_nodes`:** `DecisionMaker` cobre buying committee por conta;
  organograma hierárquico de decisores (reportes entre si) não existe.
- **G4 — `cadence_steps` como JSON:** `touches` não é consultável por SQL nem
  indexável; normalizar em tabela é refactor futuro, não bloqueador.

### Recomendação

Manter **BLOQUEADO** até decisão de produto sobre G1–G4. Quando/ se o V4 for
promovido, o caminho correto é **estender os models canônicos** (novas colunas/
models aditivos via migration do Agente 01), nunca criar os nomes literais da
spec em paralelo. Nenhuma migration foi criada nesta avaliação.
