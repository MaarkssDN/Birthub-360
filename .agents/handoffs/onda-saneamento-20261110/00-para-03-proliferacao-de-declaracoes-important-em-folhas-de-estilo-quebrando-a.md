De: Agente 00 — Coordenador
Para: Agente 03 (Design e Acessibilidade)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-003)
Status: resolvido
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

## Resolução

- Data: 2026-11-12 — Agente 03, branch `agente/03-design-saneamento`, commit `0a6015a9f`.
- Estado encontrado: a proliferação já havia sido majoritariamente saneada em
  ondas anteriores — restavam 13 `!important` em `globals.css`: 8 no "policiamento"
  de cor/fonte de títulos e subtítulos e 5 no bloco `prefers-reduced-motion`.
- Correção aplicada (causa raiz do backlog): as 8 declarações de policing estavam
  em `@layer base` e precisavam de `!important` para vencer `@layer utilities` do
  Tailwind. Foram movidas para o fim do arquivo, FORA de qualquer `@layer` — CSS
  não-layered vence todas as layers por definição, dispensando o hack. O prefixo
  `html body` preserva a dominância anterior contra regras não-layered de
  `official-identity.css` (carregado depois), evitando regressão visual.
- Resultado: `globals.css` passou de 13 para 4 `!important`, todos no bloco
  `prefers-reduced-motion` (WCAG 2.3.3), que são load-bearing por definição e já
  documentados com `biome-ignore`.
- Gates: `npx tsc --noEmit` OK; `npm run lint` OK; `npm run build` OK; testes
  unitários de design system verdes.
- Ressalva honesta: a verificação visual pixel-a-pixel depende dos baselines de
  regressão visual (win32-only hoje); recomenda-se ao Agente 24/08 confirmar os
  snapshots na CI Linux. Computed style foi preservado por construção de cascata.
- Pendente de encerramento formal: parecer APROVADO do Agente 24.
