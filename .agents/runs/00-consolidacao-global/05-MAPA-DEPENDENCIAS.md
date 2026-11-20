# 05 — MAPA DE DEPENDÊNCIAS
Data: 2026-11-19

## Pré-requisitos obrigatórios (gate de release)
```
DEC-P02 (escopo mobile) ──┐
DEC-P03/P04 (IA/voz) ─────┼──► P0 release blockers ──► RELEASE
                          │    BG-REL-001/002/003
DEC-P07 (deploy) ─────────┘
```

## Cadeia UX restante
```
BG-UX-003 (UX-09 perfil editável, 02) ── independente
BG-UX-001 (UX-05a auth morta, 01) ── depende: testes c/ 08
BG-UX-002 (UX-05b outbound SPA, 05) ── depende: 08 p/ 3 testes; preservar cnpj.ts
BG-UX-004 (UX-08) ── depende: DEC-P01
BG-UX-005 (UX-06) ── BLOQUEADO: cadência NO-GO
BG-UX-009/010 ── validação pós-merge das correções (já em main)
```

## Integração de PRs (ordem §19 AGENTS.md adaptada)
```
1. Segurança: #465 (advisory) → #397 (cookies) → #401/#396 (AUD-1)
2. Schema/migrations: nenhum PR aberto toca prisma diretamente — verificar antes de cada leva
3. Runtime/filas: Wave E idempotencyKey #447–453 (ordem: por módulo, merge sequencial p/ evitar conflito DomainEventMesh)
4. Domínio: #434 CRM trilha E → #437 cold-email → #396 WhatsApp
5. Contratos: #399 envelope/Zod
6. UX/design: #462/#463 a11y → #368 paleta (conflitante — reconciliar)
7. QA/release: #400 Schemathesis → #403 flaky → #459 repro → #404 coverage
8. Governança: #466 ownership sync → #464 onda1 fixes → #415 P0 security
```
**Atenregar:** #361/#366/#368/#310 com CONFLICTING histórico — reconciliar ou fechar superseded antes de nova leva.

## Dependências entre agentes (handoffs)
- 05→01: schema para cold-email persistência (se necessário)
- 05→08: testes outbound SPA na remoção UX-05b
- 01→08: testes auth na remoção UX-05a
- 04→18: contrato pipelines (UX-10 já mergeado — validar)
- 16→00: worker consumers (BG-REL-003)
- 24→todos: parecer obrigatório antes de qualquer merge

## Paralelizável com segurança
- UX-09 (02) ∥ UX-05a (01) ∥ UX-05b (05) — arquivos disjuntos, worktrees separados.
- PRs de módulos diferentes na mesma leva — desde que arquivos disjuntos e gate a cada 2–3 merges.
- NUNCA paralelizar: dois agentes no mesmo arquivo; 01↔01A; 06↔06A; 16↔06/07 em queue.

## Dependências de documentação
- Toda correção → run report `.agents/runs/` + parecer 24.
- Decisões de dono → AGENTS.md local + manifesto ownership.
