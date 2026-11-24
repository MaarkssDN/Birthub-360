# HANDOFF 50 → 00 (Astra): Overlap WhatsApp — Agente 56 (Luna) × Squad 60

- **De:** Agente 50 — Atlas · **Para:** Agente 00 — Astra (cópia: coordenação Squad 60 — Aurora)
- **Data:** 2026-11-24 · **Base:** `93e82c220` · **Branch:** `coord/squad-50`
- **Tipo:** deliberação de fronteira de ownership — **bloqueia despacho de 56**

## Contexto

O WhatsApp aparece nos dois squads com responsabilidades adjacentes:

| Camada | Squad 50 — 56 Luna (`src/lib/integrations/whatsapp/**`) | Squad 60 |
|---|---|---|
| Transporte/sessão | Baileys client, sessões por tenant, reconexão, anti-ban (`src/lib/integrations/whatsapp/baileys.client.ts`; `src/features/integrations/whatsapp/whatsapp.service.ts`) | — |
| Roteamento inbox | — | 66 Kiko (`src/features/notifications/inbox/**`) |
| Templates/sanitização PII | — | 67 Teca (`src/features/notifications/templates/**`) |
| Opt-out/STOP/compliance | — | 69 Eli (`src/features/notifications/opt-out/**`) |
| Voz/mensageria omnichannel | — | 60 Aurora coordena jornadas de voz |

Risco real de colisão: `src/features/integrations/whatsapp/` contém `whatsapp.service.ts`,
`whatsappMessage.service.ts` (persistência `WhatsAppMessage`) — fronteira entre "transporte"
(Luna) e "mensagem/domínio" (Kiko/Teca/Eli) não está escrita em lugar nenhum.

## Proposta do Squad 50

- **56 — Luna** fica com: `src/lib/integrations/whatsapp/**` + transporte/sessão em
  `src/features/integrations/whatsapp/` (`whatsapp.service.ts` ciclo de vida da sessão Baileys,
  reconexão, anti-ban, locks).
- **Squad 60** fica com: roteamento de mensagens recebidas para inbox (66), templates e
  sanitização (67), opt-out (69) — consumindo a sessão via contrato, sem editar o transporte.
- Handoff contratual 56→66/67/69 documentado em `.agents/handoffs/squad-50/` quando 56 for
  despachado.

## Pedido

1. Ratificar a fronteira acima ou indicar alternativa.
2. Confirmar se `WhatsAppMessage` (persistência) pertence a Luna (transporte) ou a Kiko
   (domínio de mensagem).
3. Após deliberação, Squad 50 despacha 56 com escopo `src/lib/integrations/whatsapp/**` +
   sessão Baileys; Squad 60 preserva `src/features/notifications/**`.

## Evidência

- `src/lib/integrations/whatsapp/baileys.client.ts` (anti-ban `MAX_ANTI_BAN_DELAY_MS=8000`, L12).
- `src/features/integrations/whatsapp/whatsapp.service.ts` (sessões `Map` L67, reconnect 5×/60s
  L36-38, lock 5×/30s L49-51).
- `.agents/skills/integration-audit/SKILL.md` §WhatsApp (risco estrutural Baileys).
