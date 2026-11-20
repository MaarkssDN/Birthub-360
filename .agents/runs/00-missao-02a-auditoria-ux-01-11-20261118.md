# Missão 02A — Auditoria UX dos achados UX-01…UX-11 (Onda WB-1)

Emitida pelo Agente 00 em 2026-11-18, após aprovação humana dos perfis 02A–02D
(`.agents/prompts/02A-ux-research-usability.md` etc.).

```
Agente: 02A — UX Research & Usability (perfil interno do Agente 02)
Onda: WB-1 (auditoria UX — ver .agents/experience/05-roadmap.md, Onda B)
Base: main
Branch: agente/02a-auditoria-ux-01-11
Worktree: dedicado (AGENTS.md §17)

Objetivo:
Reverificar, com evidência própria, os 11 achados UX da auditoria
.audit-2026-11-18/ux-completude.md (UX-01…UX-11), confirmar ou refutar cada
um no estado atual do código, classificar por severidade real e produzir um
plano de correção priorizado com dono por achado — sem implementar correções.

Contexto:
- Achados fonte: .agents/runs/audit-2026-11-18/ux-completude.md
- Metodologia: .agents/experience/03-protocolo-auditoria-uxui.md
- Inventário mestre de débitos: .agents/runs/audit-2026-11-18/inventario-mestre.md
- Restrições: release NO-GO vigente; correções críticas de segurança/dados
  precedem UX; freeze de escopo — esta missão é somente auditoria.

Fora de escopo:
- Implementar qualquer correção (fase posterior, missões separadas);
- alterar código de produto, testes, prompts ou governança;
- refazer a auditoria completa do zero — foco nos 11 achados + regressões
  óbvias de navegação que os afetam;
- módulos backend bloqueados (cadência DEBT-0008…0011, IA DEBT-0012/0015) —
  mapear e sinalizar, não propor workaround.

Arquivos sob propriedade (escrita):
- .agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md (relatório final)
- .agents/handoffs/onda-WB1/02a-para-<dono>-<slug>.md (um por correção fora
  do escopo do 02)
- .agents/handoffs/onda-WB1/00-para-24-revisao-auditoria-ux.md

Arquivos de outros donos (somente leitura):
- src/features/crm/**, src/features/dashboard/**, src/features/settings/**,
  src/features/gamification/**, src/features/war-room/** (verificar
  AGENTS.md local de cada módulo antes de atribuir dono);
- src/components/crm/**, src/components/ui/**, src/components/layout/**;
- src/App.tsx.

Suposições:
- Os achados UX-NN podem estar parcialmente resolvidos desde 2026-11-18 —
  cada um deve ser re-verificado, não copiado.
- Achados que dependem de módulo em NO-GO são reportados como "confirmado —
  bloqueado por <débito>" e não geram handoff de correção prematura.
- Evidência = arquivo:linha ou reprodução; inferência é marcada hipótese.

Plano:
1. Para cada UX-01…UX-11: localizar código-fonte atual → verificar:
   status CONFIRMADO / REFUTADO / PARCIAL + evidência arquivo:linha.
2. Re-severar cada confirmado (P0–P3) contra impacto real no usuário e
   estado do release → verificar: severidade justificada, não herdada.
3. Atribuir dono correto a cada correção proposta (verificar AGENTS.md
   local do módulo; default Agente 02 para App.tsx/layout, dono do feature
   para src/features/<mod>/**) → verificar: nenhum handoff endereçado a
   dono errado.
4. Consolidar plano priorizado P0→P3 com dependências → verificar: cada
   item tem correção mínima proposta, teste de aceite e dono.
5. Emitir relatório + handoffs + solicitação de revisão ao 24 → verificar:
   parecer 24 registrado antes de encerrar.

Critério de sucesso final:
- 11/11 achados com status + evidência arquivo:linha;
- tabela de correções priorizadas com dono, teste de aceite e bloqueios;
- zero alteração em código de produto (diff restrito a .agents/**);
- parecer do Agente 24 APROVADO sobre o relatório.

Entrega:
- .agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md
- handoffs por correção + handoff de revisão ao 24
- adendo no run report .agents/runs/00-missao-maestra-us-ux-20261118.md
```

## Notas do coordenador (00)

- Execução recomendada em worktree isolado (`git worktree add`), já que o
  working tree principal carrega WIP de outras frentes.
- Este é o primeiro uso real dos perfis 02-*; o relatório servirá de
  calibração do protocolo para as próximas ondas.
- Se algum achado exigir implementação imediata (ex.: botão morto P1), a
  correção vira missão separada — esta entrega é o mapa, não o conserto.
