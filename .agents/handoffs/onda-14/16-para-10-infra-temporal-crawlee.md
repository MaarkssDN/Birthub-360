- De: 16 (Runtime, Workers e Escala)
- Para: 10 (Infraestrutura, Observabilidade e SRE)
- Onda: 14
- Status: resolvido
- Prioridade: bloqueador

## Problema
A introdução do Temporal.io para orquestração de workflows resilientes (`src/features/temporal-workers/`) e do Crawlee com Playwright/Chromium para extração web (`src/features/prospecting/crawlee/`) requer recursos de infraestrutura que não estão provisionados nos manifestos do projeto. Pelo modelo de governança (`/AGENTS.md` §15), `docker-compose.yml`, `Dockerfile`, `k8s/**` e infraestrutura de servidores são de propriedade exclusiva do Agente 10. Sem o servidor Temporal e sem os binários/dependências de SO do Chromium instalados na imagem de container, os workers quebram em tempo de execução.

## Arquivo(s) envolvido(s)
- `docker-compose.yml`
- `docker-compose.opensource.yml`
- `Dockerfile`
- `charts/birthhub-360/values.yaml`
- `.env.example`
- `src/config/env.ts`
- `src/features/temporal-workers/client.ts`
- `src/features/temporal-workers/worker.ts`

## Alteração necessária
O Agente 10 deve:
1. Incluir a suite do Temporal Server (serviços `temporal`, `temporal-admin-tools`, `temporal-ui` ou imagem oficial `temporalio/auto-setup`) no `docker-compose.opensource.yml` e manifestos de produção K8s.
2. Adicionar as variáveis de ambiente necessárias ao `.env.example` (`TEMPORAL_ADDRESS=temporal:7233`, `TEMPORAL_NAMESPACE=default`).
3. Ajustar o `Dockerfile` dos workers para incluir dependências de sistema do headless Chromium (ex.: `npx playwright install-deps` ou pacotes Debian equivalentes `libnss3`, `libatk`, etc.).
4. Configurar healthchecks e limites de recursos (CPU/Memory limits) para os containers de workers do Temporal e Crawlee.

## Teste esperado
- `docker compose -f docker-compose.yml -f docker-compose.opensource.yml up -d` sobe com todos os serviços íntegros (`healthy`).
- Temporal Web UI acessível na porta configurada (ex.: 8080 ou 8233).
- Worker do Temporal conecta no cluster com sucesso e registra as tarefas.

## Resolução
1. `docker-compose.opensource.yml`: Inclusão dos serviços `temporal` (imagem `temporalio/auto-setup:1.24.2` com healthcheck `temporal operator cluster health`), `temporal-admin-tools` (imagem `temporalio/admin-tools:1.24.2`) e `temporal-ui` (porta 8233 -> 8080, CORS configurado).
2. `Dockerfile`: Instalação de bibliotecas do sistema para execução de headless Chromium/Playwright (`libnss3`, `libnspr4`, `libatk1.0-0`, `libatk-bridge2.0-0`, `libcups2`, `libdrm2`, `libxkbcommon0`, `libxcomposite1`, `libxdamage1`, `libxfixes3`, `libxrandr2`, `libgbm1`, `libasound2`, `libpango-1.0-0`, `libpangocairo-1.0-0`, `libglib2.0-0`, `libx11-6`, `libx11-xcb1`, `libxcb1`, `libxext6`, `fonts-liberation`) no estágio `runner`.
3. `.env.example`: Adicionadas variáveis canônicas `TEMPORAL_ADDRESS=temporal:7233` e `TEMPORAL_NAMESPACE=default`.
4. `src/config/env.ts`: Schema Zod atualizado com `TEMPORAL_ADDRESS` e `TEMPORAL_NAMESPACE` com defaults locais seguros (`localhost:7233` e `default`).
5. `src/features/temporal-workers/client.ts` e `worker.ts`: Adaptados para consumir `process.env.TEMPORAL_ADDRESS` e `process.env.TEMPORAL_NAMESPACE`.
6. `charts/birthhub-360/values.yaml`: Ajustados limites de recursos de pods de workers (`limits.cpu: 1000m`, `limits.memory: 1024Mi`) e adicionadas variáveis `TEMPORAL_ADDRESS`/`TEMPORAL_NAMESPACE` ao ConfigMap de ambiente.

## Contexto adicional
Bloqueador de deploy e infraestrutura resolvido para a Onda 14.
