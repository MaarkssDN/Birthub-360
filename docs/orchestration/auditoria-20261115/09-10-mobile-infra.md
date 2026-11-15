# Auditoria — Cluster 09/10: Mobile, Infraestrutura, Observabilidade e SRE

**Demanda:** DEM-20261115-001
**Data:** 2026-11-15
**Escopo:** `android/` (nativo), `capacitor.config.ts`, `src/features/mobile/` (offline sync, PWA, gravação de campo), `infrastructure/` (observability, qdrant, security, archive), `Dockerfile`, `docker-compose*.yml`, `k8s/`, `argocd/`, `charts/birthhub-360/`, `src/bootstrap/healthchecks.ts`, `src/bootstrap/observability.ts`, `src/bootstrap/workerServer.ts`, workflows mobile (`.github/workflows/android-build.yml`, `ios-build.yml`).
**Método:** leitura estática de código, manifests e configs; sem execução de builds nem modificação de arquivos.

---

## 1. Escopo auditado

| Área | Arquivos examinados |
|---|---|
| Mobile nativo | `capacitor.config.ts`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/debug/AndroidManifest.xml`, `android/app/src/main/java/.../MainActivity.java`, `android/variables.gradle`, `android/app/build.gradle`, `android/fastlane/Fastfile`, `.github/workflows/android-build.yml`, `ios-build.yml` |
| Offline sync / PWA | `src/features/mobile/offlineSync.service.ts` (850 linhas, lido integralmente), `services/encryptedOfflineStorage.service.ts`, `services/offlineStorageAdapter.ts`, `services/offlineSyncQueue.service.ts`, `audioRecording.service.ts`, `server/mobileFieldMeeting.routes.ts`, `server/mobileFieldMeeting.service.ts` (parcial) |
| Container / imagem | `Dockerfile` (145 linhas, integral) |
| Compose | `docker-compose.yml`, `docker-compose.services.yml`, `docker-compose.postgres-local.yml`, `docker-compose.qdrant.yml`, `docker-compose.opensource.yml`, `litellm-config.yaml` |
| Kubernetes | `k8s/api-deployment.yaml`, `postgres-statefulset.yaml`, `redis-deployment.yaml`, `migration-job.yaml`, `ingress.yaml` |
| Helm/ArgoCD | `charts/birthhub-360/` (values.yaml + templates: deployment, rollout, worker-deployment, migration-job, secret, pdb, hpa, service, ingress), `argocd/application-*.yaml` |
| Observabilidade | `src/bootstrap/healthchecks.ts`, `observability.ts`, `workerServer.ts`, `infrastructure/observability/*` (prometheus, alertmanager, alert.rules, loki, tempo, otel-collector, grafana-datasources, RUNBOOK) |
| Legado | `infrastructure/archive/render.yaml.disabled`, `infrastructure/security/*`, `infrastructure/qdrant/` |

---

## 2. Elogios (com evidência)

1. **Dockerfile de produção maduro e defensivo.** Multi-stage, usuário não-root (`USER nodejs`, uid 1001 — `Dockerfile:116-118`), `HEALTHCHECK` real contra `/health/live` (`Dockerfile:122-123`), `prisma migrate deploy` embutido no `CMD` com justificativa técnica detalhada e idempotência por advisory lock (`Dockerfile:125-145`), reinstalação cirúrgica da CLI Prisma após `npm prune` com verificação de divergência lock/CLI/client (`Dockerfile:52-56`), e comentários que documentam falhas reais já ocorridas (OOM do Vite no builder, `prisma.config.ts` ausente, `.npmrc`).

2. **Healthchecks honestos, sem falso positivo.** `handleReadiness` (`src/bootstrap/healthchecks.ts:17-77`) faz probe real em Postgres (`SELECT 1`) e Redis (`ping`), alimenta `circuitGuard` e retorna 503 quando dependência crítica cai; storage é reportado como `configured`/`unconfigured` sem fingir probe. Liveness separado de readiness; `/health/version` expõe commit/build para correlação de release.

3. **Chart Helm completo para o caminho aspiracional.** `migration-job.yaml` como hook `pre-install,pre-upgrade` com `hook-delete-policy` correto e nome sufixado por revisão (`charts/birthhub-360/templates/migration-job.yaml:1-60`); PodDisruptionBudget no Deployment e no worker; HPA com CPU+memória; blue-green rollout via `rollout.yaml`; `securityContext` com `runAsNonRoot`, drop ALL capabilities; worker autoscaling **desligado de propósito** com justificativa documentada (ausência de métrica de profundidade de fila — `values.yaml` ~linha 120).

4. **Offline sync mobile é a parte mais madura do cluster.** Fila persistida com criptografia AES-GCM-256, chave non-extractable no IndexedDB do WebView com degradação segura documentada (sem fallback para texto claro — `encryptedOfflineStorage.service.ts:1-30`); sanitização recursiva de payloads contra persistência de segredos/PII (`offlineSync.service.ts:104-136`); resolução de IDs temporários com ordenação de dependências (`resolveTemporaryIds`, `:558-621`); distinção erro transitório vs. permanente com backoff de retry e parada de lote em falha de rede (`:707-725`); consentimento LGPD enforced no servidor (`mobileFieldMeeting.service.ts:66-68`).

5. **Observabilidade local bem arquitetada e honesta.** Stack completa (Prometheus + Alertmanager + Grafana + Loki + Tempo + OTel Collector) em `docker-compose.opensource.yml` com healthchecks corretos (incluindo fixes documentados de `localhost`→`127.0.0.1` e healthcheck via `python3` no LiteLLM — `docker-compose.yml:110-126`). `alert.rules.yml` distingue explicitamente regras "ativos-hoje" de "pendente-instrumentacao", citando o arquivo-fonte real de cada métrica — rara honestidade contra métricas fabricadas. `/metrics` protegido por token de operador com comparação `timingSafeEqual` (`src/bootstrap/observability.ts:26-45`, `src/shared/middlewares/requirePlatformOperator.ts`).

6. **AndroidManifest com governança de permissões explícita.** `usesCleartextTraffic` só em `debug/AndroidManifest.xml`, com comentário justificando por que release não declara; permissões (CAMERA, RECORD_AUDIO, localização) todas com uso funcional documentado em comentários longos; deep link custom `birthhub360://` implementado de verdade em `MainActivity.java` com validação de destino contra o contrato de navegação do Agente 02.

7. **Documentação de estado aspiracional honesta.** `k8s/README.md`, `charts/README.md` e `argocd/README.md` declaram abertamente que não existe cluster real consumindo esses manifests (modo local-first, Render congelado) — nenhum IaC é apresentado como produção ativa.

---

## 3. Propostas de melhoria

1. **Alinhar scrape do Prometheus com a autenticação de `/metrics`** (ver P1-1): adicionar `authorization`/`params: operator_token` no `static_configs` de `infrastructure/observability/prometheus.yml`, ou expor um endpoint de métricas interno autenticado por rede.
2. **Renderizar `SLACK_WEBHOOK_URL` no container do Alertmanager** via `envsubst`/entrypoint ou migrar para `api_url_file` + Docker secret.
3. **Definir o backend real do app mobile**: publicar `app.birthhub360.com.br` (DNS + TLS + `assetlinks.json`) ou apontar `CAPACITOR_SERVER_URL` para o host canônico local-first; hoje o default de release é um domínio que não resolve.
4. **Corrigir `k8s/` para consistência com a imagem**: alinhar porta (imagem usa `PORT=3024`, env default do app é `3005`, manifests assumem `3000`), criar o Secret `prospector-secrets` versionado (ex.: `sealed-secrets`/`external-secrets`) e trocar `imagePullPolicy: Never` + `:latest` por tags imutáveis.
5. **Offline sync**: adicionar resolução de conflito (versão/ETag ou timestamp+origem) para `UPDATE_LEAD` last-write-wins; TTL/purge para itens `failed` antigos; chunking ou migração para IndexedDB/SQLite quando `audioData` base64 exceder quota do localStorage.
6. **Remover ou fundir `offlineSyncQueue.service.ts`** (fila em memória órfã) com `OfflineSyncService` para eliminar duas implementações divergentes de fila offline.
7. **Backup/retenção**: declarar `android:allowBackup="false"` ou `dataExtractionRules`/`fullBackupContent` excluindo dados de fila offline e mídia de campo; fixar tags de imagem (`:latest`/`main-stable`/`auto-setup:latest`) nos overlays de compose.

---

## 4. Erros, falhas e dívidas técnicas

### P1 — Crítico/Alto

**P1-1. Prometheus nunca consegue scrape `/metrics` → todos os alertas "ativos-hoje" e o `InstanceDown` são falsos/mortos.**
`/metrics` exige token de operador (`x-platform-operator-token`, `?operator_token=` ou cookie) — `src/bootstrap/observability.ts:26-45` e `src/bootstrap/workerServer.ts:96-115` (retorna 403 sem token; 503 se `PLATFORM_OPERATOR_TOKEN` não configurado). O scrape config `infrastructure/observability/prometheus.yml:20-30` não define `authorization`, `bearer_token` nem `params` — ou seja, com `EXPOSE_METRICS=true` + token configurado (obrigatório em produção por `env.ts:496-505`), todo scrape recebe 401/403/503 → `up == 0` → `InstanceDown` dispara falso crítico e `nodejs_*`/`http_server_duration_milliseconds`/`bullmq_*`/`bitrix_sync_failures_total`/`ai_usage_*`/`pg_pool_*`/`redis_connection_up` nunca são coletadas. A stack de observabilidade inteira depende de um scrape que a configuração atual não consegue fazer. **Correção trivial** (`params: { operator_token: ... }` ou header), mas hoje "alertas" são teatro.

**P1-2. Alertmanager nunca notifica: `${SLACK_WEBHOOK_URL}` não é expandido.**
`infrastructure/observability/alertmanager.yml:10` usa `api_url: "${SLACK_WEBHOOK_URL}"`. Alertmanager **não** expande variáveis de ambiente no arquivo de configuração; o compose passa `SLACK_WEBHOOK_URL` como env ao container (`docker-compose.opensource.yml:147`), mas o processo lê o YAML literal → POST para a URL literal `"${SLACK_WEBHOOK_URL}"` falha silenciosamente. Não há `api_url_file`/Docker secret. Mesmo resolvido P1-1, nenhum alerta chega ao Slack.

**P1-3. App mobile release não tem backend real para apontar.**
`capacitor.config.ts`: `DEFAULT_APP_URL = 'https://app.birthhub360.com.br'` (`:38`) — domínio declarado no próprio comentário como **sem DNS** ("ainda não resolve DNS", `:30-37`); Render (fallback anterior `birthhub-360.onrender.com`) está desativado desde o modo Local-First (`:33-36`, `infrastructure/archive/render.yaml.disabled:3-4`); em CI de produção o build **exige** `CAPACITOR_SERVER_URL` e falha sem ela (`:41-45`). Ou seja: qualquer APK/AAB de produção empacotado hoje carrega um WebView apontado para um host inexistente — o app abre, mas nenhuma chamada `/api/*` funciona. O próprio comentário reconhece que "o caminho de build mobile contra um backend real precisa ser revisitado". Não é bug de código — é ausência de deploy target mobile.

### P2 — Alto

**P2-1. Manifests `k8s/` internamente quebrados (mesmo no caminho minikube).**
- Porta divergente: `k8s/api-deployment.yaml:24` usa `containerPort: 3000` e probes/serviço em `:3000` (`:30-44`, `:77-81`), mas a imagem define `ENV PORT=3024` (`Dockerfile:64,120`) e o default da app é `3005` (`src/config/env.ts:16`) — `k8s/` não define `PORT` em lugar nenhum (depende do inexistente `prospector-secrets`), então a app escutaria em 3024 enquanto probes batem em 3000 → CrashLoop de readiness. O chart Helm contorna isso setando `env.PORT='3000'` (`values.yaml` ~158), mas `k8s/` não.
- `secretRef: prospector-secrets` (`api-deployment.yaml:27-29`, `migration-job.yaml:~47-49`, `postgres-statefulset.yaml:24-36`) **não tem Secret correspondente no repositório** — pods ficam em `CreateContainerConfigError` até criação manual.
- `imagePullPolicy: Never` + `image: birthhub-360:latest` (`api-deployment.yaml:18-19`, `migration-job.yaml:~42-43`) só funciona com imagem pré-carregada no minikube; nome `:latest` é mutável.
- `k8s/migration-job.yaml` usa nome fixo `prospector-migrate` sem `ttlSecondsAfterFinished`: Job é imutável — reaplicar falha ("already exists") e Jobs falhos acumulam para sempre. O chart Helm resolveu isso corretamente com sufixo de revisão + delete policies; o caminho `k8s/` ficou para trás.

**P2-2. `android:allowBackup="true"` sem regras de exclusão, com PII de campo no app.**
`android/app/src/main/AndroidManifest.xml:10` habilita backup completo (Auto Backup → Google Drive) sem `android:dataExtractionRules`/`fullBackupContent`. O app armazena fila offline criptografada contendo notas de reunião, áudio base64 de campo e dados de leads (`FieldMeetingAudioPayload`, `offlineSync.service.ts:23-35`), e a chave AES-GCM vive no IndexedDB do WebView — que também entra no backup. Ou seja, backup + chave viajam juntos: a cifra em repouso perde a principal proteção contra extração física/backup, em tensionamento direto com LGPD e com o próprio motivo da criptografia documentado em `encryptedOfflineStorage.service.ts:5-12`.

**P2-3. Offline sync sem resolução de conflito e com risco de perda silenciosa de fila.**
- `enqueueUpdateLead`/`enqueueCreateNote` emitem `PUT`/`POST` direto (`offlineSync.service.ts:492-527`): duas estações editando o mesmo lead offline → último sync vence, sem versionamento/ETag/checagem de `updatedAt` — last-write-wins silencioso, sem registro de conflito.
- Itens `failed` permanecem na fila **para sempre** (`:719-725`, `:774-781`); não há TTL, purge nem limite de `retryCount` além do flag `failed` — fila pode crescer indefinidamente em dispositivo de campo.
- `FieldMeetingAudioPayload.audioData` é **base64 do áudio inteiro** (`:26`) persistido via `localStorage` (quota típica ~5 MB; fallback para memória volátil em `offlineStorageAdapter.ts:16-39`): uma reunião de 30-60 min estoura a quota → `setItem` cai no `inMemoryFallback` → **fila some no reload** sem nenhum aviso ao usuário. O comentário do fallback assume "restrições de sandbox", não o caso comum de quota — caminho de perda de dados real para o caso de uso central (gravação de campo).
- `offlineSyncQueue.service.ts` (36 linhas) é uma **segunda implementação de fila offline em memória, sem persistência nem sync**, sem nenhum consumidor no código (`grep` confirma: só o próprio arquivo). Dead code divergente que convida a uso errado futuro.

### P3 — Médio/Baixo

**P3-1. Secrets com defaults fracos em composes (mitigado: escopo dev/local).**
`docker-compose.yml:12,22` (`prospector_redis_pass`), `:31` (`birthhub_meili_master_key`), `:59-60` (MinIO); `docker-compose.services.yml` dezenas de defaults (`change-this-flowise-password`, `prospector_pass`, `sk-birthhub-master`, `change-this-superset-admin-password`); `docker-compose.opensource.yml` (`prospector_pass`, `change-this-langfuse-*`, grafana `change-this-grafana-password`, `CLICKHOUSE_PASSWORD` default). Todos documentados como dev-only e atrás de `${VAR:-default}`, mas portas ficam expostas no host (`6379`, `7700`, `9000/9001`, `4000`, `11434`, `3008-3009`, `5678`, `7233`, `8088-8089`, `9090`, `3002`) — aceitável em `127.0.0.1`? **Não**: os binds são `0.0.0.0` por padrão no Docker. Risco real se a máquina de dev estiver em LAN/VPN.

**P3-2. Imagens sem pin de versão/imutabilidade em overlays de compose.**
`elestio/minio:latest` (`docker-compose.yml:55`, `opensource.yml`), `flowiseai/flowise:latest`, `n8nio/n8n:latest`, `apache/superset:latest`, `ghcr.io/open-webui/open-webui:main`, `temporalio/auto-setup:latest`/`ui:latest`/`admin-tools:latest` (`docker-compose.services.yml`), `ollama/ollama:latest`, `k6:latest`. Contrasta com a stack de observabilidade, que pina tudo (`prometheus:v3.5.0`, `alertmanager:v0.28.0`, `tempo:2.8.2`, `loki:3.5.5`, `otel-collector:0.136.0`) — inconsistência de higiene.

**P3-3. Android: permissões declaradas sem fluxo de runtime permission verificável.**
`RECORD_AUDIO`, `ACCESS_FINE/COARSE_LOCATION`, `CAMERA` declaradas (`AndroidManifest.xml`) com uso funcional documentado, mas `MainActivity.java` estende `BridgeActivity` **sem overrides** de `onPermissionRequest`/`WebChromeClient` e sem nenhuma chamada a `ActivityCompat.requestPermissions` — o comentário do manifest admite que a concessão em runtime "não foi possível confirmar em dispositivo/emulador real nesta sessão". No Android 6+, permissões perigosas exigem grant em runtime; se o WebView do Capacitor não cobrir `getUserMedia`/geolocation nativamente, as features de campo falham silenciosamente no aparelho. Risco não verificado, não bug confirmado.

**P3-4. App Link com host divergente e `autoVerify` sem `assetlinks.json`.**
Intent-filter `https://birthhub-360.onrender.com/app/*` com `autoVerify="true"` (`AndroidManifest.xml`) aponta para o domínio Render **desativado**, divergente de `server.url` (`app.birthhub360.com.br`) — e `assetlinks.json` não está publicado (handoff aberto já citado no próprio comentário). Funciona como link comum, mas a verificação automática nunca ocorrerá no estado atual.

**P3-5. `versionCode 1` / `versionName "1.0"` fixos** (`android/app/build.gradle:10-11`) e `image.tag: 'latest'` no chart (`values.yaml:24`) — sem versionamento de release mobile nem imutabilidade de imagem no caminho Helm; Fastlane `beta`/`deploy` lanes existem mas nada incrementa versionCode automaticamente.

**P3-6. `k8s/ingress.yaml` e chart ingress: TLS desligado/stub.**
`ssl-redirect: 'false'` + host `prospector.local` (`k8s/ingress.yaml`); chart usa `birthhub-360.local` com `tls.secretName` placeholder — OK para minikube, mas se o caminho k8s for ativado, é http puro até configuração de certificado. Documentado como aspiracional, logo P3.

**P3-7. Comentário desatualizado em `alert.rules.yml:3-8`** afirma que "não há serviço alertmanager em docker-compose.opensource.yml" — existe (`:140-149`). Cosmético, mas o arquivo de regras é a fonte de verdade lida por operadores.

---

## 5. Resumo executivo

O cluster 09/10 tem **fundamentos sólidos e documentação excepcionalmente honesta**: Dockerfile não-root com migração embutida, healthchecks reais (liveness/readiness com probes de DB/Redis), chart Helm completo (migration hook, PDB, HPA, blue-green, securityContext), offline sync com AES-GCM e governança LGPD, e observabilidade local completa. **Porém, três P1 convergem para o mesmo sintoma: a observabilidade e o app mobile não funcionam de fato hoje.** O scrape do Prometheus é incompatível com a autenticação de `/metrics` (alertas nunca disparam e `InstanceDown` seria falso positivo), o Alertmanager referencia `${SLACK_WEBHOOK_URL}` sem expansão de ambiente (notificações nunca saem), e o app Capacitor de produção aponta para um domínio sem DNS com o backend anterior desativado. Em P2, os manifests `k8s/` estão internamente quebrados (porta divergente, Secret inexistente, Job imutável), `allowBackup=true` anula a proteção da fila criptografada, e o offline sync tem last-write-wins sem detecção de conflito, risco de perda de fila por quota do localStorage com áudio base64, e uma implementação duplicada órfã. Recomendação prioritária: corrigir scrape/auth do Prometheus e o webhook do Alertmanager (horas de trabalho), e tomar a decisão de produto sobre o backend target do app mobile antes de qualquer release nas lojas.
