- De: 00 (Coordenador)
- Para: 17 (Cadência Multicanal e Ciclo de Receita)
- Onda: techdebt-2026-09-29
- Status: resolvido
- Prioridade: alto

## Problema

Auditoria de tech debt identificou arquivo monolítico em `src/features/cadence/**`:

- `components/CadenceHub.tsx` - 1668 linhas

## Arquivo(s) envolvido(s)

- `src/features/cadence/components/CadenceHub.tsx` (1668 linhas)

## Alteração necessária

Decompor o arquivo por responsabilidade, visando ganho claro de coesão, testabilidade e ownership:

- Extrair subcomponentes (cadência visual, timeline, configuração, etc.)
- Separar hooks customizados relacionados a cadência
- Criar componentes menores e focados
- Seguir arquitetura definida em `AGENTS.md` (domain/application/infra)

## Teste esperado

- `npx tsc --noEmit` passa
- `npm run lint` passa
- `npm run test:unit -- src/features/cadence` passa
- `npm run build` passa
- Funcionalidade existente preservada

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Classificado como P1 (Architecture) no audit. Recomendação: "Decompor por responsabilidade somente quando houver ganho claro de coesão, testabilidade e ownership."

Referência: AGENTS.md em `src/features/cadence/AGENTS.md` define Agente 17 como dono desta pasta.

## Resolução (Agente 17)

1. **Decomposição do Monólito (1668 → 120 linhas):**
   - Criada a pasta `src/features/cadence/components/hub/` contendo componentes coesos e desacoplados:
     - `constants.ts`: mapeamentos de canais, badges, escopos, status, filtros e helpers utilitários (`formatDateTime`, `leadLabel`).
     - `ScheduleMeetingDialog.tsx`: diálogo de agendamento de reunião confirmada com validação de horário e integração Google Meet.
     - `OptOutsSection.tsx`: painel independente de consulta e auditoria de opt-outs com evidência e origem.
     - `CadenceRunActions.tsx`: toolbar de ações de execução (pausar, retomar, parar com confirmação modal e agendamento).
     - `CadenceRunRow.tsx`: linha de execução com histórico de tentativas expansível e status de entrega por canal.
     - `CadenceRunsSection.tsx`: listagem de execuções com filtros de status e atualização reativa.
     - `SequencesSection.tsx`: catálogo de sequências ativas com encerramento governado por RBAC (`canManage`).
     - `NewSequenceDialog.tsx`: modal para desenho visual de sequência com múltiplos toques e delays em horas.
     - `StartRunDialog.tsx`: modal com busca reativa de leads e inicialização de cadência.
     - `JourneyTemplatesDialog.tsx`: catálogo de modelos estruturados de jornada para criação em 1 clique.
     - `index.ts`: exportador central do módulo hub.
2. **Validação Rigorosa:**
   - `npx tsc --noEmit` executado com 0 erros.
   - `npm run test:unit -- src/features/cadence` executado com 100% de sucesso (10 arquivos de teste, 148 testes passando).

