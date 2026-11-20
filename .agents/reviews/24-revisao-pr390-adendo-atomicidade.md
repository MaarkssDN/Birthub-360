# Adendo de Revisão Independente — Agente 24
**Data:** 2026-11-19  
**Onda:** Saneamento de Handoffs (Wave A/B)  
**PR:** #390 (`agente/04-handoffs-20261117` → `main`)  
**Assunto:** Auditoria de Atomicidade e Consistência em `batchUpdateLeads`  
**Documento Principal Vinculado:** `.agents/reviews/24-revisao-pr390-agente04-handoffs.md`  
**Handoff de Origem:** `.agents/handoffs/00-para-24-adendo-pr390-atomicidade-batchupdate.md`  
**Auditor:** Agente 24 (Revisão Independente)  

---

## 1. Veredito do Adendo

### **STATUS: APROVADO**

A questão da atomicidade em `batchUpdateLeads` (`src/features/crm/application/LeadUseCases.ts`) foi auditada em profundidade. O trade-off inicial presente no commit `54b117f53` (duas escritas sequenciais: `updateLeadStatus` seguida de `prisma.lead.update` para `owner`/`tags`) foi **completamente eliminado e superado pelo commit subsequente `ff9b5143b`** ("fix(crm): escrita unica por item em batchUpdateLeads (sem gravacao parcial)").

Atualmente, `repository.updateStatus` aceita o parâmetro opcional `extraFields` (`owner` e `tags`), permitindo que a transição de status, atualização de fechamento (`closedAt`), sincronização de pipeline/stage/probability, gravação de timeline e os campos de formulário (`owner`/`tags`) sejam persistidos em uma **única instrução atômica `prisma.lead.update` por lead**.

Com essa arquitetura unificada, **não há mais janela de gravação parcial** no lote. Se a escrita falhar, o item é devidamente contabilizado em `failedCount` e nenhum dado parcial inconsistente persiste no banco de dados.

---

## 2. Resposta aos Questionamentos do Handoff

### Pergunta 1: O trade-off documentado é aceitável como está, ou é bloqueador?
**Parecer:** O trade-off original — aceitar o risco de persistência parcial de status quando a escrita subsequente de `owner`/`tags` falhasse — apresentava risco moderado de estado fantasma no CRM (o item era exibido como falho no toast/contador do lote, mas o status já havia mudado no banco). Embora fosse compreensível como etapa intermediária para herdar o gate CYC-007, a solução definitiva adotada no commit `ff9b5143b` resolveu a causa raiz através de escrita única via `extraFields`. Portanto, o cenário de bloqueio foi **desarmado por completo**.

### Pergunta 2: `failedCount` hoje conflaciona "rejeitado pelo gate CYC-007" com "erro de infraestrutura" — o caller consegue distinguir? Isso é aceitável?
**Parecer:** É **plenamente aceitável** para a semântica de operações em lote de CRM (Kanban).
- No contexto de `batchUpdateLeads`, o caller de interface (`CrmBoard.tsx`) busca atualizar múltiplos cards simultaneamente de forma resiliente (best-effort com relatório agregado: `updatedCount`, `failedCount`, `total`, `statusChangedLeads`).
- Se um item do lote é rejeitado pelo gate de fechamento de negócio CYC-007 (`AppError(..., 401/403)`) ou por falha temporária de infraestrutura/banco, o comportamento correto é abortar a atualização daquele item específico, registrar log estruturado (`logger.error({ err, leadId, organizationId }, 'batchUpdateLeads: falha ao atualizar um item do lote...')`) e permitir que os demais leads continuem seu processamento.
- A diferenciação fina de motivos de falha por card é uma melhoria cosmética/UX futura de telemetria, não um bloqueador funcional ou de segurança.

### Pergunta 3: Existe alternativa de menor custo que preserve o fluxo de fechamento sem a janela de falha parcial?
**Parecer:** Sim, e foi **exatamente essa alternativa que foi implementada**:
- `PrismaLeadRepository.updateStatus` passou a receber:
  ```typescript
  extraFields?: { owner?: string | null; tags?: string[] }
  ```
- No método `lead.update`, esses campos entram no mesmo payload:
  ```typescript
  data: {
    status: prismaStatus,
    closedAt: isClosingNow ? new Date() : null,
    ...(matchedStage ? { pipelineId, pipelineStageId, probability } : {}),
    ...(extraFields?.owner !== undefined ? { owner: extraFields.owner } : {}),
    ...(extraFields?.tags !== undefined ? { tags: extraFields.tags } : {}),
    timeline: { create: { ... } },
  }
  ```
- Desta forma, a operação é atômica no PostgreSQL. Se falhar, nada é gravado; se tiver sucesso, todos os campos são gravados de forma indivisível.
- Caso o lote envolva apenas `owner`/`tags` sem alteração de status, o método realiza um único `prisma.lead.update` direto com cláusula `where: { id: lead.id, organizationId }` garantindo isolamento estrito de tenant.

### Pergunta 4: Cobertura de teste do cenário de falha parcial existe ou deve ser exigida antes do merge?
**Parecer:** **Existe e foi validada com 100% de sucesso**.
A suíte `src/features/crm/application/__tests__/LeadUseCases.batchUpdate.test.ts` conta com 3 testes unitários focados na atomicidade:
1. `"status + owner viajam juntos em updateLeadStatus/extraFields — prisma.lead.update não é chamado uma segunda vez"` (testa a rota de sucesso em chamada atômica única).
2. `"falha na escrita única conta failedCount sem tentativa de segunda escrita parcial"` (simula erro do banco e valida que nada parcial é executado).
3. `"somente owner/tags (sem mudança de status) continua no update direto de campo único"` (testa o caminho direto quando não há transição de estágio).

Além disso, `src/features/crm/infra/__tests__/PrismaLeadRepository.test.ts` conta com 13 testes unitários cobrindo o isolamento de tenant e a gravação conjunta de `extraFields`.

---

## 3. Evidências de Execução de Testes Automatizados

1. **`LeadUseCases.batchUpdate.test.ts`:**
   - Comando: `npx vitest run -c vitest.unit.config.ts src/features/crm/application/__tests__/LeadUseCases.batchUpdate.test.ts`
   - Resultado: **1 arquivo / 11 testes aprovados (100% PASS)** em 8.80s.
2. **`PrismaLeadRepository.test.ts`:**
   - Comando: `npx vitest run -c vitest.unit.config.ts src/features/crm/infra/__tests__/PrismaLeadRepository.test.ts`
   - Resultado: **1 arquivo / 13 testes aprovados (100% PASS)** em 5.69s.

---

## 4. Conclusão da Revisão Independente

O adendo formal à revisão do PR #390 é emitido com parecer **APROVADO**.
A governança de dados, isolamento de tenant, regras de fechamento CYC-007 e a integridade transacional de escritas em lote foram integralmente cumpridas.

O PR #390 está liberado para merge pelo Agente 00 / Agente 08A, respeitando a ordem de precedência da onda (#381 → #383 → #390).

---
*Agente 24 — Revisão Independente · 2026-11-19*