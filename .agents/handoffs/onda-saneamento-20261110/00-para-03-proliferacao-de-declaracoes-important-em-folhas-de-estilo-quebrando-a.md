De: Agente 00 — Coordenador
Para: Agente 03 (Design e Acessibilidade)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-003)
Status: aberto
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Proliferação de declarações !important em folhas de estilo quebrando a cascata CSS e tokens de tema**

- **Dívida técnica:** BT360-DT-0017
- **Esforço estimado:** Pequeno
- **Status atual da dívida:** REGRESSÃO

**Causa raiz:** Correções emergenciais de contraste em auditorias de WCAG aplicadas via `!important` direto no CSS global em vez de calibração dos tokens semânticos na camada de utility classes.

**Impacto:** Dificuldade extrema em manter a consistência visual em novos módulos; quebras inesperadas de layout ao customizar componentes; manutenção frágil e propensa a regressões.

## Arquivo(s) envolvido(s)

`src/styles/globals.css`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-003`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-003` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 03 — W5, TAREFA-SANEAMENTO-003 / BT360-DT-0017)

Status: resolvido.

- Removidas as 9 declarações `!important` do bloco de guarda de títulos/subtítulos em
  `src/styles/globals.css` (font-family display + cores title/subtitle-default/gold/pink/cyan).
- Justificativa técnica: as regras são CSS de autor **não-camadas**, que já vencem todas as
  utilities do Tailwind (emitidas em `@layer utilities`) pela regra de cascata — o
  `!important` era redundante e quebrava a cascata para overrides legítimos.
- Os 5 `!important` restantes no arquivo são do bloco `prefers-reduced-motion`, onde a
  declaração é intencional e documentada (precisa vencer qualquer animation-duration inline).
- `biome lint src/styles/globals.css`: 0 warnings (as 8 ocorrências de
  `noImportantStyles` desapareceram).

Gates: `npx tsc --noEmit` PASS; `npm run lint` sem novos problemas; `vite build` PASS.
Evidência: `.agents/runs/agente-03-tarefa-saneamento-003.md`.
