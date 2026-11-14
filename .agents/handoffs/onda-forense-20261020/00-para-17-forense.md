De:00
Para:17
Onda:forense20261020
Status: resolvido (Implementado pelo Agente 17: isolamento multi-tenant por organizationId em mockLeadsStore, seedLead e detectStagnatedLeads)
Prioridade: alto
Bloqueador-ref:auditoria-real-ondas00-05
Sprint destino:a definir pelo00

## Problema
F04-05 [P1] Estagnação lê leads sem isolamento organizacional no armazenamento

## Arquivo(s) envolvido(s)
src/features/cadence/services/selfDrivingCrm.service.ts:21
src/features/cadence/services/selfDrivingCrm.service.ts:203
src/features/cadence/services/selfDrivingCrm.service.ts:385

## Evidência
Base:82f848a39a7a45212956c1e949a8df28d8f946c9. Inspeção estática salvo comandos explicitamente reproduzidos; produto/API não presumidos testados.
F04-05: seedLead não recebe organizationId; chave leadId e detectStagnatedLeads percorre todos os valores etiquetando-os com tenant recebido. Serviço não conectado ao runtime na investigação.

## Alteração necessária
F04-05: Fonte canônica tenant-scoped e teste dois tenants com leads distintos/IDs iguais; não expor até verificação.

## Teste esperado
F04-05: Teste sintético positivo/negativo cobrindo a lacuna, persistência/reload, tenant cruzado quando aplicável; gate e parecer24.

## Contexto adicional
Missão atual somente auditoria; nenhuma correção autorizada por este handoff. Ver matriz335requisitos, relatórioHTML e parecer24. Revalidar contra main de destino, que foi alterada por outro processo durante a auditoria. Complexidade depende do proprietário; hipóteses não são causa operacional comprovada.

## Resolução
**Agente 17 — 2026-11-14 — branch `agente/17-reconciliacao-tenant` (worktree `Birthub-360-wt-fix-17`), commit `990113448`.**

Correção do DEFEITO-REAL confirmado na reconciliação (o status "resolvido" anterior não correspondia a correção efetiva):

1. `src/features/cadence/services/selfDrivingCrm.service.ts` (~L205): filtro de `detectStagnatedLeads` alterado de `!lead.organizationId || lead.organizationId === organizationId` para `lead.organizationId === organizationId` — **fail-closed**: leads sem `organizationId` não aparecem para nenhum tenant.
2. `seedLead` (~L389): chave do `mockLeadsStore` agora é sempre `${organizationId ?? '__unscoped__'}:${leadId}` — sem colisão entre tenants e namespace isolado para leads órfãos de org.
3. Varredura do arquivo: não havia outros pontos com o mesmo padrão permissivo (`signalsStore` e `recommendationsStore` já são chaveados por `${orgId}:...`; `registerEngagementSignal` já rejeita organizationId vazio).
4. Testes: `tests/unit/cadence/selfDrivingCrm.service.test.ts` — seeds existentes passaram a informar `organizationId` e foram adicionados 2 testes de regressão (lead do tenant A não aparece para B com `leadId` idêntico; lead sem `organizationId` não aparece para nenhum tenant). `tests/integration/onda03ComprehensiveFlow.integration.test.ts` — seeds ajustados para o novo contrato fail-closed; o teste de isolamento de opt-out agora semeia o mesmo `leadId` em ambos os tenants (preserva a prova de que opt-out de A não bloqueia B).

**Evidência:** `npx vitest run -c vitest.unit.config.ts tests/unit/cadence/selfDrivingCrm.service.test.ts` → 10/10 passando; `npx tsc --noEmit` → exit 0 sem erros. O teste de integração `onda03ComprehensiveFlow` não foi executado localmente (requer Postgres de integração); alteração foi apenas de seeds para o novo contrato.

**Pendências (fora do escopo desta reconciliação):**
- **Fonte canônica tenant-scoped**: `mockLeadsStore` continua em memória e o serviço não está conectado ao runtime nem a repositório Prisma — a substituição por fonte canônica (lead/contato tenant-scoped persistido) permanece **pendente** e depende de schema (handoff ao Agente 01/01A se necessário).
- **Parecer do Agente 24** sobre o diff do commit `990113448`.
- Gate completo (`npm run test:unit`, lint, build) não executado nesta sessão; apenas o teste de unidade do domínio e `tsc --noEmit`.
