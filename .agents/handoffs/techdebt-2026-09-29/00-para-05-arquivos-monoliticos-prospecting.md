- De: 00 (Coordenador)
- Para: 05 (Prospecção)
- Onda: techdebt-2026-09-29
- Status: resolvido
- Prioridade: alto

## Problema

Auditoria de tech debt identificou 2 arquivos monolíticos em `src/features/prospecting/outbound/**` que violam princípios de arquitetura:

1. `server/routes.ts` - 3614 linhas
2. `components/LeadCard.tsx` - 2451 linhas

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes.ts` (3614 linhas)
- `src/features/prospecting/outbound/components/LeadCard.tsx` (2451 linhas)

## Alteração necessária

Decompor cada arquivo por responsabilidade, visando ganho claro de coesão, testabilidade e ownership:

**Para `routes.ts`:**
- Separar handlers de rota em módulos por feature/domain (search, enrichment, export, etc.)
- Extrair lógica de negócio para services/domain
- Manter apenas definição de rotas e middleware no arquivo principal

**Para `LeadCard.tsx`:**
- Extrair subcomponentes (seções de contato, ações, evidências, etc.)
- Separar hooks customizados
- Criar componentes menores e focados

## Teste esperado

- `npx tsc --noEmit` passa
- `npm run lint` passa
- Funcionalidade existente preservada (testes E2E relevantes)
- Novos componentes são testáveis em isolamento

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Classificados como P1 (Architecture) no audit. Recomendação: "Decompor por responsabilidade somente quando houver ganho claro de coesão, testabilidade e ownership."

Referência: AGENTS.md em `src/features/prospecting/AGENTS.md` define Agente 05 como dono desta pasta.

## Resolução

1. **`LeadCard.tsx` (2452 → 1367 linhas):**
   - Decomposto em 6 subcomponentes modulares e reutilizáveis em `src/features/prospecting/outbound/components/lead-card/`:
     - `LeadCnpjDataSection.tsx`: Dados oficiais da Receita Federal e botão de atualização cadastral.
     - `LeadDecisionMakerSection.tsx`: Contatos de decisores enriquecidos via Apollo/Hunter com e-mail, telefone e LinkedIn.
     - `LeadActionsBar.tsx`: Barra de ações (salvar, seletor de tom, enriquecer, script rápido, status Bitrix, evidências, Bland AI).
     - `LeadNewsDossierSection.tsx`: Dossiê público com resumo, gatilhos/fatos e notícias da mídia.
     - `LeadOutreachSection.tsx`: Abas multicanal (cold call, cold email, whatsapp, linkedin, objeções, qualificação, ice breaker).
     - `LeadTasksAndActivitySection.tsx`: Lista de tarefas, histórico de atividades e gravação/ditado por áudio.
     - `index.ts`: Barrel export.

2. **`routes.ts` (3614 → 1409 linhas):**
   - Extraídos serviços e utilitários:
     - `src/features/prospecting/outbound/server/services/leadSearch.service.ts`: `findLeads`, `enrichLeadWithApollo`, `resolveCnpjWithResilience`, saneamento de domínio e slugs.
     - `src/features/prospecting/outbound/server/utils/formatLead.ts`: `formatLeadRow`, `validateChangedLeadFields`, `upsertMessageWithVersioning`.
   - Extraídos sub-roteadores modulares em `src/features/prospecting/outbound/server/routes/`:
     - `auth.routes.ts`: Autenticação e hash scrypt (`/auth/login`, `/auth/logout`, `/auth/me`, `/users`).
     - `campaigns.routes.ts`: Campanhas e distribuição de leads (`/campaigns`, `/campaigns/:id`, `/users/:userId/leads`, `/leads/distribution`).
     - `tasks.routes.ts`: Gestão de tarefas (`/leads/:id/tasks`, `/tasks/:id`, `/users/:userId/tasks`, `/tasks`).
     - `chat.routes.ts`: Chat e Ollama (`/ollama/status`, `/chat`, `/chat/sessions`, `/chat/sessions/:id/messages`).
     - `system.routes.ts`: Saúde, observabilidade, estatísticas e feedbacks (`/health`, `/providers/health`, `/search-runs/:searchId`, `/observability/summary`, `/db/stats`, `/error-reports`, `/db/query`, `/cnpj/:cnpj`, `/feedback/summary`).
     - `integrations.routes.ts`: Integrações externas (`/integrations/bitrix24/send-lead`, `/leads/:id/bitrix-check`, `/integrations/hunter/verify`, `/integrations/hunter/domain-search`, `/integrations/bland/call`).
   - Retidas no arquivo principal as rotas centrais de ciclo de vida do lead e motor de busca (`/prospect`), montando os sub-roteadores e reexportando utilitários para compatibilidade.
   - Atualizado `HOTSPOT_EXCEPTIONS.md` com novos tetos de 1500 linhas.

3. **Validação:**
   - `npx tsc --noEmit` executado com sucesso (código 0).
   - `npm run test:unit -- src/features/prospecting` (23 arquivos, 257 testes) passaram integralmente.
   - `npm run check:hotspots` verificado com sucesso.
