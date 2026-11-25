- De: 00
- Para: 08 (QA) + 14 (Harness)
- Status: ABERTO
- Prioridade: P1 (gate estrutural)

## Achados (relatório: auditoria/testes-gates-ci.md)

### DEBT-0026 — Sonar mede só unitário + verify:* fora do CI — P1
`sonar-project.properties:17` só coverage/unit/lcov; sonarqube.yml roda só test:unit; integration gera coverage sem lcov. ~110 arquivos de integração fora do denominador → issue #200 insatisfatível.
**Correção:** lcov na suíte integration + merge no Sonar.

`verify:integrations`/`verify:ai` existem mas nenhum workflow invoca → regressão Bitrix/IA só em produção. Job dedicado ou documentação formal de execução manual pré-release.

### QA-03/04 — Gates não-bloqueantes — P2
Golden eval + verify:migration-drift `continue-on-error` (ci.yml:264-288); 9 GHSA allowlisted sem expiração (ci.yml:60). Migration-drift: criar baseline de drift conhecido e falhar só em drift novo (padrão --ignore-known já existe).

### QA-05/06 — E2E serial ~73min retries mascaram flake; visual c/ bypass + 11 snapshots (#201) — P2
### QA-08/09 — test:containers fora de CI; skips em proposalVersioning "Pago" — P2/P3
### QA-11 — E2E não cobre: LGPD ponta a ponta, Bitrix real, IA real, fila/retry, jornada receita completa — P2

## Nota
release:check não é gate CI e tem cobertura menor que AGENTS.md §28 — alinhar ou documentar.
