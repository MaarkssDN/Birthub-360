# Parecer 24 — preparação isolada AWS

Missão: aws-release-2026-10-09, preparação somente. Autor: 00/release_architecture; auditor: sync_auditor24.
Código aprovado para preparação: `e019a5417a7af518f32bb14746705c48f974d98f`, PR 678, sem merge/deploy.
Plano auditado: `.agents/runs/aws-deploy-plan-2026-10-09.md`, SHA-256 `4841134c3830066a860948f4d8ecc6ac8cb087d880b8f8ec80d4afb499887ea1`.

## Decisão exata

**APROVADO** exclusivamente preparar tar Git archive desse commit, transferir/verificar hash em diretório remoto novo modo 0700 e construir imagem Linux nova sem credenciais de produção no contexto/env/build args, sem substituir arquivos da aplicação atual e sem alterar container/imagem/rede de produção. A imagem resultante deve permanecer staging e ser identificada por digest e label de commit. Antes do build, verificar espaço e RAM/CPU disponíveis; risco de esgotamento no mesmo host de produção exige adiar ou construir fora desse host. Não fazer prune/remove dos recursos existentes.

**BLOQUEADO** para executar restore, migrations de sandbox, migrations de produção, restart ou cutover pelo script operacional ainda não apresentado. O plano descreve isolamento adequado, mas não comprova que a implementação o cumpre. CI completo está pendente e nenhuma aprovação de release é emitida.

## Evidências lidas e verificadas

Plano completo, Dockerfile, .dockerignore, prisma.config.ts, healthchecks e scripts legados consultados. HEAD do worktree autor confirmado igual ao commit acima. Scripts legados não serão usados para produção. Backup e preflight são evidências operacionais recebidas do 00, não acessadas remotamente pelo auditor. `.tmp/aws-deploy-safe.py` não estava presente no worktree autor nesta revisão; nenhuma execução desse script foi auditada.

## Correções/condições concretas para a próxima fase

1. Sandbox Prisma deve receber **ENV mínimo** com DATABASE_URL, DIRECT_URL e SHADOW_DATABASE_URL apontando exclusivamente ao sandbox, além de flags necessárias demonstradas. Não copiar todo ENV de produção desnecessariamente. prisma.config.ts importa dotenv; assegurar ausência de .env real na imagem e impedir fallback de URL.
2. DB sandbox deve usar digest igual ao DB real, rede Internal=true sem rede de produção/egress/HostPorts/socket privilegiado, volume novo exclusivo. Roles/ownership/grants/RLS precisam ser reproduzidos sem password hashes de produção; credenciais efêmeras. Restore strict, logs/dump privados, nenhuma linha de dados em saída. PII do restore permanece no host protegido.
3. `.dockerignore` contém `*.sql`. Validar empiricamente se migration.sql entra no contexto e comparar **todos nomes e hashes** das migrations do commit com a imagem. Build bem-sucedido não prova presença das migrations. Se qualquer migration falta, bloquear e corrigir seleção do contexto pelo proprietário antes de publicar.
4. Script final deve ser lido e aprovado antes de operações de restore/migrate/cutover. Separar modos prep/rehearsal/cutover sem fallthrough acidental. Falha/CI pendente nunca habilita cutover; migração real não pode ser consequência de preparar staging.
5. Antes de cutover: conferir writable layer/dados do container antigo, digest completo, config/host/network preservados, proxy real, healthcheck 3024, snapshot consistente/restore testado, compatibilidade oldimage com schema migrado, gates do SHA exato e rollback executável. Não restaurar DB automaticamente.

## Testes, limites e encaminhamento

Esta revisão é de plano e delimitação de operação preparatória; nenhuma conexão AWS, leitura de chave/ENV privado, build remoto, restore, migração, health real ou mutação de produção foi executada pelo auditor. Leitura e hashes locais executados. Remediação de código recebeu parecer próprio e 118 testes independentes aprovados; isso não substitui CI integral.

Riscos encaminhados ao 00/08A/10 e ao 01 para migrações. Única escrita: este parecer. Autorizar staging não autoriza produção. Mudança de SHA, plano ou implementação exige nova revisão.
