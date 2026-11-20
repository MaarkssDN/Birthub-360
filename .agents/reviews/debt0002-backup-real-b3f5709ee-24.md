# Parecer do Agente 24 — PR #435 DEBT-0002 backup/restore/DR real (fail-closed)

- **Missão:** revisão independente — PR #435 (`scripts/db/backup-encrypted.sh`, `scripts/db/restore-test.sh`, `scripts/backup.sh`, `scripts/ops/dr-simulation.sh`: backup/restore/DR reais, sem sucesso falso).
- **Autor:** Agente 10 (Infraestrutura, Observabilidade e SRE). **Auditor:** Agente 24.
- **Base:** `main`. **Revisão exata:** head `b3f5709eef1ce7967daf78cf82a17177b435544c` (confirmado via `gh pr view 435` e `git rev-parse pr435`).
- **Arquivos do diff (6):** os 4 scripts acima + 2 handoffs novos (`10-para-00-debt-0002-backup-real.md`, `10-para-08-docs-backup-dr.md`).

## Diff auditado vs escopo declarado

### `scripts/db/backup-encrypted.sh` (reescrito)

- `set -euo pipefail` + `die()` helper. Backup real: `run_dump | gzip -c | openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:$PASSPHRASE"` — **dump em claro nunca toca o disco** (pipeline direto para o tmp cifrado).
- Fail-closed em todas as etapas: sem `BACKUP_DATABASE_URL`/`DATABASE_URL` → die; sem `BACKUP_ENCRYPTION_PASSPHRASE` → die ("Backup sem criptografia é proibido"); sem openssl/gzip → die; `pg_dump`/`pg_dumpall` ausente → fallback para container `birthhub_postgres` (`BACKUP_DOCKER_CONTAINER` configurável) → senão die.
- **Verificação de integridade ponta a ponta antes de declarar sucesso**: `openssl enc -d ... | gzip -t` sobre o artefato — chave errada/corrupção → die. Depois `mv` para o nome final, `sha256sum` + tamanho registrados.
- Retenção configurável (`BACKUP_RETENTION_DAYS`, default 30d, `0` desativa). Cópia remota opcional `BACKUP_SCP_TARGET` via scp — **falha de scp = die** (exit ≠ 0).
- `--verify-crypto` preservado e compatível com o teste unitário existente (`BACKUP_VERIFY_KEY` ainda honrado — verifiquei o bloco L36–68 do arquivo da revisão).
- `TARGET_LABEL` loga apenas a parte após `@` da URL — sem vazamento de credencial no log.

### `scripts/db/restore-test.sh` (reescrito — era sucesso falso)

- Drill real: resolve artefato mais recente (ou `BACKUP_FILE`), decifra/descomprime conforme sufixo (`.sql.gz.enc`, `.sql.enc`, `.sql.gz`, `.sql`) em `$WORKDIR` temporário, valida header "PostgreSQL database dump".
- Restaura em banco temporário isolado `birthhub_restore_drill_<epoch>` derivado de `DRILL_ADMIN_DATABASE_URL`/`DATABASE_URL` (o banco-alvo **não** é tocado — a URL do drill troca apenas o path do dbname).
- Sanity checks reais: `count(*) information_schema.tables WHERE table_schema='public'` > 0 obrigatório; conta `_prisma_migrations` quando presente.
- **DROP garantido**: `DROP DATABASE IF EXISTS` no caminho de sucesso e best-effort dentro de `fail()`; trap `rm -rf $WORKDIR` sempre.
- Evidência honesta: `BACKUP-RESTORE-DRILL-RESULT.json` com `status: passed|failed|not_executable`, `stage`, `reason`, `sha256`, `restore_seconds`, `tables_in_public`. Exit 0/1/2 — `not_executable` (exit 2) cobre pré-requisitos ausentes sem fingir execução. **Nenhum sucesso falso restante.**

### `scripts/backup.sh` (hardening)

- `set -e` → `set -euo pipefail`; `.env` carregado via `set -a; . ./.env; set +a`; todas as expansões com defaults `${VAR:-...}`.
- Pós-dump: arquivo deve existir, ser não-vazio (`-s`) e conter "PostgreSQL database dump" — senão exit 1. Retenção `BACKUP_RETENTION_DAYS` (default 14).

### `scripts/ops/dr-simulation.sh` (reescrito — era RTO=4min/RPO=15s hardcoded)

- `set -euo pipefail`. **RPO medido de verdade**: `mtime` do backup mais recente em `BACKUP_DEST_DIR` vs `DR_RPO_TARGET_SECONDS` (default 86400s); sem backup → exit 1.
- **RTO honesto**: só é medido se `DR_FAILOVER_CMD` estiver configurado (executa o comando real e cronometra); sem ele → exit 2 / `NOT_MEASURED`. Nenhum número fabricado permanece.

## Verificações executadas por mim

- `gh pr diff 435` lido integralmente (668 linhas); `git fetch origin pull/435/head:pr435`.
- **`bash -n` nos 4 scripts da revisão exata → todos OK.**
- **Self-test real executado**: `BACKUP_DIR=/tmp/bkverify/out BACKUP_VERIFY_KEY=testkey bash backup-encrypted.sh --verify-crypto` → `[Crypto-Check] Criptografia AES-256 validada com sucesso (round-trip conferido).` exit=0.
- Flag removida `--verify-rto-rpo` não tem callers: `grep -rn "dr-simulation\|verify-rto-rpo" package.json .github/workflows/ docs/` → nenhuma referência executável (apenas docs que o handoff 10→08 já cobre).
- `docs/ops/DISASTER_RECOVERY_PLAYBOOK.md:21` ainda cita `backup-encrypted.sh` para restauração — o próprio PR abre handoff ao 08 para atualizar docs (propriedade respeitada, pendência rastreada).

## Propriedade e governança

- `scripts/db/**` constava como do Agente 01A no plano-mestre; a missão DEBT-0002 foi designada ao 10 pelo Coordenador — o handoff registra a ciência explicitamente para o 00. Não é violação (missão delegada), mas recomendo o 00 formalizar a exceção.
- Docs (`docs/SRE.md`, playbook) **não tocadas** — corretamente delegadas ao 08 via handoff (docs/** = 08). `package.json`/lockfile intocados.
- Escopo cirúrgico (P3). Handoffs completos e honestos — o status "resolvido (código) / pendente (ativação operacional)" é a declaração correta: **o mecanismo existe, mas nada o dispara em produção** (sem cron/systemd no repo — e inventar agendamento violaria P2). RPO efetivo de prod continua sem lastro até provisionamento de `BACKUP_DATABASE_URL`, `BACKUP_ENCRYPTION_PASSPHRASE`, `BACKUP_DEST_DIR`/`BACKUP_SCP_TARGET` e agendamento — pendência operacional registrada, não defeito do código.

## Achados

| # | Prioridade | Descrição | Ação sugerida |
|---|---|---|---|
| 1 | P2 | **`restore-test.sh` não distingue dump de cluster (`pg_dumpall`, `BACKUP_ALL_DATABASES=1`) de dump por banco.** Artefato cluster contém `CREATE DATABASE`/`\connect` — restaurá-lo via `psql -f` pode criar/conectar em bancos reais fora do drill, quebrando o isolamento "banco temporário". Só dispara se o operador ativar `BACKUP_ALL_DATABASES=1` (não-default, nada no repo o usa), mas o script permite a combinação. | Antes de usar `BACKUP_ALL_DATABASES=1`, adicionar guarda no restore-test (ex.: detectar header "PostgreSQL database cluster dump" → `not_executable`) ou documentar proibição. Recomendo follow-up pequeno ao 10. |
| 2 | P3 | `openssl enc -pass "pass:$PASSPHRASE"` expõe a passphrase na lista de processos durante a execução. Prefira `-pass env:BACKUP_ENCRYPTION_PASSPHRASE` (openssl suporta `env:`/`fd:`). Mesma observação em restore-test.sh e no verify-crypto. | Hardening futuro; não bloqueia (host é single-operator, janela curta). |
| 3 | P3 | `scripts/backup.sh` passou a fazer `. ./.env` (executa o arquivo como shell) — `.env` malformado ou com valores com espaços pode quebrar ou injetar. Script local/dev; o parse anterior era mais restritivo. | Aceitável; se quiser, voltar ao parse `KEY=VAL` com `export`. |
| 4 | P3 | Em `dr-simulation.sh`, `verify` retorna 1/2 sob `set -e` → o script morre dentro da chamada e o bloco `EXIT=$?; case...` é código morto (exit codes finais continuam corretos). Cosmético. | Nenhuma obrigatória. |
| 5 | P3 | Se o processo for morto (SIGKILL) entre CREATE e DROP, o banco `birthhub_restore_drill_*` fica órfão; DROP em falha é best-effort. Residual aceitável para drill manual. | Documentar cleanup manual no runbook (handoff 10→08 pode cobrir). |
| 6 | P3 | Evidências de teste do handoff (vitest 4/4, smoke com stubs) são declaradas; eu revalidei `bash -n` (4/4 OK) e o `--verify-crypto` real (exit 0). O drill completo com Postgres real não foi reexecutado por mim (exige banco); a lógica foi auditada linha a linha. | Aceitável; primeiro drill agendado em staging é a prova final. |

Tenancy/LGPD: scripts operam sobre dumps de banco inteiro — o artefato `.enc` contém PII; a criptografia AES-256-CBC + passphrase fora de disco mitiga. Recomendação já implícita no handoff: `BACKUP_DEST_DIR`/`BACKUP_SCP_TARGET` devem ter permissões restritas (o script não aplica chmod no destino — verificar no provisionamento).

## Veredito

**APROVADO** — revisão exata `b3f5709ee`, com uma condição registrada: a aprovação cobre o caminho default (dump por banco via `pg_dump`/`pg_dumpall` **por-banco**); o achado #1 (drill não deve aceitar artefato de cluster dump) deve ser corrigido ou explicitamente proibido **antes** de qualquer uso de `BACKUP_ALL_DATABASES=1`. Todos os critérios da missão verificados: fail-closed real (`set -euo pipefail` + verificações de artefato + exit codes), AES-256-CBC sem chave em disco e sem default de passphrase, zero sucesso falso restante nos 4 scripts, drill em banco temporário com DROP garantido e evidência JSON honesta, RPO medido pela idade real do backup (RTO honestamente NOT_MEASURED sem failover real). Pendência bloqueadora **do débito** (não do código): ativação operacional em produção depende de decisão/provisionamento humano — rastreada no handoff 10→00.
