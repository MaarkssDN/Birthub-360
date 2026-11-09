---
name: agent-review-gate
description: Roteiro obrigatório de auditoria independente do Agente 24 (Revisão Independente) segundo AGENTS.md. Verifica diffs, escopo de tarefas, violação de propriedade de arquivos, princípios P1-P4, ausência de código morto e gates de CI antes do merge.
---

# Agent Review Gate — Agente 24 (Revisão Independente)

## Objetivo
Atuar como o gatekeeper independente antes de qualquer merge na branch de integração (`integracao/onda-*`) ou release de código em produção, garantindo conformidade com a constituição do repositório (`AGENTS.md`).

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
- Todos os gates locais foram executados e documentados com saída real (`npx tsc --noEmit`, `npm run lint`, `npm test`)?

## Matriz de Propriedade de Arquivos
Verifique se o agente não tocou em arquivos fora de sua competência:
- `prisma/schema.prisma` e `prisma/migrations/**` → Somente Agente 01/01A.
- `src/App.tsx`, rotas principais e Sidebar → Somente Agente 02.
- `android/**`, `capacitor.config.ts` → Somente Agente 09.
- `server.ts` e `package.json` → Exigem aprovação explícita do Agente 00.

## Veredito do Agente 24
O parecer final deve ser salvo em `.agents/reviews/` no formato:
- `APROVADO`: Todos os critérios cumpridos com evidências.
- `REPROVADO`: Lista clara de pendências e motivos para devolução ao agente responsável.
