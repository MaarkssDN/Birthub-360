De: Agente 00 — Coordenador
Para: Agente 02 (Produto e UX)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-015)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Leitura de notificação broadcast em entidade compartilhada silencia unread para colegas de equipe**

- **Dívida técnica:** BT360-DT-0014
- **Esforço estimado:** Médio
- **Status atual da dívida:** IMPLEMENTADO / NÃO VALIDADO

**Causa raiz:** Simplificação de modelagem inicial onde notificações organizacionais não foram desacopladas do status de leitura por usuário.

**Impacto:** Usuários e vendedores perdem avisos importantes da plataforma (manutenções, metas atingidas, novos leads compartilhados) porque outro colega já visualizou a notificação previamente.

## Arquivo(s) envolvido(s)

`src/features/notifications/services/notification.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-015`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-015` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 02 — 2026-11-12)

O serviço já implementava leitura broadcast por usuário (DEBT-NOT-001): `readAt` global da notificação broadcast permanece `null` e o estado de leitura é persistido por `(organizationId, userId)` via `Setting` (`notifications.broadcastReads`) com cache em memória. A dívida estava `IMPLEMENTADO / NÃO VALIDADO`.

Validação adicionada em `tests/unit/features/notification-service.test.ts` (15/15 verdes):
- `unreadCount` exclui broadcasts lidos pelo usuário via `notIn`, mas conta normalmente para colega (`where.id` ausente para USER_B).
- `list` injeta `readAt` individual para quem leu o broadcast; colega recebe `readAt: null` — sem contágio de leitura.
- Cenário DEBT-NOT-001 original (A lê → B segue unread) já coberto e reconfirmado.

Sem alteração de código de produção — implementação existente estava correta; faltava evidência de regressão. Persistência depende do delegate `Setting` (schema Prisma, Agente 01) já existente; fallback em memória documentado no serviço.

Pendente: parecer Agente 24 e integração pelo Agente 00.
