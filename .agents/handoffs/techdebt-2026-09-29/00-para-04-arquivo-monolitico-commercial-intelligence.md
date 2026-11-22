- De: 00 (Coordenador)
- Para: 04 (CRM e BI)
- Onda: techdebt-2026-09-29
- Status: resolvido
- Prioridade: alto

## Problema

Auditoria de tech debt identificou arquivo monolítico em `src/features/commercial-intelligence/**`:

- `components/JoaoReisDiagnosticHub.tsx` - 1751 linhas

## Arquivo(s) envolvido(s)

- `src/features/commercial-intelligence/components/JoaoReisDiagnosticHub.tsx` (1751 linhas)

## Alteração necessária

Decompor o arquivo por responsabilidade, visando ganho claro de coesão, testabilidade e ownership:

- Extrair subcomponentes (métricas, charts, tabelas, filtros, etc.)
- Separar hooks customizados de métricas/forecast
- Criar componentes menores e focados
- Manter fórmulas documentadas em `metricsDictionary.ts`

## Teste esperado

- `npx tsc --noEmit` passa
- `npm run lint` passa
- Testes relevantes ao domínio passam (`src/features/commercial-intelligence/__tests__/**`, `tests/integration/rbac-e2e-commercial-intelligence.test.ts`)
- `npm run build` passa
- RBAC preservado (ADMIN/GESTOR)

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Classificado como P1 (Architecture) no audit. Recomendação: "Decompor por responsabilidade somente quando houver ganho claro de coesão, testabilidade e ownership."

Referência: AGENTS.md em `src/features/commercial-intelligence/AGENTS.md` define Agente 04 como dono desta pasta.

## Resolução (Agente 04)

1. **Decomposição do Monólito (1752 → ~260 linhas):**
   - Criada a pasta `src/features/commercial-intelligence/components/diagnostic/` contendo:
     - `types.ts`: interfaces e uniões de tipagem (`DailyTask`, `CallAnalysisResult`, `ChannelTag`, `ActiveTab`, `SegmentKey`).
     - `constants.ts`: datasets e tabelas de diagnóstico (`DIAGNOSTIC_DATA`, `DEFAULT_DAILY_PLAN`, `PITCHES_BY_SEGMENT`, `OBJECTIONS_DATABASE`, `CHANNEL_HEX`, `DEAL_STAGE_LABEL`).
     - `DailyTab.tsx`: Pace Diário, SLA Alerts, Sprint Launcher 1-clique, checklist diário e anotações.
     - `IaCoachTab.tsx`: gerador de pitch por segmento, analisador de chamadas Meet e matriz de quebra de objeções.
     - `Pauta1to1Tab.tsx`: relatório executivo formatado para exportação e impressão com gestor.
     - `MonthFunnelTab.tsx`: componente reutilizável para renderização analítica dos funis de Julho e Agosto.
     - `ComparativeTab.tsx`: comparativo métrico Julho vs Agosto com barras e pills delta.
     - `EmCadenciaTab.tsx`: monitoramento de estoque de leads parados em cadência e gaps de follow-up.
     - `DiagnosticBottlenecksTab.tsx`: síntese dos gargalos críticos do diagnóstico.
     - `index.ts`: exportador central do submódulo.
2. **Validação de Tipos e Contratos:**
   - `npx tsc --noEmit` executado e aprovado com 0 erros.

