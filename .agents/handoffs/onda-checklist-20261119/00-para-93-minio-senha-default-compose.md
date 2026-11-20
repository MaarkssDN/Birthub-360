De: 00 (Astra)
Para: 93 (Max) / 90 (Hélio)
Onda: Checklist 2026-11-19 · Onda 1
Status: aberto
Prioridade: alto
Bloqueador-ref: B-04
Sprint destino: próximo

## Problema
`.env.example` deixou de trazer a senha do MinIO (`birthhub_minio_dev_only`), mas `docker-compose.yml`
ainda usa esse valor como fallback (`${MINIO_ROOT_PASSWORD:-birthhub_minio_dev_only}`).

## Arquivo(s) envolvido(s)
`docker-compose.yml` (linhas 60 e 87); também citada em `scripts/storage/test-minio-storage.ts`,
`docs/development/LOCAL_FIRST.md`, `docs/security/runbooks/ROTATE_DEVSTACK_EXPOSED_SECRETS.md`.

## Evidência
`grep -n minio_dev_only docker-compose.yml`

## Alteração necessária
Trocar o fallback por `${MINIO_ROOT_PASSWORD:?defina MINIO_ROOT_PASSWORD}` (fail-fast) e atualizar docs.

## Teste esperado
`docker compose config` falha sem a variável definida.
