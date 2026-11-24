# AUDITORIA DE IMAGEM DOCKER E TOPOLOGIA P0-07 — ONDA 2
## VERIFICAÇÃO DE SEGURANÇA DO ARTEFATO DOCKER, CAMADAS E TOPOLOGIA DE CACHE

**Data:** 2026-11-23  
**Agente Responsável:** Agente 93 — Max (Containers e Builds Docker)  
**Squad:** Squad 90 (Infraestrutura, SRE e Segurança Aplicada)  
**Demanda:** DEM-20261123-001 (Onda 2 — Slot 7)  
**Worktree:** `wt-93-docker-o2`  
**Branch:** `agente/93-docker-onda2-dem20261123`  
**Status da Auditoria:** HOMOLOGADO E VERIFICADO EM AMBIENTE SEGURO (NO-GO MANTIDO)

---

## 1. RESUMO EXECUTIVO E CONFORMIDADE COM DIRETIVAS DO ORQUESTRADOR

Em cumprimento irrestrito às instruções da ordem operacional da Onda 2:
1. **Nenhum socket Docker TCP 2375 foi utilizado:** Toda análise e verificação foi executada localmente no ambiente seguro de trabalho, inspecionando o `Dockerfile`, os manifests de compose e a árvore de compilação.
2. **Nenhuma alteração no host Samsung ou rollout remoto:** O status NO-GO da plataforma permanece 100% preservado; nenhum push ou deploy foi realizado.
3. **Escopo estritamente disjunto do Agente 90:** O Agente 90 auditou e endureceu a configuração upstream do Nginx (`nginx/birthhub360.conf`); o Agente 93 auditou o artefato Dockerfile, a montagem do container, o filesystem de runtime e a validação de compilação.

---

## 2. ARQUITETURA MULTI-STAGE E VERIFICAÇÃO DO GATE P0-07

O `Dockerfile` implementa um pipeline multi-stage (`builder` → `runner`) baseado em `node:22-slim` com verificações automáticas de fail-fast em tempo de build:

```dockerfile
# Stage 1: Builder
FROM node:22-slim AS builder
...
RUN npm run build
# P0-07: fail-fast automático no build se ferramentas internas vazarem para dist/ ou SW
RUN test ! -e dist/tools && test ! -e dist/design-lab \
 && node -e "const fs=require('fs'); const sw=fs.readFileSync('dist/sw.js','utf8'); ..."
RUN npm run build:worker
RUN npm prune --omit=dev
...
# Stage 2: Runner (Runtime)
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3024
...
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public/tools ./public/tools
COPY --from=builder /app/public/design-lab ./public/design-lab
...
USER node
EXPOSE 3024
HEALTHCHECK --interval=30s --timeout=5s ...
CMD ["sh", "-c", "npx prisma migrate deploy && exec npm run start"]
```

### Análise dos 4 Pilares de Isolamento de Ativos Protegidos (P0-07):

1. **Separação Física no Filesystem do Container (`/app`):**
   - Os arquivos estáticos públicos do frontend são compilados pelo Vite para `/app/dist`. O gate `test ! -e dist/tools && test ! -e dist/design-lab` garante que nenhuma página de `/tools` ou `/design-lab` é empacotada em `dist/`.
   - As ferramentas internas residem em `/app/public/tools` e `/app/public/design-lab`, fora da pasta raiz de arquivos estáticos públicos servida pelo Express (`express.static(dist)`).
   - O Express só entrega arquivos de `/public/tools` e `/public/design-lab` após passar pelo middleware de autenticação obrigatória (`requireAuth`) e verificação de perfil de operador (`operatorGuard`).

2. **Precache do Service Worker (`dist/sw.js`):**
   - A asserção no build valida que o array `precacheAndRoute(...)` gerado pelo Workbox não contém nenhuma URL iniciando com `/tools` ou `/design-lab`.
   - O `sw.js` contém a regra explícita `NetworkOnly` para denylist de ferramentas internas, impedindo que requisições offline capturem essas rotas.

3. **Invalidação e Política de Cache HTTP:**
   - No container Node/Express: headers de cache para `/tools` e `/design-lab` emitem `Cache-Control: private, no-store`.
   - No Nginx upstream (Agente 90): o bloco `location = /sw.js` emite `Cache-Control: no-cache, no-store, must-revalidate` com headers completos de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`), garantindo a substituição imediata de workers no cliente.

4. **Princípio do Menor Privilégio no Container:**
   - O container final descarta todas as `devDependencies` via `npm prune --omit=dev`.
   - O processo executa sob o usuário não-privilegiado `node` (`uid=1000, gid=1000`), sem privilégios de root (`USER node`).
   - Sinais de desligamento gracioso (`SIGTERM`) são entregues diretamente ao runtime Node via `exec npm run start`.

---

## 3. CHECKLIST DE VERIFICAÇÃO TÉCNICA E CRITÉRIO DE SUCESSO

| Item Auditado | Requisito de Segurança | Evidência Técnica | Status |
|---|---|---|---|
| Gate P0-07 no Dockerfile | Falhar build se `dist/tools` ou `dist/design-lab` existirem | `RUN test ! -e dist/tools && test ! -e dist/design-lab` | APROVADO |
| SW Precache Denylist | Sem ferramentas internas no precache de `sw.js` | `entries.filter(e => /tools\|design-lab/.test(e.url)).length === 0` | APROVADO |
| User Privileges | Execução como não-root | `USER node` (UID 1000) no runner stage | APROVADO |
| Healthcheck Nativo | Verificação de integridade via HTTP liveness | `fetch('http://127.0.0.1:3024/health/live')` | APROVADO |
| Deploy de Migrações | Bloqueio de inicialização com schema defasado | `npx prisma migrate deploy && exec npm run start` | APROVADO |
| Isolamento TCP 2375 | Não expor nem consumir Docker via TCP inseguro | Nenhuma referência a TCP 2375 no container ou harness | APROVADO |

---
**Agente 93 — Max**  
*Auditoria de Containers e Topologia Docker P0-07 concluída em conformidade com o AGENTS.md §2, §14 e §15.*
