# AGENTS.md — Componentes Compartilhados (raiz de src/components/)

## Escopo

Este arquivo governa **apenas os arquivos na raiz de `src/components/`**.
Subdiretórios com AGENTS.md próprio (`ui/` → 03, `layout/` → 02,
`crm/` → 04) seguem suas próprias regras. Demais subdiretórios sem
AGENTS.md local seguem o dono do módulo de feature correspondente ou
escalam ao Agente 00.

## Dono por arquivo (raiz)

- `CrmBoard.tsx`, `CrmBoardToolbar.tsx` e hooks relacionados
  (`src/hooks/useCrmBoard*`) → **Agente 04 — CRM e BI**
  (decisão do usuário em 2026-11-18, resolve pendência WB-1);
- componentes de navegação/shell remanescentes → Agente 31 (Squad 30; legado 02);
- primitives de UI → Agente 33 (Squad 30; legado 03, via `ui/`);
- demais componentes raiz sem dono explícito → escalar ao Agente 00
  antes de alterar.

## Regras gerais

- Componente compartilhado não pode conter regra de negócio de um único
  tenant ou piloto — dados de funil/estágios devem vir de API
  (`GET /api/crm/pipelines`), nunca hardcoded (UX-10);
- mudança visual em componente compartilhado exige coordenar com o
  Agente 33 (Squad 30; legado 03) quando tocar tokens/estilo.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
