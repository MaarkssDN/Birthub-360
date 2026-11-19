# Revisão Agente 24 — Onda saneamento-handoffs-20261118, Lote 2 (índice + achados transversais)

- Auditor: Agente 24 | Data: 2026-11-18 | Base: `main` pós-merge do lote
- PRs revisados: #382, #384, #385, #386, #387, #388, #389, #390, #391, #392, #393, #406, #408, #409

## Tabela de vereditos

| PR | Agente | Veredito | Ressalvas principais | Merge |
|----|--------|----------|----------------------|-------|
| #382 | 07 | APROVADO | — | já merged |
| #384 | 12 | APROVADO | execução do teste RLS depende do CI de integração | já merged |
| #385 | 02 | **BLOQUEADO** | 8/10 testes DSR falham; `DataSubjectRequest` fora do parity registry | já merged — débitos abertos |
| #386 | 08 | APROVADO-COM-RESSALVAS | colide com #391 nos testes de CommandPalette | OPEN |
| #387 | 01A | APROVADO | handoff 01A→17 possivelmente stale após #389 | já merged |
| #388 | 13 | APROVADO | — | já merged |
| #389 | 17 | APROVADO | confirmar cobertura do opt-out in-memory do handoff 01A→17 | já merged |
| #390 | 04 | APROVADO | 3 commits de frentes distintas (legítimo mas denota sessões paralelas); PR OPEN no GitHub apesar de mergeado em main | mergeado via merge local |
| #391 | 03 | APROVADO | condição: coordenar com #386 nos testes | OPEN |
| #392 | 09 | APROVADO | docs-only | OPEN |
| #393 | 10 | APROVADO | docs-only; scanner segue pendente (correto) | OPEN |
| #406 | 06 | APROVADO-COM-RESSALVAS | janela one-shot de re-execução; lookup dedup best-effort; classificar transient→permanent | OPEN |
| #408 | 16 | APROVADO | tornar idempotencyKey obrigatório = decisão separada do 00 | OPEN |
| #409 | 14 | APROVADO | PII codificada segue débito do 07 | OPEN |

## Achados transversais (ação requerida)

1. **`DataSubjectRequest` fora do tenant-scoping registry** — `tests/unit/lib/tenant-scoping-parity.test.ts` **falha em main**: modelo com `organizationId` não classificado em `TENANT_INJECTED_MODELS` nem `KNOWN_RLS_ONLY_MODELS`. Origem: PR #381 (Agente 01). **Owner: 01/00**. Risco: isolamento de tenant do modelo DSR não verificado pela suíte de paridade. Correção: classificar o modelo no registry e re-rodar o teste.

2. **Testes DSR falhando (#385)** — 8/10 falhas em `dsr-pages.test.tsx` (MSW/rota). PR mergeado sem gate verde nessa suíte. **Owner: 02/08** — corrigir harness ou página e re-rodar.

3. **Colisão #386 × #391** — ambos OPEN; testes de CommandPalette assertam "Nova oportunidade" que #391 remove. **Owner: 00** arbitra ordem; **08** ajusta testes. Ordem recomendada: #391 primeiro, depois #386 com testes corrigidos.

4. **#390 mergeado mas PR OPEN** — merge local `da9b42da6` contém o conteúdo; GitHub não detectou. Fechar/sincronizar estado do PR.

5. **Handoff 01A→17 possivelmente stale** — #389 entregou fallback Prisma tenant-scoped; verificar se `InMemoryOptOutRepository` específico permanece pendente. **Owner: 00/01A/17**.

6. **#406 janela de re-execução** — aceitável (one-shot, dedupRef mitiga); documentar no runbook de deploy e preferir horário de baixo tráfego.

## Ordem de merge sugerida para os OPEN

1. **#391** (remove no-ops) — primeiro, pois #386 depende de ajuste de teste depois.
2. **#386** — somente após 08 remover asserções de "Nova oportunidade".
3. **#392, #393** — docs-only, qualquer ordem.
4. **#408** — observabilidade isolada.
5. **#409** — teste isolado.
6. **#406** — por último, com runbook da janela de re-execução.
