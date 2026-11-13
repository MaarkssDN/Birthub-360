# Revisão Independente — Agente 24 — Ondas F1/F3/F4

**Veredito: APROVADO COM RESSALVAS**
Data: 2026-11-11 · Escopo: alterações não commitadas das ondas F1 (settings persistentes), F3 (auditoria orquestração — sem código), F4 (ForecastHub mock removal + inventário).

## Verificações aprovadas

- **Tenancy/RLS**: mount correto em `src/bootstrap/routes.ts:228` — `authenticateToken` + `requireTenant`, antes do catch-all `/api`. `organizationId` do JWT; repositório filtra por org, `isGlobal=false`. Sem injeção de tenant.
- **RBAC**: PUT exige `requireRole(['ADMIN'])`; GET livre para autenticado do tenant (sem PII).
- **Validação**: `validatePillarPatch` rejeita chaves desconhecidas/tipos/faixas (400); slug inválido → 404. Envelope `{success,data}` consistente com `apiFetch`.
- **Honestidade de dados**: `ForecastHub.tsx` substituiu cockpit mock por `PredictabilityEmptyState`; placeholder marca abas não persistidas como "Pré-visualização" com aviso explícito.
- **Escopo**: sem schema/migration, sem secrets, `routes.ts` recebeu apenas import + 1 linha de mount.
- **Testes**: 8 casos de service + 3 casos jsdom; cobertura adequada.
- **LGPD**: nenhum dado pessoal novo; `piiMasking` é preferência booleana.

## Achados por severidade

### Alta
1. **Settings são write-only — nenhum consumidor aplica os valores.** Os textos da UI afirmam enforcement inexistente ("Deduplicação Automática por CNPJ", "Bloqueia envio da reunião para Closer", "Sanitização e Mascaramento de PII (LGPD)", "Trava de Horário Comercial"). Persistir ≠ aplicar; o aceite F1 pedia "refletir na feature consumidora". Recomendação: handoffs de consumo por domínio (01/02/04/06/12) ou copy honesta antes do release.

### Média
2. **`MATRIZ-FUNCIONAL-MODULOS.md` desatualizado** — §3.2/§6 ainda afirmam "zero persistência". Atualizar status M09.

### Baixa
3. Race read-modify-write em `update()` (PUTs concorrentes podem perder campos) — probabilidade baixa; registrar limitação.
4. Spec `ai.temperature` permite 0–2, slider UI limita a 1 — divergência inofensiva.
5. `parseStoredState` silencioso em row corrompida — `console.warn` ajudaria.
6. `version` incrementa mesmo sem mudança efetiva — cosmético.
7. E2E "alterar → reload → persistido" pendente (Agente 08).

## Recomendações ao Coordenador
1. Abrir handoffs de consumo dos settings (achado 1).
2. Atualizar `MATRIZ-FUNCIONAL-MODULOS.md` §3.2/§6.
3. Manter handoff F1 como **em-andamento** até e2e do Agente 08 e decisão sobre consumidores.
4. Gate de release: F1 entrega "persistência de preferências", não "enforcement" — ou copy honesta ou consumidores antes de RELEASE_APPROVED.
