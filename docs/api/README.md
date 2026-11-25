# API — índice da documentação de contratos

Este diretório concentra a política de versionamento, depreciação e changelog da API
HTTP do Birth Hub 360º. A especificação executável continua sendo
[`../openapi.yaml`](../openapi.yaml), servida em `/api-docs` (fora de produção por padrão,
ou com `EXPOSE_API_DOCS=true`).

## Documentos

- [`API_VERSIONING_POLICY.md`](API_VERSIONING_POLICY.md) — política de versão e
  depreciação de API (DEM-20261114-007 / MEL-43, Onda 6). Define o que é "v1",
  como mudanças são classificadas (semver de contrato), os headers de depreciação
  (`Deprecation`, `Sunset`) e o processo de transição.
- [`CHANGELOG.md`](CHANGELOG.md) — changelog do contrato público da API. Toda mudança
  de contrato (aditiva ou quebradora) deve registrar entrada aqui **e** em
  `docs/openapi.yaml` no mesmo commit.

## Estado atual (baseline v1, 2026-11-14)

- Todas as rotas de negócio vivem sob `/api/*` **sem prefixo de versão** — este é o
  contrato "v1 implícito". Não existe `/api/v1` hoje.
- Autenticação: cookie de sessão do Better Auth (`better-auth.session_token`) na
  maioria das rotas; API keys (`bhk_…`, middleware `apiKeyAuth`) existem em
  `src/features/api-keys/` mas **ainda não estão montadas** em nenhuma rota de
  negócio — quando forem, passam a ser o primeiro consumidor "externo" do contrato.
- Verificação de deriva documento↔rotas: `npm run verify:openapi-drift`
  (`scripts/verify-openapi-drift.ts`), que falha o build quando uma rota real não está
  documentada ou um path documentado não existe.

## Regras rápidas para quem altera contrato

1. Mudança aditiva (novo endpoint, novo campo opcional) → atualiza `openapi.yaml` +
   entrada `MINOR` no changelog. Não requer janela de depreciação.
2. Mudança quebradora (remover/renomear rota ou campo, tornar campo opcional
   obrigatório, mudar tipo) → **é decisão do Agente 00/usuário**: exige ADR, entrada
   `MAJOR` no changelog, headers `Deprecation`/`Sunset` na rota antiga e janela mínima
   de aviso de 90 dias antes da remoção.
3. Nunca documentar dado pessoal real em exemplo de payload.
