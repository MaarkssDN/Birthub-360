# Handoff 67 → 07 (Íris) — Inventário LGPD de templates/mensagens

**Origem:** Agente 67 — Teca | **Destino:** Agente 07 — Íris (Privacidade e Governança LGPD)
**Data:** 2026-11-24 | **Branch:** `agente/67-templates-pii-s60` | **Demanda:** DEM-20261123-001

## Escopo inventariado

- `src/features/voice-hub/**` — sem templates de mensagem (voz/ligação/UI); pontos de PII são
  transcrição/gravação (donos 62/63) — fora do meu escopo.
- `src/features/notifications/**` — `templates/sanitizer.ts` (meu), `notification.service.ts`
  (60), `inbox/**` (66), `realtime/**` (68), `opt-out/**` (69).
- Pipelines outbound que compõem mensagens: `src/features/cadence/**` (44),
  `src/features/integrations/whatsapp/**` (56), `src/lib/integrations/email/**` (55).

## Situação de sanitização encontrada

| Ponto | Estado |
|---|---|
| `notifications/templates/sanitizer.ts` | ✅ agora cobre CPF, cartão, JWT, clínico, **e-mail, telefone BR**; whitelist fail-closed; scan final do corpo renderizado |
| `cadence/infra/dispatchers/CadenceDispatchers.ts` | ❌ renderiza e envia/persiste corpo com PII sem sanitização (Activity, TimelineEvent, Bitrix) |
| `services/cadence/templateRenderer.service.ts` | ⚠️ órfão de ownership; interpola `{{var}}` sem escape/sanitize |
| `integrations/whatsapp/whatsapp.service.ts` | ✅ não loga corpo da mensagem; opt-out checado antes do envio |
| `notifications/notification.service.ts` | ⚠️ loga `title` no erro (pode conter PII se produtor interpolar) |

## Pedidos ao 07

1. **Validar bases legais** para persistência de corpo de mensagem com PII em
   `Activity.observations`, `TimelineEvent.description` e Bitrix (réplica operacional do
   conteúdo enviado ao titular — provável "execução de contrato", mas confirmar e registrar
   no inventário de dados).
2. **Avaliar** se `detectPiiCategories()` (novo, retorna só categorias) é adequada como
   mecanismo de auditoria LGPD-safe em logs de templates — proposta de uso pelos produtores.
3. **Revisar** se templates de cadence que interpolam `contact_name`/`company_name` precisam
   de aviso de consentimento adicional além do opt-out já implementado (DEBT-0010).

## Não feito (fora de ownership)

Nenhuma edição em `cadence/**`, `integrations/**`, `notification.service.ts` — handoffs
registrados para os donos via `67-para-00-coordenacao-templates-pii.md`.
