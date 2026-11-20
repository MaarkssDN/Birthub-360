# Handoff — Atualizar docs de backup/DR (DEBT-0002)

De: 10 — Infraestrutura, Observabilidade e SRE
Para: 08 — QA e Release (owner de docs/)
Onda: release-readiness-20261119
Status: resolvido
Prioridade: normal
Bloqueador-ref: DEBT-0002
Sprint destino: release-readiness

## Problema

Após o DEBT-0002, os scripts de backup/restore/DR são reais e fail-closed,
mas a documentação ainda descreve o estado anterior:

- `docs/SRE.md` §4 (linhas ~43-87): afirma "Hoje não existe backup automático
  de produção" — continua verdade no sentido de **agendamento** (nada dispara
  o script em prod), mas agora existe mecanismo real
  (`scripts/db/backup-encrypted.sh`) e drill
  (`scripts/db/restore-test.sh` → `BACKUP-RESTORE-DRILL-RESULT.json`). O texto
  histórico sobre `backup-production.yml` deve permanecer marcado como
  histórico, com uma nota apontando para os scripts atuais.
- `docs/ops/DISASTER_RECOVERY_PLAYBOOK.md` linha ~21: cita restauração via
  `backup-encrypted.sh` — agora a restauração de artefatos `.enc` é feita por
  `scripts/db/restore-test.sh` (drill) / decifragem manual com
  `BACKUP_ENCRYPTION_PASSPHRASE`; vale documentar o procedimento real.

## Arquivo(s) envolvido(s)

- `docs/SRE.md`
- `docs/ops/DISASTER_RECOVERY_PLAYBOOK.md`
- (opcional) `docs/operations/RUNBOOK_LOCAL_FIRST.md` — seção de backup pode
  mencionar `BACKUP_RETENTION_DAYS`.

## Evidência

Ver handoff `10-para-00-debt-0002-backup-real.md` na mesma pasta — scripts
reais, fail-closed, com testes executados.

## Alteração necessária

Atualizar os trechos acima para refletir: mecanismo real existe; agendamento
em prod é pendência operacional (ver handoff ao 00); RPO/RTO só têm lastro
após ativação. Não declarar backup de prod como existente.

## Teste esperado

Revisão do diff de docs pelo 24; consistência com
`.agents/runs/release-readiness-audit-state.json`.

## Contexto adicional

Não editei docs por propriedade (docs/** = Agente 08).

## Resolução

**Agente 10 — 2026-11-19 — branch `handle_all_hands_subagents`.**

Entrega formalizada conforme autorização e missão despachada pelo Agente 00:
1. `docs/ops/DISASTER_RECOVERY_PLAYBOOK.md` atualizado com o playbook executável completo pós-PR #435 / DEBT-0002:
   - Scripts canônicos: `scripts/db/backup-encrypted.sh` (dump streaming AES-256 pbkdf2 com validação SHA-256 e `--verify-crypto`), `scripts/db/restore-test.sh` (drill em banco isolado com `BACKUP-RESTORE-DRILL-RESULT.json`), `scripts/ops/dr-simulation.sh` (cálculo de RPO e fail-closed RTO).
   - Procedimento explícito de restauração manual via OpenSSL + gunzip + psql.
   - Declaração transparente do estado operacional em produção (agendamento cron/systemd pendente de segredos no host).
2. `docs/SRE.md` §4 atualizado documentando que o mecanismo real de backup e drill existe em código, com agendamento automático em produção mantido como pendência operacional no host.
3. `infrastructure/observability/RUNBOOK.md` enriquecido com a Seção 10 (procedimentos de DR e restore).

Status alterado para **resolvido**.
