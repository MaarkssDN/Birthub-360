# Handoff — Hotspot characterCatalog.ts acima do limite de 1.000 linhas

De: Devin (Agente 00 — coordenação da navegação modular)
Para: dono do domínio `src/features/characters/**` (verificar AGENTS.md local; provável Agente 07/13)
Onda: navegação modular (Onda 05)
Status: resolvido
Prioridade: alto (bloqueia `npm run test:architecture`)

## Problema

`npm run test:architecture` falha em `scripts/architecture/check-hotspots.ts`:
`src/features/characters/characterCatalog.ts` tem **1.113 linhas**, acima do
limite duro de 1.000, e não possui exceção registrada em
`docs/architecture/HOTSPOT_EXCEPTIONS.md`.

## Evidência

- Execução de `npm run test:architecture` em 2026-11-10: dependency-cruiser
  verde (1.939 módulos, 0 violações novas); `check-hotspots.ts` vermelho
  apenas por este arquivo.
- O arquivo já consta modificado no working tree por trabalho paralelo de
  personagens (commits/handoffs `personagens-29-20261110`).

## Alteração necessária (uma das duas)

1. Refatorar/split do catálogo (domínio characters), **ou**
2. Registrar exceção legítima em `docs/architecture/HOTSPOT_EXCEPTIONS.md`
   com owner e deadline, se o tamanho for justificável.

## Resolução

Resolvido pelo próprio Agente 00 na missão de saneamento (2026-11-10) por
refatoração real, sem exceção artificial: split de `characterCatalog.ts`
(1.113 ln) em `characterCatalog.shared.ts` (142), `characterCatalogPillars.ts`
(294), `characterCatalogAgents.ts` (632) e facade `characterCatalog.ts` (67).
Contratos públicos preservados; 23 testes de characters verdes;
`npm run test:architecture` agora passa integralmente.

## Contexto

Não foi editado nesta missão por P3 (arquivo de outro domínio). O restante
do gate de arquitetura está verde — este é o único bloqueio.
