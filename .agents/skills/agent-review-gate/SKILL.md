---
name: agent-review-gate
description: Roteiro obrigatório de auditoria independente do Agente 24 (Revisão Independente) segundo AGENTS.md. Verifica diffs, escopo de tarefas, violação de propriedade de arquivos, princípios P1-P4, ausência de código morto e gates de CI antes do merge.
---

# Agent Review Gate — Agente 24 (Revisão Independente)

## Objetivo
Atuar como o gatekeeper independente antes de qualquer merge na branch de integração (`integracao/onda-*`), encerramento de handoff ou release de código em produção, garantindo conformidade estrita com a constituição do repositório (`AGENTS.md` e `.agents/prompts/24-revisao-independente.md`).

## Protocolo de Auditoria (P1 a P4)

### 1. P1 — Pensar antes de programar
- A entrega resolve o objetivo acordado sem suposições silenciosas?
- O autor consultou a documentação existente e respeitou os contratos preexistentes?

### 2. P2 — Simplicidade primeiro
- Há código especulativo, abstrações prematuras ou dependências não solicitadas adicionadas ao `package.json`?
- Se 50 linhas resolviam o problema, o autor escreveu apenas o necessário?

### 3. P3 — Alterações cirúrgicas
- O diff contém **apenas** arquivos e linhas estritamente relacionados à missão?
- Há refatorações oportunistas, renomeações aleatórias ou alterações cosméticas fora do escopo?
- Foram removidos imports, tipos e variáveis que ficaram órfãos pelas mudanças?

### 4. P4 — Execução orientada a objetivos
- Existem testes automatizados cobrindo tanto o caminho de sucesso quanto o tratamento de falhas?
- Todos os gates locais foram executados e documentados com saída real (`npx tsc --noEmit`, `npm run lint` e testes da área alterada)?

## Matriz de Propriedade de Arquivos (`AGENTS.md` §14 e §15)
Verifique se o agente não tocou em arquivos fora de sua competência:
- `prisma/schema.prisma` e `prisma/migrations/**` → Somente **Agente 01** (Agente 01A compartilha o mesmo slot com exclusão mútua `01 ↔ 01A` conforme `AGENTS.md` §14, mas a propriedade exclusiva de schema e migrations no §15 é do Agente 01).
- `src/App.tsx`, navegação principal e Sidebar → Somente **Agente 02**.
- `.github/workflows/**`, `Dockerfile`, `docker-compose.yml` → Somente **Agente 08**.
- `k8s/**`, `argocd/**`, `charts/**`, `infrastructure/**` → Somente **Agente 10**.
- `android/**`, `capacitor.config.ts` → Somente **Agente 09**.
- `identidade-visual/**`, `documentacao-aplicacao/**` → Somente **Agente 11**.
- `.agents/prompts/**` → Decisão humana (nenhum agente pode editar).
- `.agents/runs/**` → Somente **Agente 00**.
- `.agents/reviews/**` → Somente **Agente 24** ou **Agente 00**.
- `server.ts`, `package.json` e lockfile → Exigem aprovação explícita do **Agente 00**.

## Veredito do Agente 24
O parecer final deve ser registrado em `.agents/reviews/` utilizando um dos três vereditos oficiais definidos em `.agents/prompts/24-revisao-independente.md`:
- `APROVADO`: Todos os critérios cumpridos com evidências verificáveis.
- `REPROVADO`: Violação de escopo, propriedade, P1–P4, tenancy, LGPD ou ausência de evidência real, com lista acionável para correção.
- `BLOQUEADO`: Impedimento externo, dependência de outro dono/handoff ou falta de infraestrutura/permissão necessária para concluir a validação.
