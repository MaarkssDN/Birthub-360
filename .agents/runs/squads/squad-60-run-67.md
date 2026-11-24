# Run — Agente 67 (Teca) · Squad 60 · DEM-20261123-001

**Data:** 2026-11-24
**Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-60/wt-67`
**Branch:** `agente/67-templates-pii-s60`
**Base:** `integracao/onda-3-dem20261123` @ `5422d99c3e`
**Lease:** `.agents/runs/leases/squad-60-wt67.lease` (portas 22600–22699)
**node_modules:** symlink → `C:/Github/Birthub-360/node_modules`

## Missão

Prevenção de PII em templates/mensagens (handoff previsto para 07-Íris/LGPD):
inventário de composição/renderização de templates, pontos de vazamento, sanitização
no ownership, testes e handoffs.

## Inventário executado

- `src/features/voice-hub/**` — **sem templates de mensagem** (voz, SIP, transcrição,
  gravação, comandos, UI/studio). PII relevante é áudio/transcrição → donos 62/63.
- `src/features/notifications/**` — `templates/` (meu), `notification.service.ts` (60),
  `inbox/` (66), `realtime/` (68), `opt-out/` (69).
- Pipelines outbound: `src/features/cadence/infra/dispatchers/CadenceDispatchers.ts` (44),
  `src/features/integrations/whatsapp/whatsapp.service.ts` (56), `src/lib/integrations/email/**` (55),
  `src/features/automations/**` (76), `src/features/intelligence/tools/universalMessagingTool.ts` (72).

## Achados

1. `sanitizer.ts` existia mas **não era importado por nenhum código de produção** (só teste).
   Cobria CPF/cartão/JWT/clínico; **não cobria e-mail nem telefone**.
2. `CadenceDispatchers.ts` envia e persiste corpo renderizado com PII (`contact_name`, etc.)
   em `Activity.observations`, `TimelineEvent.description` e Bitrix — sem sanitização (dono 44).
3. `src/services/cadence/templateRenderer.service.ts` é **órfão na MATRIZ_PROPRIEDADE**
   (`src/services/**` sem dono) e interpola valores sem escape/sanitize.
4. `notification.service.ts:142` loga `input.title` em erro (PII potencial).
5. `whatsapp.service.ts` **não loga corpo de mensagem** — ponto positivo.

## Alterações (todas dentro do ownership `src/features/notifications/templates/**`)

- `src/features/notifications/templates/sanitizer.ts`:
  - `PiiCategory` estendido: `email`, `phone`.
  - `PHONE_REGEX`/`EMAIL_REGEX` adicionados aos padrões (fail-closed, com âncora de formato
    para não mascarar `2024-2025` nem número de pedido).
  - Novo `sanitizeOutboundMessageBody(renderedBody, {stripHtml})` — passada final sobre o
    corpo renderizado (pega PII literal no templateBody).
  - Novo `detectPiiCategories(text)` — auditoria que retorna só categorias (LGPD-safe).
  - `sanitizeFreeTextVariable` agora retorna `redactedCategories`.
  - `sanitizeWhatsAppTemplatePayload` retorna `redactedPiiCategories` (união variáveis+corpo).
- `tests/unit/features/notifications/templates/sanitizer.test.ts` — **novo**, 9 testes.

## Comandos executados e resultados

| Comando | Resultado |
|---|---|
| `npx vitest run tests/unit/features/notifications/templates/sanitizer.test.ts tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts` | ✅ 14/14 testes verdes (9 novos + 5 existentes do squad) |
| `npx tsc --noEmit` (worktree inteiro) | ✅ exit 0, sem erros |
| `npm run lint` | ⚠️ não executado (escopo; recomendo no gate de integração) |
| `npm run test:unit` global / `test:architecture` | ⚠️ não executado — gate de integração fica para o coordenador |

## Arquivos alterados/criados

- `src/features/notifications/templates/sanitizer.ts` (editado)
- `tests/unit/features/notifications/templates/sanitizer.test.ts` (criado)
- `.agents/handoffs/squad-60/67-para-00-coordenacao-templates-pii.md` (criado)
- `.agents/handoffs/squad-60/67-para-07-lgpd-templates-mensagens.md` (criado)
- `.agents/runs/leases/squad-60-wt67.lease` (criado)
- `.agents/runs/squads/squad-60-run-67.md` (este arquivo)

## Handoffs emitidos

- `67-para-00-coordenacao-templates-pii.md` → Astra: sanitizer pronto mas sem consumidores;
  `CadenceDispatchers` (44) persiste PII sem máscara; `templateRenderer.service.ts` órfão de
  matriz; `notification.service.ts` loga título.
- `67-para-07-lgpd-templates-mensagens.md` → Íris: inventário LGPD de templates/mensagens,
  pedido de validação de bases legais para persistência de corpo com PII e avaliação do
  `detectPiiCategories` como auditoria segura.

## Observações

- `.agents/runs/squads/squad-60-plano.md` **não existe** na base `integracao/onda-3-dem20261123`
  (só planos de squads 10/30/40/90) — registrado como ausência, não bloqueante.
- Ambiguidade CPF×telefone em 11 dígitos corridos documentada em teste (fail-closed sempre redige).
- Sem push, sem merge — branch commitada localmente para revisão do 09 (Silas).

## Status

**CONCLUÍDO no escopo** — aguardando integração/revisão.
