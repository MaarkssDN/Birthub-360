# Relatório Forense Inicial (Onda 0)

Estado: CONFIRMADO · Data: 2026-11-19

## Estado inicial do Git

- Repositório: `C:\Github\Birthub-360`, branch `agente/00-integracao-skills`, HEAD `730fa7b63`; `git status` sem alterações pendentes nas primeiras linhas.
- ~40 worktrees ativos (agentes 01–17, 24, `main`, `integracao/onda-5`). Nenhum foi tocado.
- Trabalho desta missão: worktree isolado `C:\Github\Birthub-360-worktrees\genesis-brand`, branch `agente/00-genesis-brand-system`, criado do HEAD acima.
- Existe tentativa anterior: branch `docs/brand-system-e-onda-review-20261119` (commit `9b08b7bbd`). **Não foi usada como fonte**; ver [conflitos](conflitos-e-decisoes.md).

## Acesso às fontes

| Fonte | Acesso | Observação |
|---|---|---|
| A — `C:\Users\Marcelo\Desktop\IDENTIDADE-VISUAL` | Sim, local | 445 arquivos (87 SVG, 74 HTML, 68 MD, 43 PNG, 43 JSON…). O prompt cita `Desktop\DOCUMENTOS\...`; o caminho real é `Desktop\IDENTIDADE-VISUAL`. |
| B — repositório | Sim, local | `AGENTS.md` raiz lido; `AGENTS.md` de `src/components/ui`, `layout`, `styles`, `documentacao-aplicacao` existem (apenas o de `documentacao-aplicacao` lido). |
| C — histórico | Parcial | Apenas `git log` de `identidade-visual/`; issues/PRs não consultados. |

## Cobertura real (honesta)

- **Inspecionado de forma direta:** `DESIGN.md`, `PRODUCT.md`, tokens canônicos (`identidade-visual/birthhub360/tokens/birthhub360.css`), `src/styles/official-identity.css`, trechos de `globals.css`, `src/lib/motion.ts`, `Button.tsx`, `moduleRegistry.ts`, rotas de `App.tsx` e `AppLayout.tsx`.
- **Inventariado por script (não lido linha a linha):** 130 componentes visuais, 622 hex distintos em `src/`, 445 arquivos do Desktop (hash vs. repo), 64 SVGs.
- **NÃO examinado:** conteúdo dos 74 HTML e 68 MD do Desktop (incl. `TUDO/v2/*`), PNG/vídeos visualmente, app em execução (sem capturas), código de backend, ADRs, testes visuais. Portanto **a auditoria NÃO é integral**.

## Riscos e achados de higiene

- **Segredo potencial:** `05_TOKENS_E_TEMAS/Migracao-BirthHub-2026-10-10_rar__.env` no Desktop. Conteúdo **não lido nem reproduzido**; recomendar rotação/revisão pelo Agente 15 (REQUER OUTRO AGENTE).
- Arquivos `.part`, `.zip` (inclui `BirthHub360-Identidade-Visual-Completa.zip`) não extraídos.
- Só 114 de 445 arquivos do Desktop têm cópia idêntica (SHA-256) no repositório → ver [inventário de fontes](inventario-de-fontes.md).

## Metodologia

Script [`inventario.mjs`](../_tools/inventario.mjs) (somente leitura) gera CSVs em [`_inventarios/`](../_inventarios/). Leitura direta dos arquivos normativos. Nenhum original foi alterado; nenhum código funcional foi alterado.
