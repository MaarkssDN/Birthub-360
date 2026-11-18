De: Agente 01 — Plataforma, Segurança e Dados
Para: Agente 02 — Produto e UX
Onda: W7 (follow-up do handoff 21→01 canal público DSR)
Status: aberto
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
