# Parecer Agente 24 — PR #385 (Agente 02 — páginas públicas DSR /privacidade/dsr/*)

- Missão: onda saneamento-handoffs-20261118, lote 2
- Autor: Agente 02 | Auditor: Agente 24
- Branch: `agente/02-handoffs-20261117` | Estado: **MERGED** em main (2026-11-18T15:13Z, junto com #381)
- Arquivos: `DsrRequestForm.tsx`, `DsrVerifyPage.tsx`, `DsrStatusPage.tsx`, `dsr.api.ts`, `dsrShared.tsx`, rotas lazy em `App.tsx`, testes `tests/unit/features/lgpd/dsr-pages.test.tsx`, SettingsPage com seletor de idioma

## Verificações

- **Degradação sem #381**: código contém comments explícitos de dependência de #381; `dsr.api.ts` mapeia erros para mensagens amigáveis pt-BR (`invalid_or_expired_token`, `invalid_payload`, `subject_not_found`, `unavailable`) e renderiza fallback genérico — graceful degradation implementada.
- **Anti-enumeração**: POST do formulário usa contrato genérico 202 do backend; a UI não expõe confirmação de existência.
- **LGPD/PII**: páginas só exibem metadados do pedido; download de pacote restrito a ACCESS/PORTABILITY na página de verificação. E-mail DPO exposto é o institucional já publicado.
- **Seletor de idioma**: SettingsPage persiste em `@birthhub360:locale` (pt-BR/en-US) — fora do escopo DSR mas dentro do PR; sem segredos, sem PII.
- **Testes DSR**: `npx vitest run tests/unit/features/lgpd/dsr-pages.test.tsx` → **10 testes: 8 FALHARAM, 2 passaram**. Falhas em verify/status/form: UI renderiza fallback "Não foi possível enviar sua solicitação agora…" — MSW não parece casar com `resolveApiUrl` em jsdom ou rota de request diverge. Somente o teste de query-param ausente passou.

## Achados

- **BLOQUEADOR para evidência**: 8/10 testes DSR falham no ambiente de teste. Pode ser (a) defeito real da página, ou (b) harness MSW/URL mismatch. Em ambos os casos o PR foi mergeado **sem gate verde** nessa suíte — violação do §28.
- **Achado cruzado de tenancy**: `tests/unit/lib/tenant-scoping-parity.test.ts` falha em main pós-merge: `Model(s) novo(s) com organizationId fora de TENANT_INJECTED_MODELS e de KNOWN_RLS_ONLY_MODELS: DataSubjectRequest`. O modelo veio do PR #381 (Agente 01) e **não está classificado** no registry de tenancy — potencial risco de isolamento. Deve ser corrigido por 01/00 (classificar modelo como tenant-injected ou RLS-only) — o teste unitário não depende de Postgres e deveria ter barrado o merge.
- Dependência #381: mergeada no mesmo batch — ordem aceitável, mas o gate de parity deveria ter rodado.

## Veredito

**BLOQUEADO** — como evidência de qualidade. PR já mergeado; exige follow-up imediato: (1) corrigir testes DSR falhando (Agente 02/08); (2) classificar `DataSubjectRequest` em `tenant-scoping-registry`/allowlist (Agente 01/00); (3) re-rodar `tenant-scoping-parity` + `dsr-pages` verdes antes de considerar a entrega encerrada. Escopo de aprovação: **nenhum** além do já mergeado — parecer registra débitos, não reabre o diff.
