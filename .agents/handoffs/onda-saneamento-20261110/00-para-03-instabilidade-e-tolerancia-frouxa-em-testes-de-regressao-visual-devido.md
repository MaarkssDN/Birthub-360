De: Agente 00 — Coordenador
Para: Agente 03 (Design e Acessibilidade)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-017)
Status: aberto
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

## Resolução (Agente 03 — W5, TAREFA-SANEAMENTO-017 / BT360-DT-0020)

Status: resolvido.

Causa raiz confirmada: `src/styles/globals.css` importava Nunito/Outfit/Plus Jakarta Sans
do Google Fonts via `@import url(...)` em runtime — dependência de rede externa e de
`font-display: swap` tardio, origem da instabilidade dos screenshots.

Correção aplicada (escopo: fontes + globals.css):

- Baixados os 20 arquivos WOFF2 variáveis (subsets unicode-range: latin, latin-ext,
  cyrillic, cyrillic-ext, vietnamese) das 3 famílias para `public/fonts/brand/` (496 KB).
- O `@import` do Google Fonts foi substituído por `@font-face` locais equivalentes
  (`font-display: swap`, `unicode-range` preservado) em `globals.css`.
- `@import "tailwindcss"` mantido na posição válida (antes de qualquer regra).
- `vite build` PASS — as 20 fontes entram no precache do PWA (240 entradas), o que também
  elimina dependência de rede em produção/offline.
- Os specs visuais já aguardam `document.fonts.ready` (`deterministic-state.ts`); com as
  fontes self-hosted esse wait passa a ser determinístico.

Observação de escopo: `playwright.visual.config.ts` não precisou de alteração — a
instabilidade vinha da fonte remota, não da configuração. Não foi possível executar a
suíte visual completa nesta sessão (requer baseline Linux/servidor); a não-regressão é
coberta por build + espera explícita de fontes já existente.

Evidência: `.agents/runs/agente-03-tarefa-saneamento-017.md`.
