# 00-para-10-scanner-seguranca-real.md

- De: 00 (Coordenador)
- Para: 10 (Infraestrutura, Observabilidade e SRE) — dependência: Agente 15
- Onda: reconciliacao-20261114
- Status: aberto
- Prioridade: normal
- Bloqueador-ref: EXP-06 / DEM-20261114-002
- Sprint destino: —

## Problema

`ContinuousSecurityAuditService` (`src/lib/security/services/continuousSecurityAudit.service.ts`) é um simulador determinístico de homologação — emite `simulated: true` desde a reconciliação de 2026-11-14. Não existe scanner real de dependências/CVE integrado. O relatório de segurança contínua precisa de implementação real para ter valor de governança.

## Arquivo(s) envolvido(s)

- `src/lib/security/services/continuousSecurityAudit.service.ts`
- `src/shared/contracts/continuousSecurityAudit.contract.ts`
- `scripts/security/check-audit-waivers.ts`, `docs/security/AUDIT_WAIVERS.md`
- `package.json` (`security:sbom` = cyclonedx-npm, `security:audit-waivers`)
- `worker.ts` / filas (agendamento do sweep)

## Evidência

- Simulador confirmado na reconciliação: CVE/waivers/SBOM hardcoded; `simulated: true` adicionado em PR da branch `agente/15-reconciliacao-security-audit`.
- Infra real já existe: `npm audit --json`, `cyclonedx-npm` (gera `sbom.cdx.json` real), Trivy no CI (`security:trivy`), waivers formais em `docs/security/AUDIT_WAIVERS.md`.

## Alteração necessária

1. `runSecuritySweep()` deve executar scanner real: `npm audit --json` (ou Trivy fs JSON) parseado para `SecurityVulnerability[]` real; SBOM via `cyclonedx-npm` real; `sha256` do arquivo gerado; contagem de dependências real (componentes do SBOM).
2. Waivers carregados de `docs/security/AUDIT_WAIVERS.md`/fonte oficial versionada (não hardcoded), com checagem de expiração.
3. Agendar sweep no worker (periódico) e persistir relatórios; expor via rota/relatório se houver consumidor.
4. Quando real, `simulated` deve ser `false`/ausente e `complianceRating` calculado de dados reais.
5. Decidir destino do simulador: manter como fixture de teste ou remover.

## Teste esperado

- Sweep real retorna contagens/CVEs do scanner de verdade; waiver expirado não é aplicado; SBOM hash corresponde ao arquivo gerado; teste de regressão com fixture de `npm audit` simulada (mock do processo, não dados fabricados no relatório).

## Contexto adicional

Origem: reconciliação EXP-06 (handoff `onda-forense-20261020/00-para-15-forense.md`). O Agente 15 executou a opção B (simulador honesto) por decisão do usuário em 2026-11-14; este handoff cobre a opção A (scanner real) como demanda futura. Envolve Agente 15 (segurança) + 10 (infra/agendamento) + 18 (contrato, se mudar shape).

## Triagem (Agente 10, 2026-11-18)

O handoff permanece `aberto`, mas os itens 1, 2, 4 e 5 tocam `src/lib/security/**` (propriedade do Agente 15) e `src/shared/contracts/**` (Agente 18); o item 3 (agendamento periódico) toca worker/filas (Agente 16/07). A fatia do Agente 10 — alerta de observabilidade quando `complianceRating=FAIL_BLOCKED` ou `simulated=true` em produção (`infrastructure/observability/alert.rules.yml`) — é prematura enquanto não existir scanner real/métrica. Handoff de retorno aberto: `.agents/handoffs/onda-reconciliacao-20261114/10-para-15-scanner-seguranca-real.md`. Recomendação ao 00: re-despachar a implementação central ao Agente 15.
