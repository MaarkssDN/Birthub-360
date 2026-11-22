# Playbook de Recuperação de Desastres (Disaster Recovery — DR) — Birth Hub 360
**SRE / Infraestrutura:** Agente 10  
**Data:** 19 de novembro de 2026 (Atualizado pós-PR #435 / DEBT-0002)  
**Status:** HOMOLOGADO / SCRIPTS REAIS E FAIL-CLOSED

---

## 1. Métricas de Continuidade Operacional

- **RTO (Recovery Time Objective):** Alvo < 15 minutos em failover primário/secundário. Medição formal realizada via `scripts/ops/dr-simulation.sh` através da variável `DR_FAILOVER_CMD`; na ausência do comando de chaveamento automatizado, o script reporta honestamente `NOT_MEASURED` (exit code 2) sem emitir falso sucesso.
- **RPO (Recovery Point Objective):** Alvo < 24h para backup diário. Em simulação e auditoria, o RPO é medido pelo delta temporal entre o backup criptografado mais recente (`*.sql.gz.enc` em `$BACKUP_DIR`) e o timestamp atual contra o limiar `DR_RPO_TARGET_SECONDS` (padrão 86.400s / 24h).

---

## 2. Ferramentas e Procedimentos de DR (Pós-PR #435)

### 2.1 Backup Criptografado Ponta a Ponta (`scripts/db/backup-encrypted.sh`)
- **Geração:** Executa `pg_dump` ou `pg_dumpall` conectado ao PostgreSQL e processa o fluxo diretamente em pipeline:
  `pg_dump -> gzip -> openssl enc -aes-256-cbc -pbkdf2`
  Nenhum dado em claro toca o disco durante a operação.
- **Validação de Integridade:** Valida round-trip com decifragem e teste `gzip -t` antes de emitir hash SHA-256 e registrar o artefato.
- **Retenção:** Aplica expiração automática de arquivos `.enc` mais antigos que `BACKUP_RETENTION_DAYS` (padrão 30 dias).
- **Cópia Off-site:** Opcionalmente transfere o arquivo via SCP para `BACKUP_SCP_TARGET`.
- **Verificação criptográfica unitária:**
  ```bash
  bash scripts/db/backup-encrypted.sh --verify-crypto
  ```

### 2.2 Restauração e Drill Automatizado (`scripts/db/restore-test.sh`)
O drill de restore valida periodicamente a capacidade real de recuperação sem afetar o banco principal:
1. Restaura o backup mais recente em banco temporário isolado (`birthhub_restore_drill_<timestamp>`).
2. Executa sanity checks: contagem de tabelas no schema `public` e confirmação das migrações Prisma (`_prisma_migrations`).
3. Emite evidência JSON em `BACKUP-RESTORE-DRILL-RESULT.json`:
   - `status: passed` (exit 0)
   - `status: failed` (exit 1)
   - `status: not_executable` (exit 2)
   ```bash
   bash scripts/db/restore-test.sh
   ```

### 2.3 Restauração Manual em Caso de Incidente Crítico
Caso seja necessário restaurar um backup criptografado diretamente em uma instância de banco restaurada:

1. **Definir credenciais e arquivo:**
   ```bash
   export BACKUP_ENCRYPTION_PASSPHRASE="<chave-secreta-de-cifra>"
   export TARGET_DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   BACKUP_FILE="/caminho/para/backup_YYYYMMDD_HHMMSS.sql.gz.enc"
   ```

2. **Decifrar e aplicar o dump:**
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 \
     -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
     -in "$BACKUP_FILE" | \
     gunzip | \
     psql "$TARGET_DATABASE_URL"
   ```

3. **Verificação de Integridade Referencial e Schema:**
   ```bash
   npx prisma migrate status
   ```

---

## 3. Procedimento Operacional de Failover e Restauração a Quente

1. **Detecção e Isolamento:**
   - O healthcheck do proxy reverso detecta indisponibilidade contínua de `/health/ready` (> 3 falhas de 5s).
   - Isolamento imediato do tráfego para failover passivo.
2. **Promover Réplica ou Restaurar Snapshot Recente:**
   - Se réplica PostgreSQL quente estiver disponível: promover a réplica para primária (`pg_ctl promote`).
   - Se necessária restauração de desastre: executar procedimento manual do item 2.3 utilizando o último snapshot `.sql.gz.enc`.
3. **Validação de Saúde:**
   - Testar conectividade do pool e healthcheck da aplicação (`GET /health/ready`).
4. **Rechaveamento de Tráfego:**
   - Apontar o proxy (Caddy / Nginx / Load Balancer) para o nó restaurado.

---

## 4. Status Operacional de Produção

- **Implementação em Código:** Completa, testada e sem falsos sucessos (PR #435 / DEBT-0002).
- **Ativação Operacional em Produção:**
  1. Provisionar `BACKUP_DATABASE_URL` (com permissões `BYPASSRLS` para dump completo de todos os tenants).
  2. Provisionar `BACKUP_ENCRYPTION_PASSPHRASE` no secret manager do host de produção.
  3. Configurar cronjob diário no host (ex: `0 3 * * * /path/to/scripts/db/backup-encrypted.sh`).
  4. Configurar drill semanal via cron para `scripts/db/restore-test.sh`.
