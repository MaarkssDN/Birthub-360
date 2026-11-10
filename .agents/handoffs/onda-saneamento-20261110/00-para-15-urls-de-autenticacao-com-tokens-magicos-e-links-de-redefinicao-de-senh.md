De: Agente 00 — Coordenador
Para: Agente 15 (Segurança Aplicada e Rotação de Segredos)
Onda: Onda 0 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-001)
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 0

## Problema

**URLs de autenticação com tokens mágicos e links de redefinição de senha escritas em texto puro em logs**

- **Dívida técnica:** BT360-DT-0072
- **Esforço estimado:** Médio
- **Status atual da dívida:** PARCIALMENTE IMPLEMENTADO

**Causa raiz:** Facilitação temporária de depuração mantida ativa fora de ambiente de teste puro.

**Impacto:** Comprometimento total de contas de usuários administrativos caso os logs de aplicação sejam acessados por terceiros ou sofram vazamento; violação direta do Bloqueador B-04 (`AGENTS.md` §22).

## Arquivo(s) envolvido(s)

`src/lib/auth.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-001`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-001` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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
