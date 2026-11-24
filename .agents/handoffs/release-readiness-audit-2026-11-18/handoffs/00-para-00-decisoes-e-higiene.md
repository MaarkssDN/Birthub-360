- De: 00
- Para: 00 (coordenação)
- Status: ABERTO — higiene transversal, executar após Trilha 1/2 ou em paralelo sem conflito
- Prioridade: P2/P3

## Achados (relatório: auditoria/arquitetura-transversal.md)

### DEBT-0052 — design-lab público + agente-codigo-local — P2
`public/design-lab/` vai p/ dist/imagem (~100 arq internos acessíveis); `agente-codigo-local/` segundo app completo com lockfiles gerando waivers. Mover lab p/ docs ou proteger; repo próprio p/ agente-codigo-local.

### DEBT-0053 — `// @ts-nocheck` em 4 componentes React — P2
BirthHubOrbit360, Gamified3DOrb, BrandOrb, RevenueSignalOrb — typecheck "0 erros" não cobre. Tipar R3F.

### DEBT-0054 — Duplicações — P2
framer-motion+motion (65 arq); ≥15 deps mortas (confirmar `npx knip`); 4-5 stacks LLM paralelos → consolidar em lib/ai/gateway.

### DEBT-0055 — gitleaks allowlist `.agents/runs/**.md` ampla — P2
Segredo em relatório futuro passa no scan. Restringir p/ fingerprints; auditar handoff-secrets.md.

### ARQ-14 — PRODUCTION-READINESS.md stale ("APPROVED" 08/10, ~7 semanas) — P2
Re-emitir parecer do 08 contra commit atual ou marcar snapshot com validade.

### ARQ-11 — TechDebt JSON >90% ruído — nota
Não usar como backlog; triagem dos 215 P1 antes de alocar sprints. Válidos: scripts/create-user-marcelin.ts:23 fallback senha.

### ARQ-04/15 — Rotas órfãs (job-roles, settings.routes) + TODOs — P3
Deletar arquivos mortos; TODO produtivo quase nulo.

## Ação imediata sugerida
Rodar `npx knip` para confirmar DEBT-0054 (deps mortas) — barato e orienta limpeza.
