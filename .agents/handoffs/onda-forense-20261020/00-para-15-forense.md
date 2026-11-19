De:00
Para:15
Onda:forense20261020
Status: resolvido
Prioridade:alto
Bloqueador-ref:auditoria-real-ondas00-05
Sprint destino:a definir pelo00

## Problema
EXP-06 [P1] Auditoria contínua não é scanner real

## Arquivo(s) envolvido(s)
Consultar matriz e evidência específica.

## Evidência
Base:82f848a39a7a45212956c1e949a8df28d8f946c9. Inspeção estática salvo comandos explicitamente reproduzidos; produto/API não presumidos testados.
EXP-06: continuousSecurityAudit.service.ts:38-68: simulação428,CVE fixo,SBOM com timestamp.

## Alteração necessária
EXP-06: Consumir scanner/manifesto reais e waivers oficiais; não declarar conformidade por fixture.

## Teste esperado
EXP-06: Teste sintético positivo/negativo cobrindo a lacuna, persistência/reload, tenant cruzado quando aplicável; gate e parecer24.

## Contexto adicional
Missão atual somente auditoria; nenhuma correção autorizada por este handoff. Ver matriz335requisitos, relatórioHTML e parecer24. Revalidar contra main de destino, que foi alterada por outro processo durante a auditoria. Complexidade depende do proprietário; hipóteses não são causa operacional comprovada.

## Resolução

> Reconciliação 2026-11-14 (Agente 00): veredicto DEFEITO-REAL — continuousSecurityAudit.service.ts é simulador com fixtures hardcoded. Correção pendente de despacho. Ver RESULTADOS-RECONCILIACAO-20261114.md.

### Resolução (Agente 15, 2026-11-14) — EXP-06

Decisão do usuário: **opção B — simulador honesto** (scanner real vira demanda futura).

Feito:
- `SecuritySweepReport.simulated?: boolean` adicionado ao contrato (`src/shared/contracts/continuousSecurityAudit.contract.ts`) — aditivo/opcional; JSDoc declara que o serviço é SIMULADOR DE HOMOLOGAÇÃO e que `complianceRating` é ilustrativo.
- `ContinuousSecurityAuditService` agora emite `simulated: true` no relatório e no evento de auditoria; JSDoc da classe documenta que todos os dados são fabricados.
- Teste `tests/unit/security/continuousSecurityAudit.service.test.ts` assere `report.simulated === true` — 7/7 verde; `npx tsc --noEmit` limpo.

Pendente (demanda futura — scanner real):
- Handoff de débito criado: `.agents/handoffs/onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real.md` (destinatário 10, dependência do 15): consumir `npm audit --json` + `cyclonedx-npm` (script `security:sbom` já existe), waivers de `docs/security/AUDIT_WAIVERS.md` via `scripts/security/check-audit-waivers.ts`, agendamento no worker e exposição do relatório. O serviço hoje não tem consumidores — quando o scanner real existir, `simulated` deve ser `false`/ausente e os dados vir de fonte real.

### Fechamento (Agente 15 — 2026-11-17, worktree `agente-15-handoffs`)

Triagem de staleness: artefatos da resolução acima verificados presentes neste
worktree (base `main@f8d4bc76d`):

- `src/shared/contracts/continuousSecurityAudit.contract.ts:62` — `simulated?: boolean` com JSDoc de simulador.
- `src/lib/security/services/continuousSecurityAudit.service.ts:114,135` — serviço emite `simulated: true` no relatório e no evento de auditoria.
- `tests/unit/security/continuousSecurityAudit.service.test.ts:21` — asserção `report.simulated === true` presente.
- Débito do scanner real rastreado em `onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real.md` (fora do escopo deste handoff — destino Agente 10).

A lacuna EXP-06 (conformidade declarada por fixture) foi saneada na opção B:
o simulador agora é honesto e o scanner real é demanda rastreada separadamente.
Status → `resolvido`.
