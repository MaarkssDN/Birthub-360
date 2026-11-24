De: 11 — Marca e Ativos Institucionais
Para: 24 — Revisão Independente
Onda: genesis-brand-system
Status: aberto
Prioridade: alto
Bloqueador-ref: AGENTS.md §40 (auditoria independente obrigatória)
Sprint destino: próxima

## Problema

A Operação Genesis Brand System produziu a biblioteca documental
`identidade-visual/brand-system/` (73 arquivos Markdown, ~10 seções) consolidando
marca, identidade visual, produto, design system, motion, experiência, ativos,
guias de implementação e plano de evolução — tudo baseado em evidência do repo
e da pasta de trabalho externa de identidade visual.

A entrega é docs-only (nenhum código alterado), mas o volume e a natureza
(fundamentação de identidade oficial) exigem revisão independente antes de
qualquer integração, merge ou uso como fonte de verdade.

## Arquivo(s) envolvido(s)

- `identidade-visual/brand-system/` (inteiro — novo, untracked)
- Fontes citadas: `identidade-visual/v2/`, `identidade-visual/birthhub360/`,
  `src/styles/`, `src/lib/motion.ts`, `src/App.tsx`, `docs/`, `.agents/handoffs/`

## Evidência

- `RELATORIO-FINAL-GENESIS-BRAND-SYSTEM.md` (raiz de brand-system) resume escopo,
  descobertas, pendências e limitações.
- `_FATOS-CANONICOS.md` lista os fatos verificados com caminhos de evidência.
- `00-GOVERNANCA/matriz-de-evidencias.md` classifica cada afirmação.
- Validação executada: 0 links Markdown quebrados; contagens de rotas/componentes/
  hex/characters verificadas por grep; git status confirma escopo exclusivo.
- NÃO executado: testes automatizados (mudança docs-only — nenhum teste cobre Markdown).
- Gates executados em 2026-11-22 na branch `agente/00-integracao-skills`:
  - `npx tsc --noEmit` → limpo (0 erros);
  - `npm run lint` → 1517 warnings + 2 infos **pré-existentes**, 0 erros (exit 0);
  - `npm run build` → sucesso (Vite + verify:pwa-precache OK).

## Alteração necessária

Revisar conforme roteiro `.agents/prompts/24-revisao-independente.md`:
1. Escopo: somente `identidade-visual/brand-system/` foi criado — confirmar via `git status`.
2. Propriedade: `identidade-visual/**` é do Agente 11 — confirmar.
3. P1–P4: evidência > suposição; simplicidade; alterações cirúrgicas; critérios verificáveis.
4. Honestidade epistêmica: propostas marcadas como `[PROPOSTO]`/PENDENTE; nada não-oficial
   apresentado como regra; `v2/` mantido como não homologado.
5. Segurança/LGPD: nenhum segredo copiado; `.env` externo apenas referenciado por caminho.

## Teste esperado

- Parecer em `.agents/reviews/` com veredito (aceito / ajustes / bloqueado) e evidências.

## Contexto adicional

Decisões estratégicas (D1–D12 em `09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md`) foram
escaladas ao Agente 00 em handoff separado — a revisão do 24 cobre a qualidade da
documentação, não a aprovação das decisões de identidade.
