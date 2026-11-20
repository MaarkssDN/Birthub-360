# Inventário de Rotas

Estado: CONFIRMADO (extração de `<Route>`). Dados: [rotas.csv](../_inventarios/rotas.csv) (públicas, `src/App.tsx`). Rotas `/app/*` ficam em `src/components/layout/AppLayout.tsx` (linhas 409–647; 73 `path=`). Layout por rota, estados e responsividade por tela: NÃO VERIFICADO.

## Públicas (`App.tsx`)

`/` e `/welcome` (Landing360) · `/landing-new` (LandingInnovative, Agente 12) · `/login` (Landing360 tela login) · `/reset-password` · `/privacy` · `/terms` · `/privacidade/dsr/verificar` · `/privacidade/dsr/acompanhamento` · `/book/:slug` (agendamento público) · `/select-brand`→`/welcome` · `/hub`→`/app` · `*`→`/welcome`. Além disso, `/design-lab/*` (command-language, components-v2, home-proposals — condicional, NÃO VERIFICADO acesso).

## Privadas (`/app/*`, dentro de `ProtectedRoute` + `AppLayout`)

Home/dashboard: `` (index), `home`, `dashboard`, `workspace`.
Comercial/CRM: `crm`, `crm360`, `companies`, `contacts`, `activities`, `prospect`, `prospect/inteligente`, `propostas`, `calendar`.
Inteligência: `intelligence`, `intelligence/elite-agent`, `intelligence/pending-actions`, `pending-actions`, `signals-risks`, `market-intelligence`, `market-intelligence/{hub,deck,accounts/:id}`, `winloss`, `war-room`.
Orquestração/aprendizado: `cadence`, `playbooks`, `jornadas`, `processos`, `roteiros`, `chatbook`, `roleplay`, `gamification`, `qualification_matrix`, `objections_matrix`, `topic_training`, `daily-plan`, `sdr-diagnostic`, `knowledge`.
Plataforma: `analytics`, `reports`, `integrations`, `bitrix`, `automations`, `notifications`, `editor`, `settings`, `settings/pillars/:pillar` (+ ~10 sub-rotas de settings em blocos multi-linha), `characters`, `voice-hub/*`.
Redirects: `dialer/*`→`/app/cadence`, `outbound/*`→`/app/dashboard`, `*`→`/app`.

Rotas com guards condicionais (blocos `<Route` multi-linha 430–447, 453, 510, 528–562…): NÃO VERIFICADO quais guards cada uma aplica.
