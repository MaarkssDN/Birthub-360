# Run Report — Agente 09 / TAREFA-SANEAMENTO-028 + TAREFA-SANEAMENTO-048 (W4/W5)

- **Agente:** 09 — Mobile e PWA (Capacitor/Android)
- **Branch/worktree:** `agente/09-mobile-saneamento` em `C:\Github\Birthub-360-worktrees\agente-09-mobile`
- **Status:** implementado, handoffs atualizados

## TAREFA-SANEAMENTO-028 — Deep links nativos (BT360-DT-0053)

Auditoria de paridade `VALID_TABS` (`MainActivity.java`) × `ACTIVE_NAV_TABS`
(`src/lib/navigationBus.ts`) × `<Route>` de `src/App.tsx`:

- Divergência real: `gamification` era rota SPA ativa mas ausente de `VALID_TABS`
  — deep link `birthhub360://gamification` caía em "Link inválido".
- Correção: uma linha em `MainActivity.java` adicionando `"gamification"`.
- Após correção: conjuntos idênticos, 53 destinos (diff programático Java × TS).
- Intent-filters do `AndroidManifest.xml` já corretos — problema era a lista de
  destinos válidos no código nativo, não o manifesto.
- Rotas fora do contrato `TabType` permanecem fora do escopo por decisão de contrato.
- Handoff de regressão aberto para Agente 08:
  `09-para-08-teste-de-paridade-valid-tabs-active-nav-tabs.md` (`tests/**` é do 08).

## TAREFA-SANEAMENTO-048 — Ícones PWA (wave 2 anterior, merge já realizado)

- Branch `origin/agente/09-pwa-icons` integrada via merge (sem reescrita).
- Verificação física: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`,
  `apple-touch-icon.png`, `favicon.ico` existem e batem com os `src` declarados.

## Gates

- `npx tsc --noEmit` e `npm run lint`: executados nesta branch (escopo não toca
  `src/**` TS — alteração é string literal em lista Java estática; biome cobre
  apenas `src/`, `server/`, `scripts/`).
- `gradlew assembleDebug`: **não executável** — ambiente Windows sem Android
  SDK/JDK configurado. Limitação documentada; diff é 1 string em array estático.
- Verificação de paridade: diff programático executado (resultado acima).

## Pendências

- Parecer do Agente 24 para ambas as tarefas.
- Teste de paridade automatizado: depende do Agente 08 (handoff aberto).
