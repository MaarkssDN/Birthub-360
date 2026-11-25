# 22 — Matriz de Ownership Reconciliada (caminho × dono vigente × proposto)

**Data:** 2026-11-22 · **Status:** PROPOSTA para deliberação — **não altera
governança canônica**
**Base:** `20-OWNERSHIP-PROPOSAL.md` + reconciliação numeração legada ↔ roster
global de 100 agentes

---

## 1. Reconciliação de numeração

Os AGENTS.md de feature usam **numeração legada** (`.agents/prompts/legacy_v1/`):

| Legado | Papel | Roster global (AGENTS.md §3) |
|---|---|---|
| 02 | Produto e UX | **Squad 30** — Violeta(30), Noa(31), Ema(32), Célia(33), Ari(34), Mia(35), Léo(36), Suri(37), Nara(38), Tina(39) |
| 03 | Design e Acessibilidade | Squad 30 — ênfase Célia(33, DS/componentes) e Ari(34, WCAG) |
| 04 | CRM e BI | **Squad 40** — Ravi(40)…Malu(49, BI comercial) |
| 07 | IA e Automações | **Squad 70** — Orion(70)…Mina(79) |
| 08 | QA e Release | Squad 00 — Ória(01)…Silas(09) |
| 12 | Voz e Telefonia | **Squad 60** — Aurora(60)…Eli(69); Lena(65)=Voice Hub UI |

Regra de leitura: "Agente NN" nos AGENTS.md locais = papel legado; o roster
global designa squads/agentes específicos. **Handoffs devem citar os dois**
(ex.: "legado 04 → Squad 40, Rita/Lívia conforme escopo") até o Orquestrador
padronizar.

## 2. Matriz de ownership

| Caminho | Dono vigente | Proposto (legado → roster) | Fundamento documental | Conflitos |
|---|---|---|---|---|
| `src/hooks/**` | **nenhum** (sem AGENTS.md) | Legado 02 → Squad 30; sugestão Ema(32, estados de UI) p/ hooks de dados, Noa(31) p/ hooks de shell | Hooks servem só à camada UI; `useCrmBoard*` já é do legado 04 por decisão 2026-11-18 (`src/components/AGENTS.md`) | `useDatabase.ts` é cross-módulo — nenhum squad de domínio pode ser dono único sem exceções |
| `src/contexts/**` | **nenhum** | Legado 02 → Squad 30; Noa(31) p/ estado de app, Célia(33)/Ari(34) consultados p/ ThemeContext | Contexts = estado global de aplicação (análogo a app shell do Noa) | `AuthContext` toca auth → qualquer mudança de lógica exige handoff ao dono de auth (Squad 90/Nera 96 ou Squad 20) |
| `src/features/characters/**` | **nenhum** | **Legado 02 → Squad 30** (experiência/personas), com Squad 70 consultado p/ semântica de runtime | `characterCatalog.ts` declara explicitamente: *"Nenhum personagem é um agente de IA"* — são **personas/apresentação** de agentes (galeria, avatar, estados visuais). `useCharacterExecution.ts` consome SSE do supervisor, mas a feature é camada de experiência | Corretivo à proposta inicial: a associação nominal com "agentes de IA" **não** justifica Squad 70 — o domínio do feature é apresentação de identidade/personas → Squad 30. Squad 70 entra só como fonte de eventos/runtime |
| `src/features/signals-risks/**` | **nenhum** | **Legado 04 → Squad 40** (Ravi 40; Malu 49 p/ analytics) — **fortalecido** | `signalsRisks.api.ts` consome `/api/commercial-intelligence/*` (dono vigente: **Agente 04**, `commercial-intelligence/AGENTS.md`) e `/api/market-intelligence/*`; `DealRisksTab` = risco sobre deals do CRM | `market-intelligence/` também não tem AGENTS.md — fronteira com Squad 70 (sinais podem derivar do enxame). Verificar proveniência dos sinais antes de ratificar |

## 3. Verificações funcionais — RESULTADO

1. **characters:** `characterCatalog.ts` declara "Nenhum personagem é um agente
   de IA" — são personas de apresentação. `useCharacterExecution.ts` consome
   `/api/agent/swarm/stream` (SSE do Supervisor) mas apenas para **exibir**
   estado. → Domínio = experiência/personas → **Squad 30** recomendado.
2. **signals-risks:** `signalsRisks.api.ts` consome
   `/api/commercial-intelligence/{health-score,alerts,ai/deal-risk-scan}` e
   `/api/market-intelligence/data-quality-report`. `commercial-intelligence` é
   de Agente 04 → **Squad 40** recomendado. Proveniência dos "sinais de
   mercado" (`market-intelligence/`) segue sem AGENTS.md — pendente.
3. **hooks/contexts:** `useDatabase.ts` é genérico (companies/contacts/leads/
   activities/analytics) — cross-módulo confirmado, sem domínio único.

## 4. Impacto se aprovado

- Handoffs Onda 1 atualizados passam a citar dono legado + roster.
- `src/hooks/AGENTS.md`, `src/contexts/AGENTS.md`,
  `src/features/characters/AGENTS.md`, `src/features/signals-risks/AGENTS.md`
  precisam ser **criados** — mas isso altera governança canônica e exige
  autorização específica do Orquestrador (não incluída nesta deliberação).
- Ownership proposto **não** foi apresentado como aprovado nos handoffs —
  marcado como "pendente de ratificação".
