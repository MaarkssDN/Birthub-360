# Parecer 24 — rehearsal isolado corrigido

Missão aws-release-2026-10-09; autor 00; auditor sync_auditor24.
Script auditado: `C:/Github/Birthub-360/.tmp/antigravity-sync/rehearse-db.py`.
SHA-256 confirmado: `8274896079ef0b885a5a6ad72af2065a4449a4251ae6e4a993dd0695299beedd`.

**APROVADO** exclusivamente executar restore/migrate rehearsal em recursos Docker novos isolados, usando o backup privado existente e a imagem nova identificada pelo SHA/digest final aprovado para artefato. Esta aprovação não permite migrations/restart/cutover de produção, nem substitui CI de release. A execução pode produzir erro diagnóstico sem ser relatada como sucesso.

## Correções verificadas por leitura integral e hash

- Script compara PostgreSQL digest com `.Image` do container birthhub_postgres e exige Running; prospectordb é nome confirmado no preflight pelo 00.
- Root com SHA hexadecimal/diretório releases esperado, sem symlink, chmod0700. Backup sem symlink no diretório explicitamente aprovado, modo0600.
- Log/env/manifest usam os.open O_NOFOLLOW e fchmod0600 inclusive para arquivo existente; umask077. Sem saída de ENV ou dados de tabelas.
- Bloqueia volume e container preexistentes, não reaproveita dados implicitamente. Rede internal dedicada sem HostPorts; volume novo; backup bind readonly; recursos limitados.
- Roles e memberships preservam atributos/permissões sem ler password hashes. Restore usa exit-on-error e não remove ownership/ACL; falha interrompe.
- Prisma recebe somente URLs sandbox mínimas e roda deploy/status/deploy idempotente, sem iniciar app ou worker. Imagem/CLI dentro da rede isolada não recebe credenciais de produção.
- Compara contagens existentes antes/depois, migrations unfinished e RLS esperado. O dump contém PII: manutenção e logs continuam locais privados. Nada é enviado ao Git.
- Não para/remove/migra aplicação ou banco de produção. A única parada ao final corresponde ao DB sandbox criado pelo próprio script.

## Limites da aprovação

Pycompile pass foi informado pelo 00; leitura/hash confirmados independentemente. Nenhuma execução remota ou leitura de chave/segredo pelo auditor. Resultado real restore/migrate ainda NÃO EXECUTADO nesta revisão. Exigir manifest resultante com exit0, imagem/digest e SHA final correspondentes; script ainda não prova isolamento cross-tenant real nem compatibilidade da imagem antiga contra schema migrado, necessários para release posterior.

Imagem de aplicação precisa ser associada externamente ao commit final por label/manifest e conter todas migrations com hashes corretos antes de executar. Backup foi aprovado para este ensaio; uma release posterior exige janela e backup apropriados. Não apagar recursos preexistentes ou dados em caso de erro; reconciliar manualmente conforme evidência.

Proprietários comunicados: 00/08A/10/01. Correções MAC/aliases do cutover foram enviadas ao autor; esse script não ganhou aprovação de produção por este parecer. Única escrita do auditor: este documento.

## Reauditoria adicional — proteção do artefato e migrations

Nova revisão `60901c8b5ad43d1247068592afb2d5b38e1e7566a48cb6ac38942ddeef179145`: conteúdo integral e SHA256 confirmados. **APROVADO no mesmo escopo restrito de rehearsal isolado**, substituindo a revisão827489 acima; sem aprovar produção.

Adiciona comparação do ID da imagem e label org.opencontainers.image.revision com SHA do diretório release; coleta migrations da imagem em container efêmero networknone sem start da aplicação; exige mesmo conjunto de migration.sql do source Gitarchive; consulta apenas nomes/checksums/finished/rolledback da tabela migrations de produção, rejeitando failed/missing/modified. Checksums alternativos LF/CRLF tratam somente representação de linha. Extração AST do código JavaScript embutido confirmou regex newline corretamente escapada. Não amplia acesso ou ENV reais; todas outras proteções anteriores permanecem. Fonte extraída deve continuar ligada ao tarhash/SHA auditado e arquivos da imagem construídos desse contexto. Restore/rehearsal real ainda pendente; resultados posteriores devem ser apresentados para release final.
