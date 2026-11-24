# Handoff 40 → 25 — Rate limiting nas rotas auth/integrations do prospecting outbound

- De: 40 — Ravi (Coordenador Squad 40)
- Para: 25 — Tália (Rate Limiting e Proteção de Bordas — Squad 20)
- Onda/Demanda: DEM-20261123-001
- Data: 2026-11-24
- Status: aberto
- Prioridade: alto (rotas de auth/login sem rate limit = brute-force/credential stuffing)
- Origem: achado do Agente 99 (`.agents/handoffs/onda-3/99-para-43-prospecting-ssrf-e-log-injection.md`, item 5) + contexto do 22 (`22-para-43-tasks-idor-contexto.md`)
- Nota de ownership: `src/features/prospecting/outbound/server/routes/{auth,integrations,system,job-roles}.routes.ts` pertence ao 43 — Amon (regularizado por parecer `09-dem-20261123-slot43-2fc7570d0`). O 25 define a política/mechanismo; a aplicação nos handlers é do 43 ou de quem o Astra designar.

## Problema

CodeQL `js/missing-rate-limiting` (warning) sinalizou ~5 rotas no módulo outbound do
prospecting sem rate limit:

- `outbound/server/routes/auth.routes.ts` (login/registro — mais sensível)
- `outbound/server/routes.ts`
- `outbound/server/routes/integrations.routes.ts` (~L353)
- `outbound/server/routes/job-roles.routes.ts`

O módulo está atualmente atrás de `unavailableLegacyModule('outbound')`
(`src/bootstrap/routes.ts:212`), o que mitiga a exposição — mas a decisão de reabertura
está pendente e a remediação deve precedê-la.

## Pedido

1. Definir política de rate limit aplicável a rotas de auth (ex.: janela, quota por
   tenant + por IP, lockout progressivo) coerente com `src/api/middlewares/rate-limit.ts`
   (ownership do 25) ou equivalente do outbound.
2. Entregar ao squad-40 o contrato/mechanismo para aplicação pelo 43 nos handlers
   listados, com testes de throttling.
3. Coordenar com 20 — Ciro caso o middleware canônico precise de mount no router do
   outbound (fora do ownership do squad-40).

## Evidência

- `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`
- `.agents/handoffs/onda-3/99-para-43-prospecting-ssrf-e-log-injection.md`
