# Relatório de Auditoria de Dívidas Técnicas — Agente 10

## IDENTIFICAÇÃO
- **ID do agente:** 10
- **Nome oficial:** Infraestrutura, Observabilidade e SRE
- **Especialização:** Engenharia de Confiabilidade de Sites (SRE), infraestrutura Kubernetes/Helm/ArgoCD, Docker Compose, observabilidade (métricas, logs, tracing), planos de Disaster Recovery (RTO/RPO), healthchecks e resiliência de cluster
- **Responsabilidades:** Propriedade exclusiva de `k8s/**`, `argocd/**`, `charts/**` e `infrastructure/**` (`AGENTS.md` §15), garantia de disponibilidade e escalabilidade dos serviços, monitoramento contínuo de recursos, exercícios periódicos de restauração de backups (Restore Drills) e limites de capacidade.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `k8s/**`, `docker-compose*.yml`, `scripts/backup/**`, `scripts/local-first/doctor.mjs`, infraestrutura de logs e métricas.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Manifestos Kubernetes, Helm charts, automações do ArgoCD, scripts de backup e restauração de banco PostgreSQL, diagnósticos de ambiente (`local:doctor`), configurações do Prometheus e OpenTelemetry.
- **Arquivos relevantes:**
  - `docker-compose.yml`
  - `docker-compose.postgres-local.yml`
  - `docker-compose.opensource.yml`
  - `scripts/backup/run-backup-restore-drill.ts`
  - `scripts/local-first/doctor.mjs`
  - `docs/SRE.md`
  - `docs/BACKUP-MANIFEST.md`
- **Serviços existentes:** PostgreSQL 16 com extensões vetoriais, Redis Cache/Queue, Meilisearch Engine, LiteLLM Proxy, Prometheus Metrics Exporter.
- **APIs e integrações:** Kubernetes API, Docker Daemon API, AWS S3 / CloudWatch, Grafana Dashboards.
- **Funcionalidades implementadas:** Stack completa de microsserviços via Docker Compose, healthchecks em containers, scripts de validação pré-voo (`npm run local:doctor`).
- **Testes encontrados:** `scripts/backup/run-backup-restore-drill.ts`, `tests/containers/health.test.ts`.
- **Dependências externas:** Kubernetes, Docker, Prometheus, Grafana, PostgreSQL, Redis.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-10-001 (DEBT-OPS-004)
- **Título:** Script de exercício de recuperação de desastres (Restore Drill) ignora integridade Prisma e limite RTO
- **Categoria:** SRE e Confiabilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `scripts/backup/run-backup-restore-drill.ts` (linhas 85-120), `docs/BACKUP-MANIFEST.md`
- **Evidência:** O script `backup:drill` executa o comando `pg_restore` e avalia o sucesso do exercício exclusivamente pelo código de saída retornado pelo processo shell (`exitCode === 0`). Ele não executa `prisma migrate status` contra o banco restaurado para validar a integridade de schema e não calcula nem valida se o tempo total decorrido violou o limite máximo de RTO (Recovery Time Objective de 15 minutos definido no SLA do projeto).
- **Problema:** Um backup corrompido ou incompleto (ex.: restore com avisos de objetos órfãos ou migrações faltantes) pode ser falsamente classificado como sucesso no relatório de auditoria de desastres.
- **Causa raiz:** O script foi implementado como uma prova de conceito básica sem checagens semânticas de dados e medição de SLA.
- **Impacto:** Falsa sensação de segurança em relação à capacidade de recuperação contra desastres ou ataques de ransomware; falhas só serão descobertas no momento de um desastre real em produção.
- **Correção necessária:** Integrar no script:
  - Verificação de schema via `prisma migrate status --exit-code`;
  - Consulta de integridade de contagem de registros (`SELECT count(*) FROM "Organization"`);
  - Medição do tempo decorrido com asserção estrita `elapsedSeconds <= 900` (RTO de 15 min).
- **Agente proprietário:** 10
- **Agentes dependentes:** 01 (Prisma e Migrations), 08 (QA de Scripts)
- **Complexidade:** Média (1 a 2 dias)
- **Prioridade:** P1
- **Critério de aceite:** O script falha e emite alerta vermelho se o tempo de restauração ultrapassar 15 minutos ou se o Prisma reportar qualquer divergência de migration no banco de destino.
- **Teste necessário:** Teste automatizado executando `npm run backup:drill` em ambiente controlado com verificação das métricas de RTO e integridade de tabelas.
- **Dependências:** Alinhamento com Agente 01.

### ID: DIV-10-002
- **Título:** Ausência de graceful shutdown coordenado entre containers no docker-compose.opensource.yml
- **Categoria:** Infraestrutura e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `docker-compose.opensource.yml` (linhas 15-80), `docker-compose.yml`
- **Evidência:** Os serviços de banco de dados (`postgres`), fila (`redis`), busca (`meilisearch`) e proxy de IA (`litellm`) não possuem declarações explícitas de `stop_grace_period` (padrão 10s do Docker) nem dependências coordenadas de encerramento (`stop_signal`).
- **Problema:** Durante comandos `npm run infra:down` ou paradas de nó em produção, o Docker envia `SIGKILL` para o PostgreSQL antes que o processo da API termine de gravar transações pendentes no disco, provocando recovery mode na próxima inicialização do banco.
- **Causa raiz:** Configuração de Compose focada em inicialização rápida (`depends_on: condition: service_healthy`) sem definição simétrica de políticas de desligamento.
- **Impacto:** Risco de corrupção de índices do Meilisearch e transações incompletas no banco de dados durante manutenções ou deploys de infraestrutura.
- **Correção necessária:** Configurar `stop_grace_period: 30s` no PostgreSQL e Meilisearch, definir `stop_signal: SIGINT` e documentar a ordem correta de drenagem de conexões antes do encerramento dos containers de dados.
- **Agente proprietário:** 10
- **Agentes dependentes:** 16 (Runtime e Workers)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** `docker compose down` encerra primeiramente os workers e a API, aguarda 5 segundos e encerra o banco de dados de forma limpa sem mensagens de "database system was not properly shut down" nos logs do Postgres.
- **Teste necessário:** Teste de shutdown monitorando os logs do container PostgreSQL durante a finalização do compose.
- **Dependências:** Nenhuma.

### ID: DIV-10-003
- **Título:** Ausência de limitação de taxa em nível de Ingress/Proxy Reverso contra ataques de força bruta
- **Categoria:** Infraestrutura e Segurança
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `k8s/ingress/**`, `docker-compose.yml`
- **Evidência:** Não há configuração de Ingress Controller (Nginx Ingress / Traefik / AWS ALB) com anotações de Rate Limiting (`nginx.ingress.kubernetes.io/limit-rps`) nos endpoints públicos sensíveis (`/api/auth/login`, `/api/auth/reset-password`). A proteção atual depende exclusivamente de um middleware em memória (`express-rate-limit`) no Node.js.
- **Problema:** Se múltiplos nós ou pods da aplicação estiverem rodando, o rate limit em memória não é compartilhado, e requisições maliciosas distribuídas sobrecarregam a CPU do Node.js antes de atingir a lógica de negócio.
- **Causa raiz:** Infraestrutura focada no cluster interno sem implementação de camadas perimetrais de Web Application Firewall (WAF) ou Ingress Rate Limiting.
- **Impacto:** Vulnerabilidade a ataques de negação de serviço (DoS) e tentativas automatizadas de adivinhação de senhas em larga escala.
- **Correção necessária:** Adicionar anotações de rate limiting no Ingress do Kubernetes (ou no API Gateway) com limite de 10 requisições por minuto por IP para as rotas de autenticação.
- **Agente proprietário:** 10
- **Agentes dependentes:** 15 (Segurança Aplicada)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Disparo de 20 requisições consecutivas a `/api/auth/login` a partir do mesmo IP é bloqueado diretamente no Ingress com HTTP 429 sem repassar tráfego para os pods da aplicação.
- **Teste necessário:** Teste de estresse com `k6` validando o bloqueio de taxa na camada de borda.
- **Dependências:** Alinhamento com Agente 15.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (stack de containers e orquestração Docker/Kubernetes plenamente documentados).
- **Cobertura automatizada de testes:** Alta (script `local:doctor` e verificadores de saúde de containers operacionais).
- **Segurança:** Média (defesa perimetral contra DoS necessita endurecimento no Ingress).
- **Arquitetura:** Alta (manifestos desacoplados e organizados por ambiente).
- **Confiabilidade:** Média (comprometida pela falta de asserções estritas de RTO e integridade no restore drill).
- **Observabilidade:** Alta (métricas de containers e saúde de serviços monitorados).
- **Manutenibilidade:** Alta (configurações declarativas no padrão GitOps).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 identificado.
2. **Segurança e integridade de dados:** Atualizar `run-backup-restore-drill.ts` com asserções de RTO e status Prisma (DIV-10-001).
3. **Falhas funcionais:** Configurar Ingress Rate Limiting para proteção perimetral de rotas de login (DIV-10-003).
4. **Confiabilidade:** Adicionar `stop_grace_period` e encerramento coordenado no Docker Compose (DIV-10-002).
5. **Testes:** Executar simulação de restauração com medição de RTO no ambiente de staging.
6. **Arquitetura:** Parametrizar recursos de CPU e memória (requests/limits) em todos os pods do Kubernetes.
7. **Melhorias estruturais:** Implementar dashboards consolidados de SLA e RTO no Grafana.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-10-002, DIV-10-003)
- **Problemas compartilhados:** 1 (DIV-10-001 compartilhado com 01 e 08)
- **Handoffs necessários:**
  - Handoff para 01: Definição dos critérios de consistência do banco pós-restore.
  - Handoff para 15: Alinhamento das regras de bloqueio de IP no Ingress perimetral.
- **Riscos mais importantes:** O teste de restore sem validação do RTO pode ocultar incapacidade de recuperação em tempo hábil durante um desastre real; finalização abrupta de containers de dados pode corromper índices de busca.
- **Recomendação final:** Blindar o script `run-backup-restore-drill.ts` com métricas estritas de tempo e integridade.
