# Revisão Independente — Correções WB-1 (UX-02, UX-07, UX-11)

**Revisor:** Agente 24 — Revisão Independente
**Data:** 2026-11-19
**Objeto formal:** commit `f2d4d596b` na branch `agente/00-integracao-skills`
**Complemento revisado:** commit `bc061e229` (UX-07, frente separada — completude)
**Fontes de verdade:** `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1/§3,
`.agents/runs/correcoes-wb1/{17-ux02-playbooks,04-ux11-deadlink-lead,02-ux07-kpi-pipeline}.md`,
código em `main`/branch auditada via `git show`/`git diff` (working tree tem WIP alheio — não tocado).

## Veredito

**APROVADO** — as três correções são cirúrgicas, corretas, fiéis ao plano §3 da auditoria e
respeitam propriedade e P1–P4. Duas observações não-bloqueantes registradas abaixo.

## Escopo exato auditado

Commit `f2d4d596b` (5 arquivos, +203/−5):

| Arquivo | Dono declarado | Veredito de escopo |
|---|---|---|
| `src/features/sales-orchestration/components/PlaybooksHub.tsx` | 17 (AGENTS.md local criado em 2026-11-18, resolve pendência WB-1) | OK |
| `src/features/crm/components/LeadDetailDrawer.tsx` | 04 (`src/features/crm/AGENTS.md`) | OK |
| `.agents/runs/correcoes-wb1/17-ux02-playbooks.md` | artefato de run | OK |
| `.agents/runs/correcoes-wb1/04-ux11-deadlink-lead.md` | artefato de run | OK |
| `.agents/runs/correcoes-wb1/02-ux07-kpi-pipeline.md` | artefato de run | OK |

Commit `bc061e229` (complemento): `src/features/dashboard/components/SinglePageDashboard.tsx`
(dono 02, `src/features/dashboard/AGENTS.md`) + parecer `24-revisao-pr421-20261119.md`.
Nenhum arquivo fora do declarado em nenhum dos dois commits. **P3 (cirúrgico): conforme.**

## UX-02 — PlaybooksHub (achado P2 / DEBT-0060)

Plano §3 item 3 pedia: `onClick → /app/roteiros` no botão principal; `ArrowUpRight`
sem rota de detalhe → `disabled` + title "Em breve" (padrão do "Novo Playbook" :55-62).

Verificado no diff:
- `useNavigate` importado e `navigate('/app/roteiros')` no botão "Abrir Roteiros &
  Checklists" — rota real confirmada: `src/components/layout/AppLayout.tsx:484`
  (`<Route path="roteiros" element={<RoteirosHub />} />` sob `/app/*`, `App.tsx:173`).
  Apenas consumo da rota; registro de rotas/tabMeta (dono 02) não tocado — conforme
  a coordenação prevista no AGENTS.md local do 17.
- `ArrowUpRight`: `disabled` + `title="Em breve — detalhe do playbook ainda não
  disponível"` + `aria-label` descritivo. `Button` (`src/components/ui/Button.tsx:87-115`)
  é `forwardRef` e espalha `...props` no `<button>` nativo — `title`/`aria-label`
  chegam ao DOM; `disabled` real via prop.
- Zero ação morta no arquivo; regra local "nenhum botão sem onClick ou disabled+tooltip"
  satisfeita.

**Observação (não-bloqueante):** botão `disabled` não recebe foco nem dispara tooltip
`title` de forma confiável em todos os browsers/leitores de tela — o `aria-label`
permanece na árvore de acessibilidade em modo browse, mas o aviso "em breve" pode não
ser percebido por teclado. É o padrão já sancionado pelo plano §3 e idêntico ao
"Novo Playbook" existente; se quiser endurecer, alternativa futura seria
`aria-disabled` + clique que anuncia — fora do escopo desta leva.

## UX-11 — LeadDetailDrawer (achado P3 / DEBT-0065)

Plano §3 item 7 pedia: distinguir 404 ("não encontrado") de erro de rede ("tentar
novamente" com retry) e **não** fechar o drawer em erro de rede.

Verificado no diff:
- `isLeadNotFoundError` (~:74-79): regex `/lead not found|status 404/i` sobre
  `err.message`. Verifiquei a cadeia real: backend responde
  `res.status(404).json({success:false, error:'Lead not found'})`
  (`src/features/crm/presentation/LeadController.ts:53`); `apiFetch`
  (`src/lib/api.ts:64-68`) lança `Error(errorData?.error)` → `Error('Lead not found')`.
  Match correto. Falhas de rede/timeout têm mensagens próprias distintas
  (`api.ts:57-59`) → caem no ramo correto.
- Catch bifurcado (~:193-202): 404 → toast específico + `onClose()` (mantém o
  comportamento de fechar, agora com mensagem honesta); demais erros → toast +
  `setLoadError('network')` **sem** `onClose()` — drawer permanece, deep link
  `?lead=<id>` preservado. `setLoadError(null)` no início de cada tentativa → retry
  limpa estado corretamente.
- Novo ramo de render `loadError && !lead` (~:481) com "Tentar novamente"
  (`fetchLead`) e "Fechar" (`onClose`). Guard `&& !lead` correto: falha em re-fetch
  com lead já carregado não mascara o conteúdo.
- `Button` importado e usado com variantes existentes; `toast` já importado.

**Robustez da distinção por mensagem — julgamento: ACEITÁVEL, não bloqueante.**
`apiFetch` não propaga `status` HTTP (confirmado em `src/lib/api.ts:66-68` — só
`Error(message)`). Expor status exigiria alterar `src/lib/api.ts`, arquivo fora da
propriedade do 04 e desproporcional para um P3. A degradação é segura e foi
declarada pelo executor: se o backend mudar a mensagem de 404, o caso cai no ramo
de erro de rede (drawer aberto com retry) — nunca fecha silenciosamente, que era o
defeito original. Adicionalmente o fallback `status 404` na regex cobre o caso em
que `errorData` venha nulo (`API request failed with status 404`). Contrato de
mensagem estável e testado indiretamente (integração RBAC em `tests/integration/
rbac-e2e.test.ts` usa o mesmo endpoint).

**Observação (não-bloqueante):** o toast diz "não encontrado **ou sem permissão**",
mas um 403 de `requireLeadOwnership` provavelmente tem mensagem própria e cairia no
ramo de erro de rede (drawer permanece com retry) — comportamento seguro, só a
mensagem não cobre o caso de permissão. Inócuo.

## UX-07 — SinglePageDashboard (achado P2→P3 / DEBT-0033) — completude

Commit `bc061e229` (dono 02), revisado por completude:
- `:82` `?? 0` → `?? null` preserva ausência; ternário renderiza `'—'` para null,
  `'R$ 0'` só para zero real, BRL para valores > 0 — exatamente o contrato de
  `src/lib/db.ts:202-203` e o padrão de `ReportsHub.tsx:260`.
- Testes existentes (`tests/unit/features/dashboard/SinglePageDashboard.test.tsx`)
  mockam `pipelineValue: 450000` e `0` — ambos os caminhos preservados; **nenhum
  teste asserta "R$ 0" para null**, logo sem regressão. A ressalva do relatório do
  02 sobre o handler MSW (`tests/mocks/handlers/analytics.ts:18` retorna null) é
  pertinente mas os testes injetam dados via mock de hook, não via MSW — risco
  baixo; gate de integração deve confirmar.

## Relatórios vs diff real

Os três relatórios em `.agents/runs/correcoes-wb1/` são fiéis ao diff: descrevem os
mesmos hunks, citam linhas corretas (`LeadController.ts:53`, `api.ts`, `AppLayout.tsx:484`),
registram honestamente limitações (status não propagado; UX-N2 refutado com
evidência — "Indisponível" já tem `NO_API_SUBTITLE`, corretamente não alterado) e
declaram o que não foi executado (build, smoke e2e, commit — este último feito depois
pelo 00 no commit auditado). Nenhuma divergência encontrada.

## Conformidade P1–P4 e gates

- **P1:** descoberta feita — handoffs, evidências e AGENTS.md locais consultados;
  propriedade confirmada (17 ganhou AGENTS.md local em 2026-11-18 exatamente para
  resolver a pendência desta correção).
- **P2/P3:** mínimo de código; nenhum refactor adjacente; imports novos justificados
  (`useNavigate`, `Button`/`toast` já existentes).
- **P4:** critérios do plano §3 verificáveis e atingidos estaticamente; `npx tsc
  --noEmit` exit 0 reportado por cada executor e reconfirmado pelo 00 no estado
  combinado; `npm run lint` exit 0 com warnings pré-existentes (1561, nenhum nos
  arquivos tocados). Não re-executei os gates (revisão sobre objetos de commit;
  WIP alheio no working tree tornaria a execução não representativa do commit).
- **Propriedade §15 + locais:** todos os arquivos dentro do domínio do dono
  declarado; nenhuma migration, nenhuma alteração de `server.ts`, `package.json`,
  rotas globais ou `api.ts`. Sem handoff necessário — nenhuma dependência externa
  foi criada.
- **Tenancy/LGPD:** o tratamento de 404 "não encontrado ou sem permissão" não vaza
  existência do lead (mensagem genérica); nenhum dado novo exposto.

## Pendências para o 00 (não bloqueiam a aprovação)

1. Smoke e2e de `/app/roteiros` e do deep link `?lead=` permanece não executado
   (requer app + auth) — recomendo incluir no próximo gate de release WB-1.
2. Considerar handoff futuro (baixa prioridade) para expor `status` HTTP no erro de
   `apiFetch`, eliminando a heurística por mensagem — dono provável: 01/18.
3. UX-07: confirmar no gate de integração que nenhum teste MSW-dependent assume
   "R$ 0" para `pipelineValue: null`.

**Parecer emitido sem alteração de código — somente artefato de revisão.**
