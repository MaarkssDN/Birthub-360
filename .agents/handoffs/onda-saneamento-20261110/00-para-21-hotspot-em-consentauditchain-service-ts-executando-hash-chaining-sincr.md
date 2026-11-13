De: Agente 00 — Coordenador
Para: Agente 21 (Privacidade e LGPD)
Onda: Onda 1 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-038)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 1

## Problema

**Hotspot em consentAuditChain.service.ts executando hash-chaining síncrono com impacto em transações**

- **Dívida técnica:** BT360-DT-0086
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Concentração de funções de cálculo de hash, validação de integridade de elos anteriores e ancoragem em arquivo único sem offload.

**Impacto:** Degradação de tempo de resposta da API de onboarding em horários de pico.

## Arquivo(s) envolvido(s)

`src/lib/security/consentAuditChain.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-038`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-038` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

**Implementação:** refatoração cirúrgica em `src/lib/security/consentAuditChain.service.ts`:

- Extração de `checkChainRecord`/`checkChainTail`/`chainResult` — lógica de
  verificação idêntica, compartilhada entre os dois verificadores (sem duplicação);
- Novo `verifyConsentChainAsync`: mesma verificação cedendo o event loop via
  `setImmediate` a cada `CONSENT_CHAIN_VERIFY_YIELD_EVERY` (256) registros;
- `verifyChainIntegrity` (caminho de request via `commercialMissionTrace`) passa
  a usar a versão assíncrona — o hash-chaining O(n) não bloqueia mais a API de
  onboarding em cadeias longas;
- `verifyConsentChain` síncrono preservado (API e testes existentes inalterados).

**Branch/commit:** `agente/21-w3-consent-chain-async` → `598c17013`.

**Gates:** `npx tsc --noEmit` limpo; biome limpo nos 2 arquivos; Vitest
`tests/unit/security/consentAuditChain.test.ts` → **44/44 verdes** (+3 casos:
paridade sync/async, HASH_MISMATCH, prova de yield do event loop).

**Status:** aguardando revisão formal do Agente 24.

## Resolução

TAREFA-038 — consentAuditChain.service.ts refatorado para cadeia assincrona (merge 6ecfc6033; 44/44 testes na revisao W3).
