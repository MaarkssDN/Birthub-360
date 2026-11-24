# DESPACHO — FRENTE PÓS-ONDA 4 (dem-20261124-pos4)

**Coordenador:** Agente 00 — Astra/Devin · **Data:** 2026-11-24
**Baseline:** `9f80c07ed` (integracao/onda-4-dem20261123 — inclui toda a Onda 4 aprovada)
**Status plataforma:** NO-GO

## Agentes efetivamente despachados (8 subagentes background)

| # | Agente | Missão | Worktree / Branch | agent_id |
|---|--------|--------|-------------------|----------|
| 1 | 99 Vito | Triagem 11 exceções arquiteturais + 36 waivers Trivy (P0, vence 29–30/11) | wt-99-sec / agente/99-sec-triage-pos4 | ea7d1cb5 |
| 2 | 06 | IDOR `POST /api/bitrix/daily-plan/complete` + WhatsApp STOP-sem-Lead/purga/throttler | wt-06-idor-wa / agente/06-idor-whatsapp-pos4 | aa6176cb |
| 3 | 69 Eli | Opt-out por sujeito identificável sem lead + race check-then-send | wt-69-optout / agente/69-optout-pos4 | b396b77b |
| 4 | 85 Bóris | X-Idempotency-Key no outbox mobile (CREATE_LEAD, áudio, retries, tenant) | wt-85-mobile-idem / agente/85-mobile-idem-pos4 | 9fa40f70 |
| 5 | 22 Hugo | Contrato de dedup idempotência no backend (namespaced por org) | wt-22-api-idem / agente/22-api-idem-pos4 | ee0b3282 |
| 6 | 63 Lira | Contrato STT→comandos (transcrição normalizada, tenant/session) | wt-63-stt / agente/63-stt-pos4 | 70a8ccd6 |
| 7 | 64 Tito | Adapter STT→voice-command-router (preserva contratos Onda 4) | wt-64-stt-cmd / agente/64-stt-cmd-pos4 | 8e400fce |
| 8 | 17 | Janela comercial por timezone do lead/org (fim do SP fixo) + achados do handoff 44→17 | wt-17-cadence-tz / agente/17-cadence-tz-pos4 | fd4da449 |

Integração: `integracao/pos4-dem20261124` em `wt-00-integracao`.

## Decisões de ownership (registradas)

- **IDOR daily-plan:** proprietário real do endpoint é Agente 06 (`src/features/integrations/**` — AGENTS.md local confirma). `_userId` ignorado e `itemId` arbitrário para BITRIX_* confirmado por leitura do código antes do despacho.
- **Janela SP fixa:** vive em `src/features/cadence/**` → Agente 17 (não 44). Ordem do orquestrador previa handoff ao 17 — executado conforme.
- **WhatsApp STOP/throttler:** `whatsappMessage.service.ts` é do Agente 06 → ele executa; 69 garante contrato de opt-out por sujeito.
- **Idempotência:** 85 tem grant especial sobre `src/features/mobile/offlineSync*` + `src/mobile/offline/**`; 22 cuida do lado servidor (schema novo → handoff ao 01 se necessário).
- **STT/comandos:** 63 e 64 em arquivos disjuntos (63 = pipeline STT existente, 64 = commands/** + adapter novo).

## Convergência Ondas 3 e 4 (§7 da ordem)

- Onda 3: zero commits em todas as branches — nada a convergir. Escopos 20/21/34/42/45/96 NÃO reiniciados (verificação exigida pela ordem: sem defeitos comprovados novos, ficam em backlog).
- Onda 4: 100% integrada em `integracao/onda-4-dem20261123` @ `9f80c07ed`, gates verdes, 7/7 APROVADO Silas. Esta frente parte dessa ponta — sem duplicação.

## Pendências para próxima rodada

- Agente 09 (Silas) será despachado para auditoria dos commits congelados desta frente quando as branches tiverem entregas.
- Fixes de código dos hotspots arquiteturais aguardam o inventário do Agente 99 (dono por arquivo).
- Squad coordinators (40/50/60/80/90): funções de coordenação exercidas pelo Agente 00 nesta sessão (delegação registrada); squads 10/30/70 sem frentes P0 abertas nesta ordem.
