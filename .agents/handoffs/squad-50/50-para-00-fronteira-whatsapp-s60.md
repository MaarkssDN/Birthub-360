# HANDOFF 50 → 00 (Astra): Texto de fronteira WhatsApp — 56 Luna × Squad 60

- **De:** Agente 50 — Atlas · **Para:** Agente 00 — Astra (cópia: 60 — Aurora)
- **Data:** 2026-11-24 · **Base:** `93e82c220` · **Branch:** `coord/squad-50`
- **Tipo:** proposta de cláusula de ownership para ratificação e publicação na MATRIZ

## Texto proposto para a MATRIZ_PROPRIEDADE.md

> **`56 — Luna` (Squad 50):** dona do **transporte e sessão** WhatsApp —
> `src/lib/integrations/whatsapp/**` e a camada de sessão Baileys/Meta Cloud API em
> `src/features/integrations/whatsapp/` (`whatsapp.service.ts` ciclo de vida/sessão,
> `useRedisAuthState.ts`, `conectorManager.ts`, `baileys.client.ts`, anti-ban, reconexão,
> locks). Contrato de saída: eventos/mensagens normalizados publicados para o inbox;
> Luna NÃO implementa roteamento, UI de conversa, templates de negócio nem regras de opt-out.
>
> **Squad 60 (66 Kiko / 67 Teca / 69 Eli / 60 Aurora):** dona da **experiência e conformidade
> de canal** — `src/features/notifications/inbox/**`, `templates/**`, `opt-out/**` e consumo
> das mensagens via contrato com Luna. Squad 60 não edita sessão/transporte Baileys;
> pedidos de mudança de transporte viram handoff 66/67/69 → 56.
>
> **Ponto em aberto para o Astra:** persistência `WhatsAppMessage` e
> `whatsappMessage.service.ts` — sugiro Luna (transporte gravaEnvelope bruto) com schema
> pertencente ao Squad 10; Kiko consome via repositório. Ratificar.

## Evidência de suporte

- Sessão/reconexão/anti-ban: `src/lib/integrations/whatsapp/baileys.client.ts:12`
  (`MAX_ANTI_BAN_DELAY_MS=8000`), `src/features/integrations/whatsapp/whatsapp.service.ts:36-51,67,267-273`.
- Testes existentes da camada: `tests/unit/lib/integrations/whatsappAntiBan.test.ts` (3/3 verdes).
- Risco estrutural já registrado: Baileys = protocolo não-oficial (skill `integration-audit`).

## Pedido

Ratificar o texto (ou emendar) e publicar na matriz. Após ratificação, Squad 50 despacha 56
com escopo `src/lib/integrations/whatsapp/**` + sessão Baileys, sem tocar inbox/templates/opt-out.
