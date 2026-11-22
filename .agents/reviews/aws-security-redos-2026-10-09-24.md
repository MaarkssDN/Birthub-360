# Parecer 24 — correção ReDoS opt-out

Missão aws-release-2026-10-09, autor release_security01 (01 e fase serial08 autorizada00), auditor sync_auditor24.
Base `e019a5417a7af518f32bb14746705c48f974d98f`; branch codex/aws-release-security-fix, revisão congelada sem commit.
**APROVADO exclusivamente commit e integração por cherry-pick no PR678 para repetir CI**, sem merge em main/deploy. Se conflito produzir mudança de conteúdo, exigir reauditoria.

## Revisão e critérios

- Serviço `src/shared/services/optOutCheck.service.ts`: SHA256 `9912bf8189f20d71dbde34dff3d96cde752b6e3035fc05ba55df0c5ae08ffff2`.
- Teste `src/features/lgpd/services/__tests__/optOutCheck.service.test.ts`: SHA256 `41b1ee5627cec3a5dd1e29c6f4f796818cbbe5f778c1a03a7f3b4750bf064e02`.
- Relatório `.agents/runs/aws-release-security-2026-10-09.md`: SHA256 `86dd343ed1566cbd2735fe1c5f0070bb85d3248b286c4f3fe9c51f5553505d32`.

Diff completo, relatório e hashes conferidos independentemente. Regex de sufixo não ancorada em input externo podia recomeçar em múltiplos offsets e causar custo quadrático. Correção percorre cada borda uma vez com conjunto constante de caracteres, preservando trim/lowercase/remoção de bordas/trim e termos existentes. Sem limite artificial de input, waiver ou alteração de regras tenant/canal/LGPD.

Testes adicionam pontuação/espaços válidos e inválidos e adversarial de 50k caracteres. Auditor reexecutou `npx vitest run -c vitest.unit.config.ts <optOutCheck.service.test.ts> <optOut.test.ts>`: exit0, 2 arquivos/49 testes PASSARAM, 14,03s. Casos existentes tenant/multicanal preservados. Relatório autor registra diferencial2541 sem diferenças, benchmark legado5859ms/fix0,056ms, typecheck/lint/build/formatação/diffcheck exit0; auditor não inventou repetição desses gates.

Nenhum novo segredo, PII real, mudança de schema, persistência ou auth no diff. Propriedade shared01 e testes08 sob acordo serial00 respeitada. Única escrita do auditor este parecer. CI incluindo CodeQL deve reexecutar no SHA final; histórico HIGH não é considerado resolvido remotamente até resultado real. Suítes completas e plano EC2/rollback continuam gates de release, que não é aprovada aqui.
