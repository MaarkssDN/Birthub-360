# Matriz Funcional dos 11 Módulos — Inventário e Plano de Implementação

Missão: continuidade pós-homologação da navegação modular (somente
inventário + planejamento; nenhuma alteração de código nesta fase).
Fontes de verdade: `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.1.html`,
`AGENTS.md`, `src/components/layout/moduleRegistry.ts`, `src/App.tsx`,
`src/features/**`, `tests/**`, `src/features/characters/*`.

Data: 2026-11-11 · Autor: Agente 00 (coordenação)

---

## 1. Taxonomia oficial (Documento Mestre V4.1)

8 Pilares + 3 módulos complementares + Hub Central (fora da numeração):

| ID | Módulo | Avatar/personagem | Descrição oficial (resumo) |
|---|---|---|---|
| P01 | Hub Comercial | Orbit | Pipeline kanban, CRM 360°, propostas com alçadas |
| P02 | Inteligência de Mercado | Nexus | Prospecção, enriquecimento, dossiê 360°, LDR |
| P03 | Orquestração de Vendas | Aria | Cadências multicanal, Plano Diário, Mesa, Roleplay |
| P04 | Performance Comercial | Vanguard | 17 relatórios, Win/Loss autopsy, War Room |
| P05 | Previsibilidade Comercial | Oracle | Forecast calibrado (MAPE), pipeline ponderado, metas |
| P06 | Inteligência Artificial | Core | Enxame de 15 agentes, Supervisor, RAG, Copiloto |
| P07 | Automação & Conectividade | Spark | Automações, webhooks, integrações, Bitrix24, VoiceHub |
| P08 | Engajamento Comercial | Echo | Voz/telefonia, gravações, WhatsApp, outbound |
| M09 | Admin & Operations | Sudo | Tenancy, RBAC, LGPD, auditoria, billing |
| M10 | Mobile & Field Sales | Orbit Mobile | Capacitor offline-first, FieldMeetingRecorder |
| M11 | Social Selling | Nexus Social | Sinais sociais, copy IA, shadow profiles |

Plano de ondas oficial do Documento Mestre (referência): ONDA 01 fundação/
tenancy → ONDA 02 Hub Comercial → ONDA 03 Prospecção+Orquestração →
ONDA 04 Analytics+Forecast → ONDA 05 IA+Conectividade → ONDA 06
Mobile+Social+hardening. **Na prática a base já existe** — as ondas abaixo
são de *completude funcional*, não de construção do zero.

---

## 2. Matriz de maturidade funcional

Legenda: ✅ real e testado · 🟡 real mas parcial/gated · 🔴 placeholder/demo/não funcional

| Módulo | Rotas (registry) | Backend real | Estado funcional | Lacuna principal |
|---|---|---|---|---|
| **Hub** | `/app`, `/app/workspace`, `/app/daily-plan`, `/app/notifications` | dashboard/notifications services | ✅ Hub operacional (rail + painel validados) | Personalização do Hub limitada ao existente |
| **P01 Hub Comercial** | `/app/crm`, `/app/crm360`, `/app/propostas`, `/app/companies`, `/app/contacts`, `/app/activities` | crm (10 svc), crm360, proposals, companies, contacts, activities | ✅ Pipeline kanban real, sync Bitrix, propostas com alçada, ficha 360° | Atividades ligadas ao CRM; sem lacuna estrutural grande |
| **P02 Inteligência de Mercado** | `/app/prospect`, `/app/prospect/inteligente`, `/app/market-intelligence`, `/app/market-intelligence/hub` | prospecting (67 svc/api), market-intelligence | ✅ ProspecçãoHub multi-fonte, enriquecimento, dossiê, LDR | 0 testes dedicados a market-intelligence; validação de créditos/provedores a confirmar |
| **P03 Orquestração de Vendas** | `/app/jornadas`, `/app/playbooks`, `/app/processos`, `/app/roteiros`, `/app/cadence`, `/app/activities`, `/app/calendar`, `/app/roleplay`, `/app/qualification_matrix`, `/app/objections_matrix`, `/app/topic_training`, `/app/chatbook`, `/app/editor` | cadence (45), playbook, roleplay, chatbook, sales-orchestration | 🟡 Cadências/jornadas reais; `DemoDataNotice` sinaliza telas com seed/template | Jornadas/Playbooks/Processos/Roteiros consomem `/api/sales-orchestration/overview` com fonte `real|none` — telas parcialmente demo; roleplay e matrizes dependem de IA |
| **P04 Performance Comercial** | `/app/analytics`, `/app/winloss`, `/app/reports`, `/app/gamification`, `/app/war-room`, `/app/dashboard`, `/app/commercial_intelligence` | analytics (Prisma repo), gamification | ✅ Analytics, gamificação, war-room; 🟡 "17 relatórios executivos" do doc a verificar um a um | War-room SSE; contagem real de relatórios executivos vs doc |
| **P05 Previsibilidade** | `/app/forecast`, `/app/metas`, `/app/pipeline_ponderado` | predictability.api → compõe `/api/commercial-intelligence` | ✅ ForecastHub/MetasHub/PipelinePonderadoHub com contrato honesto (null sem dado) | Motor de forecast existe no commercial-intelligence; calibragem MAPE <8% do doc a medir |
| **P06 Inteligência Artificial** | `/app/intelligence`, `/app/intelligence/elite-agent`, `/app/copiloto_ia`, `/app/pending-actions`, `/app/knowledge`, `/app/signals-risks`, `/app/sdr-diagnostic`, `/app/commercial_intelligence` | intelligence (62 svc), copiloto-ia, knowledge (RAG pgvector), commercial-intelligence | ✅ Módulo mais maduro: Supervisor, AgentBus, Copiloto, Elite Agent, RAG, pending-actions | Gate de papel em várias superfícies; volume de agentes a validar contra os 15 do doc |
| **P07 Automação & Conectividade** | `/app/automations`, `/app/integrations`, `/app/bitrix` | automations (17 svc), integrations (38), bitrix | ✅ Automações, webhooks, DLQ, credenciais criptografadas, conector Bitrix24 | VoiceHub WebRTC pertence a P08 mas é citado no doc junto a conectividade |
| **P08 Engajamento Comercial** | `/app/mesa-tratamento` (+ hidden: voice-hub, outbound, dialer→cadence) | mesa-tratamento (triage service real), voice-hub (43 svc mas **gated**) | 🟡 Mesa de Tratamento real e liberada; 🔴 voice-hub/outbound/dialer atrás de `legacyModuleGate` → **503 MODULE_NOT_READY intencional** (handoff 17→12) | **Maior lacuna do portfólio**: VoiceHub, discador, gravações, WhatsApp do Documento Mestre estão desligados |
| **M09 Admin & Operations** | `/app/settings`, `/app/team`, `/app/module-access`, `/app/usage`, `/app/notifications`, `/app/characters`, + `settings_<pillar>` ×8 | settings, team, module-access, organization-modules, notifications | 🟡 Núcleo admin real (RBAC, LGPD, auditoria); � **`settings_<pillar>` ×8 persistem via `GET|PUT /api/settings/pillars/:pillar` (Onda F1), mas valores ainda não têm consumidores nos módulos — enforcement pendente** | Ligar os settings persistidos às rotinas consumidoras (handoffs por domínio) |
| **M10 Mobile & Field Sales** | sem rota web (rail desabilitado) | mobile (FieldMeetingRecorder, offlineSync, mobileFieldMeeting.routes/service) | 🟡 Existe base Capacitor + offline sync + gravação de campo | Ativação exige autorização + critérios (doc: SQLite criptografado, offline-first); gate formal pendente |
| **M11 Social Selling** | `/social-selling` (top-level, RequireModuleAccess) | social-selling (rotas+repo Prisma+services) | ✅ SocialSellingHub, ApproachGenerator, shadow copy, sinais | Validar conformidade "proibição de scraping" do doc e cobertura de testes (0 testes hoje) |

---

## 3. Análise de lacunas vs Documento Mestre

### Lacunas críticas (bloqueiam paridade funcional)

1. **P08 — Voice Hub / telefonia desligada.** `voice-hub`, `outbound`,
   `dialer` retornam 503 `MODULE_NOT_READY` por `legacyModuleGate`
   (decisão documentada: handoff 17→12, reabrir só com isolamento por org).
   O Documento Mestre prevê VoiceHub WebRTC, gravações (retenção 90d),
   WhatsApp, outbound. **Dependência: Agente 12 + 17.**
2. **M09 — 8 telas de settings por pilar são placeholders não-persistentes.**
   `PillarSettingsPlaceholder` usa `useState` local; Salvar não chama API
   (verificado: nenhum fetch/apiClient no arquivo). Precisa de contrato de
   settings por organização (provável extensão de `/api/settings` ou
   `organization-modules`). **Dependência: Agente 02 + 01.**
3. **M10 — mobile existe mas não homologado/ativado.** Base técnica
   presente; falta gate formal de ativação.

### Lacunas de profundidade (módulo existe, escopo do doc maior)

4. **P03** — 4 telas de orquestração sinalizam dados demo/template
   (`DemoDataNotice` honesto). Jornadas/Playbooks/Processos/Roteiros
   precisam de dados reais ou declaração de escopo reduzido.
5. **P04** — "17 relatórios executivos" do doc: inventariar quantos
   existem de fato em `/app/reports` + war-room; preencher os faltantes.
6. **P02** — zero testes dedicados a market-intelligence; ledger de
   créditos de enriquecimento (AC-MKT-003) a verificar.
7. **M11** — zero testes; validar proibição de scraping e LGPD do doc.
8. **P05** — calibragem MAPE<8% e health score: medir contra dados reais.

### Pontos fortes confirmados

- P01, P06 são os módulos mais maduros (backend extenso + testes).
- Contratos honestos já adotados: `predictability.api.ts` (null sem dado),
  `DemoDataNotice`, `NAV_HIDDEN_TABS` — a cultura "sem mock disfarçado"
  está instalada; manter.
- Isolamento de features via HTTP (regra no-cross-feature-imports)
  respeitado nos contratos novos.

---

## 4. Mapa de integração — 29 personagens × agentes executáveis

Fonte: `characterCatalogPillars.ts` (9), `characterCatalogAgents.ts` (20).
Personagens de pilar (`linkedAgentId: null`) são **identidade visual** do
workspace via `contextGroup` → `ModuleAgentWidget`. Os demais vinculam-se
a agentes reais:

| Camada | Personagem | Agente/motor vinculado | Status do agente |
|---|---|---|---|
| pillar | orbit, nexus, aria, vanguard, oracle, core, spark, echo | — (visual) | n/a |
| pillar | sudo | ADMINISTRAÇÃO (contextGroup) | n/a |
| commercial-agent ×15 | axiom→beacon→meridian→forge→relay→helm→apex→ledger→anchor→seal→cipher→harbinger→scout→pledge→tribunal | `ldr-intelligence`, `bdr-outbound`, `sdr-qualification`, `closer-sales`, `coordinator-commercial`, `manager-commercial`, `executive-director`, `billing-revenue`, `churn-retention`, `contract-signature`, `bitrix-guardian`, `revenue-intelligence`, `account-detective`, `promise-guardian`, `devils-advocate` | ✅ todos os 15 existem em `commercialAgentRegistry.ts` |
| channel-agent ×4 | vox, scope, tracker, tempo | `voice-agent`, `sdr-diagnostic`, `hunter-agent`, `tactical-agent` | motores de canal (voice-agent depende do gate P08) |
| orchestration | aegis | `supervisor-central` | ✅ Supervisor + AgentBus + AIPendingAction |

**Conclusão**: nenhum personagem está órfão — todos os `linkedAgentId`
resolvem para entradas reais do registry ou motores de canal. A
distinção visual vs executável está correta no modelo. Pendência:
`voice-agent` (vox) está funcionalmente bloqueado pelo gate P08.

---

## 5. Priorização das funcionalidades pendentes

| # | Item | Módulo | Impacto | Esforço estimado | Depende de |
|---|---|---|---|---|---|
| 1 | Reabrir VoiceHub/telefonia (gate 17→12) | P08 | Alto (doc prevê voz nativa) | Alto | Agente 12, isolamento por org |
| 2 | ~~Settings por pilar persistentes~~ → **parcialmente resolvido (F1)**: persistência real implementada; falta consumo pelos módulos + e2e (Agente 08) | M09 | Alto | Médio | Handoffs de consumo por domínio |
| 3 | Substituir seeds demo de Jornadas/Playbooks/Processos/Roteiros por dados reais | P03 | Médio | Médio | sales-orchestration backend (17/04) |
| 4 | Inventariar/completar "17 relatórios executivos" | P04 | Médio | Médio | Levantamento + 04 |
| 5 | Testes market-intelligence + social-selling + mesa-tratamento + signals-risks | vários | Médio (homologação) | Baixo-Médio | Agente 08 |
| 6 | Medir calibragem forecast MAPE e health score | P05 | Médio | Baixo | Dados reais + 04/23 |
| 7 | Gate formal de ativação M10 | M10 | Baixo (web não usa) | Médio | Autorização do proprietário |
| 8 | Validar conformidade LGPD/social-selling (scraping ban) | M11 | Médio | Baixo | 21 + 05 |

---

## 6. Plano de implementação por ondas (proposta)

**Pré-condição**: conclusão da missão de commits da navegação homologada
(8 commits) — esta fase é somente planejamento.

- **Onda F1 — Settings persistentes (M09 + transversal)**
  Escopo: contrato de settings por organização; substituir
  `PillarSettingsPlaceholder` por telas reais para os 8 pilares.
  Agentes: 01 (schema/endpoint se necessário), 02 (UI), 08 (testes).
  Aceite: alterar setting → persistir → refletir na feature consumidora.

- **Onda F2 — Voz & Engajamento (P08)**
  Escopo: reabrir `legacyModuleGate` de voice-hub/outbound/dialer com
  isolamento por org; ativar destinos na nav (NAV_HIDDEN_TABS).
  Agentes: 12 (voz), 17 (cadência), 01 (gate/RLS), 02 (nav).
  Aceite: call recording/transcrição acessível por tenant autorizado;
  dialer funcional ou explicitamente cortado do escopo.

- **Onda F3 — Orquestração sem demo (P03)**
  Escopo: dados reais ou escopo declarado para jornadas/playbooks/
  processos/roteiros; roleplay/matrizes validados com IA real.
  Agentes: 17, 07 (roleplay IA), 02, 08.
  Aceite: `DemoDataNotice` zerado ou justificado por módulo.

- **Onda F4 — Performance & Previsibilidade (P04+P05)**
  Escopo: inventário dos relatórios executivos vs doc; métricas de
  calibragem forecast.
  Agentes: 04, 10 (SSE/war-room), 23 (custo/perf), 08.
  Aceite: checklist dos 17 relatórios com status; MAPE medido.

- **Onda F5 — Cobertura de testes & hardening**
  Escopo: specs E2E/unit para market-intelligence, social-selling,
  mesa-tratamento, signals-risks; regressão a11y.
  Agentes: 08, 24 (revisão).
  Aceite: suíte verde + parecer 24.

- **Onda F6 — M10 ativação (condicional)**
  Escopo: gate formal do módulo mobile quando o proprietário autorizar.
  Agentes: 09, 10, 21 (LGPD offline).

---

## 7. Critérios objetivos de aceite (por módulo)

Um módulo só é "funcionalmente completo" quando:

1. Todas as rotas do registry renderizam conteúdo real (sem demo/seed
   não sinalizado, sem placeholder local-state).
2. Backend correspondente existe e é exercido por ao menos 1 teste de
   integração ou E2E.
3. Permissões do módulo respeitam RBAC/RLS (verificado por teste).
4. Personagem/personagens do pilar resolvem e agentes vinculados estão
   registrados (já ✅ para os 29).
5. `npx tsc --noEmit`, `npm run lint`, `npm run build`,
   `npm run test:architecture` verdes no escopo tocado.
6. Revisão independente do Agente 24 aprovada.
7. Evidência visual real (screenshot) da tela principal do módulo.

---

## 8. Handoffs propostos

Criados em `.agents/handoffs/`:
- `00-para-01-02-settings-pilares-persistentes.md` (Onda F1)
- `00-para-12-17-voicehub-reactivacao.md` (Onda F2)
- `00-para-17-07-orquestracao-sem-demo.md` (Onda F3)
- `00-para-04-10-08-relatorios-forecast.md` (Onda F4)
- `00-para-08-cobertura-testes-modulos.md` (Onda F5)

Cada handoff referencia esta matriz e carrega escopo, dono, critério de
sucesso e fora-de-escopo.
