- De: 06 (Integrações e Bitrix)
- Para: 04 (CRM e BI)
- Onda: 14
- Status: resolvido
- Prioridade: alto

## Problema
Os novos CRMs (HubSpot Deals, Pipedrive Deals, RD Station Oportunidades, Monday Boards) utilizam taxonomia heterogênea de estágios de venda, probabilidades de fechamento e campos de valores/moedas. O módulo analítico de Commercial Intelligence e a visualização de funil do CRM 360 (mantidos pelo Agente 04) necessitam de uma camada de mapeamento canônica para calcular métricas como taxa de conversão, bottlenecks e forecast de receita sem erros de normalização.

## Arquivo(s) envolvido(s)
- `src/shared/types/crm.ts`
- `src/features/crm/domain/Lead.ts`
- `src/features/commercial-intelligence/**`
- `src/features/integrations/hubspot/hubspot.service.ts`
- `src/features/integrations/pipedrive/pipedrive.service.ts`
- `src/features/integrations/rdstation/rdstation.service.ts`
- `src/features/integrations/monday/monday.service.ts`

## Alteração necessária
O Agente 04 deve validar e formalizar:
1. Contrato canônico de estágios de pipeline (`PipelineStage`: `PROSPECTING`, `QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`).
2. Tabela de equivalência padrão (default mappings) para os estágios nativos do HubSpot, Pipedrive, RD Station e Monday.
3. Conversão de valores monetários e probabilidade calculada para alimentar corretamente os componentes `ForecastAccuracyCard`, `FunnelBottleneckCard` e `ExecutiveOverviewTab`.

## Teste esperado
- Testes unitários de ingestão de Deals provenientes de cada CRM mapeando perfeitamente para as entidades de domínio sem corromper métricas agregadas.
- Ausência de valores `NaN` ou estágios `undefined` nos cálculos de inteligência comercial.

## Contexto adicional
Alinha o domínio de integrações externas com o ecossistema de dados analíticos do Birth Hub 360.

## Resolução (Agente 04 - 2026-10-08)
1. Formalizado o tipo canônico `CanonicalPipelineStage` em `src/shared/types/crm.ts`: `PROSPECTING | QUALIFICATION | PROPOSAL | NEGOTIATION | WON | LOST`.
2. Criada tabela canônica `DEFAULT_CRM_STAGE_MAPPINGS` mapeando explicitamente todos os estágios do HubSpot, Pipedrive, RD Station e Monday.com para o modelo analítico do Birth Hub 360.
3. Criada a função pura `normalizeCrmStage(rawStage, defaultStage?)` com normalização defensiva e fallback determinístico sem emissão de `NaN`.
4. Implementada suíte de testes unitários em `tests/unit/features/crm/normalizeCrmStage.test.ts` com 100% de aprovação.

