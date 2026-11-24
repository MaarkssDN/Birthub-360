# ONDA 3 — Checklist de Auditoria Independente (Agente 09 · Silas)

Missão: `ONDA3-09-AUDIT` — auditoria independente das 7 entregas da Onda 3.
Base da auditoria: branch `agente/09-audit-onda3` @ baseline `32d07c375`.
Matriz de ownership auditada: `.agents/runs/onda-3-matriz-ownership.md` em `integracao/onda-3-dem20261123` @ `d5192c47a` (commit `d5192c47a72e9c4e3c0eaa8bce44e39154826c68`).

## Verificação de baseline (FASE 1 — executada em 2026-11-24)

- [x] `integracao/onda-2-dem20261123` HEAD = `32d07c375` — termina em merges da Onda 2 (pareceres 09, entregas 93/08/94/90…).
- [x] `integracao/onda-3-dem20261123` HEAD = `d5192c47a` = baseline `32d07c375` + somente o doc de matriz de ownership do Agente 00. Nenhum código de produto na integração.
- [x] Worktrees `wt-20`, `wt-21`, `wt-34`, `wt-42`, `wt-45`, `wt-65`, `wt-96` existem e estão nas branches `agente/<id>-<slug>-onda3`, todas apontando para `32d07c375` no momento da verificação.
- [x] Matriz de ownership lida e registrada (ver tabela abaixo). Arquivo NÃO existe na baseline local; lido via `git cat-file` do commit `d5192c47a` (blob `aa59f662`).

## Matriz de ownership auditada (fonte: d5192c47a)

| # | Agente | Missão | Branch | Ownership exclusivo |
|---|--------|--------|--------|---------------------|
| 1 | 20 — Ciro | ONDA3-20-CORE-BACKEND | `agente/20-core-backend-onda3` | `src/api/index.ts`, `src/api/router.ts` |
| 2 | 21 — Zara | ONDA3-21-API-CONTRACTS | `agente/21-api-contracts-onda3` | `src/api/schemas/**`, `openapi.yaml` |
| 3 | 34 — Ari | ONDA3-34-ACCESSIBILITY | `agente/34-accessibility-onda3` | `src/components/a11y/**` |
| 4 | 42 — Lívia | ONDA3-42-CRM-KANBAN | `agente/42-crm-kanban-onda3` | `src/features/crm/deals/**`, `src/features/crm/pipelines/**` |
| 5 | 45 — Otto | ONDA3-45-CRM-AGENDA | `agente/45-crm-agenda-onda3` | `src/features/crm/tasks/**` |
| 6 | 65 — Lena | ONDA3-65-VOICE-HUB | `agente/65-voice-hub-onda3` | `src/features/voice-hub/**` |
| 7 | 96 — Nera | ONDA3-96-AUTH | `agente/96-auth-onda3` | `src/lib/auth/**` (exceto RBAC do Agente 97) |
| 8 | 09 — Silas | ONDA3-09-AUDIT | `agente/09-audit-onda3` | `.agents/reviews/**` |

## Critérios de aceite aplicáveis a TODA entrega (AGENTS.md §28/§32/§40/§41 + skill agent-review-gate)

Para cada entrega, verificar ANTES de emitir parecer:

### A. Integridade da entrega
- [ ] SHA final congelado declarado pelo executor (HEAD da branch `agente/<id>-*-onda3` no worktree correspondente).
- [ ] Handoff de conclusão existe em `.agents/handoffs/onda-3/` com contrato, arquivos alterados, comandos executados e resultados reais.
- [ ] Nenhum commit posterior ao SHA declarado (revisão inválida se o conteúdo mudar — §40).

### B. Escopo e propriedade (P1–P3, §15/§16)
- [ ] `git diff 32d07c375..<SHA> --stat` contém SOMENTE arquivos dentro do ownership da matriz.
- [ ] Nenhum arquivo de outro dono tocado: `prisma/**` (01), `src/App.tsx`/Sidebar (02), `.github/workflows`/Dockerfile (08), `charts/`/`infrastructure/` (10), `.agents/prompts/**` (humano), `.agents/runs/**` (00), `package.json`/lockfile/`server.ts` (aprovação 00).
- [ ] Diff cirúrgico: sem refatoração oportunista, sem formatação alheia, sem código morto, imports/variáveis órfãos removidos quando criados pela própria alteração.
- [ ] Sem dependência nova não solicitada em `package.json`.

### C. Qualidade e evidência (P4, §28/§32/§41)
- [ ] `npx tsc --noEmit` executado — saída real registrada (eu reexecuto se necessário).
- [ ] `npm run lint` executado — saída real registrada.
- [ ] Testes do escopo alterado executados com evidência (testes direcionados; não exigir suíte pesada completa — §28 gate de integração é do coordenador).
- [ ] Testes cobrem caminho feliz E falha; causa raiz tratada; sem fallback enganoso; erros relevantes observáveis.
- [ ] Build não regrediu quando aplicável.

### D. Segurança, tenancy, LGPD (§26/§27/§32)
- [ ] Sem enfraquecimento de autenticação/autorização, RLS, sanitização de PII ou isolamento de tenant.
- [ ] Sem segredo/credencial/PII real no diff.
- [ ] Obrigações LGPD do escopo respeitadas (audit log, consentimento, retenção).
- [ ] Agente 96: não toca RBAC (Agente 97); demais: não tocam `src/lib/auth/**` além do permitido.

### E. Comunicação e governança (§6/§18/§40)
- [ ] Handoffs formais criados quando houve dependência cross-domínio (42↔44 cadências; 45→44; 20 investigações de domínio).
- [ ] Problemas fora de escopo registrados como handoff, não editados oportunisticamente.
- [ ] Parecer do 09 é pré-requisito de integração — eu emito `APROVADO`/`REPROVADO`/`BLOQUEADO` no template `PARECER_REVIEW.md`.

## Status das 7 entregas

| Agente | Missão | Branch | SHA auditado | Status | Parecer |
|--------|--------|--------|--------------|--------|---------|
| 20 | ONDA3-20-CORE-BACKEND | `agente/20-core-backend-onda3` | — | PENDENTE (baseline) | — |
| 21 | ONDA3-21-API-CONTRACTS | `agente/21-api-contracts-onda3` | — | PENDENTE (baseline) | — |
| 34 | ONDA3-34-ACCESSIBILITY | `agente/34-accessibility-onda3` | — | PENDENTE (baseline) | — |
| 42 | ONDA3-42-CRM-KANBAN | `agente/42-crm-kanban-onda3` | — | PENDENTE (baseline) | — |
| 45 | ONDA3-45-CRM-AGENDA | `agente/45-crm-agenda-onda3` | — | PENDENTE (baseline) | — |
| 65 | ONDA3-65-VOICE-HUB | `agente/65-voice-hub-onda3` | — | PENDENTE (baseline) | — |
| 96 | ONDA3-96-AUTH | `agente/96-auth-onda3` | — | PENDENTE (baseline) | — |

## Riscos/observações registradas na Fase 1

- `wt-65-voice-hub`: a matriz registra reparo do worktree em 2026-11-24 (index.lock stale removido). Em verificação inicial o `git status` chegou a exibir deleções staged de `.agents/**`; re-verificado em seguida e o worktree estava limpo na baseline. Monitorar: qualquer `D`/`M` residual antes de auditar o 65.
- Handoffs conhecidos a reconciliar (da matriz): investigações de domínio do 20; interações 42↔44 e 45→44; restrição RBAC do 96.
- Execução de testes de auditoria: testes direcionados apenas, no worktree do executor ou cópia isolada com prefixo de dados `onda3_09_` se DB for necessário. Não rodar suítes pesadas em paralelo com as dos executores.

## Log de monitoramento

- 2026-11-24 (início): baseline verificada; nenhuma entrega com commits à frente de `32d07c375`; nenhum handoff em `.agents/handoffs/onda-3/` observado nos worktrees. Checklist publicado.
