De: Agente 00 — Coordenador
Para: Agente 17 (Cadência Multicanal e Ciclo de Receita)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-035)
Status: resolvido
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

## Resolução (Agente 17 — 2026-11-12)

Nota de implementação: o arquivo citado no handoff (`src/features/cadence/services/cadenceExecution.service.ts`) não existe — a implementação real do serviço de execução é `src/features/cadence/application/CadenceExecutionService.ts`. O ponto de "associação de leads à régua comercial" (início de `CadenceRun`) é `POST /api/cadence/runs` em `src/features/cadence/cadence.routes.ts`.

### O que foi feito

1. **Novo módulo** `src/features/cadence/application/cadenceEligibility.ts` — `checkCadenceStartEligibility(deps, organizationId, leadId, channels)`: resolve o sujeito do lead uma única vez (leadId + e-mail + telefone via `LeadSubjectResolver`) e consulta o `OptOutRecord` unificado (`isOptedOut`) para **cada canal distinto da sequência**. `scope: 'global'` bloqueia qualquer canal; escopo de canal só bloqueia se o canal estiver na régua. Erros de resolução/consulta propagam (sem fallback que trate falha como elegível).
2. **`cadence.routes.ts` (`POST /runs`)**: o filtro prévio agora roda em lote para TODOS os canais distintos da sequência, em duas camadas complementares:
   - `checkOptOutStatus` por canal (quando `lead.contactId` existe) — cobre flags em `customFields` e contato anonimizado (LGPD Art. 18), antes só o primeiro canal era avaliado;
   - `checkCadenceStartEligibility` — cobre o `OptOutRecord` por leadId/e-mail/telefone **inclusive para leads sem `contactId`**, caso que a checagem anterior não alcançava.
   Bloqueio → `409` antes de qualquer `CadenceRun` ser criada (nada entra na fila do BullMQ).
3. **Testes**: `src/features/cadence/__tests__/cadenceEligibility.test.ts` — 9 casos (sucesso, opt-out global, opt-out de canal presente/fora da sequência, lead sem contato, casamento por e-mail, isolamento de tenant, dedup de canais, propagação de erro). 170/170 testes de `src/features/cadence` verdes.

### Gates executados

- `npx tsc --noEmit` — limpo.
- `npx biome lint src/features/cadence` — sem erros novos (1 warning pré-existente em `cadenceExecutionPort.test.ts`, não tocado).
- `npx vitest run -c vitest.unit.config.ts src/features/cadence` — 12 arquivos, 170 testes, todos passando.
- Testes de integração com Postgres real (`tests/integration/cadence-start.routes.test.ts`) não executados neste ambiente (sem banco); a alteração na rota é aditiva e os caminhos existentes (201/404/409 por unique constraint) não mudam.

### Pendência fora do meu escopo

`src/features/market-intelligence/server/actionExecutor.service.ts` (`START_SDR_CADENCE`) cria `CadenceRun` **sem nenhuma checagem de opt-out** — arquivo fora de `src/features/cadence/**`. Handoff aberto: `.agents/handoffs/onda-saneamento-20261110/17-para-05-market-intelligence-start-cadence-sem-optout.md`.

**Condição de encerramento formal pendente:** parecer `APROVADO` do Agente 24 (validação de hashes + não-regressão), conforme exigido pelo próprio handoff.
