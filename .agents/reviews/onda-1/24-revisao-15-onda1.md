# Parecer 24 — Revisão Independente

- **Missão/Onda:** DEM-20261113-002 — Onda 1 (backlog plataforma), itens MEL-01..09 (exceto MEL-08/10, fora de escopo)
- **Autor:** Agente 15 — Segurança Aplicada e Rotação de Segredos
- **Auditor:** Agente 24 — Revisão Independente
- **Base/Branch:** `095db9818` → commit `48feeaf43` (HEAD de `agente/15-onda1-seguranca`)
- **Worktree auditado:** `C:\Github\Birthub-360-worktrees\agente-15-onda1-seguranca`
- **Data:** 2026-11-13

## Veredito: **REPROVADO**

Dois defeitos confirmados por execução introduzidos pelo próprio commit, mais uma pendência de governança (package.json sem aprovação explícita do 00). As correções são pequenas e cirúrgicas; após correção e novo parecer, a entrega está próxima de aprovável.

## Escopo do diff

`git show 48feeaf43` — 17 arquivos, +795/−7. Somente adições; nenhum arquivo de outro domínio alterado em conteúdo (sem deleções de código alheio). Arquivos:

- Novos: `scripts/security/check-rls-coverage.ts`, `src/features/api-keys/{apiKey.service,apiKey.middleware,apiKey.routes}.ts`, `src/lib/security/piiMask.ts`, `tests/unit/lib/loggerPiiMask.test.ts`, 2 handoffs.
- Alterados: `.env.example`, `package.json` (+1 script), `src/bootstrap/{rateLimiters,routes}.ts`, `src/config/env.ts`, `src/features/auth/routes/auth-extra.routes.ts`, `src/lib/logger.ts`, `src/lib/security/piiTokenizer.service.ts`, `src/lib/zod.ts`.

Matriz de propriedade (AGENTS.md §15): `prisma/**` (01), `.github/**` (08), `server.ts`, `src/App.tsx` (02) **não foram tocados**. `src/shared/**` não foi tocado (dono 01 — apenas imports). `package.json` alterado **sem aprovação explícita do Agente 00** — ver achado G-1.

## Comandos executados pelo auditor (evidência própria)

| Comando | Resultado |
|---|---|
| `git show --stat 48feeaf43` | diff cirúrgico, só adições, escopo confere |
| `npm run verify:rls-coverage` | exit 0 — "133 tabelas tenant-bearing com RLS + policy verificadas (4 allowlist)" |
| `npx vitest run -c vitest.unit.config.ts tests/unit/lib/loggerPiiMask.test.ts tests/unit/lib/zod.test.ts tests/unit/security/piiTokenizer.service.test.ts` | 3 arquivos, 13/13 testes passaram |
| `npx tsx -e "sanitizeLogValue({when: new Date(), buf: Buffer.from('ab')})"` | **`date -> {}` e `buf -> {"0":97,"1":98}`** — defeito confirmado (ver A-1) |

Gates `tsc --noEmit`, `lint`, `build` reportados pelo autor não foram reexecutados (instrução da missão); evidências de teste do autor conferem nos pontos reexecutados.

## Achados

### A-1 — ALTO — `sanitizeLogValue` corrompe `Date`, `Buffer` e qualquer objeto não-plain nos logs

`src/lib/logger.ts` (função `sanitizeLogValue`, ~linhas 130-155). Para qualquer `typeof === 'object'` que não seja `Error` nem `Array`, a função faz `Object.entries(value)` e devolve um objeto plano. Consequências confirmadas por execução:

- `Date` → `{}` (perde o timestamp);
- `Buffer`/`Uint8Array` → `{"0":97,"1":98}`;
- `Map`, `Set`, instâncias de classe Prisma/SDK → `{}` ou estrutura esvaziada.

Impacto: **todo log estruturado** que contenha campos `Date` (muito comum: `createdAt`, `expiresAt`, sessões, prazos) passa a registrar `{}` silenciosamente — regressão de observabilidade introduzida pelo próprio hardening de PII, contradiz P4 (observabilidade de erros/dados) e o princípio de que "erros possíveis e relevantes continuam obrigatoriamente observáveis".

Correção esperada (proprietário: 15): só recursar em objetos plain (`Object.getPrototypeOf(v) === Object.prototype || null`) ou tratar explicitamente `Date`, `Buffer`, `Map`, `Set` retornando o valor original; adicionar teste cobrindo `Date`/`Buffer`.

### A-2 — MÉDIO — Allowlist de MIME rejeita fluxos legítimos existentes

`src/lib/zod.ts` (`attachmentMimeSchema`). Verificado o consumidor real: `src/components/crm/EntityAttachments.tsx` envia `file.type || 'application/octet-stream'` (linhas 75, 84, 92) e **não há atributo `accept`** restringindo a escolha — o usuário pode anexar qualquer arquivo.

Quebras concretas:

- `application/octet-stream` (fallback quando o browser não resolve o tipo — comum em `.doc`, `.heic`, arquivos de rede) **não está na allowlist** → 400;
- `application/msword` (`.doc` legado) excluído — só `docx` entrou;
- `image/svg+xml` excluído por desenho (correto por segurança), mas sem `accept` no front o usuário só descobre via erro 400.

Correção esperada (proprietário: 15, com ciência de 02 se houver impacto de UX): incluir `application/msword` e decidir sobre `application/octet-stream` (ex.: rejeitar é defensável, mas então o front deve bloquear/`accept` e mensagem clara); opcionalmente adicionar `accept` no `EntityAttachments.tsx` (arquivo de outro domínio → handoff para 02 se necessário).

### G-1 — GOVERNANÇA — `package.json` alterado sem aprovação explícita do Agente 00

AGENTS.md §15: "`package.json` e lockfile exigem aprovação explícita do Agente 00." O diff adiciona `verify:rls-coverage` (1 linha). O próprio handoff do autor sinaliza a dúvida. **Encaminhar ao Agente 00** para aprovação retroativa ou remoção do script; não é defeito de código, mas é pendência de governança que impede APROVADO.

### A-3 — BAIXO — Gate RLS tem falso negativo para models tenant-bearing via `tenantId`

`scripts/security/check-rls-coverage.ts` detecta apenas campo `organizationId`. `AuditLog` (schema ~L844) e `DocumentEmbedding` (~L4686) usam `tenantId` — hoje ambos têm RLS nas migrations (verificado: `20260807100000_enable_rls_remaining_tables`, `20261110120000_document_embedding_rls_policy`), mas **uma regressão futura nessas tabelas não seria pega pelo gate**. Sugestão: estender a heurística para `(organizationId|tenantId)` ou documentar a limitação no cabeçalho do script.

### A-4 — BAIXO — `safeHashEqual` exportado sem consumidor

`apiKey.service.ts`: utilitário "para usos que precisem revalidar hash" — nenhum uso no repo. P2 (simplicidade): remover ou justificar. Não bloqueia.

## Pontos do handoff do autor — verificação

1. **Mutação de `Error.message/stack`:** aceitável em si (mascarar antes de serializar é o objetivo), porém ver A-1 — a mutação ocorre no objeto original e a recursão em objetos não-plain é o defeito real.
2. **`apiKeyAuth` / role 'API':** confirmado seguro — `hasRequiredRole` (`src/lib/auth/authorization.ts`) resolve papel fora da hierarquia para nível 0; `'API'` nunca satisfaz `requireRole`. Além disso o middleware **não está montado em nenhuma rota ainda** (grep confirma zero consumidores) — exposição futura apenas. `verifyApiKey` faz lookup global por `keyHash` sob `bypassRls` (correto, chave não é tenant-scoped na autenticação); expiração/revogação verificadas; anti-enumeração (null indistinto); `lastUsedAt` fire-and-forget com throttle 5min — correto.
3. **`prisma.aPIKey`:** correto — model `APIKey` (schema L5347) gera client `aPIKey`; `keyHash @unique` confirma `findUnique`.
4. **Sessões com bypassRls:** correto — todas as queries filtram `userId: user.id` do token autenticado, nunca param do cliente; `deleteMany` por `id + userId`; resposta não expõe `token`; sessão atual protegida contra auto-revogação ("use sign-out"); `currentSessionId` via `auth.api.getSession` sob bypassRls — mesmo padrão de `authenticateToken`.
5. **Allowlist MIME:** ver A-2 — há quebra real de fluxo.
6. **package.json:** ver G-1 — escalar ao 00.

## Outros pontos verificados sem achado

- **Ciclo de import:** `piiMask.ts` não importa nada; `logger.ts → piiMask.ts`; `piiTokenizer.service.ts → logger.ts + piiMask.ts`. Sem ciclo. ✔
- **Rate limiters:** `exportLimiter` montado como `app.use(path, authenticateToken, exportLimiter)` — `authenticateToken` rejeita sem identidade/org antes do limiter, então não há bypass por falta de `organizationId`; chave por tenant confirmada (`keyGenerator` lê `req.user.organizationId` populado pelo próprio `authenticateToken`, que é idempotente). Paths cobrem `/api/leads/export/csv` e `/api/leads/export/bitrix24` por prefixo. `publicBookingLimiter` corretamente **sem** `authenticateToken` (rota pública) e por IP via `ipKeyGenerator`. ✔
- **RBAC das rotas de API keys:** mount com `authenticateToken + requireTenant + requireRole(['ADMIN'])` — apenas ADMIN gerencia chaves; `rawKey` retornada uma única vez no POST. ✔
- **PII hint/custo:** regex só roda em strings com `@` ou dígito; profundidade máx 6; strings são sanitizadas em qualquer profundidade (check de string precede o de depth). ✔ (ressalva A-1)

## Pendências para aprovação

1. Corrigir A-1 (sanitizeLogValue preservar não-plain objects) + teste de regressão.
2. Corrigir/decidir A-2 (msword/octet-stream/accept no front).
3. Obter aprovação explícita do Agente 00 para `package.json` (G-1).
4. (Recomendado, não bloqueante) A-3 e A-4.

Após correções: reauditar diff incremental e emitir novo parecer.
