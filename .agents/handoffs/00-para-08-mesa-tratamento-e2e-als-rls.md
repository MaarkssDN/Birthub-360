De: 00 — Coordenador
Para: 08 — QA e Release (dono do spec); 06 — Integrações e Bitrix (se confirmar bug de produto); 04 — CRM e BI (registro/jornada)
Onda: gate da main (application gate E2E)
Status: aberto
Prioridade: alto (últimos 2 failures do application gate — 157/159 E2E passando)
Bloqueador-ref: run 43726090855 (PR #361, main ~d7457f44) — `tests/e2e/mesa-tratamento-jornada.spec.ts`
Sprint destino: desbloqueio do release gate

## Problema

O application gate da main está a **2 testes E2E do verde** (unit 901 arquivos ✅, integration 117 ✅, E2E 157 passed / 2 failed). Os 2 failures são no mesmo spec, `tests/e2e/mesa-tratamento-jornada.spec.ts` — arquivo **adicionado hoje** no commit `46220eb92` ("test(08): jornada E2E completa da Mesa de Tratamento com portal Bitrix mock"), provavelmente nunca verde no CI.

### Evidência exata (log do job application gate)

**Failure 1** — teste linha 66, assert na linha 104:

```
Error: expect(received).toBeTruthy()
Received: undefined
> 104 | expect(currentBitrixId).toBeTruthy();
```

`currentBitrixId = currentAtlasLead?.bitrixLeadId` → **undefined** ⇒ `prisma.lead.findUnique({ where: { id: currentLeadId } })` retornou **null** — o lead que a fila retornou não é visível para o client Prisma do processo de teste.

**Failure 2** — teste linha 271, assert na linha 326:

```
Expected: "Lead_Recebido"
Received: undefined
> 326 | expect(leadAfter?.status).toBe('Lead_Recebido');
```

`leadAfter?.status` → **undefined** ⇒ `leadAfter` é **null** — novamente `findUnique` por id não encontra o lead. **Não é o `bitrixSyncStatus='failed'` que falhou** — o lead inteiro está invisível para a assertion.

### Hipótese principal (spec, não produto)

Os dois testes leem o banco diretamente via `prisma` do processo Playwright com `requestContext.enterWith({ bypassRls: true })` antes de cada query. O padrão confiável já existente no próprio harness é `tests/e2e/db-assertions.ts::read()` → `requestContext.run({ bypassRls: true }, fn)` — escopo explícito da store ALS. `enterWith` muta o contexto ambiente e pode não alcançar a promise interna do client Prisma estendido (o ALS é capturado quando a async resource é criada; comentários em `tests/e2e/helpers.ts:179-185` documentam exatamente essa armadilha enterWith-vs-run).

Se o bypass não chegar ao interceptor, `tenantId=undefined` + bypass negado → query roda sem `app.current_tenant_id`/`app.bypass_rls` → RLS fail-closed → **zero linhas** — exatamente o sintoma (`findUnique` → null) sem nenhum erro.

Checagens que **refutam** bug de produto:
- `Lead` está em `BYPASS_RLS_ALLOWED_MODELS` (`src/lib/prisma-interceptors.ts:126`) — bypass vale para Lead mesmo em produção.
- A fila (`GET /api/mesa-tratamento/queue`) retornou `queue` com 2 itens e `current` não-nulo — ou seja, **os leads existem e têm `bitrixLeadId`** (o `where` da rota exige `bitrixLeadId: { not: null }`). A importação Bitrix→Atlas funcionou.
- `importSelectedBitrixLeads` (`src/features/integrations/bitrix/service/leads.ts:208+`) continua chamando `crm.lead.get` por lead e gravando `bitrixLeadId: raw.ID` — o assert das linhas 107-110 provavelmente passaria se a linha 104 não tivesse falhado antes.
- Outros specs E2E que usam bypass (`workspace.spec.ts`, `commercial-intelligence-journey.spec.ts`, `db-assertions.ts`) **passaram** — o ambiente/RLS está íntegro; a falha é específica deste spec novo.

### Hipótese secundária (se a principal não reproduzir)

`currentLeadId`/`leadId` podem não ser o `Lead.id` esperado (ex.: resposta `data.current.id` ser outra chave). Verificar o shape real de `toQueueDetail` — hoje `id: lead.id` (Atlas), confirmado em `mesaTratamento.routes.ts:80`.

## Arquivo(s) envolvido(s)

- `tests/e2e/mesa-tratamento-jornada.spec.ts` — linhas 43, 55, 98, 263, 292 (`enterWith`) e as queries `prisma.*` subsequentes (dono: Agente 08)
- Referência do padrão correto: `tests/e2e/db-assertions.ts:54` (`requestContext.run({ bypassRls: true }, fn)`)
- `src/lib/prisma.ts` / `src/lib/prisma-interceptors.ts` / `src/lib/async-context.ts` — só para diagnóstico, **não precisam de mudança**

## Alteração necessária (sugestão ao Agente 08)

1. Trocar `requestContext.enterWith({ bypassRls: true })` + `await prisma...` por `requestContext.run({ bypassRls: true }, () => prisma...)` nas leituras/escritas diretas do spec — ou reusar os helpers de `db-assertions.ts`/`helpers.ts`.
   - Alternativa mínima: `enterWith({ tenantId: organizationId, bypassRls: true })` (padrão de `helpers.ts:73`) — com tenantId explícito a RLS casa mesmo se o bypass falhar.
2. Re-rodar `npm run test:e2e -- tests/e2e/mesa-tratamento-jornada.spec.ts` até verde **antes** de mergear novos specs do tipo.
3. Se após o ajuste de contexto o `bitrixSyncStatus` continuar diferente de `'failed'` no failure-path (aí sim seria bug real de produto — `postCommentToBitrix` falha antes de `syncLeadToBitrix` marcar status), abrir handoff separado para 06.

## Teste esperado

- `tests/e2e/mesa-tratamento-jornada.spec.ts` verde no CI (3 testes).
- Application gate verde na main.

## Contexto adicional

- Spec introduzido em `46220eb92` (hoje) — checar se o PR de origem rodou o E2E de verdade ou se o gate falhou na época e o merge passou por exceção.
- O mock Bitrix (`tests/e2e/bitrix-mock/`) está correto — a fila provou import real (2 leads na fila).
- Dono primário: **Agente 08** (arquivo de teste E2E); 06/04 só se o ajuste de contexto revelar bug real de produto.
