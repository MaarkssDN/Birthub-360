# 20 — Proposta de Ownership para diretórios sem AGENTS.md local

**Data:** 2026-11-22 · **Status:** PROPOSTA — requer deliberação do Orquestrador
**Contexto:** Despacho complementar — ownership pendente antes de distribuir
implementações da Onda 1.

---

## 1. Convenção observada no repositório

Os AGENTS.md locais de feature usam numeração de squad legada (02 Produto e UX,
03 Design e Acessibilidade, 04 CRM e BI, 07 IA e Automações, 12 Voz e
Telefonia). O roster global de 100 agentes mapeia squads temáticos; a
numeração local é a que os handoffs existentes (`00-para-NN`) já utilizam.
Esta proposta segue a **numeração local** por consistência com os AGENTS.md de
feature — o Orquestrador confirma o mapeamento para o roster global se
necessário.

## 2. Proposta por diretório

### 2.1 `src/hooks/**` — hooks de dados/UI compartilhados

**Conteúdo:** `useDatabase.ts` (`useFetch` + hooks de companies/contacts/leads/
activities/analytics), `useCrmBoard*`, hooks utilitários de UI.

**Proposta:**
- **Dono primário: Agente 02 — Produto e UX** (estado e dados de apresentação;
  hooks servem exclusivamente à camada UI).
- **Exceção já decidida:** `useCrmBoard*` permanecem com **Agente 04**
  (decisão de 2026-11-18 em `src/components/AGENTS.md` — não reverter).
- Coordenação obrigatória com Agente 03 quando o hook tocar tokens/tema.

**Justificativa:** hooks não são lógica de backend (Squad 20) nem domínio de
negócio específico; são infraestrutura de apresentação compartilhada — mesmo
critério que deu `src/components/layout/**` ao Agente 02.

### 2.2 `src/contexts/**` — estado global React

**Conteúdo:** `AuthContext`, `DailyClosingContext`, `ExperienceModeContext`,
`ThemeContext`.

**Proposta:**
- **Dono primário: Agente 02 — Produto e UX** (estado global de aplicação).
- `ThemeContext` e qualquer contexto de tema/aparência → **coordenação
  obrigatória com Agente 03** (tokens/tema são dele); se a consolidação de
  temas do ADR-012 criar um contexto único, a implementação executiva pode ser
  do 03 com revisão do 02.
- `AuthContext` → qualquer alteração de lógica de sessão/autenticação exige
  handoff ao dono de auth (não é escopo do 02 sozinho).

**Justificativa:** contexts são o equivalente em estado do "app shell" que o
02 já governa.

### 2.3 `src/features/characters/**` — personagens/agentes de IA

**Conteúdo:** `CharacterGalleryView`, `CharacterDetailPanel`,
`characterRuntime.ts`, `characterCatalog*.ts`, `useCharacterExecution.ts`.

**Proposta:**
- **Dono primário: Agente 07 — IA e Automações** (os personagens são agentes de
  IA — `characterRuntime.ts` deriva vínculos com `COMMERCIAL_AGENT_REGISTRY` e
  `/api/agent/swarm/stream`; é funcionalmente um catálogo de agentes).
- **Coordenação com Agente 02** para a camada de apresentação/UX (galeria,
  estados de UI) e com **Agente 03** para tema/contraste (ADR-015).

**Justificativa:** o domínio do feature é execução de agentes de IA, não CRM
nem voz. O dono de `intelligence/` (Agente 07) já é o dono da fonte de dados
(`COMMERCIAL_AGENT_REGISTRY`) que o runtime consome.

### 2.4 `src/features/signals-risks/**` — Sinais & Riscos

**Conteúdo:** `SignalsAndRisksHub.tsx`, `DealRisksTab`, `SignalsRadarTab`,
`signalsRisks.api.ts`.

**Proposta:**
- **Dono primário: Agente 04 — CRM e BI** (risco de negócio sobre deals —
  `DealRisksTab` é literalmente risco por oportunidade; analytics/BI já são do
  04).
- **Coordenação com Agente 07** se os "sinais" dependerem de modelos de IA
  (verificar `signalsRisks.api.ts` — se os sinais forem outputs do enxame de
  IA, o 07 é consultado, não dono).

**Justificativa:** o módulo vive na seção "Risco & Sinais" do
`moduleRegistry.ts` e opera sobre o ciclo comercial (deals/oportunidades) —
mesmo domínio de analytics e forecast, que já são do Agente 04.

## 3. Alternativas consideradas e rejeitadas

| Diretório | Alternativa | Por que rejeitada |
|---|---|---|
| `src/hooks/**` | Agente 04 (CRM e BI) | Hooks são cross-módulo (companies, contacts, analytics, activities) — não são domínio CRM. Quebraria a regra de propriedade por uso majoritário. |
| `src/contexts/**` | Agente 03 (Design) | Só `ThemeContext` é de design; `AuthContext`/`ExperienceModeContext` são estado de aplicação. Forçar tudo ao 03 criaria conflito com auth. |
| `characters/**` | Agente 02 (Produto e UX) | A galeria é UX, mas o runtime/catálogo é execução de agentes de IA — domínio do 07. A camada visual fica com 02+03 via coordenação. |
| `signals-risks/**` | Agente 07 (IA) | Os "sinais" podem usar IA, mas a superfície é risco de negócio sobre deals — domínio CRM/BI do 04. O 07 entra como consultor de dados, não dono. |

## 4. Impacto nos handoffs da Onda 1

Com esta proposta aprovada:
- `00-para-02-usefetch-sem-cancel-race-guard.md` → destinatário confirmado
  **Agente 02** (era "dono a confirmar").
- `00-para-02-03-providers-contexto-sem-usememo.md` → confirmado **Agente 02**
  primário + 03 para ThemeContext.
- `00-para-02-03-characters-tema-oficial-aa.md` → primário passa a ser
  **Agente 07** (feature) + 03 (tema) + 02 (apresentação).
- `00-para-00-signals-risks-catch-silencioso.md` → destinatário passa a ser
  **Agente 04**.

## 5. Pendência de nomenclatura (para o Orquestrador)

Existe divergência entre a numeração local dos AGENTS.md de feature (02/03/04/
07/12) e o roster global de 100 agentes. O handoff do Silas usa "Agente 09"
que existe em ambos (09 = Silas no roster global; nos prompts locais o papel é
o mesmo). **Confirmar se a numeração local é a vigente para handoffs ou se
deve-se migrar para o roster global** — os handoffs existentes usam a local.
