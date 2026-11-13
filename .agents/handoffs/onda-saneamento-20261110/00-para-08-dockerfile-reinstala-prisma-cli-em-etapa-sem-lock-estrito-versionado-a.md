De: Agente 00 — Coordenador
Para: Agente 08 (QA, Testes e Release)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-024)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Dockerfile reinstala Prisma CLI em etapa sem lock estrito versionado arriscando versão divergente**

- **Dívida técnica:** BT360-DT-0045
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Otimização para reduzir o tamanho da imagem intermediária executando comandos avulsos do npm.

**Impacto:** Falhas inesperadas em tempo de inicialização de containers em ambientes Kubernetes ou AWS ECS.

## Arquivo(s) envolvido(s)

`package-lock.json`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-024`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-024` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

- **Status:** já implementado em `main` antes da emissão deste handoff — nenhuma alteração necessária em 2026-11-12 (Agente 08, verificação em `agente/08-qa-saneamento` @ `a8ce7646f`).
- **Evidência:** `Dockerfile` linhas 33-56 já implementam exatamente o critério pedido: a versão exata da CLI resolvida pelo `npm ci` é capturada de `node_modules/prisma/package.json` em `/tmp/prisma-cli-version` **antes** do `npm prune --omit=dev`; a reinstalação usa `npm install --no-save --ignore-scripts "prisma@${prisma_version}"` (versão pinada, não o range semver de devDependencies); e um guard `node -e` aborta o build se `cli !== lock || cli !== client` (divergência CLI/package-lock/@prisma/client), além de verificar a presença do `schema-engine`. Introduzido pelo commit `508a05271` (2026-10-14, "fix(debt): bloquear release gate e contexto Docker da Onda 00"), anterior à reconciliação de 2026-11-10 que gerou este handoff.
- **Escopo `package-lock.json`:** não foi preciso tocar o lockfile — a correção consome a versão já travada por ele.
- **Validação:** inspeção direta do Dockerfile em origin/main; build Docker completo não reexecutado nesta sessão (imagem é pesada e o caminho já foi exercido pelo workflow de publish em runs anteriores). Sem alteração de código nesta rodada.

## Resolução (Agente 08 — W5, TAREFA-SANEAMENTO-024 / BT360-DT-0045)

Status: resolvido.

**Diagnóstico:** a correção já existia desde o commit `508a05271` (Onda 0,
"fix(debt): bloquear release gate e contexto Docker"). O Dockerfile atual:

- captura a versão EXATA da CLI do `node_modules` instalado via `npm ci`
  (lockfile) antes do `npm prune --omit=dev` (Dockerfile:39);
- reinstala com `npm install --no-save --ignore-scripts "prisma@${prisma_version}"`
  — versão pinada, sem tocar package.json/lockfile (Dockerfile:52-53);
- executa o postinstall do `@prisma/engines` e falha se o `schema-engine`
  estiver ausente (Dockerfile:54-55);
- guarda de divergência: derruba o build se CLI ≠ lockfile ≠ `@prisma/client`
  (Dockerfile:56). Versão atual verificada: prisma 7.10.0 em ambos.

**Entrega desta onda (gate executável):** novo teste
`tests/unit/ci/dockerfile-prisma-pin.test.ts` (6 casos, todos verdes) que assevera
o pin e executa de verdade `scripts/verify-docker-context.mjs` — script que já
existia mas não era invocado por nenhum script de package.json ou workflow
(orphan gate, agora coberto pelo `test:unit` no CI).

Evidência: `.agents/runs/agente-08-tarefa-saneamento-024.md`.
