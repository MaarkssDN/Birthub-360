De: 10
Para: 15
Onda: reconciliacao-20261114
Status: aberto
Prioridade: normal
Bloqueador-ref: onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real.md
Sprint destino: —

## Problema

O handoff `00-para-10-scanner-seguranca-real.md` (scanner de segurança real no lugar do simulador honesto) tem a maior parte do escopo em `src/lib/security/**` — propriedade do Agente 15 — e `src/shared/contracts/**` — Agente 18. O Agente 10 fez a triagem de propriedade (2026-11-18) e devolve a implementação central ao 15.

## Arquivo(s) envolvido(s)

- `src/lib/security/services/continuousSecurityAudit.service.ts` (simulador: `simulated: true`, CVE/waivers/SBOM hardcoded)
- `src/shared/contracts/continuousSecurityAudit.contract.ts` (Agente 18 — só se o shape mudar)
- `docs/security/AUDIT_WAIVERS.md` (waivers com checagem de expiração)

## Evidência

Ver `onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real.md` (seções Problema/Teste esperado) e a `## Triagem (Agente 10, 2026-11-18)` adicionada ao final.

## Alteração necessária

1. Implementar `runSecuritySweep()` real: `npm audit --json` ou Trivy fs JSON → `SecurityVulnerability[]`; SBOM via `cyclonedx-npm` real com sha256 do arquivo; contagem real de componentes.
2. Waivers de `docs/security/AUDIT_WAIVERS.md` com checagem de expiração (waiver expirado não é aplicado).
3. `simulated` → false/ausente quando o scanner real roda; decidir o destino do simulador (fixture de teste?).
4. Item 3 do handoff original (agendamento no worker) → abrir handoff para 16/07 após o sweep existir.
5. Métrica/alerta de observabilidade para `complianceRating=FAIL_BLOCKED` → volta ao 10 quando a métrica existir.

## Teste esperado

Mock do processo de scan (fixture de `npm audit`/Trivy), não dados fabricados no relatório. Waiver expirado deve ser ignorado; SBOM hash deve corresponder ao arquivo gerado.

## Contexto adicional

Origem: reconciliação EXP-06 / handoff `onda-forense-20261020/00-para-15-forense.md`. O simulador honesto foi entregue por decisão do usuário em 2026-11-14; este handoff cobre a opção A (scanner real) como demanda futura.
