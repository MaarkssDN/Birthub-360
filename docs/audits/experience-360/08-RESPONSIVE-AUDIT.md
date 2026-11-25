# 08 — Auditoria de Responsividade
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Evidência executada:** inventário do Agente 14 (390×844 mobile + 1280×800 desktop, light/dark, 70 rotas): **0 overflow horizontal a 390px**, carga ≤2,2 s. `mobile-sweep.spec.ts` cobre 37 módulos a 393×851.

## 1. Achados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| RSP-001 | P2 | Modais/painéis voice-hub com largura fixa sem `max-w` responsivo — transbordam em 360-390px; Voice Hub roda no Android/Capacitor | `VersionHistoryPanel.tsx:69` `w-[560px]`; `TestSimulatorModal.tsx:270` `w-[450px]`; `GlobalHelpCenter.tsx:160` `w-[380px] h-[520px]` |
| RSP-002 | P2 | Tabelas: 43 arquivos com `<table>`; `Table.tsx` do DS resolve com wrapper overflow — mas tabs de commercial-intelligence (`PipelineForecastTab.tsx:35`, `JourneyTab`, `AgingTab`) usam `<table className="w-full">` **sem wrapper próprio**, dependendo do Card pai | refs |
| RSP-003 | P3 | Touch targets borderline ~26px em botões KanbanCard ("Converter"/"Enriquecer" `px-2.5 py-1 text-[11px]`) — passa WCAG 2.5.8 (≥24px) raspando, abaixo dos 44px recomendados p/ mobile | `KanbanCard.tsx:351-386` |
| RSP-004 | P3 | `mobile-sweep` cobre 37 módulos; ~20 rotas fora do sweep (settings/pillars, characters, failover, war-room, resilience, forecast, metas, pipeline_ponderado) | `tests/e2e/mobile-sweep.spec.ts:6-43` |
| RSP-005 | P3 | Breakpoints Tailwind default apenas; ~10 breakpoints arbitrários na landing (fora de escopo); em produto `768px`/`760px` misturados | CSS de features |
| RSP-006 | P3 | `min-w-[280px]` em canvas de fluxo voice-hub studio (`UnifiedNode.tsx:64`) — editor visual provavelmente desktop-only; confirmar gate de viewport | ref |
| RSP-007 | P2 | **Logout inexistente em mobile**: `hidden sm:flex` no topbar; avatar é decorativo sem menu — em <640px não há caminho visível para sair da conta | `AppTopbar.tsx:239-252` |
| RSP-008 | P3 | `<img>` sem `loading="lazy"`/`decoding="async"` fora da galeria (logos em listas: CompanyList.tsx:221 etc.) | refs |

## 2. Pontos fortes verificados

- Sidebar/rail colapsa para `ModuleRail` 68px + `ModuleNavPanel`/drawer mobile — arquitetura de navegação mobile já pensada.
- 0 overflow horizontal medido em 390px nas 70 rotas (ADMIN).
- `Table.tsx` do DS com `overflow-auto` + role/aria corretos.
- `mobile-sweep.spec.ts` com `isMobile`/`hasTouch` reais.

## 3. Lacunas de verificação

- Orientação paisagem e tablets (768/1024) com interações — só carga.
- Zoom 200% e reflow 320px — não medido.
- Modais custom restantes com largura fixa — amostra apenas voice-hub.
- Papéis não-ADMIN em mobile — não executado.

## 4. Recomendações

1. **P2:** `max-w-[calc(100vw-2rem)]` (ou equivalente token) nos 3 modais voice-hub + auditoria dos demais `w-[NNNpx]` fixos.
2. **P2:** caminho de logout/menu de conta no mobile (avatar → menu ou item no drawer).
3. **P2:** estender `mobile-sweep` para as ~20 rotas restantes.
4. **P3:** touch targets ≥44px nos controles primários do kanban e listas mobile.
