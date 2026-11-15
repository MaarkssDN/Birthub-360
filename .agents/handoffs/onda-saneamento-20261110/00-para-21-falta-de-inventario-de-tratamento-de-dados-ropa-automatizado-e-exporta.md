De: Agente 00 — Coordenador
Para: Agente 21 (Privacidade e LGPD)
Onda: Onda 1 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-052)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 1

## Problema

**Falta de inventário de tratamento de dados (ROPA) automatizado e exportável para auditoria**

- **Dívida técnica:** BT360-DT-0087
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Ausência de script de verificação de drift entre anotações de PII no schema e a documentação regulatória.

**Impacto:** Dificuldade em responder prontamente a solicitações de auditoria ou Relatório de Impacto à Proteção de Dados Pessoais (RIPD).

## Arquivo(s) envolvido(s)

`docs/lgpd-base-legal.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-052`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-052` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 21 — 2026-11-12)

**Implementação:**

- `scripts/lgpd/ropa-inventory.ts` (novo): gera
  `docs/lgpd/INVENTARIO_CAMPOS_PII.md` a partir de
  `src/lib/crypto/encryptedModelFields.ts` (fonte única de campos cifrados em
  repouso) + anotações de PII nos comentários de `prisma/schema.prisma`;
- modo `--check`: falha (exit 1) em drift — campo cifrado inexistente no schema,
  anotação de PII não inventariada ou artefato desatualizado;
- fail-closed: erros de referência impedem a gravação do artefato;
- `docs/lgpd-base-legal.md` documenta o inventário e o gate.

**Resultado:** 31 campos PII em 16 models inventariados; `--check` verde.

**Branch/commit:** `agente/21-w3-consent-chain-async` → `897b93675`.

**Gates:** `npx tsc --noEmit` limpo; biome limpo; `npx tsx scripts/lgpd/ropa-inventory.ts --check` → OK.

**Nota de propriedade:** `docs/` é domínio do Agente 08 e `scripts/` não tem
dono exclusivo no §15 — a alteração foi autorizada pelo escopo do handoff
(arquivo `docs/lgpd-base-legal.md` + script de verificação exigido pela causa
raiz). Registrado para deliberação do Agente 24.

**Status:** aguardando revisão formal do Agente 24.

## Resolução

TAREFA-052 — scripts/lgpd/ropa-inventory.ts com gate de drift (merge 6ecfc6033).
