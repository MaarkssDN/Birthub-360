De: 00 — Coordenador
Para: 01 — Plataforma, Segurança e Dados
Onda: v4-fase2
Status: aberto
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
