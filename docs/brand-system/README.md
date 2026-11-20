# Brand System — Birth Hub 360° (Operação Genesis)

> Estado: **RASCUNHO PARA APROVAÇÃO HUMANA** · Referência: 2026-11-19 · Base: commit `730fa7b63` (branch `agente/00-genesis-brand-system`)
> Fonte da verdade proposta para marca, produto e experiência. Tudo aqui é derivado de evidência; propostas estão marcadas **PROPOSTO**.

## Como ler

Rótulos de evidência: **CONFIRMADO · PARCIALMENTE IMPLEMENTADO · DOCUMENTADO, NÃO IMPLEMENTADO · HISTÓRICO · CONFLITANTE · PROPOSTO · NÃO VERIFICADO**.
Precedência (herdada de `birthhub360.css`): *Brandbook > Manual Visual > Manual de Produto > Catálogo*; em runtime, vence o código em `identidade-visual/birthhub360/tokens/`.

## Índice

| Área | Documento |
|---|---|
| Governança | [relatório forense](00-GOVERNANCA/relatorio-forense.md) · [fontes](00-GOVERNANCA/inventario-de-fontes.md) · [evidências](00-GOVERNANCA/matriz-de-evidencias.md) · [conflitos e decisões](00-GOVERNANCA/conflitos-e-decisoes.md) · [versões](00-GOVERNANCA/controle-de-versoes.md) |
| Marca | [brandbook](01-MARCA/brandbook.md) |
| Identidade visual | [paleta](02-IDENTIDADE-VISUAL/paleta-de-cores.md) · [tipografia e geometria](02-IDENTIDADE-VISUAL/tipografia-e-geometria.md) · [logotipo e assets](02-IDENTIDADE-VISUAL/logotipo-e-assets.md) |
| Produto | [identidade do produto](03-PRODUTO/identidade-do-produto.md) · [mapa de módulos](03-PRODUTO/mapa-de-modulos.md) · [rotas](03-PRODUTO/inventario-de-rotas.md) |
| Design system | [foundations e tokens](04-DESIGN-SYSTEM/foundations-e-tokens.md) · [componentes](04-DESIGN-SYSTEM/componentes.md) |
| Motion | [manual de animações](05-MOTION/manual-de-animacoes.md) |
| Experiência | [estados, acessibilidade e responsividade](06-EXPERIENCIA/estados-acessibilidade-responsividade.md) |
| Guias | [agentes de IA e checklist](08-GUIAS-DE-IMPLEMENTACAO/agentes-de-ia.md) |
| Evolução | [backlog e gap analysis](09-PLANO-DE-EVOLUCAO/backlog-priorizado.md) |
| Relatório final | [RELATORIO-FINAL-GENESIS-BRAND-SYSTEM.md](RELATORIO-FINAL-GENESIS-BRAND-SYSTEM.md) |
| Dados brutos | [`_inventarios/`](_inventarios/) (CSV gerados por [`_tools/inventario.mjs`](_tools/inventario.mjs)) |

## Nota sobre estrutura

Menos arquivos que a estrutura-modelo da missão, por decisão registrada: capítulos foram fundidos onde a evidência não sustentava documentos separados (ex.: ilustração/imagery, jornadas detalhadas, ux-writing). Ver lacunas em [roadmap do backlog](09-PLANO-DE-EVOLUCAO/backlog-priorizado.md).

> Existe uma tentativa anterior em outra branch (`docs/brand-system-e-onda-review-20261119`). Esta árvore foi refeita do zero por decisão do Orquestrador Humano; reconciliar antes de qualquer merge.
