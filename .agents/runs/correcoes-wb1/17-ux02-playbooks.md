# Relatório — UX-02: botões mortos em PlaybooksHub (Agente 17)

Data: 2026-11-18 · Onda: WB-1 · Base: working tree (sem commit, conforme missão)

## Escopo

- Arquivo alterado: `src/features/sales-orchestration/components/PlaybooksHub.tsx` (único).
- Handoff origem: `.agents/handoffs/onda-WB1/02a-para-17-playbooks-botao-roteiros-morto.md`
- Evidência: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 UX-02 (P2).

## Diff resumido

1. **Import**: adicionado `import { useNavigate } from 'react-router-dom';` (linha 2) — padrão já usado no projeto (`SinglePageDashboard.tsx`, `CentralModulesHome.tsx` etc.).
2. **Hook**: `const navigate = useNavigate();` no topo de `PlaybooksHub()`.
3. **Botão "Abrir Roteiros & Checklists"** (~:221-227): adicionado
   `onClick={() => navigate('/app/roteiros')}`. Destino verificado:
   `src/components/layout/AppLayout.tsx:484` (`<Route path="roteiros" element={<RoteirosHub />} />`
   sob `/app/*`, `src/App.tsx:173`) — rota real, consumida sem alterar registro de rotas (Agente 02).
4. **Botão ArrowUpRight** (~:228-234): não existe rota de detalhe de playbook
   (AppLayout só tem `playbooks` exato). Aplicado o padrão já usado em
   "Novo Playbook" (:55-62): `disabled` + `title="Em breve — detalhe do playbook ainda não
   disponível"` + `aria-label` descritivo (botão só tem ícone; `disabled` impede foco,
   então o `title` é tooltip visual e o `aria-label` documenta a intenção).
   Escolhido `disabled`+tooltip em vez de remover para manter o layout simétrico do card.

## UX-N2 (KPIs "Indisponível")

**Sem alteração — premissa da missão não se confirma.** Em `PlaybooksHub.tsx:103,110` o
`value="Indisponível"` já vem acompanhado de `subtitle={NO_API_SUBTITLE}` (:105,:112),
idêntico aos demais KPIs do arquivo. O mesmo padrão (`value="Indisponível"` +
`subtitle={NO_API_SUBTITLE}`) é o usado em `RoteirosHub.tsx:105-114`,
`ProcessosVendasHub.tsx:89-98` e `JornadasComerciaisHub.tsx:63-79`. "Indisponível" é o
valor-canônico de métrica sem cálculo real (ver `DemoDataNotice.tsx:7` e
`useOrchestrationOverview.ts:110`), não uma inconsistência. Registrar como não-issue.

## Comandos executados + resultado

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0, sem erros (~10 min) |
| `npm run lint` (`biome lint src`) | exit 0; 1561 warnings + 2 infos **pré-existentes** em todo o `src` (CSS `!important`, params não usados etc.) — nenhum em `sales-orchestration` |
| `npx biome lint src/features/sales-orchestration/components/PlaybooksHub.tsx` | exit 0, 0 diagnósticos no arquivo |
| Testes do módulo | **nenhum teste existe** para `src/features/sales-orchestration/**` (busca por `*.test.*` retornou vazio) |

## Desvios

- UX-N2 não aplicado por não haver inconsistência real (ver seção acima).
- `npm run build` não executado: fora do pedido da missão (gate local do AGENTS.md recomenda,
  mas o pedido limitou a tsc + lint; build completo é pesado e o diff é trivial de tipos).
- Smoke e2e da rota `/app/roteiros` não executado (requer app rodando + auth); destino
  confirmado estaticamente via `AppLayout.tsx:484` e `App.tsx:173`.
- Sem commit, sem handoff, sem git — conforme instrução.

## Estado final

Zero ação morta em `PlaybooksHub.tsx`: os dois botões por card agora têm
`onClick` real ou `disabled`+tooltip, cumprindo a regra local
("zero ação morta na UI").
