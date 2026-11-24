# Run — ONDA3-21-API-CONTRACTS (Agente 21 — Zara)

- Runtime: Devin (subagente), worktree `wt-21-api-contracts`, branch `agente/21-api-contracts-onda3`
- Base: `32d07c375` · SHA final: `ae5988377` (+ commit do handoff/run)
- Escopo exercido: `docs/openapi.yaml` (contrato real servido em `/api-docs`,
  `src/bootstrap/apiDocs.ts:20`), `postman/specs/Birth Hub 360º API/openapi.yaml`
  (spec efetivamente usada pelo workspace Postman — `.postman/resources.yaml` e
  `.postman/workflows.yaml`), `.agents/handoffs/onda-3/`.
- `src/api/schemas/**` não existe no repositório: não há camada central de DTOs
  Zod; a validação é por feature (`src/lib/zod.ts`, `validateRequest`, schemas
  locais). Nada a criar sem demanda concreta (P2).

## Diagnóstico por item da missão

1. **Divergências contrato × comportamento** — CORRIGIDO (parcial) + APROVADO no restante.
   - Gate estrutural `npm run verify:openapi-drift`: ✅ 0 deriva (81 prefixos,
     510 paths, passe 2 com 79 routers resolvidos).
   - Integridade do YAML: 110 `$ref` internos, 0 quebrados; 0 `$ref` com
     siblings; 0 paths duplicados; `yaml.parse` OK.
   - **Bug real corrigido**: 13 operações públicas/webhook herdavam
     `security: [sessionCookie]` global embora os mounts não usem
     `authenticateToken` (`src/bootstrap/webhooks.ts`, `src/bootstrap/routes.ts`).
     Adicionado `security: []` + seção "Exceções de autenticação" em
     `info.description`. Lista verificada estaticamente mount a mount.
   - **Spec Postman obsoleta corrigida**: `postman/specs/.../openapi.yaml` era
     subconjunto estrito de `docs/openapi.yaml` (2.280 linhas de defasagem, zero
     conteúdo divergente). Ressincronizada por cópia — o workspace Postman
     (`.postman/workflows.yaml`) consome esse arquivo.
   - Amostras profundas OK: `POST /leads` (`leadSchema` ↔ `LeadInput`),
     `/settings/pillars/{pillar}` (GET/PUT), `/bug-reports` (POST/PATCH).

2. **Validações Zod** — PREEXISTENTE / depende de outros agentes.
   - `validateRequest` (`src/shared/middlewares/validateRequest.ts`) é o padrão;
     ~40 arquivos `*.routes.ts` não usam Zod nem `safeParse` — a maioria GET ou
     webhook; validação manual existe em controllers (ex.: `BugReportController`
     checa tipos e o UseCase sanitiza/trunca). Correção de schemas pertence aos
     squads das features; não editei arquivos de outros donos.
   - `.passthrough()` único: `src/lib/voice-hub/features/prospecting/validators/
     birthhub360.schema.ts:47` — deliberado e documentado (callback Bland AI).
   - `z.unknown()`/`z.record(z.unknown())` amplos em `job-roles`, `intelligence`,
     `crm360` — contextos livres intencionais; registrado como observação.

3. **Params/path/query/body incompatíveis** — APROVADO no escopo auditado.
   - Gate passe 2 confirma path+método de todos os endpoints resolvidos.
   - Nomes de parâmetros `{x}` × `:x` são posicionais (não afetam contrato);
     divergências de nome detectadas por matching ingênuo eram falsos positivos
     de sufixo — não reportadas como defeito.

4. **Tipagem dos contratos** — APROVADO com observação.
   - `LeadInput`/`ActivityInput` etc. refletem fielmente os Zod de `src/lib/zod.ts`.
   - Observação: não existe `z.infer` compartilhado entre schema Zod e
     `components/schemas` do OpenAPI — o YAML é mantido manualmente; risco de
     deriva fina mitigado pelo gate estrutural + testes de contrato existentes.

5. **Testes de conformidade** — DEPENDENTE DE OUTRO AGENTE (handoff aberto).
   - Repositório já tem: `verify:openapi-drift` (gate), testes em
     `tests/unit/contracts/` e `tests/unit/shared/*openapi*` (10 arquivos,
     44 testes — todos verdes após a mudança).
   - `test:api-schema` (Schemathesis) existe mas exige app no ar; inclusão em CI
     já é handoff aberto `backlog-5/18-para-08-schemathesis-ci.md`.
   - Handoff novo `onda-3/21-para-08-teste-conformidade-security-openapi.md`
     propõe teste que trava `security: []` nos mounts públicos/webhook.

6. **Correções** — CORRIGIDO.
   - `docs/openapi.yaml`: `security: []` em 13 operações + nota de exceções de
     autenticação + esclarecimento de truncamento/coerção em `/bug-reports`.
   - `postman/specs/Birth Hub 360º API/openapi.yaml`: ressincronizado.
   - Regra respeitada: nenhuma validação foi enfraquecida; nenhum schema foi
     alterado para mascarar comportamento do backend.

## Comandos executados

- `npm run verify:openapi-drift` → ✅ 0 deriva (antes e depois das edições)
- `npx vitest run tests/unit/contracts tests/unit/shared/openapiRouteInventory.test.ts tests/unit/shared/verifyOpenapiDriftSubRoutes.test.ts tests/unit/shared/contracts` → 10 arquivos, 44/44 testes verdes
- Script Node ad-hoc: integridade de `$ref`, paths duplicados, `security` por operação

## Pendências / handoffs

- `.agents/handoffs/onda-3/21-para-08-teste-conformidade-security-openapi.md` (aberto)
- Observação de governança: `docs/AGENTS.md` atribui `docs/` ao Agente 08, mas a
  missão/MATRIZ atribui `openapi.yaml` ao 21 — o arquivo editado é o contrato
  servido pela API (`src/bootstrap/apiDocs.ts`); se o 00 entender que a posse de
  `docs/openapi.yaml` é do 08, este trabalho deve ser reavaliado.
