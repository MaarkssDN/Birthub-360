# Parecer 24 — Reauditoria pós-correção

- **Missão/Onda:** DEM-20261113-002 — Onda 1 (backlog plataforma), MEL-01..09
- **Autor:** Agente 15 — Segurança Aplicada e Rotação de Segredos
- **Auditor:** Agente 24 — Revisão Independente
- **Revisão auditada:** commits `48feeaf43` (feature) + `b1b9644bf` (correções A-1..A-4), HEAD de `agente/15-onda1-seguranca`
- **Parecer anterior:** `.agents/reviews/onda-1/24-revisao-15-onda1.md` — REPROVADO
- **Data:** 2026-11-13

## Veredito: **APROVADO (condicionado)**

Todo o código da entrega está aprovado nos commits `48feeaf43` + `b1b9644bf`. **Condição de integração:** o script `verify:rls-coverage` em `package.json` (linha adicionada em `48feeaf43`) ainda aguarda aprovação explícita do Agente 00 (AGENTS.md §15). Se o 00 negar, basta remover a linha — o gate continua executável via `npx tsx scripts/security/check-rls-coverage.ts`. Esta pendência é de governança, não de código, e foi escalada.

## Diff incremental auditado

`git show b1b9644bf` — 6 arquivos, +144/−11. Inclui o parecer anterior `.agents/reviews/onda-1/24-revisao-15-onda1.md` (artefato do próprio 24, propriedade §15 — correto). Demais alterações cirúrgicas e restritas aos achados.

## Verificação dos achados

### A-1 (sanitizeLogValue corrompia Date/Buffer) — RESOLVIDO ✔

`src/lib/logger.ts`: após o check de `Array`, adiciona guarda de protótipo — só recursa quando `Object.getPrototypeOf(value) === Object.prototype || null`. `Date`, `Buffer`, `Map`, `Set` e instâncias de classe retornam intactos ao serializer do pino. Correto: objetos `Object.create(null)` (proto null) continuam sanitizados; strings seguem sanitizadas em qualquer profundidade (check de string precede o de depth). Novo teste de regressão cobre Date/Buffer/Map/Set/classe **e** confirma que plain objects ao redor continuam mascarando PII. Borda aceitável: PII dentro de propriedades de instâncias de classe não é mais sanitizada — trade-off razoável e documentado, instâncias raramente carregam PII em logs.

### A-2 (allowlist MIME quebrava fluxos) — RESOLVIDO ✔

`src/lib/zod.ts`: adicionados `application/msword` e `application/octet-stream`. Avaliação:

- `octet-stream` é o fallback real do front (`EntityAttachments.tsx` envia `file.type || 'application/octet-stream'`) e era o comportamento status quo anterior ao commit (qualquer string era aceita) — restaurar é correto, não é afrouxamento novo;
- SVG/HTML/executáveis permanecem fora — hardening preservado;
- Front não alterado: **aceitável** — o backend agora aceita tudo que o front pode enviar; o único resíduo é UX (usuário que escolher `.svg` recebe 400 em vez de bloqueio no picker). Observação não bloqueante: handoff opcional ao Agente 02 para adicionar `accept` em `EntityAttachments.tsx`.

### A-3 (gate RLS cego a `tenantId`) — RESOLVIDO ✔

`scripts/security/check-rls-coverage.ts`: `isTenantBearing` agora casa `(organizationId|tenantId)` em início de linha — sem falsos positivos por comentários (`// tenantId` não casa `^\s*tenantId`) nem por substring. Gate reexecutado: **135 tabelas** (133 + AuditLog + DocumentEmbedding), exit 0.

### A-4 (safeHashEqual sem uso) — RESOLVIDO ✔

Removido junto com o import `timingSafeEqual` em `apiKey.service.ts`. Grep confirma zero referências restantes a `safeHashEqual`; os `timingSafeEqual` remanescentes no repo são de features pré-existentes não relacionadas.

## Comandos executados pelo auditor (reauditoria)

| Comando | Resultado |
|---|---|
| `git show b1b9644bf` (diff integral) | cirúrgico, sem código alheio tocado |
| `npm run verify:rls-coverage` | exit 0 — "135 tabelas tenant-bearing com RLS + policy verificadas (4 allowlist)" |
| `npx vitest run -c vitest.unit.config.ts tests/unit/lib/loggerPiiMask.test.ts tests/unit/lib/zod.test.ts tests/unit/security/piiTokenizer.service.test.ts` | 3 arquivos, **14/14 testes** passaram (inclui novo teste de regressão A-1) |
| `grep safeHashEqual/timingSafeEqual src/` | sem referências órfãs em api-keys |

`tsc --noEmit` reportado pelo autor (0 erros) não reexecutado — diff é pequeno e tipado; os testes unitários compilam os arquivos alterados via vitest.

## Estado dos pontos de segurança originais (sem regressão)

- API keys: SHA-256, expiração/revogação, `lastUsedAt` throttled, role 'API' incapaz de passar `requireRole`, middleware ainda sem consumidores — inalterado e correto.
- Sessões: filtro sempre por `userId` do token, token nunca retornado, proteção da sessão atual — inalterado e correto.
- Rate limiters por tenant/IP sem bypass — inalterado e correto.
- Sem ciclo de import piiMask ↔ logger — inalterado e correto.
- Matriz de propriedade: nenhum arquivo de dono exclusivo (01/02/08/09/10) tocado nos dois commits.

## Pendências

1. **G-1 → Agente 00:** aprovar ou rejeitar a linha `verify:rls-coverage` em `package.json`. Não bloqueia o mérito do código; bloqueia merge se negada sem remoção da linha.
2. **Opcional → Agente 02:** `accept` attribute em `EntityAttachments.tsx` para UX de tipos bloqueados (SVG/HTML).
3. Handoff 15→08 (`15-para-08-rls-coverage-ci.md`) permanece aberto — CI do gate é escopo do 08.

## Escopo da aprovação

Aprova os commits `48feeaf43` e `b1b9644bf` na íntegra para integração na branch de onda, **condicionado** à resolução de G-1. Não aprova deploy em produção, não cobre MEL-08/MEL-10 (fora de escopo da onda) e não substitui os gates de CI do Agente 08.
