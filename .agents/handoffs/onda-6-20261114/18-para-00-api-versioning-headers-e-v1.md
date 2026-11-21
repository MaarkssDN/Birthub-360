De: 18 — Contratos, API e Documentação Viva
Para: 00 — Coordenador
Onda: 6 (DEM-20261114-007 / MEL-43 — versionamento de API)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: próxima onda que tocar `src/bootstrap/**`

## Problema

A política de versionamento/depreciação da API foi definida e documentada
(`docs/api/API_VERSIONING_POLICY.md`, ADR-011, `docs/api/CHANGELOG.md`), mas duas
peças de implementação dependem de arquivos fora da propriedade do Agente 18:

1. **Headers de depreciação** (`Deprecation` RFC 8594, `Sunset`, `Link rel="deprecation"`)
   exigem um middleware montado no composition root (`server.ts` /
   `src/bootstrap/routes.ts`), que exige aprovação explícita do 00.
2. **Decisão sobre `/api/v1`**: a política adota "v1 implícita" (todo `/api/*` atual =
   v1) e reserva o prefixo de path para quando houver consumidor externo via API key
   ou primeira mudança quebradora coexistente. Ratificar ou vetar essa decisão —
   introduzir `/api/v1` agora seria mudança de contrato público que afeta frontend
   (02) e mobile (09).

## Arquivo(s) envolvido(s)

- `server.ts` (aprovação explícita do 00) ou `src/bootstrap/routes.ts` — ponto de
  montagem sugerido: logo após `mountFeatureRoutes(app)` ou antes dele, um
  `app.use('/api', apiDeprecationHeaders())` global.
- Novo arquivo sugerido: `src/shared/middlewares/apiDeprecationHeaders.ts`
  (propriedade do Agente 01 — `src/shared/**`) **ou** `src/bootstrap/` se o 00
  preferir manter no composition root. Não criei o arquivo porque `src/shared/**`
  pertence ao 01 e `src/bootstrap/**` não é do 18.

## Evidência

- Nenhuma ocorrência de `Deprecation`/`Sunset` em `src/` (grep, 2026-11-14).
- `src/features/api-keys/apiKey.middleware.ts` existe mas `apiKeyAuth` não é montado
  em nenhuma rota — não há consumidor externo versionado hoje.
- `docs/openapi.yaml` agora declara `components.headers.Deprecation/Sunset/LinkDeprecation`
  e `info.description` aponta a política — spec pronta para referenciar os headers.
- Operações já `deprecated: true` no OpenAPI (ex.: `/agent/model-benchmark`) ainda
  não têm data de `Sunset` definida — isso é decisão de produto por endpoint.

## Alteração necessária

**(a) Ratificar a política** — revisar `docs/ADR/ADR-011` e
`docs/api/API_VERSIONING_POLICY.md`; se aprovado, mudar status do ADR para "Aceito".

**(b) Montar o middleware de headers** — implementação mínima sugerida (≈40 linhas,
sem dependências):

```ts
// src/shared/middlewares/apiDeprecationHeaders.ts (ou src/bootstrap/)
// Emite headers RFC 8594 para rotas marcadas como deprecadas.
// Registro: Map<'METHOD /api/path', { deprecatedAt: number; sunset?: string; successor?: string }>
// alimentado a partir dos endpoints deprecated:true do OpenAPI (pode ser gerado
// por script ou mantido manualmente — decisão do implementador).
import type { NextFunction, Request, Response } from 'express';

interface DeprecationEntry { deprecatedAt: number; sunset?: string; successor?: string }
const DEPRECATED_ROUTES = new Map<string, DeprecationEntry>(); // ex.: 'GET /api/agent/model-benchmark'

export function apiDeprecationHeaders() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.method} ${req.baseUrl}${req.path}`.replace(/\/+$/, '') || '/';
    // simplificação: casa por prefixo de mount + path; ajuste fino fica com o implementador
    for (const [route, meta] of DEPRECATED_ROUTES) {
      if (key === route || key.startsWith(route)) {
        res.setHeader('Deprecation', `@${meta.deprecatedAt}`);
        if (meta.sunset) res.setHeader('Sunset', meta.sunset);
        if (meta.successor) res.setHeader('Link', `<${meta.successor}>; rel="deprecation"`);
        break;
      }
    }
    next();
  };
}
```

Montagem: `app.use('/api', apiDeprecationHeaders())` em `src/bootstrap/routes.ts`
antes de `mountFeatureRoutes` ou no topo de `server.ts` após `express.json`.

**(c) Decidir `/api/v1`** — recomendação do 18: **não introduzir agora**. Quando a
primeira API key for montada numa rota de negócio ou surgir a primeira mudança
quebradora, reabrir a decisão com ADR próprio.

## Teste esperado

- Chamada a endpoint deprecado responde com `Deprecation` e `Sunset` headers.
- Endpoint não deprecado não emite os headers.
- `npm run verify:openapi-drift` continua verde.

## Contexto adicional

- Itens `deprecated: true` já existentes no OpenAPI precisam de data de anúncio +
  `Sunset` por endpoint — sugiro tratar como follow-up do dono de cada domínio ao
  usar o endpoint, ou uma tarefa do 18 varrendo o spec.
- Se o 00 preferir adiar os headers, o anúncio oficial de depreciação já funciona
  via `deprecated: true` + `docs/api/CHANGELOG.md` (ver política §4).
