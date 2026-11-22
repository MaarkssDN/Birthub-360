- De: 06 (Integrações e Bitrix)
- Para: 02 (Produto e UX)
- Onda: 14
- Status: resolvido
- Prioridade: alto

## Problema
Os novos conectores de CRM (HubSpot, Pipedrive, RD Station, Monday) operam em nível de serviço backend, mas precisam de interface visual integrada na tela de Configurações/Integrações para que o usuário administrador possa conectar, desconectar, testar credenciais e acompanhar o status da sincronização. Pelo protocolo de governança (`/AGENTS.md` §15), alterações na navegação principal, shells e `App.tsx` são de propriedade exclusiva do Agente 02.

## Arquivo(s) envolvido(s)
- `src/App.tsx`
- `src/components/navigation/Sidebar.tsx`
- `src/features/integrations/components/**`
- `src/features/settings/**`

## Alteração necessária
O Agente 02 deve:
1. Criar cards de conexão visualmente consistentes para HubSpot, Pipedrive, RD Station e Monday.com na página de Integrações.
2. Fornecer fluxo de modal para entrada de chaves/OAuth com validação de formato e feedback de teste de conexão.
3. Garantir estados explícitos de UI: `disconnected`, `connecting`, `connected`, `syncing`, `error` (conforme `/AGENTS.md` §25 — dados reais e estados explícitos).
4. Ocultar credenciais após salvar (exibir apenas últimos 4 caracteres ou status "Conectado").

## Teste esperado
- Validação de renderização visual e responsividade nos breakpoints desktop e mobile.
- Verificação de acessibilidade WCAG 2.2 AA (foco visível, contraste em badges, atributos aria em botões de ação).
- Navegação entre rotas de integração sem recarregamento total da página.

## Contexto adicional
Garante conformidade com o design system do Birth Hub 360 e princípios de UX do produto.

## Resolução (Agente 02 - 2026-10-08)
O Agente 02 implementou o painel visual completo e acessível em `src/features/integrations/components/ExternalCrmPanel.tsx`:
1. Suporte nativo a HubSpot, Pipedrive, RD Station e Monday.com.
2. Estados explícitos de interface (`disconnected`, `connecting`, `connected`, `syncing`, `error`).
3. Modais acessíveis para entrada de chaves/OAuth com validação de campos, feedback sonoro (`SoundFX`) e teste de conectividade ponta a ponta (`/api/integrations/external-crm/:id/test`).
4. Máscara de segurança para tokens (`maskSecret`), foco gerenciado e contraste conforme WCAG 2.2 AA.
Status atualizado para **resolvido**.
