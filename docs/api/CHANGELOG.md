# Changelog da API — Birth Hub 360º

Contrato público da API HTTP (`/api/*`). Versão de contrato = `info.version` de
`docs/openapi.yaml`. Política completa em
[`API_VERSIONING_POLICY.md`](API_VERSIONING_POLICY.md).

Formato das entradas: `## [X.Y.Z] - AAAA-MM-DD` com seções `Added`, `Changed`,
`Deprecated`, `Removed`, `Fixed`.

---

## [1.0.0] - 2026-11-14 — Baseline v1

Primeira versão de contrato formalizada. Todo o tráfego REST sob `/api/*` (sem
prefixo de versão) passa a ser denominado **API v1**. Nenhuma rota foi alterada —
este baseline apenas nomeia o estado existente.

### Added

- Política de versionamento e depreciação documentada
  (`docs/api/API_VERSIONING_POLICY.md` + ADR-011).
- Processo de changelog de contrato (`docs/api/CHANGELOG.md`).

### Notes

- Endpoints já marcados `deprecated: true` no OpenAPI antes deste baseline
  (ex.: `/agent/model-benchmark`) permanecem deprecados; a janela de remoção conta
  a partir do anúncio formal em entrada `Deprecated` futura deste changelog.
- Headers `Deprecation`/`Sunset` ainda não são emitidos pelo servidor — pendência
  registrada em handoff ao Agente 00.
