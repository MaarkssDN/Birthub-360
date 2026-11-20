De: Agente 01 — Plataforma, Segurança e Dados
Para: Agente 02 — Produto e UX
Onda: W7 (follow-up do handoff 21→01 canal público DSR)
Status: resolvido (implementado pelo Agente 02 — PR #385 mergeado em main; backend do Agente 01 mergeado no PR #381; aceite do Agente 08 no PR #428)
Prioridade: normal (backend pronto; sem as páginas os links dos e-mails caem em 404)
Bloqueador-ref: `.agents/handoffs/21-para-01-dsr-canal-publico-lgpd.md` (resolução 2026-11-17)
Sprint destino: próxima onda

## Problema

O canal público de solicitação DSR (LGPD art. 18) foi implementado no backend
(`POST/GET /api/public/data-subject-requests`, `/verify`, `/status/:token`), mas
os e-mails transacionais apontam para páginas que ainda não existem:

- `${PUBLIC_BASE_URL}/privacidade/dsr/verificar?protocol=...&token=...`
- `${PUBLIC_BASE_URL}/privacidade/dsr/acompanhamento?token=...`

Sem elas, o titular não consegue verificar o token nem acompanhar o pedido.

## Arquivo(s) envolvido(s)

- Novas páginas (sugestão: `src/features/lgpd/pages/` ou junto a `/privacy` —
  propriedade do 02/frontend; o Agente 03 pode revisar a11y).
- `src/App.tsx`/rotas públicas (propriedade do 02).

## Contrato da API (já implementado e testado)

1. `POST /api/public/data-subject-requests` — body `{ email, rightType, preferredChannel?, details? }`
   → `202 { ok: true }` sempre (anti-enumeração). `rightType` ∈
   `ACCESS|PORTABILITY|CORRECTION|ERASURE|CONSENT_REVOCATION|SHARING_INFO`.
2. `POST /api/public/data-subject-requests/verify` — body `{ protocol, token }`
   → `200 { ok:true, status:'COMPLETED'|'IN_PROGRESS', package? }`;
   `package` (só ACCESS/PORTABILITY) é o dossiê JSON serializado — oferecer
   download `.json`. Erros: `400 invalid_or_expired_token`, `404 subject_not_found`,
   `503 unavailable`.
3. `GET /api/public/data-subject-requests/status/:statusToken` →
   `{ ok:true, protocol, rightType, status, createdAt, verifiedAt }`.

Rate limit: 10 req/15min por IP — a UI deve desencorajar reenvios.

## Alteração necessária

1. Página `/privacidade/dsr/verificar`: lê `protocol`+`token` da query, chama
   `/verify`, mostra resultado (sucesso + download do dossiê quando houver;
   erros amigáveis sem detalhe técnico).
2. Página `/privacidade/dsr/acompanhamento`: lê `token`, chama `/status/:token`
   periodicamente ou sob demanda, mostra protocolo/status/prazo (15 dias, art. 19).
3. Opcional (recomendado): formulário público de solicitação DSR na página
   `/privacy` que faça o `POST /` — hoje o canal só é acessível por quem já
   recebeu e-mail; o titular que nunca interagiu com a landing não tem entrada.
4. i18n pt-BR; textos devem reforçar: prazo de 15 dias, canal manual via DPO
   como fallback, nenhum dado é alterado sem confirmação por e-mail.

## Teste esperado

Fluxo E2E (com backend de teste): submit → e-mail → verify → status.
No mínimo: páginas renderizam, chamam os endpoints corretos e tratam os erros
do contrato acima.

## Contexto adicional

- Migration `20261117231500_data_subject_request_dsr` precisa estar aplicada
  no ambiente antes do fluxo funcionar (pendente de deploy — decisão do 00/08A).
- `CORRECTION`/`SHARING_INFO` ficam `IN_PROGRESS` (tratamento manual do DPO) —
  a UI deve comunicar "recebido, em análise" em vez de "concluído".
<<<<<<< HEAD
=======

---

## Resolução (Agente 02 — 2026-11-18)

**Status:** RESOLVIDO.

Todas as páginas, rotas e formulários necessários foram implementados com conformidade estrita aos princípios P1-P4:

1. **Cliente API tipado:** `src/features/lgpd/pages/dsr.api.ts` com suporte aos três endpoints do contrato (`/`, `/verify`, `/status/:token`), mapeamento amigável de erros do contrato, datas pt-BR e prazo legal de 15 dias (LGPD art. 19), além de helper de download seguro do dossiê JSON.
2. **Página de verificação:** `src/features/lgpd/pages/DsrVerifyPage.tsx` na rota `/privacidade/dsr/verificar`, com proteção contra consumo duplicado em StrictMode, estado de carregamento acessível, exibição amigável do status de conclusão ou análise, e botão para baixar dossiê.
3. **Página de acompanhamento:** `src/features/lgpd/pages/DsrStatusPage.tsx` na rota `/privacidade/dsr/acompanhamento`, com protocolo, tipo de direito, status amigável, prazo limite legal e botão de atualização sob demanda.
4. **Formulário de solicitação DSR:** `src/features/lgpd/pages/DsrRequestForm.tsx` com React Hook Form + Zod embutido na seção 5.1 de `/privacy` (`src/pages/PrivacyPolicy.tsx`), com mensagem de sucesso anti-enumeração e acessibilidade WCAG AA.
5. **Rotas em App.tsx:** Rotas lazy adicionadas sem autenticação necessária (`/privacidade/dsr/verificar` e `/privacidade/dsr/acompanhamento`).
6. **Testes unitários:** 10 testes com MSW em `tests/unit/features/lgpd/dsr-pages.test.tsx` cobrindo sucesso, erros, formulário, prazos e download de dossiê (100% passando).
7. **Handoff de integração:** `.agents/handoffs/onda-W7/02-para-01-dsr-paginas-implementadas.md` publicado.
>>>>>>> origin/agente/02-handoffs-20261117
