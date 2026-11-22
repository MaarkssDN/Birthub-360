# Parecer 24 — preservação Git Antigravity e preparação AWS

- Missão/onda: sync-antigravity-2026-10-09, fase 1.
- Autor operacional: 00/08A; auditor independente: 24.
- Base de consulta: `d930264ae60d5b4ca5026c05c4131d0bce8fb64d`.
- Ambiente isolado: worktree audit-antigravity-sync, HEAD destacado na base acima.
- Revisão exata aprovada para preservação: `39bca3a2bf6e690253550e3f3057dd829e055979`.
- Destino permitido: nova branch `codex/backup-antigravity-desktop-2026-10-09`, sem integrar main, sem force, sem apagar refs/stashes/worktrees.
- Decisão da preservação: **APROVADO**.
- Decisão de release/deploy: **BLOQUEADO**, aguardando evidências pertinentes de ambiente, gates e plano de execução.

## Suposições e escopo

Preservar o stash como ref remoto é backup autorizado de trabalho existente. Não representa aprovação funcional das mudanças, integração, release ou autorização para executar workflows manualmente no stash. A autorização humana de deploy existe; aprovação técnica continua dependente da revisão e do ambiente exatos. A chave privada não foi acessada.

Plano executado: ler governança e prompts → compreender limites; enumerar objetos novos e todos os pais → delimitar conteúdo transmitido; ler integralmente diff/novos blobs e examinar padrões de segredo → verificar higiene; examinar contrato AWS → registrar lacunas sem declarar publicação pronta.

## Evidência da preservação

`git show --no-patch --format=raw` identificou dois pais:

1. `06256a6e5ee12835612fb7668cfef77ffc4a29af`: base histórica já alcançável nos refs remotos.
2. `f9eeae8c7aa5180c9277859feddd0b0bbcf924f4`: índice histórico; seu único diff contra a base é o teste de voice runtime.

`git rev-list <stash> --not --remotes` retornou somente o stash e seu segundo pai. `git rev-list --objects` delimitou esses dois commits, árvores e somente dois novos blobs:

| Arquivo | Blob Git |
| --- | --- |
| `src/components/layout/AppTopbar.tsx` | `1d4b324e6a30d3ec7a8b927d39bc8f20db3fb74b` |
| `tests/unit/lib/voice-runtime/intentAndFollowup.test.ts` | `803fd86ac00875a9e3ef53f5946c0e8cc2350afb` |

Diff completo: dois arquivos, 57 inserções e 88 exclusões. Não inclui .env, chaves, dumps, logs, node_modules, dist ou outros artefatos proibidos. Leitura humana do conteúdo e varredura dos dois commits/dois blobs: zero ocorrências de padrões de chave privada, AWS access key, token GitHub/OpenAI, atribuição literal sensível longa ou URL de banco com senha. Varredura baseada em padrões não é garantia universal; nenhuma evidência positiva foi encontrada neste conteúdo delimitado.

Os gatilhos do workflow AWS vigente estão restritos a push em main e execução manual. A nova branch de backup não corresponde ao gatilho de produção. `git show <stash>:.github/workflows/deploy-aws.yml` confirmou os mesmos gatilhos no conteúdo histórico do stash.

Typecheck, lint, build, testes funcionais e audit npm: **NÃO EXECUTADOS e não aplicáveis à mera preservação histórica como branch sem integração**. O conteúdo inclui alterações visuais e teste ainda não validados funcionalmente. Esses gates permanecem obrigatórios antes de considerar o conteúdo uma entrega de produto ou implantá-lo.

## Leitura estática AWS — achados e critérios pendentes

Arquivos examinados: `.github/workflows/deploy-aws.yml`, `Dockerfile`, `package.json`, `.agents/prompts/08A-git-deploy-aws.md`, `docs/operations/PRODUCTION_ARCHITECTURE.md`, guia de produção arquivado e script de rollback.

1. **Destino não demonstrado (00/08A/10):** a documentação canônica suporta single-node Docker Compose. O workflow descreve ECS/ECR/S3/CloudFront. Confirmar host/conta/região/topologia e versão atual por inspeção segura. Um PEM é mecanismo de acesso SSH, não identificação suficiente do destino. Não assumir que nomes versionados comprovam recursos existentes.
2. **Versão ECS (08/10):** workflow publica tags SHA e latest no ECR, mas força redeploy sem registrar/selecionar explicitamente nova task definition. Exigir imagem/digest observado nas tasks; HTTP 200 não demonstra revisão publicada. Achado aplicável caso escolhido o caminho ECS.
3. **Conteúdo público S3 (08/10):** `build` gera `dist/server.cjs` com sourcemap; workflow sincroniza todo `dist/` ao S3 com exclusão. Confirmar destino e seleção de arquivos, impedindo backend/sourcemaps privados no bucket público. Achado aplicável caso escolhido o caminho S3.
4. **Migrações (01/08/10):** Dockerfile já inicia com `npx prisma migrate deploy && exec npm run start`; portanto não foi confirmada ausência de migração no boot dessa imagem. Ainda verificar imagem utilizada, acesso de migração, resultado real e readiness antes do tráfego.
5. **Gates (08/00):** confirmar resultados para SHA exato de typecheck, lint, arquitetura, unitários, integração, E2E, build, npm audit e scan do diff; integração/IA conforme aplicabilidade. Nenhum resultado atual de release foi fornecido a esta fase.
6. **Rollback (08A/10/01):** script consultado é orientativo, não executa rollback da imagem. Identificar revisão anterior, backup, restauração e reversibilidade de migrações antes de publicar.
7. **Evidência pós-publicação (08A/22/24):** versão/digest, migração, readiness, frontend e API no domínio real, autenticação e observabilidade. Deploy ignorado por ausência de OIDC não equivale a deploy concluído.

Não foi aberta correção de produto/workflow pelo auditor. As necessidades acima foram comunicadas ao Coordenador para encaminhamento conforme destino confirmado; não há autorização deste parecer para alterar infraestrutura de outro proprietário.

## Comandos, resultados e limitações

- Leitura AGENTS.md e prompts 24/08A: executada.
- `git show`, `git diff`, `git rev-list`, `git cat-file`, `git status`, `git rev-parse`: executados, evidências acima; worktree inicialmente limpo.
- Varredura PowerShell de commits/blobs novos: executada, zero achados nos quatro conteúdos.
- Busca de workflows/documentos/scripts: executada; nenhuma publicação externa pelo auditor.
- Consulta a `docker-entrypoint.sh`: arquivo inexistente; contrato encontrado diretamente no CMD do Dockerfile.
- Busca usando wildcard `docker-compose*.yml` como argumento rg no Windows: erro de expansão; não utilizada como evidência de resultado.
- Testes de aplicação, conexão AWS, SSH, deploy, rollback e validação visual: NÃO EXECUTADOS nesta fase.

## Conclusão e riscos

Somente o backup remoto do SHA de stash identificado está aprovado. Conservar o stash e todos os refs existentes. O Coordenador deve verificar o SHA remoto após push. Qualquer mudança do conteúdo ou integração exige novo parecer. Sincronização integral de outras branches/worktrees depende do inventário e conferência operacional do 00; este parecer não certifica alterações que não foram apresentadas.

O deploy continua BLOQUEADO por evidência insuficiente nesta fase; autorização do usuário não foi confundida com validação técnica. Nenhum arquivo de produto, workflow, prompt ou governança foi alterado. Única escrita do auditor: este parecer.

### Evidência de conclusão recebida do 00

O operador confirmou push para origin/codex/backup-antigravity-desktop-2026-10-09 com SHA remoto `39bca3a2bf6e690253550e3f3057dd829e055979`, igual ao conteúdo aprovado; branch local/upstream 0/0. Oito branches originais 0/0 e seis stashes inalterados. Residual Antigravity sem .git foi comparado com a branch origin usando índice temporário: nenhum arquivo existente alterado; 2277 arquivos ausentes foram preservados no remoto sem propagar exclusões de checkout parcial. Extra mock_data_search.txt é saída derivada de busca sem segredo. Dois HTML scratch sem Git preservados. Esses resultados operacionais foram fornecidos pelo 00, não executados novamente pelo auditor. Completam a evidência da preservação autorizada; não ampliam a aprovação para integração ou deploy.

## Complemento fase 2 — plano EC2, sem aprovação de release

Informação operacional recebida do 00: EC2 `ubuntu@3.143.251.44`, diretório `/home/ubuntu/birthhub-360` sem Git, container `birthhub-app` sem bind mounts, Node 22, `PORT=3024`, imagem corrente identificada pelo operador, boot com migração seguida de start. Liveness observado pelo operador; versão corrente ainda unknown. Essas informações não foram obtidas por acesso remoto do auditor.

Leitura integral de `deploy-ec2.ps1`, `deploy-ec2.sh`, `deploy-aws.ps1` e `src/bootstrap/healthchecks.ts` confirmou:

- Os dois scripts EC2 substituem arquivos no host e reiniciam o container. Sem mount, o container continua com seu próprio conteúdo; isso não demonstra atualização. O shell ainda envia node_modules do ambiente local, incompatível com dependências nativas Windows/Linux.
- O script AWS usa docker cp e restart. Não oferece imagem reproduzível, identificação da revisão, migração/versionamento verificáveis, gate ou rollback completo. Imprime conclusão baseada na sequência de comandos, sem validar readiness/revisão.
- `/health/live`, `/health/ready` e `/health/version` expõem commit/versão; versão usa também DEPLOY_TIMESTAMP. Readiness verifica banco e Redis quando filas habilitadas; storage configurado não demonstra acesso real.

### Alternativa recomendada ao 00/08A/10

1. Após remediação e gates, exportar contexto do commit aprovado por Git archive, sem .env ou arquivos ignorados. Construir imagem Linux reproduzível do Dockerfile existente, identificada por SHA/digest. Esse Dockerfile usa fontes/scripts e executa build: um tar contendo somente dist/package/schema não atende seu contrato. Não reutilizar node_modules Windows nem usar diretório remoto com .env como contexto amplo.
2. Preservar imagem e container antigos, configuração completa e redes; copiar só environment/ports não garante equivalência. Conferir aliases, extra-hosts, user, restart policy, limites, healthcheck, comandos e portas. Não expor environment em saída ou relatório.
3. Preparar nova imagem e staging sem alterar a instância atual. Confirmar espaço e recursos: build remoto pode pressionar a mesma máquina de produção. Backup externo de dados deve estar concluído e verificável antes de migração.
4. Validar migrações com 01, executá-las em tarefa identificada antes do novo start e considerar compatibilidade do schema com imagem antiga. Reverter imagem não desfaz migração; plano de rollback precisa cobrir ambos.
5. Somente com gates e parecer APROVADO da revisão final, efetuar troca preservando container antigo e validar commit, liveness, readiness, frontend/API e Nginx. Usar COMMIT_SHA, BUILD_VERSION e DEPLOY_TIMESTAMP correspondentes à release.
6. O HEALTHCHECK da imagem atual versionada fixa porta 3000, enquanto ambiente observado usa 3024. Nova execução deve ajustar healthcheck explicitamente ao PORT real; HTTP externo isolado não corrige esse conflito.

Gate arquitetura do HEAD `d930264ae60d5b4ca5026c05c4131d0bce8fb64d`: falha informada pelo 00 em oito dependências entre features. **PRÉ-EXISTENTE na base e BLOQUEADOR de release até remediação**, sem sugerir relaxar a regra. Gates restantes e SHA corrigido não apresentados ao auditor nesta revisão. Autorizar preparação de staging não significa aprovação para restart, migração ou troca de produção. O parecer de backup permanece APROVADO no escopo original; release permanece BLOQUEADO.
