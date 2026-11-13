De: Agente 00 — Coordenador
Para: Agente 01 (Plataforma, Segurança e Dados)
Onda: Onda 1 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-044)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 1

## Problema

**Lógica de criação de primeiro usuário executa user.count redundante para atribuir role ADMIN**

- **Dívida técnica:** BT360-DT-0009
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Refatoração de autenticação que preservou verificação antiga fora da transação.

**Impacto:** Sobrecarga insignificante em baixo volume, mas adiciona débito de legibilidade e latência na esteira de onboarding.

## Arquivo(s) envolvido(s)

`src/lib/auth.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-044`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-044` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 01 — 2026-11-12)

- **Causa raiz já eliminada:** `user.count` removido de `src/lib/auth.ts` no commit `5709caaa2` (onda-saneamento-20261015). Estado atual: fundador de org nova recebe `role: 'ADMIN'` sem consulta de contagem. Nenhuma alteração adicional em `src/lib/auth.ts` foi necessária.
- **Teste de regressão adicionado:** `tests/integration/auth-founder-admin.test.ts` (sucesso: fundador→ADMIN+org+módulos; semântica: 2º fundador também ADMIN sem count; falha: e-mail duplicado rejeitado).
- **Execução do teste de integração:** bloqueada nesta estação (sem `.env.test`/Docker). Pendente gate de integração do 00/08.
- **Run report:** `.agents/runs/agente-01-tarefa-saneamento-044.md`.
- **Revisão:** aguardando parecer do Agente 24.
