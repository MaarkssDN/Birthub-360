De: Agente 17 — Cadência Multicanal e Ciclo de Receita
Para: Agente 07 (IA e Automações / market-intelligence)
Onda: onda-saneamento-20261110
Status: aberto
Prioridade: alto
Bloqueador-ref: BT360-DT-0080 (TAREFA-SANEAMENTO-035)
Sprint destino: próxima onda de saneamento

## Problema

`src/features/market-intelligence/server/actionExecutor.service.ts` (~linhas 77–123), ação `START_SDR_CADENCE`, cria um `CadenceRun` via `startCadenceRun` + `prismaCadenceRunRepository.save` **sem nenhuma verificação de opt-out/supressão** — nem por contato, nem por lead, nem por `OptOutRecord`. Um titular que pediu descadastro pode entrar em cadência ativa por este caminho.

## Arquivo(s) envolvido(s)

`src/features/market-intelligence/server/actionExecutor.service.ts`

## Evidência

- O único opt-out check do fluxo de início de cadência (`checkOptOutStatus`) existe em `src/features/cadence/cadence.routes.ts` (`POST /runs`) e agora também `evaluateLeadCadenceEligibility` (mesmo arquivo, commit em `agente/17-optout-cadencia`).
- `actionExecutor.service.ts` não importa nem chama nenhum serviço de opt-out.

## Alteração necessária

Antes de `prismaCadenceRunRepository.save(run)`, aplicar a mesma elegibilidade do Agente 17:
`evaluateLeadCadenceEligibility` (`src/features/cadence/domain/cadenceEligibility.ts`) com os `OptOutRecord` da org via `prismaOptOutRepository.list(organizationId)` (import de `src/shared/infra/PrismaOptOutRepository.js` — porta compartilhada, não é edição em cadence). Se inelegível, NÃO criar o run e devolver falha/skip explícito com motivo (não silenciar). Reaproveitar `checkOptOutStatus` se o lead tiver `contactId`, para paridade com `POST /runs`.

## Teste esperado

Teste unitário do actionExecutor (ou do ponto de integração): lead opt-out → run não criado + outcome de falha explícito; lead elegível → run criado.

## Contexto adicional

- Domínio `src/features/market-intelligence/**` pertence ao Agente 07 — o Agente 17 não pode editar.
- `evaluateLeadCadenceEligibility` é função pura exportada; `OptOutRecord`/`prismaOptOutRepository` são compartilhados (`src/shared/**`, dono Agente 01 — consumo por porta é permitido).
