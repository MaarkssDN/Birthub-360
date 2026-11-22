De: Agente 00 — Coordenador
Para: Agente 15 (Segurança Aplicada e Rotação de Segredos)
Onda: Onda 0 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-001)
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 0

## Problema

**URLs de autenticação com tokens mágicos e links de redefinição de senha escritas em texto puro em logs**

- **Dívida técnica:** BT360-DT-0072
- **Esforço estimado:** Médio
- **Status atual da dívida:** PARCIALMENTE IMPLEMENTADO

**Causa raiz:** Facilitação temporária de depuração mantida ativa fora de ambiente de teste puro.

**Impacto:** Comprometimento total de contas de usuários administrativos caso os logs de aplicação sejam acessados por terceiros ou sofram vazamento; violação direta do Bloqueador B-04 (`AGENTS.md` §22).

## Arquivo(s) envolvido(s)

`src/lib/auth.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-001`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-001` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 15 — 2026-11-10, worktree `agente-15-tokens-autenticacao-log`)

**A correção já existia no HEAD; nenhuma alteração de código foi necessária ou feita**
(`src/lib/auth.ts` pertence ao Agente 01/01A e não foi tocado).

Evidências:

- Commit `b00a4618f` (2026-11-10) removeu por completo a chave `resetUrl` do
  `logger.warn` de `sendResetPassword` — era o último vetor de vazamento
  (a versão anterior, de `b1bb0e9dc`, mascarava só o valor do token mas ainda logava a URL).
- Leitura integral do `src/lib/auth.ts` atual: os 4 `logger.*` do bloco
  `sendResetPassword`/`sendVerificationEmail` logam apenas `{ userId, reason }` —
  sem `url`, `token` ou `user.email`. A URL com token vai somente por e-mail.
- Defesa em profundidade já presente: `LOGGER_REDACT_PATHS` em `src/lib/logger.ts`
  cobre `url`/`resetUrl`/`verificationUrl`/`token`/`email`; `observability.ts`
  redige `token`/`code`/`state` etc. da query string no log de request
  (cobre o clique no link de verificação/reset).
- Verificação formal exigida: `node scripts/verify-auth-log-redaction.mjs` — script
  de asserção textual determinística; tracei manualmente cada assert sobre o arquivo
  atual e todos passam (4 logger calls, sem `url`/`token`/`user.email`, com
  `MAILER_NOT_CONFIGURED` e `throw new APIError`). **Execução do `node` foi negada
  neste ambiente** — o gate do Agente 24/08 deve rodar o comando antes do parecer.
- Relatório completo: `docs/security/AUTH_TOKEN_LOG_LEAK_BT360-DT-0072.md`.
- Cobertura de teste existente: `tests/unit/lib/loggerRedaction.authCredentials.test.ts`.

Risco residual fora do escopo (handoff separado para o Agente 01):
`src/bootstrap/auth.ts:105` usa `console.error` com o erro cru do handler Better Auth
(fora da camada de redaction do pino) — ver
`.agents/handoffs/onda-saneamento-20261110/15-para-01-consoleerror-cru-em-mount-auth-handler.md`.
