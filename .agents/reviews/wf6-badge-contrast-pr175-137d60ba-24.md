# Parecer Agente 24 — PR #175 (WF6, contraste dos badges do Painel Central)

- **SHA:** 137d60ba7d385e33caf66f04df9bc64cf97d9eed (base 16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69)
- **Veredito: APROVADO**, com o merge condicionado ao aceite registrado do WF4 para `tests/e2e/accessibility.spec.ts`. O arquivo é do WF4 e, até 02/11/2026, não há esse aceite na PR.

## Contraste (recalculado pelos tokens; WCAG 2.x; texto de 10px bold, mínimo 4.5:1)
Tokens: `identidade-visual/birthhub360/tokens/birthhub360.css:9-16,119-127` e overrides light `src/styles/official-identity.css:75-76` (gold #92400e, cyan #0369a1). O fundo do badge é `color-mix(accent 10%, transparent)`, ou seja, translúcido, composto sobre o card `.bh-platform-card` (`official-identity.css:136-138`, `background: var(--color-surface)`): #FFFFFF no light e #14141A no dark.

| Tema | Accent | Antes | Depois |
|---|---|---|---|
| light | cyan | 5.13 | 7.01 |
| light | gold | 6.07 | 8.05 |
| light | pink | 4.08 | 5.82 |
| light | iris | 5.38 | 7.28 |
| light | success | 4.62 | 6.43 |
| light | danger | 4.61 | 6.43 |
| light | blue | 4.54 | 6.33 |
| dark | cyan | 8.70 | 9.46 |
| dark | gold | 9.29 | 10.16 |
| dark | pink | 4.87 | 5.78 |
| dark | iris | 5.00 | 6.49 |
| dark | success | 6.94 | 8.06 |
| dark | danger | 4.45 | 5.60 |
| dark | blue | 4.47 | 5.92 |

O mínimo depois da mudança é 5.60 (dark danger), o que confirma a alegação de que tudo fica em pelo menos ~5.6:1. Os badges do dashboard usam gold, success, iris e cyan, e todos ficam em pelo menos 6.4. Os números batem com a tabela da PR (diferença de ±0.05). `color-mix()` é Baseline 2023 (Chrome 111, Firefox 113, Safari 16.2). O código já usava `color-mix` no fundo, então não há regressão de suporte.

## Escopo
- `SinglePageDashboard.tsx:190,225,254,283`: só as classes de texto dos 4 badges. Nenhuma mudança em token global, package, lockfile ou baseline de VR. VR 41438546181 success.
- `tests/e2e/accessibility.spec.ts:48-70,125`: `waitForCardsEntrance` espera por um estado (opacity 1 e filter none em `.bh-platform-card` e ancestrais) e não por um sleep fixo. Não exclui regras nem elementos. O teto de 5s com `.catch` segue para o scan, que continua capaz de falhar, então o teste não ficou mais fraco.

## CI no head
Release 41438546174 success (application gate: Unit, Golden Dataset, Integration, Build, Smoke e E2E com success). Sonar 41438546081, VR 41438546181, CodeQL 41438546022, Trivy 41438546313, Dep Review 41438546151 e Bundle Budget 41438546021 com success.

## Observações
- O main avançou para ccba2819. Os arquivos que mudaram não se sobrepõem a esta PR.
- P3: a mesma heurística light/dark pode ser aplicada a outros badges com `text-[var(--card-accent)]` (fora do escopo).
