De: Agente 00 — Coordenador
Para: Agente 14 (Ambiente de Execução e Test Harness)
Onda: Onda 2 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-033)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 2

## Problema

**Falta de seed automático de entidades de compliance e opt-out no provisionamento do banco de teste**

- **Dívida técnica:** BT360-DT-0071
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O provisionamento de teste focou apenas na estrutura de tabelas sem definição de um estado inicial de dados de compliance.

**Impacto:** Testes de regras de privacidade tornam-se frágeis e suscetíveis a falsos positivos por falta de baseline padronizada.

## Arquivo(s) envolvido(s)

`scripts/test/prepare-integration-env.js`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-033`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-033` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 14 — 2026-11-12, branch `agente/14-w3-seed-compliance`)

`prepare-integration-env.js` agora executa `buildComplianceSeedSql()` via psql após o
bootstrap de roles: organização dedicada `compliance-baseline-org` (nunca `test-org-id`,
para não poluir o tenant padrão do harness) + `OrganizationAiConsent` granted +
3 `OptOutRecord` (Global/Email/WhatsApp). Idempotente: ids fixos + `ON CONFLICT DO
NOTHING` — verificado contra `prospectordb_test` real: 1ª execução cria
1 org/1 consent/3 opt-outs; 2ª execução não duplica. Escopo deliberado: a cadeia de
auditoria LGPD (`ConsentAuditChainHead`/`ConsentAuditRecord`) exige genesis
hash/sequence válidos produzidos pelo serviço — seed SQL estático a corromperia;
testes que precisam de cadeia devem criá-la via serviço. Ressalva de ciclo de vida:
o `afterAll` do integration-setup remove todas as orgs ao fim de cada arquivo de
teste — o baseline existe desde o provisioning até a primeira limpeza; recriação
por arquivo de teste fica como possível follow-up se algum teste depender disso.
Run report: `.agents/runs/agente-14-tarefa-saneamento-033.md`. Pendente: revisão do
Agente 24.

## Verificação de merge (Agente 14 — 2026-11-12, branch `agente/14-harness-saneamento`)

Implementação confirmada em `main` via PR #239 (commit `55424831b`):
`buildComplianceSeedSql`/`COMPLIANCE_BASELINE_ORG_ID` presentes em
`scripts/test/prepare-integration-env.js` (L208+) e cobertos por testes unitários.
Reexecução nesta sessão: `vitest run tests/unit/scripts/test-harness-safety.test.ts` → 12/12 ✅,
`node --check` ✅, `npx tsc --noEmit` ✅, `npm run lint` exit 0.
Status mantido `em-andamento`: condição de encerramento é parecer APROVADO do Agente 24.

## Encerramento (Coordenador 00 — 2026-11-13)

Condição de parecer APROVADO do Agente 24 satisfeita: revisão independente em
`.agents/reviews/` (PR #257, `pr251-24-revisao.md`) confirmou a implementação em
`main` via PR #239 com evidência de código e testes. Handoff encerrado como
`resolvido`.
