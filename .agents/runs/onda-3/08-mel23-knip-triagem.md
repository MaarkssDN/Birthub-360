# MEL-23 — Triagem Knip (Onda 3, Agente 08)

Data: 2026-11-13 · Branch: `agente/08-onda3-qa` · Base: `integracao/onda-3`
Ferramenta: `knip@^6.35.1` via `npx knip --reporter json` (exit 1 = issues encontradas; config funciona, sem quebra).
Config usada: `knip.json` (raiz) — entry: `src/main.tsx`, `src/App.tsx`, `server.ts`, `worker.ts`, `vite.config.ts`, `vitest.unit.config.ts`, `vitest.integration.config.ts`, `playwright.config.ts`; project: `src/**`, `server/**`, `scripts/**`.

## Sumário de achados (822 arquivos com issues)

| Categoria | Total | Observação |
|---|---|---|
| `files` (arquivos não referenciados) | 343 | 176 em `src/features`, 70 em `src/lib`, 39 em `src/components`, ~58 em `scripts/` |
| `exports` (exports não consumidos) | 729 | Maior concentração: `src/lib/voice-hub` (76), `src/components/icons` (70), `src/features/intelligence` (67), `src/features/prospecting` (49), `src/lib/motion.ts` (42) |
| `types` (tipos exportados não usados) | 675 | `src/features/prospecting` (99), `intelligence` (97), `commercial-intelligence` (70), `src/shared/contracts` (52) |
| `dependencies` (deps em package.json sem import) | 31 | Inclui `ai`, `@ai-sdk/react`, `socket.io`, `rxjs`, `ollama`, `million`, `pino-loki`, `@tiptap/*`, `@ffmpeg/*`, `wavesurfer.js`, `vaul`, `embla-carousel-*`, `posthog-node`, `dompurify`, `binary`, `confbox`, `pngjs`, `zlibjs`, `react-aria`, `@elevenlabs/client`, `@react-pdf/renderer`, `@twilio/voice-sdk`, `@tailwindcss/oxide` |
| `devDependencies` sem uso | 11 | `@faker-js/faker`, `ts-morph`, `glob`, `dotenv-cli`, plugins eslint legados (`react`, `react-hooks`, `react-refresh`, `jsx-a11y`, `storybook`), `@eslint/js`, `typescript-eslint` |
| `unlisted` (importados mas não declarados) | 15 | `zustand` (2 stores voice-hub), `ws` (2), `@radix-ui/react-dialog` (2), `@opentelemetry/*` (4), `@temporalio/activity`+`worker`, `@hapi/boom`, `@noble/hashes`, `crawlee`, `@opentelemetry/api-logs` — provavelmente hoisted/transitivos; **higiene de deps real** |
| `duplicates` (named + default export do mesmo símbolo) | 16 | Cosmético; ex.: `PageTransition.tsx`, `NewLoginScreen.tsx`, viewers de landing |
| `binaries` | 1 | `docker-compose` referenciado em package.json scripts sem binário correspondente |

## Classificação

### A. Prováveis falsos positivos de configuração (maioria)
- **`scripts/**` (~58 arquivos "unused")**: são utilitários operacionais manuais (seed, verify-*, capture-*, design-system, agent-import) invocados sob demanda via `npx tsx`/`node`, por runbooks ou por agentes — não por npm scripts nem CI. Knip não os vê como entry points. **Recomendação**: não remover; opcionalmente adicionar `scripts/**` como entry ou `ignore` no `knip.json` para reduzir ruído — decisão do 00 (mexe no sinal do gate).
- **`src/features/**` e `src/lib/**` flagged como files/exports/types**: muito provavelmente alcançados por import dinâmico, barrels, rotas lazy ou por arquivos fora do `project` do knip. **Recomendação**: triagem por domínio — cada dono de feature confirma antes de qualquer remoção. Não há como eu (08) garantir "certeza absoluta" sem tocar código de produto, que está fora do meu escopo de edição.
- **`src/components/ui/*` (Alert, Modal, Carousel, etc.) e `src/components/brand/*`, `src/components/icons/*`**: biblioteca de design system — componentes de catálogo/showcase e ícones provavelmente consumidos sob demanda. Falso positivo provável.
- **`dependencies`/`devDependencies` flagged**: várias são usadas via subpath, SSR condicional ou por configs fora do grafo (ex.: `@tailwindcss/oxide` é peer interno do Tailwind 4; plugins eslint podem ser referenciados por `eslint.config.*` flat config que o knip não parseia). **Recomendação**: antes de remover qualquer dep, grep manual + checar configs de lint/build. `package.json` é de aprovação do 00 — não alterei.
- **`unlisted` (15)**: não são dead code — são imports sem dep declarada. Risco real de quebra se a versão hoisted mudar. **Recomendação**: abrir handoff para 01 (deps/segurança) declarar `zustand`, `ws`, `crawlee`, `@radix-ui/react-dialog`, `@opentelemetry/*`, `@temporalio/*`, `@hapi/boom`, `@noble/hashes` conforme uso real. Não editei package.json (fora do meu domínio).
- **Raiz `worker-core.ts`, `worker-crm.ts`, `worker-extracoes.ts`, `worker-ia.ts`, `worker-mercado.ts`, `worker-prospecting.ts`**: fora do `project`/`entry` do knip — não analisados. `worker.ts` não os importa. **Suspeita de variantes mortas do worker** — precisa decisão do 16/00 (podem ser entry points de deploy alternativos). Reportar, não remover.

### B. Órfãos prováveis (médio risco — exigem confirmação do dono)
- `src/bootstrap/consentPurgeWiring.ts`, `src/middleware/securityHeaders.ts`, `src/shared/services/consentAuditChain.service.ts`: candidatos a wiring não plugado — mas podem ser importados por `server.ts`/bootstrap dinâmico. Dono: 01/02.
- `src/features/settings/**` (5 arquivos: routes, controller, use cases, repository, domain): feature settings aparentemente não roteada (bate com o comentário do próprio `knip.json`). Dono: 02 — decidir se é feature futura ou dead code.
- `src/lib/voice-hub/settings.controller.ts` + `src/lib/voice-hub/routes/settings.routes.ts`: duplicatas do bloco `features/settings` — possível dead code legado. Dono: 12.
- `src/components/layout/MobileNav.tsx`, `RequireProductModule.tsx`, `ThemeToggle.tsx`: componentes de layout não referenciados — dono: 02/03.

### C. Remoções cirúrgicas realizadas
**Nenhuma.** Justificativa: (1) todo candidato de arquivo morto está em `src/**`, fora dos caminhos que meu escopo de edição permite (`.github/workflows/**`, `tests/**`, `scripts/db/**`, configs de tooling); (2) nenhum item atinge "certeza absoluta" sem confirmação do dono do domínio (imports dinâmicos, barrels e rotas lazy não são totalmente rastreáveis pelo knip); (3) remoção de exports "não usados" (729) sem saber se são API pública de features em desenvolvimento geraria regressão silenciosa. Triagem completa acima para execução por onda futura com donos de domínio.

## Ações de config (domínio QA)
- `knip.json` **não precisou de correção** — knip executa e reporta corretamente.
- Gap documentado (não alterado para não inflar/encolher o sinal sem decisão do 00): `worker-*.ts` da raiz e `vitest.container.config.ts`, `vitest.shims.d.ts`, `playwright.visual.config.ts` estão fora de `entry`/`project`.

## Recomendação ao 00
1. Aceitar relatório como baseline de dead-code da Onda 3; abrir handoffs por domínio (02 para `src/components`/`features/settings`, 12 para `lib/voice-hub`, 16 para `worker-*.ts` raiz, 01 para `unlisted` deps).
2. Decidir se knip vira gate de CI (hoje `rules` estão em `warn`; promover `files`/`exports` para `error` só após saneamento dos falsos positivos de `scripts/`).
3. Handoff 01: declarar deps `unlisted` ou remover imports órfãos.
