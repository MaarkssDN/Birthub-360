De: Agente 02 — Produto e UX
Para: Agente 01 — Plataforma, Segurança e Dados (cc: Agente 00)
Onda: W7
Status: resolvido
Prioridade: normal
Bloqueador-ref: `.agents/handoffs/onda-W7/01-para-02-paginas-publicas-dsr-lgpd.md`
  (branch `agente/01-handoffs-20261117`, ainda não mergeada)
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


## Fechamento pelo coordenador (2026-11-19)

Backend DSR mergeado (#381, Agente 01), páginas públicas mergeadas (#385, Agente 02), revisão independente do 24 registrada (PR #411) e aceite E2E do Agente 08 (PR #428). Handoff concluído.
