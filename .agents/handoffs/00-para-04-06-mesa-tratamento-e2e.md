De: 00 — Coordenador
Para: 04 — CRM e BI; 06 — Integrações e Bitrix (mesa-tratamento + import Bitrix)
Onda: gate da main (application gate E2E)
Status: aberto
Prioridade: alto (últimos 2 failures do application gate — 157/159 E2E passando)
Bloqueador-ref: run 43726090855 (PR #361) — `tests/e2e/mesa-tratamento-jornada.spec.ts`
Sprint destino: desbloqueio do release gate

## Problema

O application gate da main está a **2 testes E2E do verde** (unit 901 arquivos ✅, integration 117 ✅, depcruise ✅, E2E 157 passed / 2 failed). Os 2 failures são no mesmo spec, `tests/e2e/mesa-tratamento-jornada.spec.ts`, ambos com cara de drift teste×implementação no fluxo Bitrix→Atlas:

### Failure 1 — linha 66 (assert na linha 104)

`ADMIN: fila importa leads do Bitrix, registra resultado com escrita de volta e usa o painel de gestão`

Falha em `spec.ts:104` — `expect(received).toBeTruthy()`:

```ts
const getCalls = await getBitrixMockRequests('crm.lead.get');
expect(getCalls.map((c) => String((c.params as { id?: string }).id)).sort()).toEqual(['9001', '9002']);
```

O spec espera que a importação da fila chame `crm.lead.get` uma vez por lead não importado. A implementação atual aparentemente não chama mais esse método (provável otimização: `crm.lead.list` já retorna os campos, ou o import mudou de caminho). **Verificar se `bitrixLeadId` continua sendo persistido no Lead importado** — é o dado que toda a jornada downstream depende.

### Failure 2 — linha 271 (assert na linha 326)

`erros: falha do Bitrix no register não grava nada local; reassign com usuário inexistente → 400`

Falha em `spec.ts:326`:

```ts
const leadAfter = await prisma.lead.findUnique({
  where: { id: leadId },
  select: { status: true, lastInteraction: true, bitrixSyncStatus: true },
});
expect(leadAfter?.status).toBe('Lead_Recebido');
expect(leadAfter?.bitrixSyncStatus).toBe('failed');  // ← recebeu outra coisa (null/'synced'?)
```

O teste injeta falha `api-error` em `crm.lead.update` e espera que o register propague erro **e** marque `bitrixSyncStatus='failed'`. Análise do código:

- `register` (`mesaTratamento.routes.ts:314-320`) chama `postCommentToBitrix` (usa `crm.timeline.comment.add` — passa no mock) e depois `exportLeadToBitrixNow` → `syncLeadToBitrix`.
- Em `syncLeadToBitrix` (`outboundSync.ts:145-166`), lead COM `bitrixLeadId` chama `crm.lead.update` → falha → `catch` (linhas 266-292) grava `bitrixSyncStatus='failed'` e relança.
- **Suspeita**: se o lead importado não tem `bitrixLeadId` (mesma raiz do failure 1), o register cai no guard `lead.bitrixLeadId == null → 400 "não está vinculado"` ANTES de qualquer escrita Bitrix → `bitrixSyncStatus` permanece `null` → assert falha. O `failedRegister.status()` 4xx passa "de graça" com o 400 errado, mascarando a causa.

## Arquivo(s) envolvido(s)

- `tests/e2e/mesa-tratamento-jornada.spec.ts` (linhas 104 e 326)
- `src/features/mesa-tratamento/routes/mesaTratamento.routes.ts` (register, linha ~225)
- `src/features/integrations/bitrix/service/outboundSync.ts` (`syncLeadToBitrix`, `postCommentToBitrix`)
- `src/features/integrations/bitrix/service/leads.ts` (`listBitrixLeads`/`importSelectedBitrixLeads` — verificar se ainda chama `crm.lead.get` e grava `bitrixLeadId`)

## Evidência

- Run: https://github.com/MaarkssDN/Birthub-360/actions/runs/43726090855 (job application gate)
- Ambos os testes passam isoladamente? **Desconhecido** — falharam em todas as 3 tentativas (retry 1 e 2) no CI, então é determinístico, não flake.
- Teste SDR da mesma spec (`linha 209`) **passou** — a fila e o register funcionam quando o fluxo completo corre; a divergência é específica das asserções de import/sync-status.

## Alteração necessária

1. Determinar se a importação da fila ainda persiste `bitrixLeadId` no Lead (provável que sim, via `crm.lead.list` — o teste pode estar assertando um método que foi otimizado para fora).
2. Se `crm.lead.get` foi removido intencionalmente: atualizar o spec para assertar o efeito real (`bitrixLeadId` preenchido + `crm.lead.list` chamado), não o método.
3. Se `bitrixLeadId` NÃO está sendo persistido: é bug de produto — a Mesa inteira depende dele (register/comment/reassign exigem vínculo). Corrigir a importação.
4. Se o register deve marcar `bitrixSyncStatus='failed'` também quando `postCommentToBitrix` falha (antes do export): hoje só `syncLeadToBitrix` marca — decidir se comentário falho também deve sujar o status (recomendado: sim, é uma falha de sync real).

## Teste esperado

- `npm run test:e2e -- tests/e2e/mesa-tratamento-jornada.spec.ts` verde no CI (ou evidência de que o spec foi alinhado ao comportamento correto).
- Application gate verde na main.

## Contexto adicional

- O mock Bitrix do E2E (`resetBitrixMock`/`setBitrixMockState`/`getBitrixMockRequests`) registra chamadas por método — verificar o shape de `params` que o mock grava para `crm.lead.get` vs. o que o import realmente envia.
- Dono sugerido da decisão: 04 (produto/CRM) + 06 (Bitrix) em conjunto — o comportamento de import é contrato entre os dois.
