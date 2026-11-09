---
name: bitrix24-payload-validator
description: Validação e governança da integração com Bitrix24 (REST API e Webhooks). Cobre mapeamento de campos customizados (UF_CRM_*), tratamento de paginação batch (50 itens por chamada), rate limits (2 req/s) e prevenção de falha silenciosa.
---

# Bitrix24 Payload Validator — Birth Hub 360

## Objetivo
Prevenir os bloqueadores prioritários **B-11** ("Sincronizações Bitrix que falham silenciosamente") e **B-12** ("Extrações Bitrix incompletas tratadas como definitivas").

## Regras de Integração

### 1. Limites de Taxa e Paginação em Lote
- O Bitrix24 impõe limite estrito de requisições por segundo (geralmente 2 req/s por webhook de entrada).
- **Batching:** Utilize chamadas `batch` (`crm.lead.list`, `crm.deal.list`, `crm.contact.list`) para agrupar até 50 comandos em uma única requisição HTTP.
- **Paginação:** Toda listagem retorna no máximo 50 itens por página com o cursor `start`. Nunca considere a extração completa sem iterar até que `next` deixe de existir no payload de resposta.

### 2. Mapeamento de Campos Customizados (`UF_CRM_*`)
- Campos de usuário variam entre instâncias de clientes do Bitrix24.
- Sempre faça a consulta preliminar via `crm.lead.fields` ou mantenha uma tabela de mapeamento parametrizável por organização no banco (`BitrixFieldMapping`).
- Não assuma que campos como `UF_CRM_CPF` ou `UF_CRM_ORIGEM` possuem o mesmo identificador em contas diferentes.

### 3. Webhooks de Entrada
- Todo webhook recebido deve ter sua assinatura/token de segurança validado antes do processamento.
- O webhook deve apenas enfileirar o evento no Redis via BullMQ e responder HTTP 200 imediatamente (<200ms) para evitar retentativas agressivas por parte dos servidores do Bitrix.

## Checklist de Confiabilidade
- [ ] O código trata respostas de erro estruturadas do Bitrix (`error: "QUERY_LIMIT_EXCEEDED"`, `error_description`) aplicando backoff adequado?
- [ ] Logs registram o ID externo do Bitrix vinculado ao ID interno da entidade no Birth Hub?
- [ ] Erros de sincronização são salvos em log de integração com status observável para o usuário do CRM?
