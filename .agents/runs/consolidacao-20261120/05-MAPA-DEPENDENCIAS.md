# 05 — MAPA DE DEPENDÊNCIAS

## Cadeia crítica de release (P0)

```
Decisões humanas (G-06 mobile, G-10 docker/segredos, G-24 consentimento)
        │
        ▼
P0 código: G-05 deploy migrate+healthcheck ──► G-08 backup validado ──► G-09 workers validados
        │
        ▼
GO-LIVE checklist (parecer 24): resolver PRs stale (G-21) + renovar exceções/waivers até 30/11 (G-11)
        │
        ▼
Gate de release → RELEASE_APPROVED
```

## Fila de integração de PRs (ordem recomendada)

1. **#458-equivalente já mergeado via #454** — format bitrix resolvido.
2. **Segurança primeiro**: #465 (effect advisory), #397, #401 (AUD-1) — depois Wave E.
3. **Wave E idempotencyKey** (ordem por módulo, conflitos de handoff já resolvidos): #447 → #450 → #451 → #452 → #453 → #441 → #386.
4. **Domínio**: #434 (CRM trilha E) → #437 (cold-email) → #415 (ErrorBoundary) → #430/#459–#466 (débitos/a11y).
5. **Docs/governança**: #460 (parecer 24 Wave E), #459, #367, #379, #353.
6. **Revisão 24/Silas obrigatória por leva** antes de merge de código.

## Dependências entre agentes

- **Schema/migrations**: só Pietro/Vera (novo) / 01 (legado) — qualquer integração que precise de coluna abre handoff.
- **`src/lib/queue/**`**: 23 Pina (novo) / 16 (legado) — outbox idempotency depende do runtime do #440.
- **Workflows CI**: 94 Tess (novo) / 08 (legado) — schemathesis, visual gate, sonar.
- **Revisão independente**: 09 Silas (novo) / 24 (legado) — bloqueia todo merge de código.
- **DSR**: depende de migration aplicada em staging/prod (ops, não código).
- **Paleta #368**: depende de decisão de produto/marca (11/39) antes de retrabalho.

## Paralelização segura

- PRs Wave E entre si: **seguras** (commits já resolvidos; CI sequencial por fila).
- UX missões pequenas (G-19): seguras em worktrees isolados.
- **Não paralelizar**: dois agentes no mesmo arquivo de handoff-mãe; schema com qualquer outro; `server.ts`/`package.json` sem aprovação do coordenador.
