# Parecer do Agente 24 — PR #416 hotfix de regressão do cadence worker

- **Missão:** revisão independente URGENTE do PR #416 (`fix/cadence-worker-regressao`) — hotfix que deixou `main` vermelha no CI.
- **Autor:** coordenador/executor do hotfix (commit `cc23b62bb2689fa656433f846d5e3f1fbd9e730d`). **Auditor:** Agente 24 (Revisão Independente).
- **Base:** `origin/main @ 4c372dd06ada42f279d66f1721cd45a98bee629b`.
- **Revisão exata:** `origin/fix/cadence-worker-regressao @ cc23b62bb` (diff `origin/main...origin/fix/cadence-worker-regressao`).
- **Arquivo auditado:** `src/features/cadence/infra/dispatchers/CadenceDispatchers.ts` (único arquivo do diff).

## Diff auditado

Exatamente 2 linhas alteradas em `resolveCadenceTemplateContext` (função ~L96–122):

```diff
     select: {
-      assignedToId: true,
+      owner: true,
       contact: { select: { name: true } },
       company: { select: { tradeName: true, legalName: true } },
     },
...
       where: {
         organizationId,
         active: true,
-        ...(lead?.assignedToId ? { userId: lead.assignedToId } : {}),
+        ...(lead?.owner ? { userId: lead.owner } : {}),
       },
```

Cirúrgico: nenhum outro arquivo, nenhuma mudança colateral. Sem refatoração, sem formatação. **Conforme P3.**

## Verificação contra o schema e o código

1. **`assignedToId` não existe no model `Lead`.** `grep -rn "assignedToId" prisma/` → zero ocorrências. O `select` com campo inexistente dispara `PrismaClientValidationError` em **toda** varredura do cadence worker que resolva template context → exatamente a causa das 2 falhas em `tests/integration/cadenceRun.worker.test.ts` e do gate vermelho. Diagnóstico correto.
2. **`Lead.owner` existe e é `String?`** (`prisma/schema.prisma` L585, dentro de `model Lead` L576+). Não é FK/`@relation`, é identificador solto — consistente com o uso documentado.
3. **`owner` é semanticamente o `User.id`.** `src/features/calendar/routes/booking.routes.ts` L416–429 documenta explicitamente: `Lead.owner` é o identificador usado por toda atribuição de posse/RBAC do CRM (round-robin em `assignment.service.ts`, `requireLeadOwnership.ts`, agregação por vendedor) e leads criados por agendamento público gravam `owner: link.userId` (L429), onde `PublicBookingLink.userId` é `String` FK → `User.id` (`prisma/schema.prisma` L3942–3943). Logo filtrar `PublicBookingLink.userId === lead.owner` é a correspondência correta: o link de agendamento do dono do lead.
4. **Fallback com `owner` null.** Quando `lead?.owner` é null, o filtro `userId` é omitido e o `findFirst` retorna qualquer `PublicBookingLink` ativo da organização (ordem não determinística se houver vários vendedores com links). É o comportamento pré-existente pretendido para leads sem dono (o campo sempre foi opcional no filtro), e o template já prevê `| default:` para `booking_link` ausente. Risco residual: org com múltiplos links ativos pode resolver o link de outro vendedor — **observação P3, não bloqueante**; melhoria futura seria priorizar link do owner e cair para org-level de forma determinística. Registrado para o domínio de cadence/produto, sem exigir alteração neste hotfix.

## Evidências de teste (fornecidas pelo coordenador; não reexecutadas por mim nesta revisão)

- `tests/integration/cadenceRun.worker.test.ts` 5/5 verde local com Postgres+Redis reais.
- `tests/unit`/unit `cadenceTemplateRendering` 7/7 verde.
- O teste de integração exercita o caminho que antes lançava `PrismaClientValidationError` (seed de lead + varredura do worker), então a correção é coberta pelo gate que estava vermelho.

## Conformidade com governança

- Propriedade: `src/features/cadence/infra/dispatchers/` pertence ao domínio de cadência; hotfix autorizado pelo coordenador para desbloquear CI. Escopo respeitado (1 arquivo, 2 linhas).
- P1–P4: causa raiz identificada e confirmada por evidência (campo inexistente no schema); solução mínima; critério de sucesso verificável (gate verde).
- Sem impacto de tenancy novo: a query já filtra `organizationId`; o filtro adicional por `userId` apenas restringe dentro da org.
- Sem impacto LGPD: `owner` é id interno de usuário, não PII nova exposta.

## Achados

| # | Prioridade | Descrição | Proprietário sugerido |
|---|---|---|---|
| 1 | P3 | Fallback `owner=null` pode escolher link de outro vendedor em orgs multi-link; considerar ordenação determinística ou flag "link padrão da org" no futuro | domínio cadence/produto |

Nenhum achado bloqueador.

## Veredito

**APROVADO** — para merge do PR #416 na `main` (desbloqueio do CI). O diff é cirúrgico, a correção `assignedToId → owner` é semanticamente correta (mesmo identificador `User.id` usado em `PublicBookingLink.userId` e gravado em `Lead.owner` por booking.routes.ts), o campo inexistente era a causa raiz confirmada das falhas, e os gates reportados pelo coordenador cobrem o caminho corrigido. Aprovação limitada ao escopo deste hotfix; não aprova trabalho futuro nem dispensa a auditoria normal de PRs.
