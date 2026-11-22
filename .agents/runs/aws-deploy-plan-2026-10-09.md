# Plano concreto de deploy EC2 — aws-release-2026-10-09

Autor: Coordenador00 / release_architecture. Estado: PLANO, NÃO EXECUTADO, depende de APROVADO do24 e CI completo no SHA exato. Único arquivo criado nesta fase; código da remediação permanece congelado. Nenhuma sessão SSH, chave PEM, segredo ou arquivo privado foi acessado pelo autor.

## Destino e evidência disponível
Destino confirmado pelo Coordenador: ubuntu@3.143.251.44, região us-east-2, aplicação /home/ubuntu/birthhub-360. Container birthhub-app, imagem antiga com identificação parcial a3c889..., Node22, PORT3024, rede app_default, sem mounts. Obter ID/image digest COMPLETOS no preflight; prefixo parcial não é identidade suficiente.
Backup confirmado pelo Coordenador: /home/ubuntu/deploy-backups/codex-20261009T044234Z/container-inspect.private.json e prospectordb.dump, modo0600; pg_restore --list com1395entradas. NÃO houve restore. O dump contém dados pessoais e permanece apenas no host protegido; nunca copiar para Git/relatório/chat.

## Achados do repositório
- deploy-ec2.ps1 e deploy-ec2.sh trocam dist no host e reiniciam container. Sem mounts, mudar o host não altera o filesystem executado pelo container. O sh também copia node_modules Windows, inadequado para runtime Linux.
- deploy-aws.ps1 usa docker cp em container antigo e reinicia, sem sincronizar node_modules/migrações/metadata. A camada mutável perde rastreabilidade e rollback de imagem.
- Dockerfile constrói Node22, Prisma Client, servidor e worker, reinstala CLI Prisma e usa migrate deploy antes de start. O HEALTHCHECK da imagem está fixado em3000, portanto deve receber override3024 neste destino. Não alterar Dockerfile nesta missão.
- prisma.config.ts usa DIRECT_URL antes de DATABASE_URL; sandbox precisa sobrescrever AMBAS para impedir acesso ao banco real. Não usar fallback localhost, migrate reset, db push, resolve artificial nem editar histórico.
- src/bootstrap/healthchecks.ts: /health/live verifica processo; /health/ready exige SELECT1 e Redis ping quando filas habilitadas; storage apenas configurado NÃO comprova disponibilidade. /health/version deve devolver COMMIT_SHA, BUILD_VERSION, DEPLOY_TIMESTAMP; defaults unknown não comprovam release.
- .dockerignore exclui env/pem/key/dump/dist/node_modules. Verificar arquivo migration.sql presente NA IMAGEM para cada migration aprovada, não inferir do build. Scripts migration safety aceitam drops históricos; isso não demonstra que migrations PENDENTES são compatíveis com rollback.

## Critérios obrigatórios antes da produção
1. SHA aprovado identificado e immutable, auditor24 APROVADO para código+plano e CI completo correspondente PASSOU. Teste pendente/skip-deploy não equivale a release aprovado.
2. Host key SSH já verificada; conexão do Coordenador usa caminho de chave autorizado sem registrar conteúdo. Nenhum StrictHostKeyChecking=no.
3. Preflight read-only registra IDs/digests, DockerAPIVersion, rede/aliases/ports/User/Cmd/Entrypoint/WorkingDir/RestartPolicy/Healthcheck. Env/inspect completos permanecem arquivos0600, nunca stdout. Confirmar snapshot privado corresponde ao mesmo container atualmente ativo; se mudou, novo backup/novo plano.
4. docker diff da camada mutável e inventário privado de /app/uploads/storage/caches: sem mounts não significa sem dados no container. Dados persistentes na camada são bloqueador até backup+preservação acordados; não copiar cegamente camada inteira por conter segredos/artefatos velhos.
5. Identificar serviços de banco e Redis pelas URLs privadas e containers/rede reais; não inventar nomes/portas/senhas. Identificar imagem/digest e versão PostgreSQL+extensões. Espaço livre suficiente para nova imagem, dump, banco restaurado e oldcontainer.
6. Obter pendências de _prisma_migrations e comparar checksums/applied_names com SHA aprovado em arquivos privados, sem conteúdo de tabelas no relatório. Sem pendência failed e sem modifiedmigration histórica.

## Fase A — artefato aprovado, sem cutover
No checkout do Coordenador, executar git archive --format=tar --output=<release-sha>.tar <SHA_APROVADO>. Somente árvore commitada exata; não enviar workingtree, node_modules local, env, chave ou dist avulso. Calcular SHA256 do tar, transferir para /home/ubuntu/releases/<SHA>/source.tar, conferir hash remoto; diretório0700. Extrair em diretório novo, nunca sobre checkout/config da aplicação existente. Build docker da fonte Linux com Dockerfile aprovado; tag birthhub-release:<SHA>, label org.opencontainers.image.revision=<SHA>. Resolver IDsha256 definitivo da imagem e gravar manifesto0600 com SHA/tarhash/imageid/oldid/oldimageid. Usar imageID, não tag mutável, no clone.
Validar dentro de container efêmero sem portas: node --version=22, arquivos dist/server.cjs+worker.cjs, PrismaCLI/config/schema/migrations completos; comparar migration manifest/hash com source.tar. Build sem injetar credenciais. Dependências apt/npm exigem rede no build, mas fonte final e lockfile fixam escopo; falha encerra antes de produção.

## Fase B — rehearsal de restore e migration em isolamento
Criar rede Docker dedicada Internal=true, sem acesso egress ou rede app_default, e volume novo com nome exclusivo ligado a este SHA. Containers sem HostPort/PortBindings/privileged/socket/mountsprodução. DB temporário usa MESMO digest PostgreSQL/pgvector da instância real, extensão/versão compatíveis, credenciais efêmeras aleatórias guardadas somente em memória/arquivo0600. AutoRemove=false até validação para preservar evidência privada.
Copiar prospectordb.dump protegido para container de restore via PUT /containers/{id}/archive ou mount read-only apenas desse arquivo (pasta backup não inteira). Preparar roles necessárias (nomes/atributos/permissões) em sandbox a partir de catálogo read-only de produção ou manifest privado, SEM password hashes. Aplicar restore strict pg_restore --exit-on-error; replicar ownership/grants/RLS, não usar --no-owner/--no-acl para esconder role ausente. Capture stderr privado0600; relatório só exitcode+contagens+nomes migrations permitidos. Erro de role/extensão/ownership bloqueia; TOC não substitui restore.
Conferir contagens por tabela/organização, schema, FK/RLS e _prisma_migrations comparadas ao dump; não publicar PII nem linhas de dados. Registrar manifests de checksums/contagens em privado.
Executar imagem aprovada em container ONE-SHOT: entrypoint nulo, Cmd=["node_modules/.bin/prisma","migrate","deploy"], ENVclonado privado com DATABASE_URL e DIRECT_URL apontando EXCLUSIVAMENTE para DB sandbox, SHADOW_DATABASE_URL também isolada. Sem executar npm start/worker, sem integrações externas, sem redeprodução e semports. Esperar /containers/{id}/wait, exigir StatusCode0; executar migrate status e segundo migrate deploy idempotente.
Reavaliar contagens/integridade após migration. Revisar SQL APENAS das migrations pendentes para drops, DELETE, renomes, constraints, backfills, irreversibilidade e tempo/locks. Validar imagem ANTIGA contra schema migrado em sandbox usando mesmas queries/contratos críticos (compatibilidade de rollback); não presumir que migrations antigas são seguras. Testes integração tenant/opt-out pertinentes contra sandbox quando harness suporta; nunca trocar runtimekeys reais por fixtures inventadas. Sem pending migrations, registrar comprovadamente no-op; com incompatibilidade ou destruição, bloquear cutover e solicitar decisão humana de banco/rollforward.
Não iniciar app inteiro em rehearsal com URLs reais: automações/embeddedworkers podem atuar. Se boot sandbox for necessário, usar DB/Redis/storage e destinos isolados, desabilitar produtores via flags EXISTENTES verificadas, e manter egress bloqueado. Não afrouxar auth nem inventar controles. Qualquer dependência impossível de isolar vira bloqueio explícito.

## Fase C — migrations produção, depois aprovação dos ensaios
Antes de mutação, renovar dump consistente/backup privado e validar o restore no ensaio apropriado se o antigo ficou distante da janela. Pausar produtor/workers e tráfego de escrita conforme mecanismo real existente; manutenção gera downtime planejado e reversível. Registrar duração e dependências. Não inventar readiness como read-only global.
Aplicar migrations pendentes pela imagem nova em one-shot clone mínimo usando ENVprodução privado e rede real, comando PrismaCLI explícito e sem start/worker. Exigir exit0, migrate status limpo, sem failedmigration. DefaultCmd novo migra no boot, mas clone integral doCmd antigo pode não conter prefixo; este one-shot garante migração anterior ao tráfego preservando oCmd antigo. Não sobrescrever Cmd silenciosamente. SeCmd antigo não consegue executar os artefatos da imagem nova (path/args), BLOQUEAR e ajustar plano com24.
Falha de migration: NÃO proceder cutover, manter oldapp só se schema continua compatível/seguro; seguir parecer owner01 para schema. Não restaurar dump automaticamente nem editar _prisma_migrations; restore exigiria decisão explícita porque pode apagar escritas recentes.

## Script remoto Python proposto — DockerAPI unix socket
Implementar depois de24aprovar; arquivo operacional privado fora do Git. Usar biblioteca padrão http.client/socket/json/copy/time/os, conexãoAF_UNIX a /var/run/docker.sock, os.umask(0o077), sem subprocessshell contendoenv. Negociar GET /version e prefixo /v<APIVersion> validado; todas respostas e erros potencialmente sensíveis ficam em log privado0600. stdout somente fase/status/IDs/SHA/hashes, nunca Config.Env, URL, logscrus. Ref API oficial: https://docs.docker.com/reference/api/engine/version/v1.51/ ; negociar versão real em vez de assumir1.51.

Pseudocódigo de funções essenciais (não executado):

```python
# request() usa HTTPConnection cujo connect abre socket.AF_UNIX;
# valida expected_status, grava detalhes de erro apenas em arquivo0600;
# não faz retry cego de mutations: reconciliar estado antes de retentar.
old = request('GET', f'/containers/{OLD_NAME}/json')
assert old['Id'] == APPROVED_OLD_ID
assert old['Image'] == APPROVED_OLD_IMAGE_ID
assert not old['Mounts']  # se diferente do preflight, reavaliar preservação
assert not old['HostConfig']['AutoRemove']
assert old['Config']['WorkingDir'] == '/app'
config = deepcopy(old['Config'])
host = deepcopy(old['HostConfig'])
config['Image'] = APPROVED_NEW_IMAGE_ID
# Preservar Env ORDENADA e todos valores secretos; mudar somente3metadata.
metadata = {'COMMIT_SHA': APPROVED_SHA,
            'BUILD_VERSION': APPROVED_VERSION,
            'DEPLOY_TIMESTAMP': APPROVED_TIMESTAMP}
config['Env'] = [e for e in config['Env'] if e.split('=', 1)[0] not in metadata]
config['Env'] += [k + '=' + v for k, v in metadata.items()]
config['Healthcheck'] = {'Test': ['CMD', 'node', '-e',
    "fetch('http://127.0.0.1:3024/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"],
    'Interval': 30_000_000_000, 'Timeout': 5_000_000_000,
    'StartPeriod': 30_000_000_000, 'Retries': 3}
# Conf/Host completos preservados, incluindo User/Cmd/Entrypoint/WorkingDir,
# restartpolicy, recursos, DNS, portas, SecurityOpt, capabilities e readonlyfs.
# Não aceitar warning API de campo ignorado ou silentlydrop desconhecidos.
networks = {}
for netname, endpoint in old['NetworkSettings']['Networks'].items():
    # EndpointID/Gateway/IPAddress/PrefixLen/NetworkID são estado do daemon;
    # não são campos criáveis. IPAMConfig/DriverOpts/GwPriority/MacAddress
    # configurados são preservados quando suportados pela APInegociada.
    networks[netname] = deepcopy({k: endpoint[k] for k in
        ('IPAMConfig', 'Links', 'Aliases', 'DriverOpts', 'GwPriority', 'MacAddress')
        if k in endpoint and endpoint[k] is not None})
    # Preservar aliases funcionais originais; distinguir aliases gerados
    # automaticamente por IDshort e o hostname Docker, documentando mapping.
    # Se IP estático: transferir IPAMConfig só após disconnectdoantigo.
# create/start ainda NÃO chamados neste ponto; dryrunmanifest compara todo campo
# e aceita delta só Image,3metadata,Healthcheck e IDs/runtimeendpointgerados.
```

O clone integral é dos campos criáveis de Config/HostConfig e de configurações de endpoint, não de status/IDs runtime do inspect. Config.OnBuild e outros campos de imagem sem efeito em create exigem tratamento conforme schema da versão real; nenhuma perda silenciosa. Env.Config/Cmd/Entrypoint devem ser comparados efetivamente depois de create/inspect. MAC dinâmico atribuído pelo daemon não é uma identidade configurada; não fixar MAC incidental sem necessidade. Aliases estáveis (app/birthhub-app ou outros reais) preservados exatamente. Se proxy aponta IPdinâmico hardcoded em vez de nome/alias, isso é bloqueador até plano de atualização e rollback do upstream aprovado.

## Troca, checkpoints e rollback
1. Preparar networkmanifest/configclone e one-shot concluídos antes de parar app. Impedir concorrência via flock no host; confirmar oldID/runtime novamente. Journal privado0600 por fase permite recuperação após SSHcair.
2. Parar old pelo API POST /containers/{oldid}/stop?t=<StopTimeout>; salvar restartpolicy e evitar auto-restart durante janela com update RestartPolicy=no temporário, delta de OLD explicitamente journalado e reversível. Manter oldcontainer e oldimage INTACTOS, sem rm/prune. Nome reserva birthhub-app-rollback-<SHAcurto>.
3. Desconectar old da rede com /networks/{networkid}/disconnect se aliases/IPs conflitam ou upstream descobre parado. Salvar exatamente endpoint/IPAM/aliases para reconnectrollback. Renomear old para reserva. Container parado pode manter DNS/alias: não manter aliasesativos duplicados.
4. POST /containers/create?name=birthhub-app com configclone+HostConfig integral+NetworkingConfig.EndpointsConfig adaptado. Inspecionar NEW e comparar campos preservados ANTESstart; se algo divergir, rollback semstart. Nome original, portas e aliases funcionais são retomados. NetworkingMode container:<oldid> ou host/MAC/staticIP/links especiais exigem ramo específico/aprovação, não generalizar bridge cegamente.
5. POST /containers/{newid}/start. Não AutoRemove. Poll bounded (ex120s acordado, sem ignorar initmigration) liveness+readiness através da rede correta; Dockerhealth healthy e /health/version commit==SHA exato/versão/timestamp. Probe externo pela rota REAL do proxy além do localhost3024: signin asset carregável, endpointsautorizados sem credenciais não podem retornar dados tenant. Não declarar auth/persistência validada só porHTTP200. Ausência de credencialteste limita validação de sessão explícita.
6. Secreate/start/health/version/proxy falhar: parar new, desconectar aliases, renomear new para birthhub-app-failed-<SHAcurto> sem destruir logs, renomear old para birthhub-app, reconectar endpoints reais comaliases/IPAM e restaurar RestartPolicyoriginal; start old e verificar baselinehealth. Nada de force-removal/prune e nada de restoreDB automático. Manter new/old/manifests para investigação; metadados no relatório só sanitizados.
7. Rollback de container é permitido somente secompatibilidade oldimage+schema pós-migration já comprovada emsandbox. Se schema incompatible: não prometer rollback; seguirowner01/rollforward+decisãohumana. oldcontainer parado não é backupdeDB.
8. Após healthy e auditorpósrelease, liberar produtores/escritas; confirmar fila/worker real se existia, sem inventar novo containerworker. Registrar imageID/SHA/time/health+migrationstatus e configuração preservada por hashprivado. Só então notificar deploy VALIDADO. Não removeroldimage/oldcontainer nesta missão.

## Obstáculos que devem bloquear em vez de serem ocultados
- CI/auditor pendente; SHA ainda a confirmar no PR final.
- Snapshot inspect pode conter ConfigCmd/Entrypoint incompatível; isso precisa preflight real.
- Backup1395TOC não restaurado; roles/extensões e DBorigem ainda precisam ser reproduzidos.
- Pendênciasmigration/destructiveness/compatibilidadeoldimage ainda não determinadas.
- Sem mounts: dadoswritablelayer e proxyupstream ainda precisam inventário; nenhum script existente resolve isso.
- DockerAPI/cloningnetworkdetails não testados remotamente pelo autor; schema/versão real devem ser validados antes de produzir mutations.
- STORAGEreadiness apenas configurado; se missão exige storage real, verificar conexão com prova adicional.

Nenhuma operação deste plano foi realizada. Este documento não concede aprovação e não altera código ou governança. O24 deve aprovar concretamente o script final e manifests sanitizados antes da execução pelo Coordenador/08A.
