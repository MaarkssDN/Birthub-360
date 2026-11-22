De: 22 â€” VerificaÃ§Ã£o de Realidade
Para: 02 â€” Produto e UX
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-02-003 (B-06)
Sprint destino: Onda 5 â€” Frontend, UX, Mobile e Contratos

## Problema
PÃ¡gina de configuraÃ§Ãµes de pilares (PillarSettingsPlaceholder.tsx) apresenta formulÃ¡rios com botÃµes "Salvar AlteraÃ§Ãµes" que apenas exibem feedback visual sem nenhuma persistÃªncia no backend.

## Arquivo(s) envolvido(s)
- src/pages/PillarSettingsPlaceholder.tsx:40-90

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-22.md e DIVIDAS-AGENTE-02.md.
- PillarSettingsPlaceholder.tsx (L40-90): Evento onSubmit executa e.preventDefault(), exibe Toast de "ConfiguraÃ§Ã£o salva com sucesso!" e nÃ£o chama endpoint algum.
- ConfiguraÃ§Ãµes sÃ£o perdidas imediatamente ao sair da tela.

## AlteraÃ§Ã£o necessÃ¡ria
1. Implementar endpoints reais em backend para os pilares configurÃ¡veis ou substituir os campos cenogrÃ¡ficos por indicaÃ§Ã£o honesta de roadmap ("Em breve").
2. Se mantido formulÃ¡rio, conectar Ã  mutation do React Query persistindo no banco.

## Teste esperado
- CritÃ©rio de Aceite: FormulÃ¡rio funcional persiste valores no banco ou componente Ã© desativado de forma transparente sem simulaÃ§Ã£o falsa.
- Teste: pillar-settings-reality.spec.tsx.

## Contexto adicional
Fim da cenografia funcional no mÃ³dulo de configuraÃ§Ãµes.


## Resolucao
- Data: 2026-11-06.
- PillarSettingsPlaceholder.tsx saneado com eliminacao completa de Toasts cenograficos de falso sucesso; o botao Salvar permanece desabilitado com aviso explicito de indisponibilidade de gravacao e badge de roadmap 'Em breve'.
- Testes: 	ests/unit/features/settings/pillar-settings-reality.test.tsx (1 passa).

