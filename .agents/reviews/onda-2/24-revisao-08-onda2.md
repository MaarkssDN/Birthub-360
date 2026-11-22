# Parecer — Agente 24 (Revisão Independente) — Entrega Agente 08 / Onda 2

**Data:** 2026-11-13
**Revisor:** Agente 24 — Revisão Independente
**Objeto:** Branch `agente/08-onda2-ci` (worktree `C:\Github\Birthub-360-worktrees\agente-08-onda2-ci`, base `integracao/onda-2`)
**Escopo declarado:** MEL-15 / DEM-20261113-003 — SBOM + gates estáticos de segurança em CI
**Demanda:** DEM-20261113-003

## VEREDITO: APROVADO

## Commits auditados

```
870ed9271 docs(run): agente 08 relatorio onda-2 MEL-15
22a432a3b ci(security): add SBOM artifact workflow and blocking RLS coverage gate (MEL-15, DEM-20261113-003)
```

`git diff --stat integracao/onda-2...HEAD`: apenas 2 arquivos, +156 linhas:
- `.github/workflows/security-sbom.yml` (novo, 90 linhas)
- `.agents/runs/onda-2/08-relatorio.md` (novo, 66 linhas)

Nenhum arquivo fora do escopo de CI foi tocado. Working tree limpo.

## Verificações executadas e evidências

### 1. Sintaxe e conformidade do workflow `security-sbom.yml`

- **YAML válido**; chave `on` sem aspas — idêntica à convenção de todos os workflows do repo (`ci.yml:6`, `security-trivy.yml:24`, `codeql.yml:16` usam `on:` cru; o parser do GitHub Actions não segue YAML 1.1 estrito).
- **Permissões mínimas**: `permissions: contents: read` no nível do workflow; nenhum job precisa de mais (upload-artifact não requer permissão extra; não há upload de SARIF/security-events).
- **Actions pinadas por SHA** com comentário de versão — confere exatamente com a convenção do repo:
  - `actions/checkout@3d3c42e5...` (v7.0.1) — mesmo SHA em ci.yml, codeql.yml, security-trivy.yml etc.
  - `actions/setup-node@949feb24...` (v7.1.0) — idem.
  - `actions/upload-artifact@cf430e03...` (v7.0.2) — idem.
- **Gatilhos adequados**: `pull_request` para `main`/`master` (mesmo padrão de `security-trivy.yml`), `schedule` semanal quinta 06:00 UTC (deslocado de Trivy=segunda e CodeQL=quarta — justificativa registrada), `workflow_dispatch`. Sem `pull_request_target`, sem checkout de código de fork com secrets — não há secrets no workflow.
- **Jobs bloqueantes**: nenhum `continue-on-error`; `if-no-files-found: error` no upload do SBOM; ambos os jobs falham o check em caso de erro.

### 2. Decisão de NÃO duplicar scan Trivy/Grype — CORRETA e bem fundamentada

Verificado no código:

- `ci.yml:62-90` — job `trivy-scan`: `aquasecurity/trivy-action@ed142fd0...` (v0.36.0, pinado por SHA), `scan-type: fs`, `severity: HIGH,CRITICAL`, `exit-code: '1'`, `trivyignores: .trivyignore.yaml`, `limit-severities-for-sarif: true`. Job alimenta o required check `build` via `needs: [secret-scan, trivy-scan]` e o agregador fail-closed (ci.yml:95-97, 354-370).
- `security-trivy.yml:39-82` — job `trivy-fs-pr-gate` em PR: mesma política (HIGH/CRITICAL, exit-code 1, .trivyignore.yaml) + SARIF na aba Security. Comentários do próprio workflow documentam o histórico e a não-duplicação.
- `ci.yml:182` — `npm run security:audit-waivers` (`npm audit --audit-level=high` com waivers auditados).
- `dependency-review.yml` + `ci.yml:45-56` — `actions/dependency-review-action` com `fail-on-severity`.

O argumento contra adicionar Grype bloqueante é sólido: GHSA aceitos em `docs/security/AUDIT_WAIVERS.md` não teriam mecanismo de waiver (`.trivyignore.yaml` é específico do Trivy), e criar `.grype.yaml` na raiz excederia o escopo de propriedade (`.github/workflows/**`). Publicar o SBOM como artefato preserva a capacidade de scan externo (Grype/Snyk) sem conflito de política. Decisão de engenharia correta — evita runner duplicado com mesma política e falso-positivo em waivers aceitos.

### 3. `verify:rls-coverage` não existia em CI antes — CONFIRMADO

- `git grep -n "rls-coverage" integracao/onda-2 -- .github/workflows/` → **exit 1 (zero ocorrências na base)**.
- O script existe: `package.json:84` → `"verify:rls-coverage": "tsx scripts/security/check-rls-coverage.ts"`; script presente em `scripts/security/check-rls-coverage.ts`.
- O gate é de fato estático (lê `prisma/schema.prisma` × migrations, sem banco) — adequado a CI sem services.

### 4. Escopo e propriedade de arquivos

- `.github/workflows/**` → domínio do Agente 08 (QA e Release / CI). ✔
- `.agents/runs/**` → formalmente do Agente 00 (AGENTS.md §15). O Agente 08 escreveu `.agents/runs/onda-2/08-relatorio.md` ali. **Avaliação: observação não-bloqueante.** `.agents/runs/` é na prática o local canônico de relatórios de execução de TODOS os agentes — o diretório contém dezenas de arquivos `agente-NN-*`, `NN-*` e relatórios de ondas de praticamente todos os slots (02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 14, 15, 17...), incluindo relatórios do próprio 08 em ondas anteriores. Tratar isso como violação bloqueante criaria um conflito com a prática estabelecida do repositório. Registro como observação para o 00: se a intenção for restringir `.agents/runs/` exclusivamente ao 00, a governança precisaria ser explicitada — hoje o padrão real é "cada agente registra seu run".

### 5. Relatório de execução — COERENTE

`.agents/runs/onda-2/08-relatorio.md` é preciso e verificável: descreve corretamente os dois jobs, os gatilhos, o pinning por SHA, a decisão de não duplicar scan (com as mesmas evidências que conferi), declara MEL-19 ignorado conforme instrução, e documenta validações executadas (parse YAML, execução local do script com 135 tabelas, `git check-ignore` do artefato). Sem exageros; claims conferem com o diff.

## Achados

### Bloqueadores
Nenhum.

### Altos
Nenhum.

### Médios
Nenhum.

### Baixos / Observações

1. **[Observação — propriedade]** `.agents/runs/**` é nominalmente do Agente 00 (AGENTS.md §15), mas o repo opera na prática com cada agente gravando seu relatório de run ali (dezenas de precedentes de todos os slots). Não é violação bloqueante; recomendo ao 00 confirmar se essa é a regra pretendida ou se relatórios de run deveriam migrar para `.agents/handoffs/`/outro local. Sem ação exigida do 08.
2. **[Observação — custo de runner]** O job `sbom` executa `npm ci` completo só para rodar `cyclonedx-npm`. É o mesmo custo dos demais jobs de CI e o comando já é o padrão dos workflows de deploy; aceitável. Se o tempo de PR virar problema, `npm ci --omit=dev` ou cache dedicado podem ser avaliados — não é defeito.
3. **[Observação — cobertura de gatilho]** O workflow dispara apenas em PR para `main`/`master`, não para `integracao/onda-*`. Isso é consistente com TODOS os workflows de segurança existentes (mesmo padrão de `security-trivy.yml`, `codeql.yml`), então PRs de integração não recebem o gate — mas isso é característica do modelo de branching do repo, não defeito desta entrega. O schedule semanal + `workflow_dispatch` cobrem a base.
4. **[Observação — required check]** O workflow novo não está (e não deveria estar, fora do escopo) listado como required check no ruleset de branch; sua efetividade como "gate" depende de o 00/08A configurarem isso no GitHub. As jobs falham corretamente; tornar bloqueante no branch protection é decisão de governança fora do diff.

## Escopo de revisão

Auditei: commits, diff completo, workflow YAML, claims de não-duplicação (ci.yml, security-trivy.yml, dependency-review.yml), existência dos scripts npm, convenção de pinning, gatilhos, permissões, e o relatório de run. Não executei o workflow em runner real (não há credenciais/runner neste ambiente); validação local do script RLS foi reportada pelo agente e o script existe e é invocável via `npm run verify:rls-coverage`.

**Parecer: APROVADO — pronto para integração pelo Agente 00.**
