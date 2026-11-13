De: Agente 00 — Coordenador
Para: Agente 08A (Operações Git e Deploy AWS)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-026)
Status: aberto
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ausência de cache compartilhado de dependências (node_modules e Prisma) nos workflows de CI**

- **Dívida técnica:** BT360-DT-0049
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Configuração inicial simplificada de pipeline mantida sem otimização de cache.

**Impacto:** Lentidão no feedback de testes para os desenvolvedores e consumo acelerado de minutos de execução no GitHub Actions.

## Arquivo(s) envolvido(s)

`.github/workflows/ci.yml`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-026`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-026` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 08A — W5, TAREFA-SANEAMENTO-026 / BT360-DT-0049)

Status: resolvido.

**Diagnóstico:** `cache: 'npm'` do setup-node já existia nos dois jobs de
`.github/workflows/ci.yml`. A lacuna restante era o download repetido dos
engines binários do Prisma a cada `npx prisma generate`/postinstall.

**Correção:** adicionado step `Cache Prisma engines` (actions/cache v6.1.0,
SHA-pinado conforme convenção do repo) após cada `npm ci`, cacheando
`node_modules/.prisma`, `node_modules/@prisma/engines` e `~/.cache/prisma`
com chave `prisma-${{ runner.os }}-${{ hashFiles('package-lock.json') }}` —
versão de engine sempre amarrada ao lockfile, sem risco de divergência.

**Gate de regressão:** `tests/unit/ci/w5-gitops-governance.test.ts` assevera a
presença dos dois blocos de cache e sua posição após `npm ci`.

Evidência: `.agents/runs/agente-08A-tarefa-saneamento-026.md`.
