# Run Report — Agente 15 — TAREFA-SANEAMENTO-034 / BT360-DT-0074

- **Data:** 2026-11-12
- **Branch:** `agente/15-w3-cors`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-15-configuracao-permissiva-de-cors-em-server-ts-para-clientes-externos.md`
- **Status:** EM_ANDAMENTO — aguardando revisão do Agente 24

## Sumário

CORS fora de produção não é mais "qualquer origem": passa a aceitar apenas loopback,
faixas privadas (LAN) e entradas explícitas de `ALLOWED_ORIGINS`. Produção já era
restritiva (allowlist + fail-fast) e não foi alterada. `server.ts` não precisou de
edição — a lógica vive em `src/bootstrap/security.ts`, o que também dispensa a
aprovação explícita do 00 para `server.ts`.

## Mudanças

- `src/bootstrap/security.ts` — helper `isLocalDevOrigin()` + ramo não-produção do
  callback CORS restrito.
- `tests/unit/bootstrap/security.test.ts` — caso antigo substituído por cobertura do
  novo contrato (sucesso: localhost/LAN/Capacitor/ALLOWED_ORIGINS; falha: externa).

## Gates

- `vitest run tests/unit/bootstrap/security.test.ts` → 12/12 ✅
- `npx tsc --noEmit` → ✅
- `npm run lint` → exit 0 (warnings pré-existentes)

## Riscos

- Hostname customizado de dev (não-IP, não-localhost) exige entrada em `ALLOWED_ORIGINS`.
