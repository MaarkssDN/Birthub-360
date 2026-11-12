De: Agente 00 — Coordenador
Para: Agente 08 (QA, Testes e Release)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-007)
Status: resolvido
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**62 arquivos de testes unitários co-localizados em src/features permanecem fora da descoberta do Vitest**

- **Dívida técnica:** BT360-DT-0044
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Falta de unificação entre a convenção de testes centralizados em `tests/` e testes co-localizados em `src/`.

**Impacto:** Falsa impressão de alta cobertura; funcionalidades críticas podem ter seus testes unitários quebrados sem alerta no CI.

## Arquivo(s) envolvido(s)

`vitest.unit.config.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-007`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-007` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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
- **Evidência:** `vitest.unit.config.ts` (linhas ~44-50) já inclui `src/**/__tests__/**/*.test.ts`, `src/**/*.test.ts` e `src/**/*.test.tsx` além de `tests/unit/**`. O `include` cobrindo `src/**` foi introduzido pelo commit `fc30b3325` (2026-10-16, "fix(audit): saneia e encerra ultimas 12 dividas tecnicas do inventario canico (wave 3)"), anterior à reconciliação de 2026-11-10 — a evidência do DIV-08-002 ("include: tests/unit/** apenas") está desatualizada em relação ao arquivo real.
- **Verificação empírica:** existem hoje 309 arquivos `*.test.ts(x)` sob `src/` (231 só em `src/features/`), todos casando com os padrões de `include`; não há `.spec.*` nem arquivos em `__tests__` sem sufixo `.test.*`. A execução real de `npm run test:unit` nesta worktree (2026-11-12) mostra arquivos co-localizados sendo descobertos e executados, ex.: `src/features/commercial-intelligence/__tests__/CommercialIntelligenceUseCases.unit.test.ts` (68 testes), `src/features/integrations/bitrix/service/__tests__/extraction.test.ts` (43), `src/features/market-intelligence/components/__tests__/honestHubs.b06.test.ts`, `src/features/mesa-tratamento/services/__tests__/mesa-triage.service.test.ts` — todos verdes até o momento da verificação.
- **Critério de aceite do DIV-08-002** ("npm run test:unit descobre e executa os arquivos co-localizados"): satisfeito — os arquivos rodam na suíte unitária padrão, que é o gate do CI.
