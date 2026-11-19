# Mapa de Módulos

Estado: CONFIRMADO (registro) · Fonte: [`moduleRegistry.ts`](../../../src/components/layout/moduleRegistry.ts). Conteúdo funcional interno de cada módulo: NÃO VERIFICADO (rotas existem; operação não testada).

| ID | Módulo (label no código) | Acento | Destinos observados (rotas `/app/…`) |
|---|---|---|---|
| hub | Hub Central | gold | `home`, `dashboard`, `workspace` |
| P01 | Hub Comercial | blue | `crm`, `crm360`, `companies`, `contacts`, `prospect`, `propostas`, Mapeamento de Decisores |
| P02 | Inteligência de Mercado | teal | `market-intelligence[/hub/deck/accounts/:id]`, `prospect/inteligente` |
| P03 | Orquestração de Vendas | violet | `activities` (Tarefas & Atividades), `playbooks`, `jornadas`, `processos`, `roteiros`, `roleplay`, `chatbook`, `qualification_matrix`, `objections_matrix`, `topic_training` |
| P04 | Performance Comercial | gold | `analytics`, `reports`, `gamification`, `winloss` (atribuição provável; NÃO VERIFICADO) |
| P05 | Previsibilidade Comercial | gold | previsões/forecast (rota exata NÃO VERIFICADO) |
| P06 | Inteligência Artificial | iris | `intelligence`, `intelligence/elite-agent`, `intelligence/pending-actions`, `signals-risks`, Copiloto IA |
| P07 | Automação & Conectividade | blue | `automations`, `integrations`, `bitrix` |
| P08 | Engajamento Comercial | red | `cadence`, `voice-hub/*` |
| M09 | Admin & Operations | slate | `settings`, `settings/pillars/:pillar` |
| M10 | Mobile & Field Sales | teal | NÃO VERIFICADO |
| M11 | Social Selling | red | NÃO VERIFICADO |

Outros: `characters` (galeria de 29 personagens), `calendar`, `notifications`, `editor`, `knowledge`, `war-room`, `daily-plan`, `sdr-diagnostic`. O diretório `src/features/` tem ~60 pastas (ex.: `billing`, `lgpd`, `mesa-tratamento`, `temporal-workers`, `design-lab`) — nem todas mapeadas a módulo (backlog P2).

> Atribuição de rotas a módulos P04/P05/M10/M11 é **inferência**; confirmar lendo `items` de cada módulo.
