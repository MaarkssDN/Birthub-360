# Plano de Transição para a Fase 02 — Engenharia e Construção do Código
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documentos Base de Referência:**
- [BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html)
- [BIRTHUB360_MODELO_DADOS.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_MODELO_DADOS.md)
- [BIRTHUB360_CONTRATOS_INTEGRACAO.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_CONTRATOS_INTEGRACAO.md)
- [BIRTHUB360_CONTRATOS_AGENTES.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_CONTRATOS_AGENTES.md)
- [BIRTHUB360_CRITERIOS_ACEITE.md](file:///c:/Users/Marks/Documents/GitHub/Birthub-360/BIRTHUB360_CRITERIOS_ACEITE.md)

---

## 1. Contexto e Alinhamento com a Governança Global (AGENTS.md)
A solicitação do usuário foi a execução conjunta das frentes **1 (Estruturação de Banco & RLS)** e **2 (Infraestrutura de Microsserviços e Eventos)**.
De acordo com o regulamento de governança deste repositório (`AGENTS.md`):
1. **Propriedade Exclusiva de Banco de Dados:** `prisma/schema.prisma` e `prisma/migrations/**` pertencem estritamente ao **Agente 01 (Plataforma, Segurança e Dados)**.
2. **Propriedade Exclusiva de Filas e Runtime:** `src/lib/queue/**` pertence ao **Agente 16 (Runtime, Workers e Escala)** ou **06 (Integrações e Bitrix)**.
3. **Isolamento de Branches e Worktrees:** Implementações de código não devem ser executadas diretamente na branch `main`, exigindo branch de integração (`integracao/onda-v4-fase2`) e branches específicas por especialista (`agente/01-database-rls-v4` e `agente/16-queue-event-mesh-v4`).
4. **Respeito a Modificações Locais Não Comitadas:** O working tree atual possui alterações não comitadas em `src/features/landing/**`, as quais devem ser isoladas ou preservadas para evitar regressões.

---

## 2. Frente 1: Estruturação de Banco & RLS (Domínio do Agente 01)
### Escopo Mapeado:
- Adicionar ao schema oficial as entidades essenciais especificadas no Modelo de Dados V4 que ainda não existem no banco:
  - `pipelines` e `pipeline_stages`
  - `deals` e `deal_stage_history`
  - `proposals` e `proposal_versions` (com campo `diff_summary`)
  - `market_dossiers` e `icp_profiles`
  - `cadences`, `cadence_steps` e `cadence_enrollments`
  - `voice_calls` e `chat_messages`
  - `agent_execution_logs`
- Garantir `organization_id UUID NOT NULL` em todas as novas entidades.
- Criar migração SQL declarativa com aplicação compulsória de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` e políticas `USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`.

---

## 3. Frente 2: Infraestrutura de Microsserviços, Filas & Eventos (Domínio do Agente 16 / 06)
### Escopo Mapeado:
- Expandir o barramento de eventos em `src/lib/queue/domainEventMesh.service.ts` para cobrir o catálogo canônico V4:
  - `deal.created`, `deal.stage_changed`, `deal.won`, `deal.lost`
  - `proposal.version_created`, `proposal.approved`
  - `lead.approved_for_crm`, `icp.score_calculated`
  - `cadence.step_executed`, `cadence.paused_on_reply`
- Validar configuração de Dead-Letter Queue (DLQ) em `src/lib/queue/deadLetter.ts` com retentativas de backoff exponencial e notificação observável.
- Assegurar idempotência via `X-Idempotency-Key` e integração do `bitrixGuardian.agent` para prevenção de loops de eco.

---

## 4. Próxima Etapa de Execução
Para avançar na construção prática do código com segurança:
- Emitir os artefatos de handoff para os Agentes 01 e 16.
- Alinhar com o usuário se criamos uma branch isolada (`git checkout -b feature/fase2-banco-e-eventos-v4`) ou se salvamos as alterações da landing page em stash/commit antes de gerar as migrações Prisma.
