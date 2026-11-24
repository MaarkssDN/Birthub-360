De: 00 — Astra
Para: 30 — Violeta (Coordenador Squad 30)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 itens 1, 2, 11
Sprint destino: Onda 4 / ciclo imediato

## Problema

Três arquivos do Squad 30 possuem exceções de hotspot arquitetural ativas que expiram em 30/11/2026. Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

| # | Arquivo | Limite | Tamanho aprox. | Causa raiz |
|---|---|---|---|---|
| 1 | `src/features/landing/pages/Landing360.tsx` | 3500 | ~3400 | Seções visuais, modais, drawer mobile e parallax em arquivo único |
| 2 | `src/features/landing/pages/Landing360Impeccable.tsx` | 1050 | 1021 | Reformatação Biome quebrou limite sem mudança de lógica |
| 11 | `src/features/landing/components/pillars/PillarRegistry.tsx` | 1450 | 1402 | Registro de pilares; já reduzido de 1773→1402 com 3 viewers extraídos |

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx` (Agente 36 — Léo, propriedade `src/features/landing/**`)
- `src/features/landing/pages/Landing360Impeccable.tsx` (Agente 36)
- `src/features/landing/components/pillars/PillarRegistry.tsx` (Agente 33 — Célia)

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 — diagnóstico individual completo com causa raiz e plano de remediação por arquivo.

## Alteração necessária

1. `Landing360.tsx`: fatiar seções em `src/features/landing/components/sections/` (Hero, Compliance, Pricing, NavigationDrawer) — reduzir abaixo de 3000 linhas.
2. `Landing360Impeccable.tsx`: extração cirúrgica de subcomponentes de apresentação para < 800 linhas.
3. `PillarRegistry.tsx`: concluir extração dos 5 viewers restantes para `viewers/` levando o arquivo a < 600 linhas.

## Teste esperado

- `npm run check:hotspots` verde sem exceções para os 3 arquivos.
- `npm run test:unit` dos arquivos de teste de landing sem regressão.
- Evidência visual (Playwright screenshots) das páginas afetadas antes/depois.

## Contexto adicional

- Decisão humana pendente: prorrogação única de 14 dias (até 14/12) condicionada à abertura das branches de refatoração — proposta do Agente 99 em `docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §4.
- Não elevar limites de exceção nem remover entradas do registro sem refatoração real.
- Registrar SHAs congelados e submeter ao Agente 09 (Silas) antes de integrar.
