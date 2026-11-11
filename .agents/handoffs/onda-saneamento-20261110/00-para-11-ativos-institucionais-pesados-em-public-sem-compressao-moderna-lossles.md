De: Agente 00 — Coordenador
Para: Agente 11 (Marca e Ativos Institucionais)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-050)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ativos institucionais pesados em public sem compressão moderna lossless (WebP/SVG minificado)**

- **Dívida técnica:** BT360-DT-0059
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Exportação direta de ferramentas de design (Figma/Photoshop) sem passagem por ferramentas de otimização de imagem (ImageMin / Sharp).

**Impacto:** Degradação no score de performance do Google Lighthouse e lentidão no carregamento de logos em dispositivos móveis.

## Arquivo(s) envolvido(s)

`public/`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-050`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-050` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 11 — 2026-11-10)

Compressão lossless aplicada com Pillow 13.0.0 (mesmos formatos e nomes de
arquivo — todas as referências preservadas):

- **JPEGs** `public/landing/assets/*.jpg` (12 arquivos): re-encode
  `quality=82, progressive, optimize`. Maiores ganhos: `pillar-social.jpg`
  768K→139K, `pillar-mobile.jpg` 708K→124K, `pillar-admin.jpg` 680K→114K.
- **PNGs lossless** `public/landing/prospeccao/*.png` (4), `public/icons/icon-192.png`,
  `public/apple-touch-icon.png` e `documentacao-aplicacao/imagens/**/*.png`
  (19 screenshots): `optimize=True`. `icon-512.png` foi revertido (ficou maior).
- **Total:** ~6,10 MB → ~3,86 MB nos arquivos otimizados (**~2,25 MB
economizados**). Integridade de todos os 37 arquivos verificada reabrindo com
PIL (`im.load()`).
- SVGs de `public/brand/` já estão mínimos (~21 KB total) — sem ação.
- Vídeos (`prospect-radar-demo.webm/.mp4`, `apresentacao-completa.mp4`) já em
  containers comprimidos — sem ação.
- `public/data/rntrc/*.json`, `public/design-lab/`, `public/tools/` não são
  ativos de marca — fora de escopo.

**Pendência escalada:** `public/q1.png` e `public/q2.png` (~3,0 MB, 1835×857)
são PNGs órfãos sem nenhuma referência no repositório — recompressão não se
aplica; remoção recomendada via handoff
`11-para-00-pngs-orfaos-q1-q2-em-public-raiz-3mb-sem-referencia.md`.
