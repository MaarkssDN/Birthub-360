De: Agente 00 — Coordenador
Para: Agente 08 (QA, Testes e Release)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-047)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Instrução de inicialização do stack local omite overlay de PostgreSQL obrigatório para migrations**

- **Dívida técnica:** BT360-DT-0047
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Separação do compose em múltiplos overlays sem atualização correspondente nos manuais de início rápido.

**Impacto:** Fricção no onboarding de novos engenheiros e perda de tempo em setup de ambiente.

## Arquivo(s) envolvido(s)

`docs/development/LOCAL_FIRST.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-047`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-047` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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
- **Evidência:** `docs/development/LOCAL_FIRST.md` passo 6 (linhas 74-78) já instrui `docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml up -d` — o overlay de PostgreSQL está presente — e o passo 7 (linhas 80-85) aplica `npx prisma migrate deploy` em seguida. Introduzido pelo commit `63f59a064` (2026-10-14, "fix(operacao): gates de release e documentacao de bootstrap para lancamento"), anterior à reconciliação de 2026-11-10.
- **Observação fora de escopo (não editada):** `README.md` linha ~91 usa `docker compose -f docker-compose.services.yml up -d` sem o overlay `docker-compose.postgres-local.yml`, e o cabeçalho do próprio `docker-compose.services.yml` declara o overlay de postgres como obrigatório para esses serviços (metadata no container `postgres`). Além disso, desde 2026-09-08 o Postgres local é opt-in (app usa Postgres Oracle; ver cabeçalho de `docker-compose.postgres-local.yml`), o que torna partes do LOCAL_FIRST.md potencialmente datadas — registro como observação para o 00 avaliar se abre dívida de documentação; não alterei por estar fora do arquivo-escopo deste handoff.

## Resolução (Agente 08 — W5, TAREFA-SANEAMENTO-047 / BT360-DT-0047)

Status: resolvido.

**Diagnóstico:** o documento já estava correto — `docs/development/LOCAL_FIRST.md`
inclui `-f docker-compose.postgres-local.yml` no comando de subida (linha 77,
correção do commit `63f59a064`), e o próprio overlay documenta que todos os
serviços dependem do `postgres` (porta 5434, pgvector).

**Entrega desta onda (guarda de regressão):** novo teste
`tests/unit/ci/local-first-docs.test.ts` (2 casos, todos verdes) que falha se
qualquer comando `docker compose ... up` do runbook omitir o overlay
`docker-compose.postgres-local.yml` e se o documento perder a referência ao
serviço/porta 5434.

Observação fora de escopo (registrada, não alterada): `docs/deploy/README.md`
usa overlays `opensource`+`services` sem o postgres-local em um exemplo da
seção 6.1 — aquele trecho descreve ferramentas extras opt-in, não o bootstrap
do banco; se o Agente 00 entender que também deve citar o overlay, abrir
handoff específico.

Evidência: `.agents/runs/agente-08-tarefa-saneamento-047.md`.
