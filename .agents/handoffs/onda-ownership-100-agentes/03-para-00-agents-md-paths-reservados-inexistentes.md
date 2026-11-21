De: 03 — Nina
Para: 00 — Astra
Onda: ownership-100-agentes
Status: aberto
Prioridade: normal
Bloqueador-ref: —
Sprint destino: —

## Problema
AGENTS.md §15 (arquitetura de 100 agentes) reserva paths que não existem no repositório:
`src/lib/db/rls/**` (13 Nilo), `src/workers/**`, `tailwind.config.js` (Tailwind é CSS-first), `src/mobile/**`, `src/lib/auth/rbac/**`.

## Arquivo(s) envolvido(s)
AGENTS.md §15 (propriedade do 00/humano); scripts/governance/ownership-coverage.manifest.json (03).

## Evidência
`npm run verify:ownership-coverage` só verifica existência para escopos de path único (linhas com vírgula são tratadas como descritor e não são checadas). `src/lib/db/rls/**` é path único e inexistente: foi aceito via `allowMissingPath` justificado no manifesto.

## Alteração necessária
Decisão do 00/humano: criar os diretórios quando o 13/23/80/97 os implementarem, ou ajustar §15 para os paths reais (RLS hoje vive em prisma/migrations/**). Quando resolvido, remover `allowMissingPath` do manifesto.

## Teste esperado
`npm run verify:ownership-coverage` e `tests/unit/architecture/ownership-coverage.test.ts` verdes sem `allowMissingPath`.
