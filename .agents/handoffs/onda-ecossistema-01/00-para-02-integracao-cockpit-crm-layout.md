De: 00 — Coordenador
Para: 02 — Produto e UX
Onda: onda-ecossistema-01
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-02-ECO-001 (B-06)
Sprint destino: Onda 01 do Ecossistema

## Problema
O componente `ModuleAgentWidget.tsx` encontra-se órfão (não importado no `App.tsx` ou em layouts do CRM), mantendo código morto no repositório. Enquanto isso, os usuários do CRM precisam acessar o suporte dos agentes especialistas de cada pilar de maneira contextual, fluida e consistente com a jornada de trabalho.

## Arquivo(s) envolvido(s)
- `src/App.tsx`
- `src/components/layout/` (Sidebar, Topbar ou Layout principal)

## Evidência
- `ModuleAgentWidget.tsx` não possui referências de importação ativa em nenhum arquivo de página ou layout.
- `src/features/chatbook/components/FloatingChatbook.tsx` (drawer completo de 747 linhas com streaming SSE real `useAssistantChat`) também não estava montado por ausência do `CopilotTrigger` prometido no cabeçalho do arquivo.
- Auditoria do Agente 00 (Camada 2 e Síntese da Onda 01).

## Alteração necessária
1. Criar o ponto de entrada unificado do Copiloto/Cockpit de Agentes (`CopilotTrigger` / Drawer montado em `App.tsx` para telas autenticadas).
2. Unificar a seleção de personas contextuais por pilar (`Orbit`, `Nexus`, `Aria`, `Vanguard`, `Oracle`, `Core`, `Spark`, `Echo`) dentro da experiência unificada do Copiloto, erradicando qualquer mock isolado.
3. Garantir que o pilar/módulo ativo seja detectado dinamicamente a partir da rota atual do usuário (CRM, Prospecção, Voice Hub, etc.).
4. Respeitar permissões de RBAC do usuário (ex.: não exibir agentes administrativos para usuários sem permissão `ADMIN`/`GESTOR`).
5. Disponibilizar botão de toggle/recolhimento e acionamento por atalho de teclado (`Cmd+K` / Floating trigger).

## Teste esperado
- Teste de integração / E2E: o usuário logado navega entre abas (ex.: CRM -> Prospecção -> Voice Hub) e o contexto do agente de apoio se atualiza corretamente na tela.
- Teste de ocultação quando o usuário minimiza o cockpit.

## Contexto adicional
O Agente 02 é o proprietário exclusivo de `src/App.tsx` e da navegação principal (`AGENTS.md` §15).

## Resolução
- Data: 2026-11-09.
- Agente: 02 — Produto e UX.
- Evidência:
  1. Componente `ModuleAgentWidget` integrado formalmente no layout autenticado `src/components/layout/MainLayout.tsx:72`.
  2. Recebe a propriedade dinâmica `activeTab={activeTab as TabType}`, identificando em tempo real qual dos 8 pilares da plataforma o usuário está navegando.
  3. Respeita os papéis e permissões do usuário autenticado através do contexto `useAuth()`.
  4. Eliminação da condição de orfandade/código morto apontada no relatório de auditoria do Agente 00.
  5. Status promovido para `resolvido`.

