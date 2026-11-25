# Relatório de Execução — Agente 34 · Ari

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 1 — Fundação
**Branch:** `agente/34-ari-acessibilidade-v2` (base: `agente/35-mia-motion-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. A auditoria axe-core de todas as telas é escopo das fases 2–3 (depende dos componentes de tela dos agentes 31/32/36–38). Nesta fase, o foco é garantir que os **primitivos v2 nasçam acessíveis** e cobri-los com teste unitário.
2. Infra de a11y já existe: `tests/e2e/accessibility.spec.ts` (axe-core via `@axe-core/playwright`), `tests/unit/components/ui/Modal.a11y.test.tsx`, `tests/unit/design-system/theme-accessibility.test.ts`.

## Plano executado

- **Etapa 1 — Auditoria:** inventário da infra de a11y existente; revisão manual dos 5 primitivos v2 contra WCAG 2.2 AA.
- **Etapa 2/3 — Correções em componentes v2:**
  - `Badge`: `div` → `span` (phrasing content — div dentro de `<p>`/heading/button é HTML inválido).
  - `Button`: `type="button"` por padrão (evita submit acidental); `type="submit"` explícito preservado; `asChild` não recebe `type`.
  - `Input`: `aria-invalid` automático quando `variant="error"`.
  - `Dialog`: Radix primitive já fornece focus trap, Escape, `aria-labelledby` via Title — verificado em teste.
  - Contraste: pares de cor v2 já calibrados no design-v2.css (badge soft `-100`/`-700`, ouro + navy).
- **Etapa 4 — Telas críticas:** pendente — depende das fases 2–3 (handoff).
- **Etapa 5 — Documentação/CI:** suíte unitária a11y criada; gate axe-core E2E já existe no projeto.

## Arquivos alterados

- `src/components/ui/v2/Badge.tsx` (div→span, HTMLAttributes span)
- `src/components/ui/v2/Button.tsx` (type default)
- `src/components/ui/v2/Input.tsx` (aria-invalid)
- `tests/unit/components/ui/v2.a11y.test.tsx` (novo — 7 testes)
- `.agents/runs/34-ari-acessibilidade-v2.md` (este relatório)

## Comandos executados

- `npx vitest run -c vitest.unit.config.ts tests/unit/components/ui/v2.a11y.test.tsx` → **7/7 passaram** (Button nome/tipo/disabled, Input aria-invalid, Badge span, Dialog Escape + título/descrição acessíveis).
- `npx tsc --noEmit` → limpo para arquivos da missão.
- `npx biome lint` → limpo.

## Testes

- Cobertura a11y unitária dos primitivos v2: foco, teclado (Escape), roles/nomes acessíveis, aria-invalid, content model HTML.

## Evidências

- Dialog v2 fecha com Escape e expõe `role="dialog"` com nome via `DialogTitle` (teste verde).
- Badge não pode mais ser filho inválido de elementos de phrasing content.

## Problemas fora do escopo

- Auditoria axe-core das telas existentes (dashboard, formulários, tabelas) — depende das fases 2–3.
- Erro TS pré-existente `swarmAudit.service.ts` (já reportado pelo Agente 33).

## Handoffs abertos

- Para Agentes 31/32/36/37/38: novos componentes de tela DEVEM usar os primitivos v2 (já acessíveis) e passar pelo `tests/e2e/accessibility.spec.ts`.
- Para Agente 00: agendar rodada axe-core completa após Fase 3.

## Aprendizados reutilizáveis

- `type="button"` default + `aria-invalid` automático são correções de a11y de baixo custo que devem ser padrão em todo primitivo novo.
- Badge como `span` evita violação silenciosa de content model — axe-core nem sempre detecta, mas browsers/screen readers sim.

## Pendências

- Validação com leitores de tela reais (NVDA/VoiceOver) — manual, Fase 5.
- axe-core nas telas v2 quando existirem.

## Riscos

- Baixo: mudanças são aditivas/retrocompatíveis (type default só afeta botões sem type explícito em contexto de formulário — comportamento mais seguro).
