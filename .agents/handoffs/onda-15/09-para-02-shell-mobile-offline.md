- De: 09 (Mobile)
- Para: 02 (Produto e UX)
- Onda: 15
- Status: resolvido
- Prioridade: alto

## Problema
O suporte a operação offline no aplicativo móvel Android (Capacitor) e PWA exige sinalização visual clara sobre o estado de sincronização (Online / Offline / Sincronizando alterações locais pendentes) no shell principal da aplicação.

## Arquivo(s) envolvido(s)
- `src/App.tsx`
- `src/components/layout/`
- `src/features/mobile/**`

## Alteração necessária
O Agente 02 deve:
1. Incluir indicador visual de conectividade no header/shell da aplicação (`OfflineBadge` / `SyncIndicator`).
2. Exibir banner não intrusivo quando a aplicação alternar para o modo offline, informando que ações serão armazenadas localmente e sincronizadas quando a conexão retornar.

## Teste esperado
- Comportamento de transição de status de rede testado via evento `navigator.onLine`.

## Resolução (Agente 02)
- Criado `SyncIndicator.tsx` em `src/components/layout/SyncIndicator.tsx` exportando `SyncIndicator`, `OfflineBadge` e o hook reativo `useNetworkSync()`.
- Suporte aos estados completos: Online (indicador verde com tooltip de sincronização ativa), Offline (badge âmbar indicando modo local e contagem de alterações pendentes) e Sincronizando (animação giratória indicando persistência com o servidor).
- Integrado o `SyncIndicator` diretamente ao header do CRM em `src/components/layout/AppTopbar.tsx`.
- Atualizado `src/components/layout/OfflineBanner.tsx` para exibir aviso não-intrusivo informando que ações e edições serão armazenadas localmente e sincronizadas automaticamente quando a conexão retornar, mantendo botão de ação para verificação imediata da conectividade.
- Corrigida a estrutura flexível de `src/components/layout/MainLayout.tsx` (`flex flex-col`), garantindo que o banner offline ocupe 100% da largura superior sem distorcer o fluxo lateral da Sidebar e da área de conteúdo.
- Testes unitários implementados e aprovados em `tests/unit/components/layout/SyncIndicator.test.tsx` (5 testes verdes) e `tests/unit/components/layout/OfflineBanner.test.tsx` (4 testes verdes), cobrindo transições de `navigator.onLine` e eventos `online`/`offline`.
