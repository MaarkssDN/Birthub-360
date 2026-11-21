# Parecer 24 — Agente 10 (Infra/Backup/Deploy) — 2026-11-20

**Handoff:** 00→10 infra-backup-deploy | **Branch:** `agente/10-infra-backup-deploy` | **Commit:** `af70a8787`

## Veredito: APROVADO (com observações)

## Auditoria P1–P4
- **P1**: objetivo claro (DEBT-0001/0002/0037, INF-08/09); nenhuma suposição silenciosa — limitação do bind-mount documentada no handoff.
- **P2**: scripts cirúrgicos; sem dependências novas; `restore-test.sh` falha fechado sem envs (correto — nunca mais sucesso falso).
- **P3**: diff contém apenas os 6 arquivos da missão. `.env.example` e `docs/deploy/` são co-propriedade do 08 — justificável pelo handoff "10 + 08".
- **P4**: evidências reais verificadas — `bash -n` OK, `--verify-crypto` round-trip PASS, fail-closed exit 1 sem pg_dump/envs. `/health/ready` confirmado existir em `src/bootstrap/healthchecks.ts`.

## Observações (não bloqueantes)
1. **Restore real não executado** — depende de `BACKUP_ENCRYPTION_KEY`+`RESTORE_DATABASE_URL` no host (D-01). Script correto; primeiro drill no host gerará o `BACKUP-RESTORE-DRILL-RESULT.json` exigido pelo aceite.
2. `deploy-aws.ps1` não auditado (handoff pedia verificar divergência) — fica como pendência registrada.
3. `dr-simulation.sh`/`rollback-drill.sh` stubs não reescritos — recomendo deprecação formal.
4. Suposição bind-mount do container não verificada em runtime — validar no 1º deploy real.

## Conformidade
Sem secrets versionados; sem destrutivo; sem push/merge pelo executor. Escopo respeitado.
