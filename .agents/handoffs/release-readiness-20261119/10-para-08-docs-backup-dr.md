# Handoff — Atualizar docs de backup/DR (DEBT-0002)

De: 10 — Infraestrutura, Observabilidade e SRE
Para: 08 — QA e Release (owner de docs/)
Onda: release-readiness-20261119
Status: aberto
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
