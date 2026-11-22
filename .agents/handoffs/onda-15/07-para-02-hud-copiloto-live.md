- De: 07 (IA e Automações)
- Para: 02 (Produto e UX)
- Onda: 15
- Status: resolvido
- Prioridade: alto

## Problema
Os insights de contorno de objeções gerados pela IA durante as chamadas telefônicas precisam ser exibidos visualmente na interface de atendimento do closer/SDR sem cobrir elementos críticos da tela do CRM ou causar sobrecarga cognitiva.

## Arquivo(s) envolvido(s)
- `src/App.tsx`
- `src/features/voice/**`
- `src/features/copilot/components/**`

## Alteração necessária
O Agente 02 deve:
1. Desenvolver o componente flutuante `LiveCopilotHUD` acionado durante chamadas ativas.
2. Apresentar sugestões de argumentação com badge de confiança da IA, transcrição em streaming e botão de ação rápida (ex.: "Copiar argumento", "Inserir proposta").
3. Garantir estados de minimização, redimensionamento e acessibilidade (WCAG 2.2 AA).

## Teste esperado
- Validação visual e teste de renderização em diferentes resoluções de tela.

## Resolução (Agente 02)
- Componente `LiveCopilotHUD` implementado em `src/features/copilot/components/LiveCopilotHUD.tsx` com renderização flutuante e ancoragem não-intrusiva (`bottom-5 right-5`).
- Apresenta badge de confiança da IA (alta, média, baixa), identificação de categorias de objeção (`price`, `timing`, `competition`, `authority`), sugestão de scripts de contorno com estratégia (Reframe, Pivot, Case Study, Discovery Question) e dica de execução.
- Transcrição em streaming em tempo real com indicador visual de áudio ativo e buffer acessível (`role="log"`, `aria-live="polite"`).
- Botões de ação rápida funcionais: "Copiar argumento" (com cópia via `navigator.clipboard`, som e feedback visual) e "Inserir na proposta" (evento `copilot:insert-proposal`).
- Estados de minimização (pill flutuante compacto com timer e badge de objeção) e 3 opções de redimensionamento (`compact`, `standard`, `expanded`).
- Conformidade total com WCAG 2.2 AA: tecla Escape para minimizar, regiões ARIA semânticas e foco acessível.
- Barramento de eventos e hook reativo `useLiveCopilotSession()` em `src/features/copilot/copilotLiveBus.ts`.
- Montado globalmente no shell autenticado `AppLayout` em `src/App.tsx`.
- Testes unitários implementados e aprovados em `tests/unit/components/LiveCopilotHUD.test.tsx` (9 testes verdes).
