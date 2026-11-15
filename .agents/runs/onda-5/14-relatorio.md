# Relatório — Agente 14 · TAREFA-SANEAMENTO-011 / BT360-DT-0004 (Onda 5)

**Missão:** verificador de sincronização entre a matriz de propriedade de arquivos (AGENTS.md §15)
e os handoffs em `.agents/handoffs/` — handoff de origem:
`.agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-entre-a-matriz-de-propriedade-d.md`.

**Worktree/branch:** `C:\Github\Birthub-360-worktrees\agente-14-onda5-arquitetura` · `agente/14-onda5-arquitetura` · base `integracao/onda-5` (= main com Ondas 1–4).

## Decisão de abordagem

**Abordagem (b): script dedicado** — `scripts/architecture/verify-file-ownership.ts`.

Justificativa (P2): o dependency-cruiser modela o grafo de *imports* entre módulos; a matriz §15
governa *quem altera qual arquivo num diff*, incluindo paths não-importáveis (`Dockerfile`,
`package.json`, `.agents/prompts/**`). Não existe aresta de import "commit → handoff", então não
há como expressar a regra como `forbidden` do depcruise sem distorcer o modelo. As fronteiras de
pastas continuam no depcruise; este gate cobre os slots de propriedade sobre `git diff`.

## O que foi entregue

| Arquivo | Conteúdo |
|---|---|
| `scripts/architecture/verify-file-ownership.ts` | Verificador: cruza `git diff --name-only` (base + staged + worktree, ou `--files`) com `OWNERSHIP_RULES` (espelho executável do §15) e exige handoff correspondente **dentro do mesmo diff**. Warnings, não bloqueio (default exit 0; `--strict` opt-in; `--json` para automação). |
| `tests/unit/architecture/verify-file-ownership.test.ts` | 15 testes — sucesso e falha. |
| `docs/architecture/FILE-OWNERSHIP.md` | Documentação de uso, matriz, limitações e decisão de não integração com depcruise. |
| `.agents/handoffs/onda-5/14-para-00-verify-ownership-npm-script.md` | Handoff ao 00 propondo wiring opcional em `package.json`/CI (package.json não foi tocado — exige aprovação do 00). |

### Regra de evidência (decisão de design relevante)

Só contam handoffs que **também estão no diff** (`.agents/handoffs/**/*.md` alterados no mesmo
PR). Handoffs históricos não autorizam alterações novas — caso contrário qualquer arquivo
frequentemente citado (ex.: `prisma/schema.prisma`, citado em dezenas de handoffs antigos) teria
cobertura permanente e o gate nunca dispararia. Critério objetivo e determinístico em CI.

Cobertura de um handoff para a alteração:
- regra de agente → caminho exato (posix ou `\`) **ou** menção ao dono (`Agente NN`/`para-NN`)
  + palavra-chave de área no mesmo documento;
- paths com aprovação do 00 (`package.json`, lockfiles, `server.ts`) → basename do arquivo +
  termo de aprovação/coordenador (citação solta do arquivo não basta).

## Gates executados

- `npx vitest run tests/unit/architecture/verify-file-ownership.test.ts --config vitest.unit.config.ts`
  → **15/15 passaram**.
- `npx tsc --noEmit --ignoreConfig --strict --module nodenext --target es2022 --skipLibCheck --types node scripts/architecture/verify-file-ownership.ts`
  → **0 erros** (o tsconfig raiz só cobre `src`+`server.ts`; scripts seguem o padrão dos demais
  `scripts/architecture/*`, que também não entram no `npm run typecheck`).
- `npx biome lint` nos dois arquivos TS → limpo (1 warning `noImplicitAnyLet` corrigido).
- `npm run lint` = `biome lint src` — arquivos tocados fora de `src`, sem impacto.

## Evidência — saída do verificador em diff sintético

**Falha (sem handoff no diff):**

``npx tsx scripts/architecture/verify-file-ownership.ts --files prisma/schema.prisma,.github/workflows/ci.yml,src/x.ts
[ownership] 3 arquivo(s) alterado(s) · 0 handoff(s) em .agents/handoffs/
[ownership] 2 aviso(s) — arquivo(s) sob propriedade exclusiva (AGENTS.md §15):
  WARN  prisma/schema.prisma  →  Agente 01/01A — prisma/schema.prisma e prisma/migrations/**  (sem handoff correspondente)
  WARN  .github/workflows/ci.yml  →  Agente 08 — .github/workflows/**, Dockerfile, docker-compose*.yml  (sem handoff correspondente)
[ownership] Modo não-bloqueante: ... Use --strict para falhar.
EXIT=0
```

**Diff real da branch** (`--base integracao/onda-5`, incluindo este relatório e o handoff):

```
[ownership] 5 arquivo(s) alterado(s) · 1 handoff(s) em .agents/handoffs/
[ownership] OK — nenhum arquivo de dono exclusivo tocado sem handoff correspondente.
```

O relatório `.agents/runs/onda-5/14-relatorio.md` é slot do Agente 00 e foi coberto pelo handoff
do próprio diff, que cita o caminho exato — demonstrando o caminho de sucesso ponta a ponta.
Exit 0 também com `--strict`.

**Sucesso (mesmo arquivo + handoff no diff):**

``npx tsx scripts/architecture/verify-file-ownership.ts --files prisma/schema.prisma,.agents/handoffs/onda-5/14-para-00-verify-ownership-npm-script.md
[ownership] 2 arquivo(s) alterado(s) · 1 handoff(s) em .agents/handoffs/
[ownership] OK — nenhum arquivo de dono exclusivo tocado sem handoff correspondente.
EXIT=0
```

## Conformidade com limites da missão

- `AGENTS.md` **não** alterado. `package.json`/lockfiles **não** alterados (proposta documentada
  no handoff ao 00). Nenhum workflow/CI tocado → sem bloqueio novo em CI existente.
- Arquivos de outros donos: `docs/architecture/FILE-OWNERSHIP.md` está sob `docs/` (dono 08),
  mas `docs/AGENTS.md` permite documentação técnica e a missão exige "documentação de uso" —
  documentado aqui para transparência do revisor.
- `tests/` (dono 08) recebeu o teste unitário exigido pela missão — padrão já existente em
  `tests/unit/architecture/` para gates do Agente 14 (check-hotspots, verify-cruise-coverage).

## Pendências / handoffs abertos

- **14 → 00** (`.agents/handoffs/onda-5/14-para-00-verify-ownership-npm-script.md`): decidir
  wiring como script npm e/ou step de CI. Sem isso, uso é `npx tsx ...`.
- **Revisão obrigatória:** Agente 24 — parecer formal em `.agents/reviews/` antes de encerrar
  o handoff BT360-DT-0004.
