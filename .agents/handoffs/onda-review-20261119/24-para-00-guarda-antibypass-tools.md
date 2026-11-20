De: 24 — Revisão Independente (achado repassado pelo 00)
Para: 00 — Coordenador
Onda: review-20261119
Status: RESOLVIDO (execução: Agente 99 — Vito, branch `agente/15-cve-waiver-tools-guard`)
Prioridade: alto
Bloqueador-ref: parecer 24 do PR #415 — `.agents/reviews/24-revisao-pr415-p0-security-extract.md`
Sprint destino: próxima onda de segurança

## Problema

A guarda anti-bypass design-lab adicionada em `src/bootstrap/frontend.ts` (PR #415) protege
`/design-lab/**` e aliases (`/public/design-lab`, `/@fs`, case-insensitive, encoding).
O Agente 24 identificou que **`/tools` tem exatamente o mesmo desenho de mounts autenticados
e provavelmente o mesmo bypass por alias/encoding** — mesma classe de vulnerabilidade P0.

## Arquivo(s) envolvido(s)

- `src/bootstrap/frontend.ts` (guarda existente — referência do padrão)
- mounts de `/tools` no mesmo arquivo ou `server.ts`/bootstrap correspondente

## Evidência

Parecer 24 PR #415: "`/tools` tem exatamente o mesmo desenho de mounts autenticados e
provavelmente o mesmo bypass por alias/encoding — recomendo handoff ao 00 para estender a
guarda ou confirmar que não há ativos sensíveis equivalentes."

## Alteração necessária

1. Mapear o que `/tools` monta e se expõe ativos sensíveis equivalentes ao design-lab.
2. Se sim: estender a guarda `isBlockedDesignLabPath` (ou generalizar para predicado de
   rotas internas sensíveis) cobrindo `/tools` e aliases — com teste supertest equivalente.
3. Se não houver ativo sensível: registrar justificativa e fechar.

## Teste esperado

- Requisições a aliases/encoding de `/tools` → 404 antes dos estáticos (se aplicável).
- `tests/unit/bootstrap/frontend.test.ts` estendido com os novos casos.

## Contexto adicional

- Dono provável da execução: 01 (Plataforma/Segurança) ou 15 (Segurança Aplicada);
  `src/bootstrap/**` — escalar ao 00 para designação se necessário.
- Não bloqueia o merge do #415 (achado é follow-up, não defeito do diff).

## Resolução (Agente 99 — Vito, 2026-11-19)

**Veredito: bypass REAL — mesma classe P0 do design-lab. Correção implementada.**

### Diagnóstico (evidências)

1. **Mounts `/tools`**: `src/bootstrap/frontend.ts` monta `/tools` com `toolsLimiter` +
   `authenticateToken` + `express.static(public/tools)` (dev, frontend.ts:109) e
   `express.static(dist/tools)` (prod, frontend.ts:153), sempre ANTES do catch-all
   `express.static(distPath)` (frontend.ts:164) e do fallback SPA. `mountFrontend` é o último
   bootstrap (`server.ts:100`), depois de todas as rotas `/api` (`routes.ts`).
2. **Bypass confirmado**: o mount `app.use('/tools', ...)` só casa o prefixo literal.
   Paths que o `express.static(distPath)`/`vite.middlewares` decodificam para o mesmo
   arquivo escapam do mount e da auth:
   - produção: `/%74ools/...`, `/tools%2F...`, `//tools/...` → `dist/tools/**`;
   - dev e prod: `/public/tools/...`, `/@fs/<abs>/public/tools/...` e
     `/@fs/<abs>/dist/tools/...` (Vite serve `publicDir` na raiz e `/@fs/` absoluto sem auth).
   Conteúdo exposto: `public/tools/social-selling/*.html` (materiais comerciais
   proprietários) — sensibilidade equivalente à do design-lab.
3. **authenticateToken sem bypass em prod**: `ALLOW_DEV_AUTH_BYPASS` só afeta
   `requireEmailVerification` (`src/lib/auth.ts:104`) e o boot aborta se a flag vier
   `true` com `NODE_ENV=production` (`src/config/env.ts:389-395`, fail-closed).
   `authenticateToken` (`src/shared/middlewares/authenticateToken.ts`) exige sessão
   Better Auth real + e-mail autorizado + organização — sem atalho condicional.
4. **CSP `unsafe-inline` em `/tools`**: relaxamento restrito ao mount `/tools`
   (`frontend.ts`, middleware de CSP antes do static), justificado em comentário —
   conteúdo HTML estático próprio do produto, nunca dado de usuário refletido. O restante
   do app mantém a CSP estrita do Helmet. Risco residual aceito e documentado; os aliases
   bloqueados pela guarda também deixam de receber esse header relaxado (recebem 404).
5. **Diferença /tools vs /design-lab**: mesmo desenho de mounts; a guarda do design-lab
   (PR #415, ainda não mergeado — commits `930c9cea1`/`6f8fca2d3` só existem na branch
   `agente/00-p0-security-extract-310`) usa predicado de segmento genérico, o que não
   serviria para `/tools` sem falsos positivos (`/dashboard/tools` é rota SPA legítima —
   `src/features/voice-hub/components/Sidebar.tsx:157` — e `/api/prospecting/tools/*`,
   `/src/**/tools/` são paths legítimos com segmento "tools"). Por isso a guarda de
   `/tools` é mais estrita: só conta a raiz `tools` ou `public|dist/tools`.

### Correção aplicada

- `src/bootstrap/frontend.ts`: novo predicado exportado `isBlockedToolsPath` + middleware
  de guarda no topo de `mountFrontend` (antes de qualquer static/vite), cobrindo dev e
  prod. Fail-closed: encoding malformado segue para o downstream (que já rejeita);
  paths legítimos (`/tools/…` prefixo literal → mount autenticado; `/dashboard/tools`,
  `/api/**/tools`, `/src/**/tools`, `/@fs/…/src/**/tools`) passam.
- `tests/unit/bootstrap/frontend.toolsGuard.test.ts` (novo — nome distinto de
  `frontend.test.ts` para não colidir com o arquivo que o PR #415 cria): 25 testes —
  predicado puro + supertest comprovando 404 nos aliases e pass-through nos legítimos.

### Gates executados

- `npx tsc --noEmit` → limpo.
- `npx vitest run -c vitest.unit.config.ts tests/unit/bootstrap/frontend.toolsGuard.test.ts`
  → 25/25 passando.
- `npx biome lint src/bootstrap/frontend.ts` → limpo (lint do repo é `biome lint src`).

### Pendências / notas para o 00

- Quando o PR #415 mergear, as duas guardas (`isBlockedDesignLabPath` +
  `isBlockedToolsPath`) coexistem em `mountFrontend` — ambas fail-closed, sem conflito
  funcional; uma consolidação futura pode unificá-las num predicado de raízes
  estáticas sensíveis.
- O bloqueio do application gate por GHSA-7589-6FVF-X4PW (effect/prisma) já está
  resolvido em main pelo PR #469 (override effect 3.22.5, commit `4ecbfe0fb`) — esta
  branch já contém a correção; nenhum trabalho adicional necessário.

## Resolução (Agente 99 / 20 — 2026-11-20)

- Em `src/bootstrap/frontend.ts`, foi adicionada `isBlockedToolsPath(rawPath)` (mantendo `isBlockedDesignLabPath` exportada para compatibilidade) e conectada ao middleware de guarda no topo de `mountFrontend`.
- Qualquer alias/encoding não autorizado para `/tools` (`/public/tools/...`, `/@fs/.../public/tools/...`, `/tools%2F...`, `/%74ools/...`, `/foo/tools/...`, `/PUBLIC/tools/...`) recebe HTTP 404 antes dos estáticos/Vite, preservando o prefixo legítimo `/tools` (e `/tools/...`), que segue para o mount autenticado, bem como módulos de código-fonte legítimos sob `/src/` (`/src/features/intelligence/tools/**`, `/src/features/prospecting/components/prospecting-hub/tools/**`, `/src/lib/ai/tools/**`).
- `tests/unit/bootstrap/frontend.test.ts` foi estendido com suíte unitária de `isBlockedToolsPath` e testes `supertest` de `mountFrontend` validando 404 para aliases/encodings de `/tools` e 200 (pass-through) para `/tools/x` e módulos `/src/**`.
