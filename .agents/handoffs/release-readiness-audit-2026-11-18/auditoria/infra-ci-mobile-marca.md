# Auditoria READ-ONLY — Agentes 10+09+11 (infra/CI/mobile/marca)
**Base:** `main @ b54060ad1`. Sem execução.

## Achados

### INF-01 — Deploy EC2 real NÃO aplica migrations nem healthcheck — **P0**
`deploy-ec2.sh:24-48`, `DEPLOY_EC2.md:94-104`. Produção real = `scp dist/+node_modules/` + `docker restart birthhub-app`. **Sem `prisma migrate deploy`, sem healthcheck** — contradiz doc que afirma "healthcheck automático". Dockerfile raiz tem `migrate deploy` no CMD mas não é a imagem usada. Viola bloqueador B-05. → Código novo contra schema antigo = crash-loop.
Correção: `docker exec birthhub-app npx prisma migrate deploy` antes do restart + curl `/health/ready` + falhar script se falhar.

### INF-02 — Backup de produção inexistente; scripts DR/rollback são stubs — **P0**
`PRODUCTION_ARCHITECTURE.md:11-12` admite "hoje não existe backup automático". `backup-encrypted.sh:45-49` escreve placeholder, não pg_dump. `restore-test.sh:5-8` só imprime sucesso. `dr-simulation.sh` RTO/RPO hardcoded. `rollback-drill.sh` = sleep 1. `backup.sh` dump em claro local.
Correção: pg_dump real agendado no EC2 → destino externo (S3/R2) + criptografia + restore testado; remover stubs que reportam sucesso falso.

### INF-03 — Rollback depende de imagem tagueada que deploy nunca cria — P1
`deploy-ec2.sh:36-42` copia dist/ para imagem latest sem versionar; rollback doc fala em tag previous que não existe. RUNBOOKS diverge do deploy real.

### INF-04 — Observabilidade cega em produção — P1
`prometheus.yml` não scrapea produção (targets dev local); sem Alertmanager receptor. `EXPOSE_METRICS` default false. RUNBOOKs históricos sem seção EC2.

### INF-05 — Mobile aponta para backend inexistente — **P0 se mobile é escopo**
`capacitor.config.ts:28-49` URL default `app.birthhub360.com.br` "ainda não resolve DNS"; Manifest App Link aponta `onrender.com` arquivado; sem assetlinks.json; workflow APK só debug manual. Offline sync real e deep link OK. → App abre e não carrega dados.
Correção: decidir escopo mobile no launch; se sim, definir backend real + assetlinks.json.

### INF-06 — `identidade-visual/` documenta paleta Neon ANTERIOR — P1
Tokens `--palette-neon-*` (#00D4FF/#FF2D9B) divergentes da paleta vigente (Gold/Iris/Orbit). `capacitor.config.ts:69-83` splash usa Obsidian #0B132B.

### INF-07 — Dois steps não-bloqueantes escondem dívida real — P2
`ci.yml:264-269` golden dataset live `continue-on-error` (só com API key); `ci.yml:271-288` `verify:migration-drift` `continue-on-error` (drift estrutural pré-existente: índices truncados, KnowledgeChunk órfã). Positivo: build gate fail-closed; production/cd exigem CI verde; deploy workflows só manual.

### INF-08 — Secrets/PII menores em configs — P3
`.env.example:282` e-mail pessoal real; defaults "segredo" de serviços dev; `charts/` env referencia serviços inexistentes (IaC inativo).

### INF-09 — `.env.example` bloco STORAGE duplicado — P3
`:86-94` e `:142-157`. Sinal de deriva.

## Top-5 riscos go-live
1. INF-01 deploy sem migrate/healthcheck (primeiro deploy = incidente).
2. INF-02 zero backup real (perda irreversível).
3. INF-05 mobile sem backend (se escopo).
4. INF-04 observabilidade cega.
5. INF-06 identidade visual divergente.

## Só verificável em ambiente real
Branch protection GitHub; `.env` EC2 (EXPOSE_METRICS, encryption keys, ENABLE_QUEUES); Prometheus/Grafana rodando?; DNS/TLS prod; backups agendados (cron); build Android em device.
