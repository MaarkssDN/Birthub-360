# Protocolo permanente de orquestração multiagente

Complementa `AGENTS.md` (autoridade sobre o roster, propriedade de arquivos, gates, handoffs §18) e
`docs/orchestration/PROTOCOLO_QUALIDADE_E_ACEITE.md` (critérios de qualidade, evidências e homologação).
Em conflito, `AGENTS.md` e regras de segurança prevalecem; instruções diretas do usuário prevalecem
sobre decisões anteriores de orquestração. Não edita prompts nem regras globais (AGENTS.md §5).

## Fluxo obrigatório de toda demanda
RECEBER → REGISTRAR → DEFINIR ACEITE → PLANEJAR → DELEGAR → EXECUTAR → ACOMPANHAR → TESTAR → CORRIGIR → REVALIDAR → REVISÃO INDEPENDENTE → CONCLUIR

Demandas antigas não são executadas automaticamente; só entram se o usuário pedir.

## Fonte canônica única
- `docs/orchestration/demands/INDEX.md` = status de todas as demandas. **Só o Agente 00 edita.**
- `docs/orchestration/demands/DEM-AAAAMMDD-NNN.md` = ficha da demanda (template `_TEMPLATE.md`).
  Seção do 00 editada só pelo 00; cada especialista escreve apenas na sua própria seção
  "Registro do Agente NN" (evita edição concorrente).
- `docs/orchestration/journal/NN.md` = diário append-only de cada agente (atividades, orientações
  diretas do usuário, mensagens enviadas/recebidas). Escrever no momento em que ocorre.
- `docs/orchestration/ACTIVITY-LOG.md` = log append-only do 00.
- Handoffs formais entre domínios continuam em `.agents/handoffs/` (AGENTS.md §18); a ficha da
  demanda só linka para eles. Pareceres do 24 em `.agents/reviews/`.

## Sessões
- Nome da sessão: `NN — <nome oficial>` (ver `ROSTER-SESSOES.md`). 00 é o Orquestrador Geral.
- Antes de criar sessão: consultar `list_sessions`/`ListAgents` e reutilizar (SendMessage) a
  existente. Sessão salva ≠ agente ativo: só chamar de ativo após resposta confirmada.
- Sessões de especialistas são criadas sob demanda (limite de 8 simultâneas, AGENTS.md §13;
  slots exclusivos 01↔01A, 06↔06A, 08↔08A).

## Comunicação (nunca simular)
Mecanismos disponíveis, em ordem de prioridade:
1. **Agent Bus Local (:4100)**: Mensageria persistida em SQLite (`.agents/bus/agent_bus.db`), REST/SSE e CLI (`node .agents/bus/agent-cli.mjs send --from XX --to YY --type TASK|ACK|INFO`). Permite que qualquer janela de terminal ou sessão se comunique rastreavelmente.
2. **SendMessage / Cross-session**: Comunicação nativa entre sessões ativas no Claude Code / Claude Desktop.
3. **Subagentes / Worker Swarm**: Execução delegada no mesmo turno com reporte ao Coordenador.
4. **Registro Estruturado**: Se nenhum canal síncrono responder imediatamente, gravar na ficha da demanda (`docs/orchestration/demands/DEM-*.md`) e no diário (`journal/NN.md`), mantendo status PENDENTE/BLOQUEADA até confirmação.

Toda solicitação inclui: ID da demanda, contexto, objetivo, critérios de aceite (obrigatórios vs opcionais), arquivos permitidos e instrução de resposta ao Agente 00.
**Mensagem enviada ≠ tarefa concluída.**
Ao receber resposta: analisar, registrar no diário, informar o 00 (decidido/executado).

## Papel do Agente 00
Recebe, registra, planeja, delega, monitora, cobra, resolve conflitos de arquivos, coordena
testes/correções, valida com evidências, consolida handoffs, informa o status final. Não pede
autorização ao usuário para decisões operacionais já cobertas pela demanda; pede só em operações
de alto impacto/segurança/fora de escopo (push, deploy, merge, deleção, segredos).
Nunca aceita "concluído" sem checar critérios e evidências (comandos + saída); o 24 audita
(AGENTS.md §40). Respeita dependências e evita dois agentes no mesmo arquivo.

## Intervenção direta do usuário
O usuário pode falar com qualquer especialista. O especialista: (1) registra a orientação
literal no seu diário e na ficha, (2) informa o 00 por SendMessage, (3) obedece, salvo violação de
segurança/governança (então explica e pergunta). O 00 reconsidera o plano e avisa os afetados.

## Continuidade
Se a sessão do 00 cair: o estado vive em `demands/`. Ao retomar, reconciliar (ler INDEX, diários,
`list_sessions`, `git status`) antes de redistribuir; nunca declarar que algo "continua rodando"
sem confirmação; evitar duplicar tarefas já IN_PROGRESS.

## Status válidos
RECEBIDA · PLANEJADA · DELEGADA · EM_ANDAMENTO · BLOQUEADA · EM_CORREÇÃO · EM_VALIDAÇÃO ·
HOMOLOGADA · CONCLUÍDA · CANCELADA
