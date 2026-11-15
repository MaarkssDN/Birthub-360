De: Agente 00 — Coordenador
Para: Agente 00 (Coordenador e Orquestrador Geral)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-011)
Status: em-andamento (agendado para Onda 5 — decisão do 00 em 2026-11-14)
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ausência de sincronização automatizada entre a matriz de propriedade de arquivos e o Dependency Cruiser**

- **Dívida técnica:** BT360-DT-0004
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O dependency-cruiser foi configurado para checar fronteiras de pastas, mas não os slots dos 26 agentes documentados no `AGENTS.md`.

**Impacto:** Risco contínuo de acoplamento indevido e commits concorrentes sobre arquivos de donos exclusivos (ex.: `prisma/schema.prisma` modificado por integrações).

## Arquivo(s) envolvido(s)

`AGENTS.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-011`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-011` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Decisão do orquestrador (Agente 00 — 2026-11-14)

- **Destino confirmado:** Onda 5 do programa de ondas (backlog HTML).
- **Dono designado:** Agente 14 (Ambiente de Execução e Test Harness) — já entregou
  MEL-24 (dependency-cruiser) na Onda 3 e conhece a config atual.
- **Escopo da missão:** estender a verificação de fronteiras para cobrir os slots de
  propriedade do `AGENTS.md` §15 (schema.prisma/migrations→01, workflows/docker→08,
  android/capacitor→09, identidade-visual→11, prompts→humano, runs→00,
  reviews→24/00, handoffs→cada agente), via regras depcruise ou verificador dedicado
  com teste de sucesso e de falha. `package.json`/`server.ts` seguem exigindo
  aprovação explícita do 00 — o verificador deve apenas detectar edição não
  autorizada, não bloqueá-la automaticamente sem fluxo de aprovação.
- **Revisão:** Agente 24 obrigatória antes do merge.
