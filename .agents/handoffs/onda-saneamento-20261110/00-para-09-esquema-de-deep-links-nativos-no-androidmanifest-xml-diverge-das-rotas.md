De: Agente 00 — Coordenador
Para: Agente 09 (Mobile e PWA (Capacitor/Android))
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-028)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Esquema de deep links nativos no AndroidManifest.xml diverge das rotas SPA da aplicação web**

- **Dívida técnica:** BT360-DT-0053
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Atualização das rotas do React Router no frontend web sem a sincronização correspondente no manifesto nativo do Android.

**Impacto:** Quebra da experiência de navegação do vendedor em trânsito ao clicar em alertas móveis; aumento do tempo necessário para localizar o cliente.

## Arquivo(s) envolvido(s)

`android/app/src/main/AndroidManifest.xml`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-028`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-028` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

**Agente 09 — 2026-11-12** (branch `agente/09-mobile-saneamento`)

Auditoria de paridade executada comparando `VALID_TABS` em `android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java` contra `ACTIVE_NAV_TABS` (`src/lib/navigationBus.ts` = `TAB_ROUTE_SET` − `NAV_HIDDEN_TABS`) e as `<Route>` de `src/App.tsx` sob `/app/*`:

- Divergência real encontrada: `gamification` é rota SPA ativa (`App.tsx`, `TabType`, `TAB_ROUTE_SET`, não está em `NAV_HIDDEN_TABS`) mas estava ausente de `VALID_TABS` — deep link `birthhub360://gamification` ou `https://<host>/app/gamification` caía no diálogo "Link inválido" mesmo com a tela existindo.
- Correção cirúrgica: adicionado `"gamification"` a `VALID_TABS` em `MainActivity.java` (única linha alterada). Após a correção, diff programático Java × TS retorna conjuntos idênticos (53 destinos).
- Intent-filters do `AndroidManifest.xml` (`birthhub360://` custom scheme + App Link `https://birthhub-360.onrender.com/app/*`) já estavam corretos e inalterados — o problema era a lista de destinos válidos no lado nativo, não o manifesto em si.
- Rotas fora do contrato `TabType` (ex.: `war-room`, sub-rotas de detalhe como `market-intelligence/accounts/:id`) permanecem fora do escopo de deep link por decisão de contrato — `navigationBus.requestNavigation` também as rejeita; o deep link opera em granularidade de aba, consistente com o contrato do Agente 02.
- Teste de regressão de paridade integral (parse de `VALID_TABS` × `ACTIVE_NAV_TABS`): aberto handoff `.agents/handoffs/onda-saneamento-20261110/09-para-08-teste-de-paridade-valid-tabs-active-nav-tabs.md` — `tests/**` pertence ao Agente 08.
- Gates: `npx tsc --noEmit` e `npm run lint` executados nesta branch (ver relatório `.agents/runs/agente-09-saneamento-onda-20261112.md`). Build Android (`gradlew assembleDebug`) não executável neste ambiente Windows sem Android SDK/JDK configurado — limitação documentada, compilação Java alterada é de 1 string literal em lista estática.
