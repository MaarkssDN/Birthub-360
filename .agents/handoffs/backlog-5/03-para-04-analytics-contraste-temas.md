De: Agente 03 — Design e Acessibilidade
Para: Agente 04 — CRM e BI
Onda: Backlog Onda 5 / DEM-20261116-001
Status: aberto
Prioridade: alto
Bloqueador-ref: MEL-37
Sprint destino: backlog-5

## Problema

MEL-37 (paridade light/dark + contraste validado) encontrou violações reais de contraste WCAG AA em `src/features/analytics/**` (propriedade do Agente 04). Ratios calculados com a fórmula de luminância relativa do WCAG (não estimados):

### 1. `Analytics.tsx` — superfície sempre escura (`bg-[#1C1D24]`), tema não se aplica ao card

- `text-[#EF4444]` sobre `#1C1D24` = **4.46:1** (linhas 48 e 60) — abaixo de 4.5:1 para texto normal ("Atenção necessária", valores de KPI em `text-[10px]`/`text-2xl`).
- `text-slate-500` (#64748B) sobre `#1C1D24` = **3.53:1** (linhas 63 "Estável", 82 "Meta:", 84 hint) — falha em texto de 10px.
- `text-[#22c55e]` = 7.37:1 OK; `text-slate-400` = 6.55:1 OK; `text-[#8B7DFF]` = 5.18:1 OK.

Sugestão (superfície é fixa escura nos dois temas — NÃO usar tokens de tema, que clareariam no claro): `text-[#EF4444]` → `text-[#F87171]` (6.07:1) e `text-slate-500` → `text-slate-400`.

### 2. `WinLossAnalysis.tsx` — componente theme-aware (usa `Card`/`text-ink`) com cores cruas que quebram no tema claro

- `text-[#22c55e]` sobre superfície clara ≈ **2.1–2.3:1** (linhas 143, 171) — falha grave no claro.
- `text-[#EF4444]` sobre superfície clara ≈ **3.4–3.8:1** (linhas 151, 172, 228) — falha para texto normal; o número é `text-2xl font-black` (large text, passa 3:1, mas os ícones/labels menores não).
- `text-[#8B7DFF] bg-[#8B7DFF]/10` (linha 252, badge 10px) ≈ **~3:1** no claro — falha.
- `text-[#8B7DFF]` spinner (linha 205) — ícone, borderline.

Sugestão usando tokens existentes do design system:
- `text-[#22c55e]` → `text-ok-active dark:text-ok` (padrão já documentado em globals.css e usado em Automations/ColdCallStatusCard).
- `text-[#EF4444]` → `text-critical` (token já reativo a tema, calibrado para ambas as superfícies).
- badge `text-[#8B7DFF] bg-[#8B7DFF]/10` → `text-iris-active dark:text-accent-violet bg-iris/10`.
- spinner `text-[#8B7DFF]` → `text-iris`.

### 3. `CrmBoard` não consome `open-create` (relacionado ao MEL-35 absorvido)

O grupo contextual "Nesta página" da Command Palette (implementado nesta branch) oferece "Nova oportunidade" em `/app/crm` com intent `{type:'open-create'}` — mesmo intent da quick action global pré-existente. Porém `src/components/CrmBoard.tsx` (e `src/features/crm/**`) não lê `location.state`/`PaletteIntent`: o intent é ignorado e a ação vira no-op visual na mesma rota. Consumidores existentes do intent: `CompanyList`, `ContactList`, `ActivityList`. Sugestão: ou consumir `open-create` no CrmBoard (abrir fluxo de nova oportunidade/lead) ou remover a ação contextual `ctx-crm-create` da palette se não houver fluxo real.

## Arquivo(s) envolvido(s)

- `src/features/analytics/components/Analytics.tsx` (linhas 48, 55, 60, 63, 82, 84)
- `src/features/analytics/components/WinLossAnalysis.tsx` (linhas 143, 151, 171, 172, 205, 228, 252)
- `src/components/CrmBoard.tsx` (consumo de `PaletteIntent` — se confirmado que pertence ao 04)

## Evidência

Cálculos WCAG reproduzíveis via script de luminância relativa (contraste `(L1+0.05)/(L2+0.05)`). Superfícies assumidas: cards `#1C1D24`/`#13151A` (fixos) e `--surface` claro `#FFF1F7`/`#FFFFFF` + escura `#1C1D24`/`#15171C` para componentes theme-aware.

## Alteração necessária

Aplicar as trocas de classe sugeridas acima. Não é necessário inventar hex novo — os tokens `--critical`, `--ok-active/--ok`, `--iris-active/--accent-violet/--iris` já existem e foram calibrados para contraste nos dois temas (ver comentários extensos em `src/styles/globals.css` ~linhas 319–370 e 755–775).

## Teste esperado

- `npx playwright test tests/e2e/accessibility.spec.ts` (axe-core) nas telas de analytics/CRM.
- Medição manual ou via DevTools dos pares corrigidos ≥ 4.5:1 (texto normal) / ≥ 3:1 (large/ícones).

## Contexto adicional

`CohortAnalysis.tsx` e `GlowChart.tsx` também são superfícies escuras fixas (`bg-[#1C1D24]`), mas os textos encontrados (`text-slate-400`/`text-slate-300`, `text-[#8B7DFF]`) já passam — sem ação necessária. `InteligenciaMercadoHub.tsx`/`ProspeccaoInteligenteHub.tsx` usam a mesma paleta dark-cockpit; não encontrei texto abaixo do mínimo neles nesta passada.
