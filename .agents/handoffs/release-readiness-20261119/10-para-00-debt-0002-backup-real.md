# Handoff — DEBT-0002: backup real implementado (scripts fail-closed)

De: 10 — Infraestrutura, Observabilidade e SRE
Para: 00 — Coordenador
Onda: release-readiness-20261119
Status: resolvido (código) / pendente (ativação operacional em prod)
Prioridade: bloqueador (era P0 no inventário; agora depende de decisão ops)
Bloqueador-ref: DEBT-0002 (.agents/runs/audit-2026-11-18/inventario-mestre.md)
Sprint destino: release-readiness

## Problema

`scripts/db/backup-encrypted.sh` gravava um placeholder
(`-- Birth Hub 360 Backup Placeholder --`) e imprimia "Backup gerado com
sucesso" — sucesso falso. `scripts/db/restore-test.sh` e
`scripts/ops/dr-simulation.sh` também reportavam sucesso sem executar nada
(RTO=4min/RPO=15s hardcoded). Não existia backup real de produção.

## Arquivo(s) envolvido(s)

- `scripts/db/backup-encrypted.sh` — reescrito: `pg_dump`/`pg_dumpall` real →
  gzip → AES-256-CBC (`openssl enc -pbkdf2`), tudo em pipeline (dump em claro
  nunca toca o disco). Verificação de integridade ponta a ponta
  (decifra + `gzip -t`) antes de declarar sucesso. Retenção configurável
  (`BACKUP_RETENTION_DAYS`, default 30d). Cópia remota opcional via
  `BACKUP_SCP_TARGET` (scp; falha = exit != 0). `--verify-crypto` preservado
  (testes existentes em `tests/unit/db/` continuam passando).
- `scripts/db/restore-test.sh` — reescrito: drill real que restaura o backup
  mais recente (ou `BACKUP_FILE`) em banco temporário isolado
  (`birthhub_restore_drill_<ts>`), faz sanity checks (contagem de tabelas,
  `_prisma_migrations`) e grava evidência em
  `BACKUP-RESTORE-DRILL-RESULT.json`. Exit 0=passed, 1=failed, 2=not_executable
  (JSON sempre gravado quando possível — nunca sucesso falso).
- `scripts/backup.sh` — hardening: `set -euo pipefail`, `.env` via `set -a`,
  verificação de dump não-vazio e reconhecível, retenção configurável.
- `scripts/ops/dr-simulation.sh` — reescrito fail-closed: mede RPO real
  (idade do backup mais recente vs `DR_RPO_TARGET_SECONDS`); RTO só é medido
  se `DR_FAILOVER_CMD` estiver configurado (senão exit 2 / NOT_MEASURED).

## Evidência

- `bash -n` OK nos 4 scripts; shellcheck indisponível no ambiente.
- `npx vitest run tests/unit/db/backup-encrypted-verify-crypto.test.ts` → 4/4 pass.
- Smoke real executado: `pg_dump` stub via PATH → backup `.sql.gz.enc`
  gerado, verificado (sha256 registrado), retenção aplicada, exit 0.
- `restore-test.sh` com `psql` stub: status `passed`, JSON válido com
  `tables_in_public`, `prisma_migrations_applied`, `restore_seconds`.
- Chave errada → `status: failed`, exit 1. Sem backup → `status:
  not_executable`, exit 2, JSON gravado em `./backups/` (fallback gravável).
- `dr-simulation.sh` sem backup → exit 1; com backup fresco → RPO OK,
  RTO NOT_MEASURED, exit 2.

## Alteração necessária (pendências — decisão humana/ops)

1. **Agendamento em produção NÃO implementado** (proposital): não há evidência
   de cron/systemd no repo e inventar agendamento violaria P2. Para ativar:
   provisionar `BACKUP_DATABASE_URL` (papel read-only dedicado, ex-:
   `prospector_backup` documentado em docs/SRE.md §4), `BACKUP_ENCRYPTION_PASSPHRASE`
   e `BACKUP_DEST_DIR`/`BACKUP_SCP_TARGET` via secret manager, e agendar
   `scripts/db/backup-encrypted.sh` (sugestão: diário). Sem isso, RPO efetivo
   continua "sem limite conhecido" — o script existe, mas nada o dispara.
2. **Decisão de destino off-site**: `BACKUP_SCP_TARGET` cobre cópia scp;
   alternativa é montar volume/object storage no `BACKUP_DEST_DIR`. Decisão
   do dono do repositório (histórico: R2 recusado em 02/11/2026 — ver
   docs/SRE.md §4).
3. `docs/SRE.md` §4 e `docs/ops/DISASTER_RECOVERY_PLAYBOOK.md` estão
   desatualizados (dizem que "não existe backup" / citam workflow removido).
   Owner de docs = Agente 08 → handoff separado nesta mesma pasta.
4. `scripts/db/restore-test.sh` exige `DRILL_ADMIN_DATABASE_URL` (role com
   CREATEDB) — em prod, provisionar role dedicada para o drill.
5. Ownership: `scripts/db/**` constava como do Agente 01A no plano-mestre;
   a missão DEBT-0002 foi designada ao Agente 10 pelo Coordenador —
   registrar ciência para evitar conflito futuro.

## Teste esperado

- `bash scripts/db/backup-encrypted.sh --verify-crypto` → exit 0.
- Com envs provisionadas: `bash scripts/db/backup-encrypted.sh` → exit 0,
  arquivo `.sql.gz.enc` + sha256 impresso; falha de pg_dump/openssl → exit != 0.
- `bash scripts/db/restore-test.sh` → `BACKUP-RESTORE-DRILL-RESULT.json`
  com `status: passed` (ou `failed`/`not_executable` honesto).

## Contexto adicional

- Convenção do repo para fallback sem binário local: container
  `birthhub_postgres` (`BACKUP_DOCKER_CONTAINER` configurável).
- `npm run backup:drill` (`scripts/backup/run-backup-restore-drill.ts`) já
  existia e cobre drill do backup dev em `./backups`; o novo
  `restore-test.sh` cobre o caminho criptografado/prod. Não duplicados.
