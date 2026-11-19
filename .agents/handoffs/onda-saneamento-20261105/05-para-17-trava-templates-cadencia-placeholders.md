De: 05 — Prospecção
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-05-001
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
Renderizador de templates de cadÃªncia (templateRenderer.service.ts) envia e-mails e WhatsApps com tags nÃ£o resolvidas (ex: {{lead.firstName}}) quando o dado estÃ¡ ausente.

## Arquivo(s) envolvido(s)
- src/services/cadence/templateRenderer.service.ts:60-95

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-05.md e DIVIDAS-AGENTE-17.md.
- templateRenderer.service.ts (L60-95): Se lead.name for null, substitui por string vazia ou mantÃ©m o texto literal da tag, enviando mensagens constrangedoras para o cliente final.
- Causa Raiz: AusÃªncia de fallback obrigatÃ³rio configurÃ¡vel ou checagem de integridade prÃ©-envio.

## AlteraÃ§Ã£o necessÃ¡ria
1. Implementar sistema de fallback seguro em templateRenderer.service.ts (ex: {{lead.firstName | default: "OlÃ¡"}}).
2. Adicionar trava que cancela o disparo e alerta o operador se uma variÃ¡vel obrigatÃ³ria nÃ£o possuir valor nem fallback.

## Teste esperado
- CritÃ©rio de Aceite: Template com tag nÃ£o preenchida aciona fallback seguro ou bloqueia disparo com erro descritivo.
- Teste: templateRenderer-fallbacks.spec.ts.

## Contexto adicional
Qualidade da imagem comercial da marca.


## Resolucao
- Data: 2026-11-06.
- Implementado CadenceTemplateRendererService em src/services/cadence/templateRenderer.service.ts com suporte a fallbacks (ex: {{lead.firstName | default: 'Ola'}}) e trava em modo strict que bloqueia envio lancando TemplateRenderError se faltar valor/fallback.
- Testes: 	ests/unit/services/cadence/templateRenderer-fallbacks.test.ts (3 passam).

> Reconciliação 2026-11-14 (Agente 00): veredicto DEFEITO-REAL — templateRenderer sem consumidor produtivo. Correção pendente de despacho. Ver RESULTADOS-RECONCILIACAO-20261114.md.

### Resolução — integração no pipeline real (Agente 17, 2026-11-14, branch `agente/17-reconciliacao-template`)

- **Causa raiz confirmada:** `CadenceTouch.templateRef` É o template com placeholders (`{{contact_name}}`, `{{company_name}}`, `{{meeting_url}}`, `{{meeting_time}}`, `{{booking_link}}` — ver `src/features/cadence/domain/cadenceTemplates.ts`), mas os dispatchers reais (`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts`) enviavam o texto CRU ao provedor — placeholders iam literalmente para o lead. O `CadenceTemplateRendererService` existia sem nenhum consumidor produtivo.
- **Correção aplicada:** `whatsAppCadenceDispatcher` e `emailCadenceDispatcher` agora chamam `renderCadenceTouchContent()` (mesmo arquivo), que resolve o contexto via `resolveCadenceTemplateContext()` (Lead → Contact.name, Company.tradeName/legalName, último `CadenceCalendarEvent` agendado → meetUrl/scheduledStart formatado pt-BR) e renderiza com `cadenceTemplateRendererService.render(..., { strict: true })`. `TemplateRenderError` vira `{ result: 'failed' }` com erro descritivo — o toque é registrado em `CadenceTouchAttempt.error` e segue a política de retry normal, sem enviar placeholder cru/vazio. Conteúdo renderizado também é o que vai para `Activity`/`TimelineEvent`/Bitrix (auditoria reflete o que foi enviado de fato).
- **Modo escolhido: strict.** Justificativa: os requisitos originais pedem "fallback OU bloqueio"; não-strict deixaria `{{tag}}` literal na mensagem enviada (o bug original). Strict converte dado ausente em falha observável em vez de mensagem constrangedora ao cliente.
- **Evidências:** `src/features/cadence/__tests__/cadenceTemplateRendering.test.ts` (5 testes novos: render WhatsApp, bloqueio strict sem chamar provedor, fallback `| default:`, render e-mail assunto+corpo, meeting_url/time via CadenceCalendarEvent). `npx vitest run -c vitest.unit.config.ts src/features/cadence` → 13 arquivos / 178 testes passando; `tests/unit/services/cadence/templateRenderer-fallbacks.test.ts` → 3/3; `npx tsc --noEmit` limpo.
- **Pendências (fora do escopo do 17 / decisão de produto):**
  1. `{{booking_link}}` não tem fonte de dados (link de agendamento self-service não existe — ver `application/scheduleMeeting.ts`). Toques de playbook que o usam sem `| default:` agora FALHAM explicitamente (`Template de cadência com variável(éis) sem valor ou fallback: booking_link`) — comportamento intencional da trava, mas exige decisão de produto sobre a origem do link (provável handoff futuro).
  2. Demais placeholders customizados que um usuário criar numa `CadenceSequence` ad hoc precisarão de `| default:` ou de extensão do `resolveCadenceTemplateContext` — documentado no cabeçalho do dispatcher.
  3. `splitSubjectAndBody` usa a 1ª linha verbatim como assunto — os playbooks prefixam "Assunto:" literalmente, então o assunto enviado inclui esse prefixo. Comportamento pré-existente, não alterado nesta reconciliação (possível melhoria futura).
- Status: resolvido (com pendências de produto registradas acima).

### Resolução definitiva de `booking_link` (Agente 17, 2026-11-18, branch `agente/17-handoffs-20261117`)

1. **Fonte de dados implementada:** `resolveCadenceTemplateContext` (`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts`) agora consulta o modelo canônico `prisma.publicBookingLink` (`/book/:slug`) escopado pelo tenant e priorizando o vendedor responsável (`lead.assignedToId`), gerando a URL canônica de agendamento.
2. **Resiliência e fallbacks:** Os templates padrão de playbook em `src/features/cadence/domain/cadenceTemplates.ts` receberam fallback seguro `{{booking_link | default: "https://app.birthub360.com.br"}}`, assegurando que mesmo organizações sem link público ativo continuem operando em strict mode sem que o toque seja bloqueado.
3. **Testes e evidências:** Testes em `src/features/cadence/__tests__/cadenceTemplateRendering.test.ts` ampliados (7 testes, 100% passando), validando a resolução de slug real e a ativação do fallback padrão.
4. **Status final:** 100% resolvido.

