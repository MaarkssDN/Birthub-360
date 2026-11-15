De: Agente 00 — Coordenador
Para: Agente 00 (Coordenador e Orquestrador Geral)
Onda: Onda 0 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-043)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 0

## Problema

**Leitura obrigatória no prompt de coordenação referencia documento de ondas inexistente**

- **Dívida técnica:** BT360-DT-0001
- **Esforço estimado:** Pequeno
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O documento foi renomeado ou consolidado durante a reorganização documental de ondas, sem a respectiva atualização no prompt mestre.

**Impacto:** Novos agentes de orquestração operam com incerteza sobre a fonte canônica do planejamento de ondas.

## Arquivo(s) envolvido(s)

`.agents/prompts/00-coordenador.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-043`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-043` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução

- **Data:** 2026-11-14 · **Executor:** Agente 00 (trilha de coordenação, DEM-20261114-002)
- **Verificação executada:** varredura de todas as referências do prompt `.agents/prompts/00-coordenador.md` e do mapa canônico `EXECUCAO-ONDAS.md`:
  - Leitura obrigatória #2 `/EXECUCAO-ONDAS.md` — **existe** (criado em 2026-10-17, commit `aa46f0f64`, "mapa canônico de ondas").
  - Todos os 5 links `file:///` de `EXECUCAO-ONDAS.md` resolvem para arquivos existentes (plano de saneamento, matriz de agentes, auditoria de dívidas, remediation-status.json, relatório de consolidação).
  - Prompts citados (`24-revisao-independente.md`, `08A-git-deploy-aws.md`, `06A-extracoes-bitrix.md`) existem em `.agents/prompts/`.
- **Conclusão:** a dívida BT360-DT-0001 já estava remediada antes desta verificação — `EXECUCAO-ONDAS.md` é a fonte canônica de ondas e todas as referências do prompt resolvem. Nenhuma alteração de arquivo foi necessária (a correção já estava em `main`).
- **Pendência de governança:** validação do Agente 24 fica a cargo da revisão da onda de saneamento de handoffs (DEM-20261114-002).
