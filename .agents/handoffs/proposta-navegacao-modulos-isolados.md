# Proposta — Navegação por Módulos Isolados + Painéis Globais

De: Devin (assessor de arquitetura, sob demanda do usuário)
Para: 00 — Coordenador
Onda: proposta (aguardando decisão humana)
Status: aberto
Prioridade: normal
Sprint destino: a definir pelo 00

## Contexto

O usuário (produto) quer redesenhar a navegação da plataforma:

1. Os ~11 módulos top-level hoje dividem uma única `Sidebar` global com ~30 destinos
   (`src/components/layout/sidebarSections.ts`, 7 seções: CENTRAL DE COMANDO, RECEITA,
   INTELIGÊNCIA, EXECUÇÃO, RELACIONAMENTO, PERFORMANCE, GOVERNANÇA).
2. Desejo declarado: cada módulo vira uma "tela separada" — entrar em outro módulo exige
   "sair" do módulo atual (modelo hub-and-spoke, como apps distintos).
3. Contrapartida: poder usar **dois módulos ao mesmo tempo** em todas as telas.

Decisões já tomadas com o usuário:

- Painéis globais: **Copiloto IA + Chatbook**.
- Estado na troca de módulo: **URL params** (deep-linkável, padrão já usado no projeto).
- Escopo desta entrega: **somente proposta detalhada** (sem implementação ainda).

## Proposta de arquitetura

### Modelo: Hub + Módulo isolado + Assistentes globais

Três camadas de navegação:

#### Camada 1 — Rail global (substitui a Sidebar atual)

- Sidebar encolhe para um **rail vertical fino** (ícones + tooltip, ~64-72px): logo,
  os ~11 módulos top-level, e voltar ao Hub (`/app` → `AdaptiveDashboard`).
- Remove as ~30 entradas flat; cada módulo carrega apenas seus ícones.
- Em mobile/Capacitor: rail vira bottom-nav com os módulos principais + "Mais" (drawer).
  O breakpoint atual de navegação é `lg` (1024px) — decisão documentada em
  `src/components/layout/AGENTS.md`/skill ui-ux; manter ou reavaliar conscientemente.

#### Camada 2 — Shell de módulo (navegação interna)

- Cada módulo top-level ganha um **sub-shell próprio**: top tabs ou sidebar contextual
  com os destinos que hoje são `subItems` daquele grupo em `sidebarSections.ts`.
- Ex.: `/app/crm/*` → Pipeline, Negócios (crm360), Propostas, Forecast, Mesa de Tratamento.
- As rotas `/app/*` já existem e são lazy — o trabalho é **reagrupar**, não criar rotas.
- Estado interno vai para URL params (tabs, filtros, `leadId`, `view`) — já é o padrão
  em vários hubs (`CopilotoIaHub` usa `?tab=conversas&leadId=`).

#### Camada 3 — Painéis globais: Copiloto IA + Chatbook

- Dois painéis **dockáveis à direita** (drawer lateral ~400-480px), abrem **sobre
  qualquer rota/módulo** e mantêm estado enquanto o usuário navega.
- Base técnica existente: `VoiceCommandWidget`, `ModuleAgentWidget`, `CommandPalette`,
  `Toaster` já são montados no `MainLayout` fora do `<main>` — o dock segue o mesmo padrão.
- Conteúdo: instâncias dos hubs existentes (`CopilotoIaHub`, `ChatbookHub`) em modo
  "embedded/panel", com `ActiveRecordContext` injetando o registro ativo (lead/contato/
  empresa) — o contexto já existe e já alimenta prompts de IA.
- Limite: **no máximo 1 painel global aberto por vez** por padrão (evita empilhar dois
  drawers); avaliar split-view como evolução futura, não no MVP.
- Gates: os painéis respeitam `RequireRole`/`RequireModuleAccess` do módulo de origem —
  painel fechado se o usuário não tem acesso (`copiloto_ia` exige SDR+, ver
  `COPILOTO_IA_ROLES` em `src/lib/auth/authorization.ts`).

### Fluxo resultante

```
Hub (/app) → rail de módulos → entra em CRM → sub-nav do CRM
                                        ↘ Copiloto/Chatbook abrem como drawer sobre o CRM
```

"Dois módulos ao mesmo tempo" = módulo da rota + 1 painel global. Sair do módulo =
voltar ao rail/hub ou clicar outro módulo (a rota anterior não persiste estado além do
que estiver na URL — reload-safe).

## Mapa de arquivos e propriedade

| Arquivo/área | Dono | Mudança |
|---|---|---|
| `src/components/layout/**` (Sidebar, MainLayout, MobileNav, AppTopbar, sidebarSections, tabMeta) | 02 | rail + shell de módulo + dock |
| `src/App.tsx` (rotas) | aprovação do 00 | reagrupamento de rotas em sub-rotas de módulo, se necessário |
| `src/features/copiloto-ia/**`, `src/features/chatbook/**` | dono do módulo (verificar) | modo "panel/embedded" reutilizável |
| `src/contexts/ActiveRecordContext.tsx` | verificar dono | sem mudança prevista; confirmar compatibilidade |
| `tests/e2e/**` | 08 | novos specs de navegação |
| Backend/API | — | **nenhuma mudança prevista** |

## Ondas sugeridas (para o 00 refinar)

- **Onda A — Fundação do shell** (02 + 03): rail de módulos, sub-shell de módulo,
  top tabs contextuais. Entrega em 1 módulo piloto (sugestão: CRM/RECEITA, maior densidade).
- **Onda B — Painel global Copiloto** (02 + dono do copiloto-ia): drawer global com
  modo embedded; gate de role.
- **Onda C — Painel global Chatbook**: idem, reusa o padrão da Onda B.
- **Onda D — Migração dos demais módulos**: cada módulo adota o sub-shell; sidebar
  legada removida ao final (não em paralelo — risco de duas navegações vivas).
- **Onda E — QA/release** (08 + 24): specs E2E de navegação, a11y do rail/drawer,
  mobile viewport, deep-links existentes (`/app/<tab>`) preservados ou redirecionados.

## Riscos e pontos de atenção

- **Deep links existentes**: muitos fluxos navegam para `/app/<tab>` (CommandPalette,
  `useNavigationBusBridge`, cards de KPI em `CrmOverview`, `LeadCopilotoPanel` →
  `/app/copiloto_ia?tab=...`). Reagrupamento de rotas não pode quebrar esses links —
  manter rotas flat como aliases ou redirecionar com `Navigate`.
- **Estado de formulários/modais**: drawers globais sobre formulários abertos podem
  criar conflito de foco/overflow — definir z-index e focus-trap (skill accessibility).
- **LGPD/tenancy**: painéis exibem PII de lead/contato — mesmo gate do módulo; nada de
  "painel global ignora permissão".
- **Mobile**: dock global vira bottom-sheet; rail vira bottom-nav. Não é "o mesmo
  componente encolhido" — precisa de design próprio (skill ui-ux, Capacitor).
- **Propriedade**: `src/App.tsx` e `package.json` exigem aprovação explícita do 00;
  navegação principal é do Agente 02 — outros agentes abrem handoff, não editam.
- **Performance**: dois hubs lazy carregados por vez + página principal = 3 chunks;
  lazy já é o padrão, mas validar bundle no mobile (skill performance).

## Critérios de sucesso (sugestão para o 00 transformar em missão)

1. Usuário entra em um módulo, navega internamente, sai pelo rail e entra em outro sem
   ver a sidebar antiga de 30 itens.
2. Copiloto IA e Chatbook abrem como painel sobre qualquer rota, respeitam permissão,
   e o estado de conversa persiste ao navegar (URL params / contexto).
3. Todas as rotas `/app/*` existentes continuam resolvendo (redirects ok, 404 não).
4. `npx tsc --noEmit`, `npm run lint`, `npm run build` verdes; specs E2E de navegação
   novas passando; a11y do rail e drawer verificada.

## Alternativas consideradas e descartadas

- **Dois módulos lado a lado na tela principal (split-view real)**: descartado para o
  MVP — dobra densidade, complica responsividade e foco; painéis dockáveis entregam o
  mesmo valor com 1/3 do custo.
- **Manter sidebar global + adicionar módulos**: não resolve a queixa de origem
  (navegação sobrecarregada, módulos sem identidade própria).
- **Keep-alive de rotas**: preserva estado mas quebra deep-link e aumenta memória no
  mobile; URL params já é o padrão do projeto.
