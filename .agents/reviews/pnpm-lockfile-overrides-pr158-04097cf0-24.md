# Parecer Agente 24 — PR #158 @ 04097cf0 (re-revisão)

- **Missão:** realinhar `pnpm-lock.yaml` com os overrides (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH)
- **Autor:** MarksNN (WF2) — branch `agente/wf2-pnpm-lockfile-overrides`
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** origin/main 2d62f9fa566eecf31a0c1a70f679cca794a2760a
- **SHA auditado:** 04097cf0b099c6bd1589d34e40aa99d3e382534a (reverificado imediatamente antes da escrita)
- **Parecer anterior:** BLOQUEADO @ 805e96a6 (branch `agente/24-review-pr158-805e96a6`)
- **Escopo incremental (805e96a6..04097cf0, 1 commit):** apenas `pnpm-workspace.yaml`, +7 linhas de comentário acima de `acorn: 8.11.3`. Sem mudança de dependência ou lockfile.

## Decisão: **BLOQUEADO**

Resta um único bloqueio, que vem da main: o application gate do Release falha nos 4 erros Biome herdados e para no lint, então **os testes unitários não rodam no CI**. Pela AGENTS.md, teste obrigatório não executado não é aprovação. Não há P1 neste PR.

## Aprovação do dono (AGENTS.md §15, linha 446)
"`package.json` e lockfile exigem aprovação explícita do 00" está na §15 "Propriedade exclusiva de arquivos" (seção começa na linha 398). Registro: o Agente 00 aprovou explicitamente as mudanças em package.json, pnpm-workspace.yaml e pnpm-lock.yaml em 2026-11-02 ~05:04 BRT, por mensagem de agente ao orquestrador. Esta aprovação foi **repassada** pelo orquestrador; o Agente 24 não teve acesso direto à mensagem. O 00 também classificou `workbox-window` como dependência direta um follow-up não bloqueante do WF2.

## Verificação dos fatos do comentário
- O commit de origem 0c4fe2fd (2026-10-04, `agente/08-waiver-ghsa-ch52`) foi verificado no parecer anterior.
- GHSA-ch52-4w7c-c8xp (API GitHub Advisory): "Withdrawn Advisory: http-cache-semantics max-stale handling…", afeta `http-cache-semantics <= 4.2.0`, withdrawn_at 2026-10-28 18:13 BRT. **Não envolve acorn.** ✔
- 985d8586 ("remover waiver vencido GHSA-CH52-4W7C-C8XP (http-cache-semantics) (#27)", 2026-10-20) remove o waiver de AUDIT_WAIVERS.md e dependency-review.yml. ✔
- O único advisory de acorn é GHSA-6chw-6frg-f759, que afeta >=5.5.0 <5.7.4, >=6.0.0 <6.4.1 e >=7.0.0 <7.1.1. OSV não lista vulns para 8.11.3 nem 8.18.0. ✔
- O critério de remoção do pin está documentado (decisão do 00/dono + build e testes verdes sem o pin). ✔

## Evidências
| Item | Resultado |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` (pnpm 10.34.6, clone limpo) | OK |
| gitleaks 8.21.2 `origin/main..HEAD` | no leaks found |
| Release 41410506435 | failure: 4 errors / 645 warnings, idêntico à main (41406269451: 4/645). Nenhuma falha nova. |
| Bundle Budget 41410506426, CodeQL 41410506619, Trivy 41410506523, Dependency Review 41410506477 | success |
| Visual Regression 41410506584 | in_progress  (na escrita) |
| SonarQube 41410506847 | in_progress  (na escrita); falha herdada na main (41406269361) |
| Evidência local anterior (805e96a6, lock idêntico) | vite build ok só com `--shamefully-hoist`; bundle 1.965.250 B |

## Achados
- Sem P1.
- **P2-1 (follow-up WF2, não bloqueante por decisão do 00):** declarar `workbox-window` como dependência direta. No layout isolado do pnpm o build falha sem hoist.
- **P2-2 (resolvido):** a justificativa do pin acorn agora está documentada no próprio override.
- **P3-1:** lockfiles npm/pnpm divergentes (45 deps diretas).

## O que resta para APROVADO
1. Corrigir na main os 4 erros Biome herdados (flowIcons.tsx, sidebarSections.ts, ErrorBoundary.tsx, terminalSafety.service.ts, dataSubjectErasure.unit.test.ts) para que o application gate chegue aos testes unitários.
2. Atualizar a branch com merge da main (sem rebase) e obter o gate verde com testes unitários executados no head.
3. Concluir SonarQube e Visual Regression no head.
