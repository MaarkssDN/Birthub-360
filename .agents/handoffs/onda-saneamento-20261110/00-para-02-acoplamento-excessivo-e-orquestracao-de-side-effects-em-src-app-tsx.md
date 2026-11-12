De: Agente 00 — Coordenador
Para: Agente 02 (Produto e UX)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-016)
Status: aberto
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Acoplamento excessivo e orquestração de side-effects em src/App.tsx**

- **Dívida técnica:** BT360-DT-0016
- **Esforço estimado:** Grande
- **Status atual da dívida:** PARCIALMENTE IMPLEMENTADO

**Causa raiz:** Falta de um router dedicado desacoplado do arquivo principal de montagem da aplicação.

**Impacto:** Lentidão no carregamento inicial da aplicação (cold boot) e dificuldade de gerenciar code-splitting / lazy loading de páginas menos utilizadas.

## Arquivo(s) envolvido(s)

`src/App.tsx`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-016`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-016` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 02 — W4, 2026-11-12)

- `src/App.tsx`: 751 → 144 linhas. Mantém apenas providers, rotas públicas e o mount de `/app/*`.
- Novo `src/components/routing/lazyPages.tsx`: registro central das 67 páginas lazy (code-splitting explícito — causa raiz do BT360-DT-0016).
- Novo `src/components/routing/AuthenticatedLayout.tsx`: `OnboardingGate` + `MainLayout` + árvore de ~60 rotas `/app/*` (com todos os `RequireRole`/`RequireModuleAccess` e comentários de auditoria preservados).
- Novo `src/components/routing/PageFallback.tsx`: fallback de Suspense compartilhado.
- Paridade de rotas verificada: 91 `<Route>` antes = 91 depois; `diff` dos paths idêntico.

### Gates executados

- `npx tsc --noEmit`: PASS (exit 0).
- `npx biome check` nos 4 arquivos: PASS após `--write` (formatação).
- `vitest tests/unit/components/layout/`: 42/42 PASS (baseline da missão de ordens).

### Pendências

- Parecer Agente 24; integração pelo Agente 00. E2E de navegação (`tests/e2e/modular-navigation.spec.ts`) não executado nesta sessão — sem Docker.
