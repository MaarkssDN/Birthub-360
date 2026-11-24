# Handoff 99 → Squad 60 (Aurora/Lena) — Voz: log-injection e hash de API keys

- **De:** Agente 99 — Vito · **Para:** Agente 60 — Aurora (coordenador) / Agente 65 — Lena
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `027f42b18` · **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## Achados CodeQL no domínio de voz

| Regra | Local | Qtde | Classificação |
|---|---|---|---|
| `js/log-injection` | `src/features/ai-voice/server/bimodalLiveVoice.service.ts:84,205`; `src/lib/voice-runtime/Observability.ts:27` | 3 | **MÉDIO** — logs dependem de valores de usuário/áudio transcrito; sanitizar antes de logar. |
| `js/user-controlled-bypass` | `src/lib/voice-hub/middlewares/index.ts:132` | 1 | **BAIXO (FP provável)** — caminho legítimo de API key Bearer (`authenticateApiKey`, leitura live no DB, revogação imediata). CodeQL marca a condição user-controlled; comportamento está correto. Avaliar supressão justificada se o gate bloquear PRs. |
| `js/insufficient-password-hash` (warning) | `src/lib/voice-hub/services/apiKeyService.ts`; `src/features/api-keys/apiKey.service.ts` | 2 | **MÉDIO** — verificar se API keys são hashed (ex.: SHA-256/bcrypt) e não armazenadas em claro; `apiKeyService` é o caminho de auth alternativo do voice-hub. Se for só hash de chave de alta entropia (não senha), documentar e suprimir. |
| `js/system-prompt-injection` | `src/lib/voice-runtime/providers/LLMGateway.ts:159` | 1 | **MÉDIO** — system prompt montado com dados de usuário; reforçar guardrails (Squad 70/Gaia). |
| `js/polynomial-redos` | `src/lib/voice-runtime/intelligence/IntentEngine.ts` | 1 | **BAIXO-MÉDIO** — regex em intent parsing; limitar tamanho de input. |

## Nota
`src/features/voice-hub/components/design-system/index.tsx` e `src/lib/voice-hub/services/workflowRuntimeService.ts` são hotspots arquiteturais vencendo 30/11 — tratado no relatório central (não é achado AppSec).
