De: 00 — Coordenador
Para: 11 — Marca e Ativos Institucionais
Onda: paralela-8
Status: aberto
Prioridade: bloqueador (gate check:hotspots vermelho)

## Problema
`npm run check:hotspots` falha: `src/features/characters/characterCatalog.ts` tem 1113 linhas (> limite 1000) e não possui exceção registrada em `docs/architecture/HOTSPOT_EXCEPTIONS.md`.

## Evidência
```
❌ 1 hotspot(s) bloqueando o gate:
   - src/features/characters/characterCatalog.ts: 1113 linhas > limite de 1000 e sem exceção registrada
```

## Alteração necessária
Reduzir o arquivo abaixo de 1000 linhas por modularização real (sem remover funcionalidade), OU — somente se a natureza do arquivo (catálogo de dados de personagens/marca) justificar — registrar exceção legítima em `docs/architecture/HOTSPOT_EXCEPTIONS.md` com dono (Agente 11) e prazo de reavaliação. Preferir modularização.

## Teste esperado
`npm run check:hotspots` → exit 0. `npx tsc --noEmit` sem novos erros. Imports de `characterCatalog` continuam resolvendo.

## Contexto
Último commit no arquivo: aac2839fd (personagens/marca). Worktree: `.claude/worktrees/ag-11`, branch `agente/11-hotspot-characters`.
