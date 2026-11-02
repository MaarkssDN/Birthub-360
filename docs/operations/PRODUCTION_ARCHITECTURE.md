# Arquitetura de Produção: Birth Hub 360

Este documento define a única arquitetura canônica e suportada para a plataforma Birth Hub 360 em produção.

> [!IMPORTANT]
> **Estado real da produção (02/11/2026):** a aplicação roda numa instância **AWS EC2**
> (`3.143.251.44`, container Docker `birthhub-app`), com a mesma topologia single-node descrita abaixo.
> O deploy é **manual, controlado e feito localmente pelo Marcelo**, pelos scripts `deploy-ec2.sh`,
> `deploy-ec2.ps1` e `deploy-aws.ps1` (procedimento em [`DEPLOY_EC2.md`](DEPLOY_EC2.md)). Por decisão
> dele, não há nada a configurar na AWS e **não há workflow de deploy** no GitHub Actions.
> O Cloudflare R2 não é usado; o que fazer com o backup do banco está **pendente de decisão do Marcelo**.

## 1. Topologia Oficial: 100% Local-First / Single-Node

A aplicação opera em modo **Local-First / Single Node (Self-Hosted)**. Provedores em nuvem (Render, Neon, Vercel, Railway, Cloudflare R2) e orquestradores distribuídos (Kubernetes) estão **oficialmente desativados e obsoletos**.

A plataforma inteira é implantada via Docker Compose em uma única máquina (VM/Bare Metal) sob controle total do usuário.

## 2. Componentes

| Papel | Tecnologia / Serviço | Origem |
| --- | --- | --- |
| **Runtime da Aplicação** | Node.js (Express + Vite) | `server.ts` e `worker.ts` |
| **Banco de Dados** | PostgreSQL 16 + pgvector | `docker-compose.postgres-local.yml` |
| **Cache & Filas** | Redis | `docker-compose.yml` (`redis`) |
| **Storage de Arquivos** | MinIO (Compatível S3) | `docker-compose.yml` (`minio`) |
| **Motor de Busca** | Meilisearch | `docker-compose.yml` (`meilisearch`) |
| **Modelos de IA** | Ollama + LiteLLM | `docker-compose.yml` (`ollama`, `litellm`) |
| **Observabilidade** | Prometheus, Grafana, Loki, Tempo | `docker-compose.opensource.yml` / `infrastructure/observability/` |
| **Deploy** | Manual na EC2 (`deploy-ec2.sh` / `.ps1`, `deploy-aws.ps1`) | feito pelo Marcelo; sem workflow de deploy |

## 3. Reverse Proxy, TLS e Domínio

- A aplicação Node.js e os contêineres Docker expõem portas localmente.
- O roteamento e TLS devem ser feitos por um Reverse Proxy externo na própria máquina (ex: Nginx, Caddy ou Traefik) ou via túnel Cloudflare Zero Trust (se opt-in, não dependência de core).
- A aplicação escuta as configurações de ambiente `PUBLIC_BASE_URL` para montar links e webhooks.

## 4. Backup e Disaster Recovery

- **Banco de Dados**: o workflow `backup-production.yml` foi escrito para enviar o dump ao Cloudflare R2, mas o R2 não é usado e o workflow nunca rodou. O que fazer com o backup está pendente de decisão do Marcelo.
- **Storage**: O volume do MinIO deve ter backup no nível do disco.
- O Recovery é testado e documentado através de runbooks (`docs/operations/RUNBOOKS.md`).

## 5. Histórico e Depreciação

*   **`docs/deploy/producao.md`**: ARCHIVED / LEGACY
*   **`docs/deploy/render.md`**: ARCHIVED / LEGACY
*   **`k8s/` e `charts/`**: ARCHIVED / LEGACY

