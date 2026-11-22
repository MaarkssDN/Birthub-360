- De: 17 (Cadência Multicanal e Ciclo de Receita)
- Para: 21 (Privacidade e LGPD)
- Onda: 15
- Status: resolvido
- Prioridade: bloqueador

## Problema
Disparos automatizados de cadência multicanal (WhatsApp e E-mail) não podem ocorrer para contatos que solicitaram descadastramento (opt-out), revogaram consentimento ou exerceram direito de exclusão (Art. 18 LGPD). O envio indevido viola diretamente o bloqueador prioritário B-13 e a regra global §27.

## Arquivo(s) envolvido(s)
- `src/features/cadence/**`
- `src/features/lgpd/**`
- `src/shared/services/dataSubjectErasure.service.ts`

## Alteração necessária
O Agente 21 deve:
1. Validar e certificar o interceptor de checagem pré-envio `checkOptOutStatus(contactId, channel)`.
2. Assegurar que comandos de resposta como "SAIR", "STOP", "CANCELAR" ou links de unsubscribe atualizem instantaneamente o registro de consentimento no banco de dados.
3. Garantir que a supressão opere por canal e por tenant sem vazamento entre organizações.

## Teste esperado
- Teste unitário e de integração: tentativa de envio para contato em lista de opt-out deve ser rejeitada com código específico (`OPT_OUT_SUPPRESSED`).

## Resolução (Agente 21)
1. Serviço interceptor `OptOutCheckService` e método `checkOptOutStatus` implementados em `src/features/lgpd/services/optOutCheck.service.ts`.
2. Bloqueio automático de disparos com código de erro canônico `OPT_OUT_SUPPRESSED` e auditoria em log.
3. Handlers para palavras-chave de descadastro ("SAIR", "STOP", "CANCELAR") conectados aos webhooks e à API de opt-out em `lgpd.routes.ts`.
4. Suíte de testes `src/features/lgpd/services/__tests__/optOutCheck.service.test.ts` (18 testes) 100% aprovada.
