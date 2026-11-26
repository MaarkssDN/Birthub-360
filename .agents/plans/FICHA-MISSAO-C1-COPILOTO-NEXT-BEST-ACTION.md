# FICHA DE MISSÃO INDEPENDENTE — TRILHA C.1
**Missão:** Integração Visual do Copiloto IA — Próxima Melhor Ação (Next Best Action) no Lead  
**Squads:** Squad 70 (IA & Enxame) & Squad 30 (UX, Design System & Marca)  
**Ownership Primário:** Agente 74 (Luca — Copiloto Comercial) & Agente 33 (Célia — Design System)  
**Status:** PLANEJAMENTO / AGUARDANDO DESPACHO FORMAL (NO-GO PARA IMPLEMENTAÇÃO)  

---

### 1. Escopo Específico
Integrar na gaveta de detalhes do lead (`src/features/crm/components/LeadDetailDrawer.tsx` / `LeadCopilotoPanel.tsx`) o componente de recomendação de Próxima Melhor Ação (*Next Best Action*), consumindo o endpoint já testado no backend:
`GET /api/copiloto-ia/leads/:leadId/next-best-action`

### 2. Dependências
- Backend: `CopilotoIaController.ts`, `CopilotoIaUseCases.ts` e `copilotoIa.api.ts` (100% implementados e testados com 5/5 testes unitários).
- Contratos: DTO `NextBestActionDTO` em `src/features/copiloto-ia/domain/CopilotoIa.ts`.
- Permissões: RBAC com papéis `ADMIN`, `GESTOR`, `CLOSER`, `SDR`.

### 3. Critérios de Aceite
1. Renderizar card com ícone de ação, título, justificativa baseada no score/estágio e botão de execução rápida.
2. Tratar explicitamente os 4 estados de UI obrigatórios (P25 / P26): `loading` (Skeleton), `empty` (lead sem histórico suficiente), `error` (fallback com retry) e `stale` (dados em cache).
3. Zero chamadas desnecessárias ou loops de re-renderização (respeito a `react-render-antipatterns`).
4. Testes de componente com Vitest e Testing Library comprovando renderização dos estados.

### 4. Fronteiras e Prevenção de Sobreposição
- Não alterar schema Prisma nem rotas de backend (somente consumo do endpoint existente).
- Não tocar em regras de negócio de pontuação ou scoring (propriedade do Agente 43 - Amon).
