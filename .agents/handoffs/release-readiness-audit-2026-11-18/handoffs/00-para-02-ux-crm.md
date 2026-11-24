- De: 00
- Para: 02 (Produto/UX)
- Status: ABERTO
- Prioridade: P1 (jornada core)

## Achados (relatório: auditoria/ux-completude.md)

### DEBT-0024 — Sem criação manual de lead/oportunidade — P1
`lib/db.ts:127` + `useDatabase.ts:176-183` existem sem consumidor; `CrmBoard.tsx` não lê intent `open-create` que `CommandPalette.tsx:307-312` envia → botão da palette navega e não faz nada. Leads só nascem de prospecção/Bitrix.
**Correção:** LeadForm/DealForm + tratar intent no CrmBoard (padrão já existe em CompanyList:53, ContactList:76, ActivityList:200) — coordenar com 04 (dono CRM).

### UX-10 — Funil Negócio com estágios hardcoded de pilotos — P2
`CrmBoard.tsx:62-89`: 'Piloto VTECH', 'Piloto Birthub 360 Profile'... Tenant novo herda estágios de outro cliente. Verificar se backend `CrmPipelineStage` já é dinâmico.

### UX-03/07 — Erro de API vira empty state (Gamificação); KPI pipeline null→"R$ 0" — P2/P3
`GamificationView.tsx:47-52`; `SinglePageDashboard.tsx:82,174-181` (`?? 0` quando contrato diz null→"—").

### UX-02/04/08/09/11 — P2/P3
Botão "Abrir Roteiros" morto (PlaybooksHub.tsx:219-224); War Room score heurística local (verificar copy); 3/4 abas settings pilar placeholder; perfil read-only; deep link ?lead inválido silencioso.

## Contexto positivo
~50 rotas íntegras; forms críticos chamam API real; feature gates em camadas; sem mocks de KPI em produção; Kanban optimistic+rollback.
