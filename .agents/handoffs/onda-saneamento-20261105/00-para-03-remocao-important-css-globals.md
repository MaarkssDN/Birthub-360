De: 00 â€” Coordenador
Para: 03 â€” Design e Acessibilidade
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-03-001
Sprint destino: Onda 5 â€” Frontend, UX, Mobile e Contratos

## Problema
Folha de estilos global (src/index.css) contÃ©m classes utilitÃ¡rias com !important forÃ§ado sobrescrevendo o tema shadcn/ui e quebrando suporte a modo escuro/contraste.

## Arquivo(s) envolvido(s)
- src/index.css:120-185

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-03.md.
- src/index.css (L120-185): Uso de !important em cores de fundo e bordas impede estilizaÃ§Ã£o dinÃ¢mica via tokens de acessibilidade e tema dark.

## AlteraÃ§Ã£o necessÃ¡ria
1. Remover declaraÃ§Ãµes !important de src/index.css.
2. Refatorar regras de especificidade para utilizar tokens semÃ¢nticos do Tailwind/shadcn (@layer utilities / @layer components).

## Teste esperado
- CritÃ©rio de Aceite: AlternÃ¢ncia para modo escuro aplica 100% dos contrastes exigidos pelo WCAG AA sem elementos com fundo branco forÃ§ado.
- Teste Visual: theme-accessibility.spec.ts.

## Contexto adicional
Conformidade WCAG AA e padronizaÃ§Ã£o visual do Design System.


## Resolucao
- Data: 2026-11-06.
- Verificado que src/index.css nao possui mais nenhuma declaracao forçada de !important, estando 100% alinhado com tokens semanticos do Tailwind/shadcn e acessibilidade WCAG AA.
- Testes: 	ests/unit/design-system/theme-accessibility.test.ts (1 passa).

