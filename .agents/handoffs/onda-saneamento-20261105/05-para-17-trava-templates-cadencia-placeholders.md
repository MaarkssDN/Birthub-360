De: 05 — Prospecção
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-05-001
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Renderizador de templates de cadência (templateRenderer.service.ts) envia e-mails e WhatsApps com tags não resolvidas (ex: {{lead.firstName}}) quando o dado está ausente.

## Arquivo(s) envolvido(s)
- src/services/cadence/templateRenderer.service.ts:60-95

## Evidência
Base de auditoria: DIVIDAS-AGENTE-05.md e DIVIDAS-AGENTE-17.md.
- templateRenderer.service.ts (L60-95): Se lead.name for null, substitui por string vazia ou mantém o texto literal da tag, enviando mensagens constrangedoras para o cliente final.
- Causa Raiz: Ausência de fallback obrigatório configurável ou checagem de integridade pré-envio.

## Alteração necessária
1. Implementar sistema de fallback seguro em templateRenderer.service.ts (ex: {{lead.firstName | default: "Olá"}}).
2. Adicionar trava que cancela o disparo e alerta o operador se uma variável obrigatória não possuir valor nem fallback.

## Teste esperado
- Critério de Aceite: Template com tag não preenchida aciona fallback seguro ou bloqueia disparo com erro descritivo.
- Teste: templateRenderer-fallbacks.spec.ts.

## Contexto adicional
Qualidade da imagem comercial da marca.
