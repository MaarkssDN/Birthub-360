De: 00 — Coordenador
Para: 03 — Design e Acessibilidade
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-03-001
Sprint destino: Onda 5 — Frontend, UX, Mobile e Contratos

## Problema
Folha de estilos global (src/index.css) contém classes utilitárias com !important forçado sobrescrevendo o tema shadcn/ui e quebrando suporte a modo escuro/contraste.

## Arquivo(s) envolvido(s)
- src/index.css:120-185

## Evidência
Base de auditoria: DIVIDAS-AGENTE-03.md.
- src/index.css (L120-185): Uso de !important em cores de fundo e bordas impede estilização dinâmica via tokens de acessibilidade e tema dark.

## Alteração necessária
1. Remover declarações !important de src/index.css.
2. Refatorar regras de especificidade para utilizar tokens semânticos do Tailwind/shadcn (@layer utilities / @layer components).

## Teste esperado
- Critério de Aceite: Alternância para modo escuro aplica 100% dos contrastes exigidos pelo WCAG AA sem elementos com fundo branco forçado.
- Teste Visual: theme-accessibility.spec.ts.

## Contexto adicional
Conformidade WCAG AA e padronização visual do Design System.
