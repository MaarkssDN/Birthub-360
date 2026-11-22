# Registro de dívida — hotspots >700 linhas (warnings não-bloqueantes)

Fonte: `npm run check:hotspots` (limite de aviso 700, falha 1000).
Estes 49 arquivos **não reprovam** o gate — são warnings de dívida técnica
pré-existente, inventariados em 2026-11-10 para distribuição aos donos de
domínio. Nenhum foi criado ou agravado pela navegação modular.

Regra: cada dono deve modularizar no contexto da sua próxima missão no
domínio, ou abrir exceção formal em `HOTSPOT_EXCEPTIONS.md` com owner e
deadline (padrão já usado para arquivos >1000).

## Por domínio / dono sugerido

### Agente 02 — Produto e UX / navegação
| Arquivo | Linhas |
|---|---|
| `src/App.tsx` | 729 |
| `src/features/hub/components/HubScreen.tsx` | 842 |
| `src/features/hub/components/CommercialAgentCellPanel.tsx` | 738 |
| `src/features/dashboard/components/SinglePageDashboard.tsx` | 961 |
| `src/features/settings/components/PillarSettingsPlaceholder.tsx` | 986 |

### Agente 03 — Design e Acessibilidade / UI base
| Arquivo | Linhas |
|---|---|
| `src/components/Intelligence.tsx` | 907 |
| `src/components/brand/title-icons/flowIcons.tsx` | 744 |
| `src/components/icons/BrandIcons.tsx` | 731 |

### Agente 04 — CRM e BI
| Arquivo | Linhas |
|---|---|
| `src/features/activities/components/ActivityList.tsx` | 856 |
| `src/features/analytics/infra/PrismaAnalyticsRepository.ts` | 760 |
| `src/features/companies/components/CompanyList.tsx` | 789 |
| `src/features/crm/application/LeadUseCases.ts` | 771 |

### Agente 05 — Prospecção
| Arquivo | Linhas |
|---|---|
| `src/features/prospecting/components/ProspectingHub.tsx` | 890 |
| `src/features/prospecting/components/prospecting-hub/DecisionMakerSearch.tsx` | 727 |
| `src/features/prospecting/components/prospecting-hub/DiscoveryFilterPanel.tsx` | 895 |
| `src/features/prospecting/components/prospecting-hub/OcrCapturePanel.tsx` | 773 |
| `src/features/prospecting/outbound/components/ProspectorTab.tsx` | 840 |
| `src/features/prospecting/outbound/components/Sidebar.tsx` | 902 |
| `src/features/prospecting/outbound/server/ai.ts` | 840 |
| `src/features/prospecting/outbound/utils/searchOptions.ts` | 718 |
| `src/features/prospecting/services/enrichment.service.ts` | 803 |

### Agente 06 / 06A — Integrações e Bitrix
| Arquivo | Linhas |
|---|---|
| `src/features/integrations/bitrix/bitrix.routes.ts` | 842 |
| `src/features/integrations/bitrix/service/dailyPlan.service.ts` | 853 |
| `src/features/integrations/threecx/threecx.service.ts` | 956 (ou Agente 12 — confirmar) |

### Agente 07 — IA e Automações
| Arquivo | Linhas |
|---|---|
| `src/features/automations/components/Automations.tsx` | 721 |
| `src/features/chatbook/components/FloatingChatbook.tsx` | 748 |
| `src/features/commercial-intelligence/commercialIntelligence.api.ts` | 991 |
| `src/features/commercial-intelligence/components/DailyPlanHub.tsx` | 923 |
| `src/features/intelligence/agents/supervisor.agent.ts` | 1000 |
| `src/features/intelligence/components/AIPendingActionsInbox.tsx` | 971 |
| `src/features/intelligence/components/AISuiteHub.tsx` | 782 |
| `src/features/intelligence/components/AutomationGuide.tsx` | 774 |
| `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx` | 864 |
| `src/features/intelligence/components/SalesMethodologyStudio.tsx` | 826 |
| `src/features/intelligence/components/SuperagentCreator.tsx` | 996 |
| `src/features/intelligence/components/SwarmDashboard.tsx` | 933 |
| `src/features/intelligence/components/UniversalEcosystemPanel.tsx` | 958 |
| `src/features/intelligence/routes/commercialCell.routes.ts` | 777 |
| `src/features/intelligence/services/ecosystemPlaybooks.service.ts` | 781 |
| `src/features/intelligence/services/swarmScheduler.service.ts` | 752 |
| `src/features/knowledge/components/Base.tsx` | 775 |

### Agente 09 — Mobile
| Arquivo | Linhas |
|---|---|
| `src/features/mobile/offlineSync.service.ts` | 879 |

### Agente 11/02 — Marca e Landing
| Arquivo | Linhas |
|---|---|
| `src/features/landing/components/LaunchLandingView.tsx` | 801 |

### Agente 12 — Voz e Telefonia
| Arquivo | Linhas |
|---|---|
| `src/features/voice-hub/pages/Dashboard/KnowledgeManager.tsx` | 812 |
| `src/features/voice-hub/pages/LandingInnovative.tsx` | 703 |

### Agente 13 — Enxame / Job Roles
| Arquivo | Linhas |
|---|---|
| `src/features/job-roles/services/agentBus.service.ts` | 730 |
| `src/features/job-roles/services/toolExecutors.ts` | 855 |
| `src/features/market-intelligence/server/accountIntelligence.service.ts` | 859 |

### Agente 15/01 — Segurança e Dados
| Arquivo | Linhas |
|---|---|
| `src/lib/security/consentAuditChain.service.ts` | 759 |

## Warnings de chunk do build (advisory)

O `vite build` emite warnings para chunks >500 kB. Avaliação: os chunks
grandes já são **lazy/code-split** (`vendor-excel` 940 kB, `vendor-3d`
~1 MB após isolamento de three/@react-three, `vendor-echarts` 654 kB,
`vendor-react` 556 kB, `index` 606 kB) — não entram no bundle inicial.
Ação aplicada: `manualChunks` agora isola `vendor-3d`. Não se justifica
alterar `chunkSizeWarningLimit` (mascararia o sinal). Revisitar se o
budget de carga inicial virar métrica formal.
