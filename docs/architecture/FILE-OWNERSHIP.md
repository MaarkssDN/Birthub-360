# Verificação de propriedade de arquivos (AGENTS.md §15)

**Script:** `scripts/architecture/verify-file-ownership.ts`
**Origem:** TAREFA-SANEAMENTO-011 / BT360-DT-0004 (handoff
`.agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-entre-a-matriz-de-propriedade-d.md`),
executada na Onda 5 pelo Agente 14.

## Por que não é uma regra do dependency-cruiser

O `dependency-cruiser` (`.dependency-cruiser.cjs`) modela o **grafo de imports** entre módulos:
suas regras `forbidden` respondem "quem pode importar quem". A matriz do AGENTS.md §15 é outra
coisa — ela governa **quem pode alterar qual arquivo num diff/PR**, incluindo caminhos que não
são módulos importáveis (`Dockerfile`, `package.json`, `.agents/prompts/**`). Não existe aresta
de import entre um commit e um handoff, então a verificação é um gate separado, executado sobre
`git diff --name-only`. As regras de fronteira de pastas continuam no depcruise; esta cobre os
slots de propriedade.

## O que o verificador faz

1. Coleta os arquivos alterados: `git diff --name-only --diff-filter=ACMRD <base>...HEAD`
   (deleções incluídas — apagar arquivo de dono exclusivo também é alteração) + staged +
   worktree (ou lista explícita via `--files`).
2. Cruza cada caminho com `OWNERSHIP_RULES` — espelho executável do AGENTS.md §15:

   | Caminho | Dono |
   |---|---|
   | `prisma/schema.prisma`, `prisma/migrations/**` | Agente 01/01A |
   | `src/App.tsx`, `src/components/layout/**`, `src/bootstrap/routes.ts` | Agente 02 |
   | `.github/workflows/**`, `Dockerfile` (raiz), `docker-compose.yml` | Agente 08 |
   | `k8s/**`, `argocd/**`, `charts/**`, `infrastructure/**`, `docker/**` | Agente 10 |
   | `android/**`, `capacitor.config.ts` | Agente 09 |
   | `identidade-visual/**`, `documentacao-aplicacao/**` | Agente 11 |
   | `.agents/prompts/**` | decisão humana |
   | `.agents/runs/**` | Agente 00 |
   | `.agents/reviews/**` | Agente 24/00 |
   | `package.json`, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `yarn.lock`), `server.ts` | aprovação explícita do Agente 00 |

   Notas sobre a tradução do §15 para regexes:

   - **Agente 02:** o §15 lista "navegação principal" e "Sidebar" sem path literal.
     A heurística adotada cobre `src/components/layout/**` (onde moram `Sidebar.tsx`,
     `ModuleRail`, `MainLayout` — ver `src/components/layout/AGENTS.md`, dono Agente 02)
     e `src/bootstrap/routes.ts` (registro de rotas). Páginas/features fora do layout
     **não** são marcadas.
   - **Agente 08:** o §15 reserva `docker-compose.yml` **literal**. Os arquivos
     auxiliares `docker-compose.services.yml`, `docker-compose.postgres-local.yml`,
     `docker-compose.qdrant.yml` e `docker-compose.opensource.yml` existem no repo mas
     **não** são slot do 08 — não geram finding (decisão da correção pós-revisão 24:
     restringir ao §15 em vez de alargar a regra).
   - **Agente 10:** `docker/**` não consta do §15, mas entra como refino local
     autorizado por `docker/AGENTS.md` (dono Agente 10 — infra auxiliar). É o que faz
     `docker/postgres/Dockerfile` ser coberto pelo slot do 10, não do 08.
   - **`Dockerfile`:** a regra do 08 só casa na raiz (`^dockerfile$`), como no §15.

   `.agents/handoffs/**` **não** é dono exclusivo: cada agente cria os próprios handoffs (§15) —
   e é justamente onde a evidência exigida pelo gate mora.

3. Para cada arquivo de dono exclusivo tocado, exige **handoff correspondente dentro do mesmo
   diff**: um `.md` sob `.agents/handoffs/**` que também aparece na lista de arquivos alterados
   e cujo conteúdo cubra a alteração — caminho exato, ou menção ao dono + área (regras de
   agente), ou basename do arquivo + termo de aprovação do 00 (paths que exigem aprovação).

   Handoffs **históricos** não contam: um handoff antigo que cita `prisma/schema.prisma` não
   autoriza uma alteração nova. Isso é deliberado — torna o critério objetivo ("o PR carrega o
   artefato de handoff") e determinístico em CI (mtime de checkout não é sinal confiável).

4. Emite `WARN` por arquivo sem cobertura. **Não bloqueia por padrão** — o modo padrão sai com
   exit 0; `--strict` sai com exit 1.

## Uso

```bash
# diff contra origin/main + alterações staged/worktree (uso típico de PR)
npx tsx scripts/architecture/verify-file-ownership.ts

# outra base
npx tsx scripts/architecture/verify-file-ownership.ts --base main

# lista explícita de arquivos (testes, auditoria ad-hoc)
npx tsx scripts/architecture/verify-file-ownership.ts --files prisma/schema.prisma,server.ts

# modo bloqueante (opt-in — ver "Limitações")
npx tsx scripts/architecture/verify-file-ownership.ts --strict

# saída JSON para automação
npx tsx scripts/architecture/verify-file-ownership.ts --json
```

Exit codes: `0` ok / warnings em modo não-estrito · `1` findings com `--strict` · `2` erro de uso.

## Testes

`tests/unit/architecture/verify-file-ownership.test.ts` — cobre a matriz §15 (sucesso: caminho
coberto por handoff no diff, por caminho exato e por dono+área; falha: sem handoff, dono sem
área, aprovação ausente), normalização de paths Windows/POSIX, deduplicação e não-marcação de
caminhos fora da matriz (incluindo `.agents/handoffs/**`).

## Limitações conhecidas (heurística, não prova formal)

- A "cobertura" é textual: um handoff que mencione o caminho **e** esteja no diff silencia o
  aviso mesmo que o conteúdo não autorize a mudança específica. O gate detecta *ausência de
  handoff*, não *validade* do handoff — a revisão do Agente 24 continua sendo o controle.
- `package.json`/lockfiles/`server.ts` pedem basename + termo de aprovação no handoff; handoffs
  que apenas citam o arquivo sem falar de aprovação **não** cobrem (verificado em teste).
- Se o §15 do AGENTS.md mudar, `OWNERSHIP_RULES` precisa mudar junto — não há como importar o
  markdown. A paridade é fixada pelos casos canônicos em teste; divergência deve ser tratada
  como bug deste script.
- `ios/**` não consta do §15 (o slot do Agente 09 lista `android/**` e `capacitor.config.ts`) —
  portanto não é marcado. Se o §15 for estendido, estender `OWNERSHIP_RULES`.
- **Paths não-ASCII:** o git é invocado com `core.quotepath=false`, então caminhos UTF-8 saem
  sem escape octal. Permanecem invisíveis ao casamento paths que o próprio git continua
  quotando por conter caracteres de controle, `"` ou `\` no nome.
- **Untracked files:** `git diff` não lista arquivos não rastreados — um arquivo novo sob
  slot exclusivo que ainda não foi adicionado (`git add`) não gera finding. Em PR/CI o
  arquivo já estará tracked, então o risco é só em uso local antes do primeiro stage.
- **Camada git/fs sem teste unitário:** `collectChangedFiles`/`loadHandoffs` são fina e
  declaradamente não cobertas por teste — a lógica pura (`verifyOwnership`, `handoffCovers`,
  `rulesForPath`) é a parte testada.

## Integração com CI / package.json

Este script **não** está ligado a `package.json` nem a workflow — alterar `package.json` e
`.github/workflows/**` exige aprovação do Agente 00 e do Agente 08 respectivamente (e o próprio
verificador avisaria). Para ativar como script npm (`verify:ownership`) ou step de CI, abrir
handoff ao Agente 00 com a proposta — decisão de wiring fica com a coordenação.
