De: Agente 00 — Coordenador
Para: Agente 17 (Cadência Multicanal e Ciclo de Receita)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-035)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 3

## Problema

**Ausência de verificação em lote de opt-out no momento do início da cadência**

- **Dívida técnica:** BT360-DT-0080
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Falta de filtro prévio na etapa de associação de leads à régua comercial.

**Impacto:** Sobrecarga desnecessária na fila do BullMQ e relatórios de cadência distorcidos com leads inelegíveis.

## Arquivo(s) envolvido(s)

`src/features/cadence/services/cadenceExecution.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-035`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-035` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução

**Agente 17 — 2026-11-11** (branch `agente/17-optout-cadencia`, pendente de revisão do Agente 24; concluído pelo Agente 00 após interrupção do executor)

O arquivo citado (`services/cadenceExecution.service.ts`) não existia — o fluxo real de início de cadência é `POST /api/cadence/runs` em `cadence.routes.ts` (o worker consome runs já criados). Implementado:

- `domain/cadenceEligibility.ts` (commit `e6c5b8bcc`): regra pura `evaluateLeadCadenceEligibility` cobrindo as mesmas fontes de `checkOptOutStatus` — contato anonimizado/excluído (LGPD Art. 18), flags `optOut*` em `customFields` de lead e contato (escopo por canal), `OptOutRecord` casando por leadId/e-mail/telefone com escopo `global`/canal.
- `cadence.routes.ts` (`POST /runs`): consulta `prismaOptOutRepository.list(organizationId)` UMA vez (filtro em lote, não N+1) e avalia o lead ANTES de criar o `CadenceRun`; inelegível → 409 com motivo. Cobre o gap real: lead **sem `contactId`** antes passava sem nenhuma checagem (a verificação antiga só rodava quando `lead.contactId` existia e só por contato).
- `__tests__/cadenceEligibility.test.ts`: 8 testes (sucesso, anonimização, flags genéricas/por canal, OptOutRecord por leadId/e-mail/telefone com escopo, lead sem contactId, contrato de tenant).

Mantida a checagem `checkOptOutStatus` existente como segunda camada (ela também cobre leads irmãos do mesmo contato).

**Fora de escopo descoberto:** `START_SDR_CADENCE` em `src/features/market-intelligence/server/actionExecutor.service.ts` cria `CadenceRun` SEM qualquer checagem de opt-out — domínio do Agente 07. Handoff `17-para-07-optout-ausente-no-start-sdr-cadence.md` aberto.

Gates: `npx tsc --noEmit` ✓, vitest `cadenceEligibility` + `optOut` 26/26 ✓.
