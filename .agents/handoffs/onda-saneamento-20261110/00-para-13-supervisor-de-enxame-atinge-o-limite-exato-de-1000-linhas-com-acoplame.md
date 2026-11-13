De: Agente 00 — Coordenador
Para: Agente 13 (Enxame Autônomo e Governança de Runtime)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-009)
Status: em-andamento
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Supervisor de enxame atinge o limite exato de 1000 linhas com acoplamento rígido a 8 agentes**

- **Dívida técnica:** BT360-DT-0065
- **Esforço estimado:** Médio
- **Status atual da dívida:** PARCIALMENTE IMPLEMENTADO

**Causa raiz:** O supervisor foi desenvolvido acumulando a lógica de decisão, prompts específicos de cada sub-enxame e regras de fallback em um único arquivo.

**Impacto:** Dificuldade de expansão do enxame de agentes; risco iminente de quebra de CI em qualquer refatoração.

## Arquivo(s) envolvido(s)

`src/features/intelligence/agents/supervisor.agent.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-009`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-009` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 13 — 2026-11-12)

**Implementação:** extração cirúrgica do bloco coeso de decisão para novo módulo
`src/features/intelligence/agents/supervisor.decision.ts` (125 linhas):

- `supervisorDecisionSchema` (schema Zod da decisão);
- `SupervisorDecision` (tipo inferido — agora exportado);
- `fallbackDecision` (roteamento sequencial de contingência);
- `enforceLeadGuard` (trava determinística anti-SDR-sem-leadId);
- `buildSwarmCorrelationId` (correlation id de tracing).

`supervisor.agent.ts` caiu de **999 → 900 linhas** e re-exporta toda a API de
decisão — nenhum consumidor precisou mudar de import (compatibilidade total).
`enforceLeadGuard` passou a aceitar contexto estrutural `SwarmLeadGuardContext`
em vez de `Pick<SwarmStateType>` — elimina acoplamento circular com o estado do
grafo sem alterar assinatura observável.

**Branch/commit:** `agente/13-w3-supervisor-split` → `e67330f92`.

**Gates executados:**
- `npx tsc --noEmit` — limpo;
- `npx biome check` nos 2 arquivos — limpo (0 erros, 0 warnings);
- Vitest unit (config `vitest.unit.config.ts`): 5 arquivos supervisor +
  semanticRouter — **36/36 testes verdes**.

**⚠ Nota de propriedade para deliberação do Agente 24/00:** o arquivo vive em
`src/features/intelligence/` (AGENTS.md local declara Agente 07 como dono), mas
o plano de saneamento atribui explicitamente TAREFA-009 ao Agente 13 ("é do
próprio 13"). A alteração foi mínima e sem mudança de comportamento; se o 24
entender que a propriedade prevalece sobre a atribuição do plano, o commit pode
ser revertido sem perda — o código extraído é autocontido.

**Status:** aguardando revisão formal do Agente 24.
