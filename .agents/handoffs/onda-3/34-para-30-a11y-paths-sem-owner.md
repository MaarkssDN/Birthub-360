# Handoff — 34 → 30: achados a11y em paths sem dono nominal na MATRIZ

- De: 34 — Ari (Acessibilidade WCAG 2.2 AA)
- Para: 30 — Coordenador de Produto, UX & Design (roteamento)
- Onda: 3 (ONDA3-34-ACCESSIBILITY, demanda DEM-20261123-001)
- Status: aberto
- Prioridade: médio
- Bloqueador-ref: `.agents/runs/onda-3/34-relatorio.md`
- Sprint destino: a definir pelo 00

## Problema

`npx biome lint src` (regras `lint/a11y/*`) encontrou diagnósticos em paths que
**não constam nominalmente** em `.agents/MATRIZ_PROPRIEDADE.md`. Agrupados aqui
para o coordenador designar o executor de cada um.

## Achados

### 1. `src/features/home/CentralModulesHomeViews.tsx:361` — interativo não semântico

`<div onClick={() => onNavigate(m)}>` no card de módulo da home — sem `role`,
sem `tabIndex`, sem handler de teclado. WCAG 2.1.1 (A) + 4.1.2. Regras:
`noStaticElementInteractions` + `useKeyWithClickEvents`.
**Sugestão de dono**: squad 30 (home/views de produto) — provável 32 ou 30.

### 2. `src/features/dashboard/components/DashboardBuilderModal.tsx` — labels órfãs ×3

`noLabelWithoutControl` em L202, L242, L282 — `<label>` sem `htmlFor`/controle
associado (o padrão visível no código é label de seção "Perfil Operacional"
seguido de grid de botões — provavelmente nem deveria ser `<label>`, trocar por
`<p>`/`<span>` ou `<fieldset>`+`<legend>`). WCAG 1.3.1/3.3.2.
**Sugestão de dono**: 38 (Nara — dashboards) ou 32.

### 3. `src/features/copilot/components/LiveCopilotHUD.tsx:228` — `useSemanticElements`

Role que deveria ser elemento nativo. `src/features/copilot/**` não está na
matriz (a do squad 70 cobre `ai-copilot/**`, diretório distinto).
**Sugestão de dono**: 70 (Orion — coordenação IA) ou 74.

### 4. `src/features/mobile/components/FieldMeetingRecorder.tsx:438` — `useMediaCaption`

`<audio controls>` de prévia de gravação sem `<track>`/legenda. Se o conteúdo é
a própria fala gravada pelo usuário (preview de meeting), a isenção de
"conteúdo não pré-gravado pelo produtor" pode se aplicar — documentar decisão;
se for conteúdo editorial, precisa de transcrição.
WCAG 1.2.2. **Sugestão de dono**: squad 80 (86 — mobile UI).

### 5. `src/contexts/__tests__/AuthContext.logoutOfflinePurge.test.tsx:48` — `useButtonType`

`<button>` sem `type` em arquivo de teste. Cosmético; owner de `src/contexts`
não listado — provavelmente 08 (QA) ou dono do AuthContext. Baixíssima
prioridade.

## Alteração necessária

Nenhuma no escopo do Agente 34 — os arquivos pertencem a outros domínios.
Solicita-se roteamento do coordenador para os donos corretos.

## Teste esperado

- Cada achado corrigido com `npx biome lint <path>` limpo para `lint/a11y/*`.
- Card de módulo da home operável por teclado após correção do item 1.
