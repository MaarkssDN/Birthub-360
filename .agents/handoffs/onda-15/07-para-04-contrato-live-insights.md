- De: 07 (IA e Automações)
- Para: 04 (CRM e BI)
- Onda: 15
- Status: resolvido
- Prioridade: alto

## Problema
Durante a execução de chamadas via LiveKit/WebRTC, o motor de IA emite eventos de detecção de sentimento, objeções comerciais e intenções de compra em tempo real. O módulo analítico do CRM e a entidade de Oportunidade precisam de um contrato formal para registrar e exibir esses insights sem poluir o histórico com logs brutos.

## Arquivo(s) envolvido(s)
- `src/features/ai-voice/`
- `src/features/commercial-intelligence/**`
- `src/shared/types/crm.ts`

## Alteração necessária
O Agente 04 deve:
1. Definir o tipo `LiveCallInsight { callId, dealId, timestamp, objectionCategory, suggestedRebuttal, sentimentScore }`.
2. Integrar os insights ao sumário executivo da negociação e alimentar o cálculo de risco de fechamento (`dealRiskDetection.service.ts`).

## Teste esperado
- Teste de ingestão de live insights atualizando o score de saúde do negócio (`healthScore.ts`) de forma reativa.

## Resolução (Agente 04)
1. Tipo canônico `LiveCallInsight` formalizado e integrado em `src/shared/types/crm.ts` e `src/features/commercial-intelligence/domain/CommercialIntelligence.ts`.
2. Serviço `dealRiskDetection.service.ts` e `healthScore.ts` equipados com ingestão e cálculo reativo de risco de fechamento a partir de live insights.
3. Suíte de testes `src/features/commercial-intelligence/application/__tests__/dealRiskDetection.service.test.ts` (13 testes) 100% aprovada.
