De: 08 — QA e Release
Para: 00 — Coordenador
Onda: review-20261119
Status: resolvido (aceite concluído — sem bloqueadores)
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: release

## Problema

Aceite conjunto da jornada pública DSR (LGPD art. 18) mergeada em main (PRs #381/#385):
mapear o fluxo, executar contra banco real e verificar persistência, anti-abuso e
isolamento do dossiê — com dados 100% sintéticos.

## Arquivo(s) envolvido(s)

- `src/features/lgpd/dsrRequest.{routes,schema,service}.ts` (backend público)
- `src/features/lgpd/pages/{DsrRequestForm,DsrVerifyPage,DsrStatusPage,dsr.api,dsrShared}.tsx`
- `src/pages/PrivacyPolicy.tsx` (formulário embutido em /privacy)
- `src/App.tsx` (rotas /privacidade/dsr/verificar e /acompanhamento)
- `src/bootstrap/rateLimiters.ts` (dsrLimiter: 10 req/15min por IP)
- `prisma/migrations/20261117231500_data_subject_request_dsr` (tabela + RLS FORCE)
- `tests/integration/dsr-public-journey.test.ts` (NOVO — evidência executável)

## Evidência

Execução real contra `prospectordb_test` (Postgres 16 + RLS real, `prospector_app`
NOSUPERUSER) em 2026-11-19, branch `agente/08-aceite-dsr-20261119`:

- `npx vitest run -c vitest.integration.config.ts tests/integration/dsr-public-journey.test.ts`
  → **5/5 testes passando**:
  1. Jornada completa: POST → 202 → linha `DataSubjectRequest` persistida
     (PENDING_VERIFICATION, protocolo DSR-XXXX-XXXX-XXXX, e-mail em `enc:v1:`
     verificado via SQL bruto, tokens só como hash SHA-256) → e-mail de
     verificação capturado → GET status (só metadados, sem PII) → verify com
     token errado → 400 genérico → verify correto → 200 COMPLETED + dossiê
     JSON → dossiê contém dados do titular e NÃO contém outro titular da mesma
     org → linha atualizada (COMPLETED, contactId, verifiedAt) → status reflete
     COMPLETED → replay do token → 400 (uso único) → e-mail de conclusão.
  2. E-mail sem titular → 202 idêntico, zero linhas, zero e-mails (anti-enumeração).
  3. Payload inválido → 400 sem tocar o banco.
  4. Rate limit dedicado → 429 na 4ª requisição (limite configurado 3 no teste;
     produção usa 10/15min — src/bootstrap/rateLimiters.ts:156-168).
  5. RLS real: `DataSubjectRequest` de test-org-id invisível sob tenant
     `org-intrusa-dsr`.
- `npx vitest run -c vitest.unit.config.ts tests/unit/features/lgpd/`
  → **35/35 passando** (rotas, service, páginas com MSW).
- `npm run pretest:integration` → 158 migrações aplicadas, nenhuma pendente
  (migration DSR presente e aplicada).

## Status por etapa

| Etapa | Status | Evidência |
|---|---|---|
| Solicitação (form → POST → persistência) | ✅ ACEITO | teste integração #1 e #2 |
| Confirmação/verificação por e-mail | ✅ ACEITO (com limitação de transporte) | e-mail capturado via mock do mailer; SMTP real não exercitado |
| Verificação → execução do direito + dossiê | ✅ ACEITO | verify ACCESS retorna `package` JSON; download coberto em dsr-pages.test.tsx |
| Acompanhamento (status token) | ✅ ACEITO | só metadados; token opaco; 400 genérico |
| Dossiê restrito ao titular | ✅ ACEITO | outro contato da mesma org ausente do pacote; resolução por emailIndex no servidor |
| Anti-abuso | ✅ ACEITO | rate limit por IP dedicado + payload 400 + anti-enumeração 202 idêntico |
| Persistência real | ✅ ACEITO | linha gravada e verificada no Postgres de teste |

## Limitações do ambiente

- Não há Mailpit/SMTP local; o e-mail foi capturado por mock de `sendEmail`
  (mesmo padrão dos testes unitários). O transporte SMTP em si é best-effort por
  design (falha de SMTP nunca derruba o fluxo — `MailerNotConfiguredError` → warn).
  Se quiser prova ponta-a-ponta de entrega, subir Mailpit + `SMTP_HOST` em
  docker-compose é follow-up de infra (fora do escopo do 08).
- Jornada UI↔API real (browser → Express → Postgres) não foi executada; a UI é
  coberta por testes de componente com MSW e a API por integração real. O
  contrato entre os dois foi validado pelos dois lados.
- Direitos ERASURE/CONSENT_REVOCATION/CORRECTION/SHARING_INFO executam via
  verify no mesmo caminho (cobertos em unit do service); a jornada de aceite
  exercitou ACCESS (dossiê) — os demais compartilham o mesmo fluxo de token.

## Alteração necessária

Nenhuma — nenhum defeito de produto encontrado. Nenhum handoff de correção aberto.

## Teste esperado

`tests/integration/dsr-public-journey.test.ts` — 5 testes, executável via
`npm run test:integration` (arquivo incluído no glob padrão da suíte).
