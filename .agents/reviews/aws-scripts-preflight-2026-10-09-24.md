# Parecer 24 — scripts de preflight e rehearsal

Missão aws-release-2026-10-09. Autores 00/release_architecture. Auditor sync_auditor24.

## Revisões examinadas

- `.tmp/aws-deploy-safe.py` no worktree autor: SHA-256 `274c858efb53392dd2ce224e1d6b7876f4ef9c138ee8d46c9e7046b09e5bf720`.
- `.tmp/test_aws_deploy_safe.py`: SHA-256 `f4cd098963a1cf71fc5a807946d774baf374f5d144807e4e0a8ac03d8bb0879c`.
- `.tmp/antigravity-sync/rehearse-db.py` do 00: revisão informada `85dd4b8749492dbe00f6b7cd6aead13fd2f34dfdfd2cf5d898b611fd819e2b32`, conteúdo integral lido.

## Decisão

**APROVADO** executar somente comandos `preflight` e `clone-plan` do primeiro script, que consultam Docker e escrevem manifests privados sem parar/reiniciar/migrar/criar container de produção. Usar diretório novo privado0700 sem symlink e parâmetros da revisão/image/container confirmados. O comando clone-plan prepara configuração; não publica imagem.

**BLOQUEADO** executar rehearsal nesta revisão até verificações concretas abaixo. **BLOQUEADO** cutover/rollback de produção nesta revisão; CI, artefato SHA final, compatibilidade de schema e aprovação de release permanecem pendentes. Os testes fake não substituem evidência real.

## Evidências

Leitura integral dos scripts e testes. Auditor executou `python .tmp/test_aws_deploy_safe.py` com bytecode desabilitado: exit0, oito testes PASSARAM. Cobrem preservar configuração, identidade/mount drift, sucesso, falha start, resposta create perdida, falha health, recuperação por ID e perda silenciosa de configuração. Hash cutover confirmou revisão recebida. Nenhuma conexão AWS, leitura de segredo ou mutação Docker pelo auditor.

Rehearsal usa rede internal dedicada sem portas, volume novo, backup readonly, credenciais efêmeras, URLs mínimas sandbox, somente Prisma CLI deploy/status/deploy, restore exit-on-error e roles/memberships sem password hashes; conserva dados originais por contagem antes/depois e verifica RLS de LeadTouchpoint. Não inicia app/worker ou altera container de produção. Isso é desenho adequado, mas ainda não demonstra clone fiel de todos contratos/RLS nem compatibilidade da imagem antiga após migrations.

## Correções antes do rehearsal

1. Comparar argumento database-image com `.Image` real de `birthhub_postgres` por inspect; atualmente script aceita qualquer string sha256 de comprimento esperado sem demonstrar mesmo digest. Confirmar container e database hardcoded correspondem ao preflight aprovado. Divergência deve falhar antes de criar recursos.
2. Verificar root0700, ausência de symlink nos destinos log/env/manifest e chmod0600 explícito nos arquivos, especialmente existentes. Umask não corrige permissões de arquivo já existente aberto com append/write_text. Dump/restore contêm PII; não ampliar acesso.
3. Validar SHA/digests com hex completo, arquivos de backup regulares privados e sem symlink antes de uso. Reconciliar recursos existentes sem deletá-los automaticamente em retry.
4. Após restore/migrate, relatórios podem conter somente hashes/contagens, sem dados. Recursos e credenciais temporárias devem permanecer isolados e privados, inclusive em falha.

## Riscos antes do cutover posterior

- payload atualmente preserva MacAddress observado inclusive se atribuído dinamicamente; plano anterior distingue MAC configurado de incidental. Também copia aliases gerados por ID. Não aprovar cutover genérico sem endpoint real e regra validada para preservar aliases funcionais e evitar colisões.
- verify_clone usa igualdade estrita de HostConfig, portanto diferenças normalizadas pelo daemon falham antes do start; isso é fail-closed, porém pode causar tentativa de rollback. Precisará ensaio concreto e comparação do schema API real.
- Rehearsal não valida oldimage contra schema migrado nem tenant cross-access real. Approvals de CI/schema não podem ser preenchidas por expectativa.
- Writable layer, configuração do proxy, completo old/image ID e backup restaurado continuam checkpoints de release. Não confundir `operation completed` preflight com deploy.

Problemas enviados ao 00/08A/10 e 01 conforme domínio. Única escrita do auditor é este parecer. Nova revisão dos scripts exige novo hash/parecer antes de avançar.

## Reauditoria endpoints — revisão31dd

Script SHA256 `31dd53a56ae32cd57ac3cf8ed5d7c027cdf5745e1ea3c028ebfdb072f725644d`; testes SHA256 `bb420b9d4e16d2760fa1e258cc448dd9ccda98a63e0fd708714020626375e795`, ambos conteúdo integral lido e hashes conferidos. Auditor reexecutou Python testes fake: 12/12 PASS, exit0. **APROVADO somente preflight/clone-plan desta revisão**, sem aprovar produção.

Correções atendidas: endpoint mapping privado obrigatório distingue MAC static/dynamic com evidência e valor observado exato; MAC dinâmico é omitido da criação; aliases de oldID/shortID removidos, hostname incidental removido somente com evidência explícita, aliases funcionais preservados; aprovação final vincula hash desse mapping. Testes cobrem MAC/aliases e normalização pelo daemon sem aceitar perda funcional. Rollback restaura endpoint do próprio container antigo, sem removê-lo.

Condições para aprovação posterior de cutover: manifest real endpoint/config/image/SHA, gatesCI, restore/migration e oldschema compatibility demonstrados, writable layer e proxy conferidos, nova aprovação exata. Rotina health do script valida commit/live/ready; operador deve validar externamente versão/timestamp e proxy conforme plano. Estado healthy-awaiting-external-validation não equivale a release concluída.
