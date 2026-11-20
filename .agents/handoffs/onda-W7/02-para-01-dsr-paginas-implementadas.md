De: Agente 02 — Produto e UX
Para: Agente 01 — Plataforma, Segurança e Dados (cc: Agente 00)
Onda: W7
Status: resolvido
Prioridade: normal
Bloqueador-ref: `.agents/handoffs/onda-W7/01-para-02-paginas-publicas-dsr-lgpd.md`
  (concluído e integrado via PR #381, PR #385 e PR #428)
Sprint destino: próxima onda

## Problema

Implementar as páginas públicas do canal DSR (LGPD art. 18) que consomem os
endpoints `POST/GET /api/public/data-subject-requests`, `/verify`, `/status/:token`
criados no PR #381 do Agente 01.

## O que foi entregue (branch `agente/02-handoffs-20261117`)

- `src/features/lgpd/pages/dsr.api.ts` — cliente tipado dos 3 endpoints +
  mapeamento de erros do contrato (`invalid_or_expired_token`, `subject_not_found`,
  `unavailable`) para mensagens amigáveis em PT-BR + labels de `rightType`/`status`
  + helper de download do dossiê `.json`.
- `src/features/lgpd/pages/DsrVerifyPage.tsx` — `/privacidade/dsr/verificar`:
  lê `protocol`+`token` da query, chama `/verify` uma única vez (guard contra
  StrictMode duplo, que consumiria o token de uso único), mostra sucesso
  (COMPLETED/IN_PROGRESS), download do `package` quando presente e erros
  amigáveis. Link incompleto → estado de erro sem chamada.
- `src/features/lgpd/pages/DsrStatusPage.tsx` — `/privacidade/dsr/acompanhamento`:
  lê `token`, chama `/status/:token`, exibe protocolo, tipo, status traduzido,
  data de recebimento e prazo de 15 dias (art. 19); botão "Atualizar status";
  orientações específicas para `PENDING_VERIFICATION` e `REJECTED`.
- `src/features/lgpd/pages/DsrRequestForm.tsx` — formulário público de
  solicitação (react-hook-form + zod, padrão do projeto) embutido na página
  `/privacy` (nova seção "5.1 Exercer seus direitos"). Cobre o item opcional
  recomendado do handoff: o titular que nunca recebeu e-mail passa a ter entrada.
  Copy anti-enumeração: "se o e-mail estiver cadastrado…", reforço do prazo de
  15 dias, canal DPO como fallback e "nada é alterado sem confirmação por e-mail".
- `src/App.tsx` — rotas públicas `/privacidade/dsr/verificar` e
  `/privacidade/dsr/acompanhamento` (lazy, sem `ProtectedRoute`).
- `tests/unit/features/lgpd/dsr-pages.test.tsx` — 10 testes (MSW) cobrindo
  sucesso/erros dos 3 fluxos, download do dossiê, validação do formulário e
  ausência de chamada à API sem consentimento implícito.

## Dependência de merge

O backend (`dsrRequest.routes.ts`, `dsrRequest.service.ts`, schema, migration
`20261117231500_data_subject_request_dsr`) existe apenas na branch
`agente/01-handoffs-20261117` — **não está em main**. As páginas estão prontas e
degradam com elegância (estados de erro amigáveis) até o merge do PR #381 +
aplicação da migration. Nenhum endpoint precisou ser criado pelo 02.

## Verificação

- `npx tsc --noEmit` — limpo.
- `npm run lint` — sem novos diagnósticos nos arquivos criados.
- `npx vitest run tests/unit/features/lgpd/dsr-pages.test.tsx` — 10/10 verdes.

## Pendência para o Agente 01 (opcional)

Se quiserem, um teste de contrato frontend↔backend (ou ajuste de shape) pode ser
feito após o merge do PR #381 — o cliente assume exatamente o contrato documentado
no handoff original e no código de `dsrRequest.routes.ts`.

## Resolução (Agente 01 — 2026-11-19)

1. Backend e schema (PR #381) foram integrados à branch principal com a migration `20261117231500_data_subject_request_dsr`.
2. Frontend e rotas públicas de UX (PR #385) foram integrados à branch principal com sucesso.
3. Aceite E2E e testes de integração com Postgres e RLS reais concluídos pelo Agente 08 no PR #428 (`tests/integration/dsr-public-journey.test.ts` — 5/5 aprovados, sem bloqueadores).
4. O contrato frontend↔backend foi homologado ponta a ponta sem qualquer incompatibilidade. Handoff resolvido e encerrado.
