De: Agente 00 — Coordenador
Para: Agente 07 (IA, Copiloto e Automações)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-005)
Status: em-andamento
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Trace de missões autônomas de IA e consentimento LGPD retornados de forma sintética em rotas de inteligência**

- **Dívida técnica:** BT360-DT-0039
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Implementação de mock para destravar desenvolvimento de telas de auditoria sem substituição pela consulta real.

**Impacto:** Impossibilidade de rastrear decisões autônomas tomadas por LLMs em caso de incidentes com clientes.

## Arquivo(s) envolvido(s)

`src/features/intelligence/routes/intelligence.routes.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-005`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-005` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 07)

- **Correção de escopo:** o trace sintético não estava em `intelligence.routes.ts`, mas em `src/features/intelligence/routes/commercial-agent.routes.ts` (`GET /api/commercial-agent/mission/:id/trace`), que montava `AgentCenterTrace` a partir de Lead/OptOutRecord/Activity do CRM. O consentimento LGPD sintético estava implícito na mesma resposta fabricada.
- **Implementação:** novo `src/features/intelligence/services/commercialMissionTrace.service.ts` (`getCommercialMissionTrace`) consulta `AgentHandoffMessage` + `AgentExecution` persistidos por `organizationId`, `AgentDefinition`, `OrganizationAiConsent` e a cadeia de auditoria de consentimento (`consentAuditChain`), com PII sanitizada via `redactResidualPii`. A rota agora delega ao serviço: `default` resolve a missão mais recente; sem registro persistido retorna 404 — nunca trace fabricado.
- **Tipos:** `triad.types.ts` estendido com `AgentCenterTraceStatus`, `MissionAgentExecutionTrace`, `MissionHandoffTrace`, `MissionConsentTrace`, `CommercialMissionTrace` etc.
- **Testes:** `src/features/intelligence/routes/__tests__/commercial-agent.mission-trace.test.ts` — 4 testes (404 sem missão persistida, 200 com trace real, strip de prefixo `mission-`, propagação de erro). 4/4 verdes.
- **Gates executados:** `npx tsc --noEmit` (0 erros), `npx biome lint` nos 4 arquivos alterados (0 warnings após remoção de variável órfã), `npx vitest run` do novo teste (4/4).
- **Pendente:** parecer do Agente 24 (`.agents/reviews/`) — condição de encerramento do handoff. Status mantido `em-andamento` até lá.

## Resolução (Agente 07 — W4, 2026-11-12)

Verificado: a implementação já existia no commit `f3f04bdaf` ("substituir trace sintético de
missão por consulta real persistida", TAREFA-SANEAMENTO-005/BT360-DT-0039). `GET /mission/:id/trace`
usa `commercialMissionTrace.service.ts` lendo `AgentHandoffMessage` + `AgentExecution` + trilha de
consentimento LGPD reais; missão inexistente → 404. Sem código sintético remanescente nos
arquivos citados. Cobertura: `commercial-agent.mission-trace.test.ts` (4 testes) dentro da suíte
verde acima. Pendente: parecer do Agente 24.
