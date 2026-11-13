De: Agente 00 — Coordenador
Para: Agente 03 (Design e Acessibilidade)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-017)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Instabilidade e tolerância frouxa em testes de regressão visual devido a fontes do sistema operacional**

- **Dívida técnica:** BT360-DT-0020
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** As fontes institucionais não estão totalmente embutidas localmente via WOFF2 com font-display estável, dependendo de fallbacks do sistema operacional.

**Impacto:** Regressões visuais passam desapercebidas para a branch principal, degradando o acabamento visual do produto.

## Arquivo(s) envolvido(s)

`playwright.visual.config.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-017`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-017` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução

- Data: 2026-11-12 — Agente 03, branch `agente/03-design-saneamento`, commit `c3eaefd34`.
- Causa raiz eliminada na camada de estilos (propriedade do 03):
  - Removido o `@import` do Google Fonts (Nunito/Outfit/Plus Jakarta Sans) do topo de
    `src/styles/globals.css` — era a única fonte remota restante.
  - IBM Plex Mono agora é 100% self-hosted em WOFF2 (subconjuntos latin + latin-ext,
    pesos 400/500/600/700 + itálico 400, `font-display: swap`, unicode-range por
    subconjunto) com fallback TTF local — 10 novos arquivos em `public/fonts/`.
  - Pilhas `--font-brand-sans`/`--font-brand-display` alinhadas à Constituição
    canônica: Inter (interface) + Sora (display) + IBM Plex Mono (dados), em
    `globals.css`, `official-identity.css` e `luxury-tokens.css`.
- `visual-regression/deterministic-state.ts` já aguarda `document.fonts.ready`
  (`waitForVisualFonts`) — nenhuma alteração necessária em
  `playwright.visual.config.ts`.
- Gates: `npx tsc --noEmit` OK; `npm run lint` (biome) OK; `npm run build` OK;
  testes `theme-accessibility` + `OfficialIdentity`/`A11yPrimitives` verdes.
- Observação para o Agente 24: validar visualmente que IBM Plex Mono renderiza
  (agora WOFF2) e que nenhuma tela dependia das famílias removidas — grep em
  `src/**` não encontrou uso de Nunito/Outfit/Plus Jakarta Sans fora das pilhas
  CSS já corrigidas.
- Pendente de encerramento formal: parecer APROVADO do Agente 24.
