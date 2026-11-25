# Handoff 67 → 00 (Astra) — Templates/PII Squad 60

**Origem:** Agente 67 — Teca | **Destino:** Agente 00 — Astra (coordenação)
**Data:** 2026-11-24 | **Branch:** `agente/67-templates-pii-s60` | **Demanda:** DEM-20261123-001

## Entregue (ownership `src/features/notifications/templates/**`)

`sanitizer.ts` reforçado, fail-closed:
- Novas categorias de PII: **e-mail** e **telefone BR** (formatos `(11) 99999-8888`, `11 3333-4444`, `+55 11 99999-8888`, `99999-8888`, `11999998888`), além de CPF, cartão, JWT/Bearer e dados clínicos já existentes.
- Novo `sanitizeOutboundMessageBody()` — passada final sobre o corpo já renderizado (pega PII literal no `templateBody`, não só em variáveis), com opção `stripHtml`.
- Novo `detectPiiCategories()` — auditoria que retorna **somente categorias**, nunca os valores (seguro para log).
- `sanitizeWhatsAppTemplatePayload()` agora devolve `redactedPiiCategories` (união variáveis+corpo) — retrocompatível.
- Testes: `tests/unit/features/notifications/templates/sanitizer.test.ts` (9 testes, verdes). `onda3VoiceSquad60.test.ts` existente segue verde. `npx tsc --noEmit` limpo no worktree.

## Achados fora do ownership — precisam de dono

1. **`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts` (44 — Lola)**
   Renderiza `templateRef` e envia/persiste o corpo integral com PII do contato em
   `Activity.observations`, `TimelineEvent.description` e `syncActivityToBitrix` — sem sanitização.
   A saudação com `contact_name` é legítima, mas qualquer PII extra no template (CPF, telefone,
   e-mail digitados no texto) vai em claro para CRM, timeline e Bitrix. Recomendo aplicar
   `sanitizeOutboundMessageBody()` no `messageBody` antes do envio e logar só
   `redactedPiiCategories`. → handoff ao Squad 40 / 44.

2. **`src/services/cadence/templateRenderer.service.ts` — ÓRFÃO DE MATRIZ**
   `src/services/**` não consta na `.agents/MATRIZ_PROPRIEDADE.md`. O renderizador interpola
   `{{var}}` e devolve `String(value)` cru — sem escape nem sanitização. Sugiro formalizar como
   `src/features/cadence/**` (44) ou registrar ownership explícito.

3. **Sanitizer estava morto** — nenhum código de produção importava
   `notifications/templates/sanitizer.ts` antes desta entrega. A adoção efetiva nos pipelines
   (cadência 44, WhatsApp 56, e-mail 55) depende de handoffs aos donos — ver
   `67-para-07-lgpd-templates-mensagens.md`.

4. **`notification.service.ts:142` (60 — Aurora)** loga `input.title` em erro de criação;
   título pode conter PII se o produtor interpolar nome. Sugestão: logar só `kind`/`entity`.

## Nota de design

11 dígitos corridos (`11999998888`) é ambíguo CPF×telefone — o fail-closed sempre redige;
apenas o rótulo da categoria pode variar (documentado em teste). Preferi manter CPF primeiro
(comportamento pré-existente) para não alterar precedência já testada.

## Pendências para o coordenador

- Merge da branch `agente/67-templates-pii-s60` após revisão do 09 (Silas).
- Encaminhar itens 1–3 acima aos squads 40/50–59 conforme roteamento.
- Gate de integração completo (test:unit global) não executado — apenas escopo tocado + tsc.
