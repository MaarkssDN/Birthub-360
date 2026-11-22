# Onda 15 — Autonomia Multicanal, Copiloto Live e Experiência Mobile

**Status:** GATE_VERDE (TODOS OS BLOQUEADORES E HANDOFFS RESOLVIDOS)  
**Data:** 2026-10-08  
**Coordenador:** Agente 00  

---

## 1. Objetivo Estratégico

Após a consolidação dos novos conectores de CRM, da infraestrutura do Temporal.io e da camada de telefonia em tempo real na Onda 14, a **Onda 15** tem como objetivo ativar o motor de receita autônoma e inteligência proativa do **Birth Hub 360°**:

1. **Épico 1 — Enxame Comercial Autônomo & Cadência Multicanal (Agentes 13, 17, 06):** Ativação de workflows autônomos 24/7 sobre os novos CRMs integrados (HubSpot, Pipedrive, RD Station, Monday e Bitrix), orquestrando cadências inteligentes por WhatsApp, E-mail, SDR Voice e Tarefas de CRM com rate-limiting estrito e opt-out.
2. **Épico 2 — Copiloto Comercial & Objeções em Tempo Real (Agentes 04, 07, 12):** Live sentiment & objection detection durante chamadas ativas conectadas via LiveKit/3CX, injetando sugestões de contorno de objeção no HUD do closer/SDR com latência < 800ms.
3. **Épico 3 — Mobile & PWA Offline-First (Agentes 09, 02, 03):** Sincronização offline local-first para o app Android (Capacitor) e PWA, permitindo consulta de pipeline, visualização de contatos e gravação de notas de voz mesmo sem conectividade.
4. **Épico 4 — Observabilidade, Custo de IA e Governança FinOps (Agentes 10, 23, 18):** Instrumentação de traces distribuídos OpenTelemetry + Langfuse no runtime do Temporal e teto de orçamento de tokens por tenant.

---

## 2. Matriz Oficial de Propriedade de Arquivos (AGENTS.md §13, §15)

| Agente | Domínio / Especialidade | Escopo Exclusivo de Arquivos |
| :--- | :--- | :--- |
| **00** | Coordenação & Integração | Orquestração global, `.agents/runs/**`, merge gates, aprovação de `server.ts` e `package.json` |
| **02** | Produto e UX | `src/App.tsx`, navegação principal, HUD do Copiloto Comercial, telas de Cadência Multicanal |
| **03** | Design & Acessibilidade | `src/components/ui/**`, motion design do Live HUD, microinterações táteis e WCAG 2.2 AA |
| **04** | CRM e BI | `src/features/crm/**`, `src/features/commercial-intelligence/**`, scoring e forecasting |
| **07** | IA e Automações | `src/features/ai-voice/`, `src/lib/ai/**`, prompts de detecção de objeções e RAG de propostas |
| **09** | Mobile (Capacitor & PWA) | `android/**`, `capacitor.config.ts`, `src/features/mobile/**`, sync offline |
| **10** | Infraestrutura & SRE | `docker-compose*.yml`, `Dockerfile`, `k8s/**`, OpenTelemetry collector e Grafana dashboards |
| **12** | Voz e Telefonia | `src/features/voice/**`, streaming de transcrição ao vivo e eventos de chamada |
| **13** | Enxame Autônomo | `src/features/swarm/**`, políticas de autonomia, schedulers e priorização de leads |
| **17** | Cadência Multicanal | `src/features/cadence/**`, despachantes de e-mail, WhatsApp e agendador de toques |
| **18** | Contratos & Docs Vivas | `docs/openapi.yaml`, contratos de APIs e validação de drift |
| **21** | Privacidade & LGPD | Fluxos de opt-out multicanal, consentimento de gravação e registro de tratamento |
| **23** | Custo & Performance IA | Orçamento de tokens, limites de taxa de LLMs e telemetria de custos por organização |

---

## 3. Matriz de Dependências Cross-Domain e Handoffs da Onda 15

| ID Handoff | De | Para | Prioridade | Status | Escopo / Objeto da Dependência |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `13-para-17-disparo-cadencia-enxame.md` | 13 | 17 | **Bloqueador** | **Resolvido** | Protocolo de acionamento de cadências multicanal a partir de recomendações do Swarm |
| `17-para-21-validacao-optout-multicanal.md` | 17 | 21 | **Bloqueador** | **Resolvido** | Trava de consentimento e checagem de blacklist/opt-out antes de qualquer envio |
| `07-para-04-contrato-live-insights.md` | 07 | 04 | Alto | **Resolvido** | Schema de eventos de objeções e insights em tempo real para o dashboard do CRM |
| `07-para-02-hud-copiloto-live.md` | 07 | 02 | Alto | **Resolvido** | Interface visual flutuante (HUD) para exibição de sugestões de IA durante a chamada |
| `09-para-02-shell-mobile-offline.md` | 09 | 02 | Alto | **Resolvido** | Adaptação de layout responsivo e indicadores visuais de conectividade (online/offline) |
| `10-para-23-metricas-tokens-otel.md` | 10 | 23 | Normal | **Resolvido** | Exposição de métricas de tokens e latência via OpenTelemetry Collector para o FinOps |
| `00-para-18-contratos-openapi-onda15.md` | 00 | 18 | Normal | **Resolvido** | Documentação viva OpenAPI para rotas do Swarm, Cadências e endpoints Mobile |

---

## 4. Ordem de Integração e Desbloqueio (AGENTS.md §19)

1. **Camada de Governança & Segurança (Slot 1):** Agente 21 valida regras de opt-out multicanal (`17-para-21`).
2. **Infraestrutura & Observabilidade (Slot 2):** Agente 10 e Agente 23 configuram coletores OpenTelemetry e travas de tokens (`10-para-23`).
3. **Motores de Domínio & Runtime (Slot 3):** Agente 13 conecta o Swarm ao despachante de Cadência do Agente 17 (`13-para-17`). Agente 07 e Agente 12 ativam o live stream de objeções (`07-para-04`).
4. **Experiência de Produto, UX e Mobile (Slot 4):** Agente 02 e Agente 03 implementam o HUD do Copiloto (`07-para-02`). Agente 09 implementa sync offline no Mobile (`09-para-02`).
5. **Documentação & Quality Gate (Slot 5):** Agente 18 sincroniza `docs/openapi.yaml` (`00-para-18`). Agente 08 e Agente 00 executam a suíte de validação global.

---

## 5. Critérios de Aceite da Onda 15

- Zero disparo multicanal sem checagem prévia de opt-out / consentimento (B-13).
- Latência média do Live HUD de objeções inferior a 800ms.
- Sincronização offline-first funcional com armazenamento local criptografado no client mobile.
- Zero drift de contratos OpenAPI (`npm run verify:openapi-drift`).
- Todos os testes unitários, de integração e de arquitetura verdes.
