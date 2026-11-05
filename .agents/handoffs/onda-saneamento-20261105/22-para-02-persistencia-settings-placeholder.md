De: 22 — Verificação de Realidade
Para: 02 — Produto e UX
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-02-003 (B-06)
Sprint destino: Onda 5 — Frontend, UX, Mobile e Contratos

## Problema
Página de configurações de pilares (PillarSettingsPlaceholder.tsx) apresenta formulários com botões "Salvar Alterações" que apenas exibem feedback visual sem nenhuma persistência no backend.

## Arquivo(s) envolvido(s)
- src/pages/PillarSettingsPlaceholder.tsx:40-90

## Evidência
Base de auditoria: DIVIDAS-AGENTE-22.md e DIVIDAS-AGENTE-02.md.
- PillarSettingsPlaceholder.tsx (L40-90): Evento onSubmit executa e.preventDefault(), exibe Toast de "Configuração salva com sucesso!" e não chama endpoint algum.
- Configurações são perdidas imediatamente ao sair da tela.

## Alteração necessária
1. Implementar endpoints reais em backend para os pilares configuráveis ou substituir os campos cenográficos por indicação honesta de roadmap ("Em breve").
2. Se mantido formulário, conectar à mutation do React Query persistindo no banco.

## Teste esperado
- Critério de Aceite: Formulário funcional persiste valores no banco ou componente é desativado de forma transparente sem simulação falsa.
- Teste: pillar-settings-reality.spec.tsx.

## Contexto adicional
Fim da cenografia funcional no módulo de configurações.
