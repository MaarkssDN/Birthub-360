- De: 00
- Para: 13 (Enxame autônomo) — cc 07
- Status: ABERTO — Trilha 3 (se enxame for Day-1)
- Prioridade: P1

## Achados (detalhes em 00-para-07-ia-gateway-custos.md)

### DEBT-0012 (co 07) — executeWithTools fora do gateway — P1
Custo/quota/AILog invisíveis por iteração ReAct. Correção compartilhada com 07.

### DEBT-0013 (co 21) — Consentimento LGPD é env allowlist — P1→P2
`aiPiiConsent.service.ts:40-57`: fail-closed mas não auditável por titular. Se decisão for persistir: tabela + audit trail + migração da consulta (manter env como override emergência). Envolve schema → handoff 01.

### IA-07 — AIPendingAction sem retry visível — P2
`aiPendingAction.service.ts:288-320`: approved+!executed por falha transitória ficam paradas. Verificar se `AIPendingActions.tsx` permite reexecutar; senão implementar.

### IA-10 — Consent gate bloqueia até agentes sem PII — P3
Comportamento seguro; documentar runbook de habilitação por org.

## Contexto positivo
Enxame 24/7 real (BullMQ, dedupe, MAX_STEPS, dead-letter, SLO), SWARM_AUTONOMY_MODE default supervised, consent gate ~15 chokepoints. Governança de runtime do PR #388 pode alterar partes — verificar diff.
