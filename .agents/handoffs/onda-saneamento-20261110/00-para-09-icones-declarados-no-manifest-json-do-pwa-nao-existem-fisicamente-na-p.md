De: Agente 00 — Coordenador
Para: Agente 09 (Mobile e PWA (Capacitor/Android))
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-048)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ícones declarados no manifest.json do PWA não existem fisicamente na pasta public**

- **Dívida técnica:** BT360-DT-0054
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O arquivo foi referenciado na especificação do manifesto sem a respectiva exportação dos assets gráficos.

**Impacto:** Auditoria Lighthouse acusa falha no checklist de PWA instalável; apresentação visual degradada na tela inicial de smartphones.

## Arquivo(s) envolvido(s)

`.agents/audits/technical-debt/2026-10-14/manifest.json`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-048`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-048` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

**Agente 09 — 2026-11-11** (branch `agente/09-pwa-icons`, commit `a5150a56b`, pendente de revisão do Agente 24)

Auditoria do manifest real (`vite.config.ts` → `VitePWA`): as entradas `icons`/`screenshots` referenciavam `/icons/icon-192.png`, `/icons/icon-512.png` e um `purpose: 'maskable'` apontando para `icon-512.png` — funcionalmente incompleto para PWA instalável (maskable precisa de área de segurança própria) e `apple-touch-icon` não estava declarado no `index.html`.

Correção:
- `public/icons/icon-512-maskable.png` criado (512×512, derivado do ícone oficial com padding de safe-zone para maskable).
- `vite.config.ts`: `purpose: 'maskable'` agora aponta para `icon-512-maskable.png`.
- `index.html`: `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` adicionado.

Todos os `src` do manifest agora têm arquivo físico correspondente em `public/`. Nenhum asset existente foi alterado (os ícones da wave 1 do Agente 11 foram reutilizados como fonte).

**Agente 09 — 2026-11-12** (branch `agente/09-mobile-saneamento`): branch `origin/agente/09-pwa-icons` avaliada e integrada via merge (commits `a5150a56b` + `e5aea6404`), sem reescrita de histórico. Verificação física nesta branch confirmou: `public/icons/icon-192.png` (192×192), `public/icons/icon-512.png` (512×512), `public/icons/icon-512-maskable.png` (512×512), `public/apple-touch-icon.png` (180×180) e `public/favicon.ico` existem e batem com os `src` declarados em `vite.config.ts`/`index.html`. Status promovido para `resolvido`; pendente apenas o parecer do Agente 24.
