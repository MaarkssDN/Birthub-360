# Handoff 22 → 05 — Rotas de prospecting sem validação Zod / mass assignment

De: 22 — Hugo (Camada HTTP, Middlewares e Rotas)
Para: 05 — Prospecção
Onda: 3 (dem-20261123)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: próxima onda de saneamento de rotas

## Problema

Em `src/features/prospecting/routes/prospecting.routes.ts` (montado em
`/api/prospecting` com `authenticateToken` + `requireTenant`, então exige sessão — o problema
é validação de payload, não auth):

1. **`POST /promote` (linha 236)** — o único handler que faz `promoteToCrm({ ...req.body,
   organizationId })` (linha ~263) **sem `validateRequest`/schema Zod**. Valida manualmente só
   `tradeName` e `source`. Campos arbitrários do body chegam ao service/use-case — mass
   assignment potencial dependendo de como `promoteToCrm` consome o objeto (cria
   Company/Contact/Lead). Recomendo definir um `promoteCandidateSchema` Zod no padrão das
   demais rotas do arquivo.

2. **`POST /enrich-cnpj` (linha ~209)** e **`POST /enrich` (linha ~585)** — sem
   `validateRequest`; validação manual parcial (`cnpj` string, `url` obrigatória +
   `isSafeUrl` SSRF check). O `/enrich` ao menos tem a guarda SSRF; padronizar com Zod
   (`z.string().url()` + refinements) fecha a classe de entrada não tipada.

3. Observação (não-bloqueante): `/enrich-cnpj` e `/enrich` ficam **fora** do `requireRole`
   aplicado às demais rotas — comentário indica decisão consciente (custo zero / sem billing),
   mas qualquer papel autenticado (incl. VISUALIZADOR) pode chamá-los. Se a intenção for
   "qualquer usuário do tenant", ok; se for "operacional", falta `requireRole`.

**Não-problema verificado:** os spreads `...req.body` em `/interpret` (linha 137) e `/reject`
(linha 283) ocorrem DEPOIS de `validateRequest(schema)`, que substitui `req.body` pelo parse
Zod — chaves desconhecidas são removidas. Sem mass assignment nesses dois pontos.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/routes/prospecting.routes.ts` (linhas ~98–115, ~209–234, ~236–275, ~585+)
- Services chamados: `promoteToCrm`, `fetchCnpjData`, `webScraperService` (somente leitura)

## Evidência

Leitura direta do arquivo no worktree `wt-22-controllers`, branch
`agente/22-controllers-onda3`. Relatório: `.agents/runs/22-onda3-controllers-auditoria.md`.

## Alteração necessária

Adicionar schemas Zod + `validateRequest` em `/promote`, `/enrich-cnpj`, `/enrich`
(mesmo padrão de `discoverCriteriaSchema`/`rejectCandidateSchema` já usados no arquivo).
Decidir explicitamente o `requireRole` das duas rotas de enriquecimento.

## Teste esperado

Estender `src/features/prospecting/routes/__tests__/prospecting.routes.test.ts`:
body com campos extras é stripped; payload inválido → 400 VALIDATION_ERROR; `/promote` sem
`tradeName`/`source` → 400.

## Contexto adicional

Rotas montadas com auth correta (`authenticateToken` + `requireTenant` no mount). O problema
é estritamente de validação de entrada — prioridade normal, não bloqueador de segurança.
