# Handoff 99 → Squad 70 (Orion/Gaia) — IA: system-prompt-injection e ReDoS

- **De:** Agente 99 — Vito · **Para:** Agente 70 — Orion (coordenador) / Agente 77 — Gaia (Guardrails)
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `027f42b18` · **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## `js/system-prompt-injection` — 8 alertas `error`

O system prompt é montado com dados influenciáveis por usuário/tenant (nome de lead, histórico, conteúdo de e-mail/chat). Isso é inerente a copilotos, mas cada ponto precisa de delimitação/escape e validação de saída:

| Local | Serviço |
|---|---|
| `src/features/automations/services/smart-lead-router.service.ts:75` | roteador de leads |
| `src/features/cadence/infra/services/cadence-ai.service.ts:56` | cadências comerciais |
| `src/features/roleplay/services/roleplay-ai.service.ts:101,184` | roleplay/simulador |
| `src/features/social-selling/server/socialSellingApproach.service.ts:56` | abordagem social selling |
| `src/lib/voice-runtime/providers/LLMGateway.ts:159` | gateway de voz (compartilhado c/ Squad 60) |
| `agente-codigo-local/server.ts:76,304` | **fora de produção** — ver handoff ao Agente 00 sobre destino deste diretório |

**Pedido a Gaia (77):** definir padrão de sanitização/delimitação de conteúdo não-confiável em prompts (ex.: fence + instrução de sistema imutável + validação de saída) e checklist de aceite; a Orion (70/71) aplica nos services acima.

## `js/polynomial-redos` (warning) em serviços de IA

`src/lib/ai/guardrails/pii.guard.ts` (2), `src/features/intelligence/tools/marketResearchTool.ts`, `src/features/job-roles/services/agentBuilder.service.ts`, `src/features/prospecting/outbound/server/validators.ts`, `knowledge/knowledge.routes.ts` — regex potencialmente catastróficas sobre input. **Classificação MÉDIO** (DoS por CPU em input grande). Pedido: limite de tamanho de input antes do match ou reescrita da regex.

## Relacionado

`src/features/intelligence/routes/intelligence.routes.ts` é hotspot arquitetural (1054/1100, vence 30/11) — não é achado AppSec; já coberto pelo plano de fatiamento da Onda 2.
