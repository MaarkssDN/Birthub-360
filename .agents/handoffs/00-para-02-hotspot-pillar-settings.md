# Handoff — Dividir PillarSettingsPlaceholder.tsx (hotspot > 1000 linhas)

De: 00 — Coordenador (registro pelo Agente 15)
Para: 02 — Produto e UX (dono de `src/features/settings/**`, ver `src/features/settings/AGENTS.md`)
Onda: F1 (pós-persistência de settings por pilar)
Status: aberto
Prioridade: alto
Referência: `docs/architecture/HOTSPOT_EXCEPTIONS.md` (exceção temporária de `PillarSettingsPlaceholder.tsx`)

## Problema

`src/features/settings/components/PillarSettingsPlaceholder.tsx` está com **1235 linhas** na main atual (`549dad47`), acima do limite rígido de 1000 do gate `npm run check:hotspots`. A contagem é a do próprio gate (`content.split('\n').length`). O crescimento veio do commit `75dee1ab` (2026-11-11, Onda F1), que ligou a persistência real na aba "Ferramentas & Regras" e levou o arquivo de 986 para 1235 linhas.

Foi registrada uma exceção **apertada e temporária** no teto de **1235 linhas** (tamanho atual da main, sem folga), com reavaliação até **2026-11-30**. O limite geral do repositório e o script `check-hotspots` não mudam.

## Alteração necessária

Dividir `PillarSettingsPlaceholder.tsx` até **2026-11-30**, extraindo subcomponentes/abas (por exemplo Ferramentas & Regras vs. placeholders de Permissões/Gatilhos/Integrações, ou formulários por pilar) sem mudar o contrato HTTP já persistente (`GET`/`PUT /api/settings/pillars/:pillar`).

Não estender a exceção (nem o prazo, nem o teto). Quando o arquivo estiver no critério de pronto, remover o bloco correspondente de `docs/architecture/HOTSPOT_EXCEPTIONS.md` no mesmo PR.

## Critérios de pronto

- O arquivo tem **≤ 1000 linhas**, medidas como o gate mede (`npm run check:hotspots` / `countLines`).
- A exceção de `PillarSettingsPlaceholder.tsx` foi **removida** de `docs/architecture/HOTSPOT_EXCEPTIONS.md`.
- `npm run check:hotspots` passa sem essa exceção.
- Comportamento preservado: carga/salvamento real na aba "Ferramentas & Regras"; abas Permissões/Gatilhos/Integrações continuam placeholders visuais honestos; settings não concedem permissão (RBAC no backend).

## Contexto

- Dono confirmado em `src/features/settings/AGENTS.md` (“Agente 02 — Produto e UX”) e no handoff `00-para-01-02-settings-pilares-persistentes.md` (UI com o 02).
- O PR de formatação `#225` (ainda aberto) só aplica `biome format` e reduz o arquivo para ~1233 linhas no gate; isso não o coloca abaixo de 1000.
- Autor do commit `75dee1ab`: `marcelinhomarkss-rgb` (Co-Authored-By: Devin), executor da Onda F1 — não é o dono do domínio.

## Resolução

(preenchido pelo Agente 02 ao resolver)
