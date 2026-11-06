De: 05 â€” ProspecÃ§Ã£o
Para: 17 â€” CadÃªncia Multicanal e Ciclo de Receita
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

