# Handoff — CadenceExecutionPort entregue sem consumidor no Enxame

```
De: 44 — Lola (Motor de Cadências Comerciais, Squad 40)
Para: 71 — Clara (Runtime do Enxame e Governança de Agentes, Squad 70)
Onda: 4 (POS3-44-CONTRACTS)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
```

## Problema

O contrato `CadenceExecutionPort` (`src/features/cadence/application/CadenceExecutionPort.ts`) e sua
implementação `CadenceExecutionService` (`src/features/cadence/application/CadenceExecutionService.ts`)
foram entregues na Onda 15 em resposta ao handoff
`.agents/handoffs/onda-15/13-para-17-disparo-cadencia-enxame.md` (lado do Agente 17 resolvido).

Inventário POS3-44-CONTRACTS confirmou: **nenhum código de produção instancia `CadenceExecutionService`
nem resolve `CadenceExecutionPort`** — grep em `src/`, `src/shared/di/setup.ts` e nos workers do
Enxame (`swarmScheduler.service.ts`, `swarmScheduler.worker.ts`, `aiPendingAction.service.ts`)
retorna zero call-sites fora de `src/features/cadence/**` e dos próprios testes
(`src/features/cadence/__tests__/cadenceExecutionPort.test.ts`,
`tests/integration/optout-list-completeness.test.ts` — este último só menciona em comentário).

O Enxame despacha ações por caminhos próprios (`send_whatsapp_reply`, `send_email`,
`swarm_recommendation` via `aiPendingAction`/`ecosystemPlaybooks`), sem passar pelas travas de
opt-out/janela comercial/rate-limit que a porta de cadência já implementa e testa.

## Arquivo(s) envolvido(s)

- `src/features/cadence/application/CadenceExecutionPort.ts` (porta + tipos)
- `src/features/cadence/application/CadenceExecutionService.ts` (implementação, 420 linhas)
- Consumidor esperado: `src/features/intelligence/services/swarmScheduler.service.ts` e/ou
  `src/features/intelligence/services/aiPendingAction.service.ts` (Squad 70)

## Evidência

```
grep -rn "CadenceExecution" src --include="*.ts" | grep -v "features/cadence"
# → zero resultados fora da própria feature
```

## Alteração necessária (lado do consumidor — Squad 70)

1. Decidir se o Enxame passa a despachar toques comerciais via `CadenceExecutionPort`
   (recomendado: é o ponto único com opt-out + janela comercial + rate limit já testados), ou
   documentar formalmente que o caminho atual (`aiPendingAction`) é o definitivo.
2. Se adotar a porta: registrar/instanciar `CadenceExecutionService` com as deps reais
   (`optOutRepo`, `subjectResolver`, `dispatcher`, `rateLimit`, `taskPort`) — ver
   `buildDeps()` em `src/features/cadence/jobs/cadenceRun.worker.ts` como referência de wiring —
   e ligar `onDeliveryStatus` para receber `delivered/bounced/replied/failed`.
3. Se não adotar: abrir handoff de volta para 44 pedindo remoção da porta (dead code) ou
   explicitar o contrato substituto.

## Teste esperado

- Recomendação do Swarm acionando `enqueueAction` com sucesso (janela comercial + opt-out ok).
- Rejeição de disparo fora da janela comercial e com opt-out ativo (já coberto em
  `cadenceExecutionPort.test.ts` — falta só o call-site real).

## Contexto adicional

Classificação: **intencional-dormente** — contrato entregue e testado, aguardando o consumidor.
Status documentado também no cabeçalho de `CadenceExecutionPort.ts`. Não é bug do lado da cadência.
Relacionado: `SelfDrivingCrmService` (`src/features/cadence/services/selfDrivingCrm.service.ts`) é
outro contrato dormente da mesma família (ver `.agents/handoffs/onda-WB1/02a-para-17-selfdrivingcrm-orfao.md`,
decisão "manter" até desbloqueio do NO-GO de cadência DEBT-0008…0011).
