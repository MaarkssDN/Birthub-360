# Parecer — PR #190 (WF6, remoção de cópias mortas do voice-hub) @ 86b635a8

- **Missão:** WF6. Remover as 18 cópias mortas em `src/features/voice-hub/pages/`.
- **Autor:** agente WF6 (branch agente/wf6-voicehub-dedup)
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** origin/main 645cb6cb, que é também o merge-base; o PR está 0 commits atrás.
- **SHA revisado:** 86b635a8829734d4f55472d5cbb9997d16a7eafb (head reconfirmado antes de emitir)
- **Escopo:** 21 arquivos, +3/−4257.
  - Remove 18 arquivos: Admin, AgentMarketplace, AgentOS, AgentRegistry, Analytics, Billing, Developers, Docs, Governance, KnowledgeManager, Observability, Organization, Overview, Preferences, Supervision, Telephony, ToolRegistry e VoiceStudio (`.tsx`).
  - Ajusta tests/tsconfig.voice-recovery.json e 2 testes.

## Critérios e evidências
1. **Nenhum arquivo removido é usado.** Rodei `rg` no head por `voice-hub/pages/<Nome>` e `pages/<Nome>` (sem o Dashboard) em src, tests, scripts, vite config e stories. Também procurei imports relativos `./<Nome>` dentro do voice-hub e `import.meta.glob`.
   - Não sobrou nenhuma referência.
   - Os únicos imports `./Developers.js`, `./Overview.js` e `./KnowledgeManager.js` ficam em `pages/Dashboard/*.test.tsx` e apontam para as cópias de Dashboard, que continuam.
   - As referências que restam estão só em `impeccable_results.json`, um relatório estático (P3).
2. **/voice-hub renderiza só o VoiceHubView.** Em src/App.tsx:451-452, `voice-hub` e `voice-hub/*` vão para `<VoiceHubView />`, carregado por lazy import de `components/VoiceHubView.js` (:307).
   - O único lazy import de `pages/` é o `LandingInnovative` (:304), que não foi removido.
   - Em `pages/` sobram Dashboard/, Landing, LandingInnovative, Login, Register, Playground e Results. Os dois últimos ficaram fora do escopo, como declarado.
3. **Build e bundle:** o Release Build e o Smoke passaram, e o Frontend Bundle Budget 41456452098 deu success. Os arquivos removidos não eram alcançáveis pelo grafo de imports, então não se espera mudança no bundle de produção.
   - Não consegui medir o build local: o disco do box encheu durante o `npm ci`. Uso o CI como evidência.
4. **Contagem de testes:** o Unit foi de 5554 (main/#180) para 5545 (−9). A queda é explicada: saíram os casos `['Voice Hub', …]` do `describe.each`, com 7 `it` em voice-hub-agent-registry e 2 em voice-hub-telephony-integrity. O caso Dashboard continua coberto. Golden (11), Integration (738/2 skipped) e E2E (108) ficaram iguais.
5. **Ownership de App.tsx (02/00):** o PR não toca App.tsx. Não se aplica.
6. **CI (§40):** todos os runs em 86b635a8 deram success.

   | Run | ID |
   |---|---|
   | Central Birth Hub 360 Release | 41456452078 |
   | SonarQube | 41456452105 |
   | Visual Regression | 41456452165 |
   | CodeQL | 41456452237 |
   | Trivy | 41456452074 |
   | Dependency Review | 41456452128 |
   | Bundle Budget | 41456452098 |

   No Release, os steps Lint, Type Check, Unit, Golden, Integration, Build, Smoke e E2E rodaram verdes.

## Achados
- **P1/P2:** nenhum.
- **P3:**
  - (a) `impeccable_results.json` ainda cita `pages/AgentRegistry`, `Developers`, `Observability` e `Preferences`. É um relatório obsoleto, sem efeito no build.
  - (b) Playground e Results continuam em `pages/` e precisam de uma verificação própria num follow-up.

## Pendências
Nenhuma bloqueante.

## Decisão
**APROVADO.**
