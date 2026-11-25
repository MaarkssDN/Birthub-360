# Handoff — Agente 17 (Cadência Multicanal) → Agente 00 (Astra, Coordenador)

- **De:** 17 — Cadência Multicanal e Ciclo de Receita (`src/features/cadence/**`)
- **Para:** 00 — Astra (ponto de entrada / decisão de divergências entre avaliadores)
- **Missão:** POS4-17-CADENCE-TZ — janela comercial por timezone do lead/org
- **Worktree:** `wt-17-cadence-tz` @ `agente/17-cadence-tz-pos4` (base `9f80c07ed`)
- **Commit:** `68e38a47c` — `feat(cadence): janela comercial por fuso do lead + scan tenant-safe/ordenado`
- **Status:** concluído — aguardando aceite (Silas)
- **Resposta ao handoff:** `.agents/handoffs/onda4/44-para-17-cadence-janelas-e-scan.md` marcado como resolvido

## O que foi entregue

### 1. Janela comercial por fuso do destinatário (achado 1 do 44→17, opção a)

Novo módulo puro `src/features/cadence/domain/businessWindow.ts`:

- `resolveBusinessTimeZone({ explicitTimeZone, state, fallback })` — cadeia documentada:
  1. `Lead.customFields.timezone` quando for IANA válido (escape hatch sem migration);
  2. UF de `Company.state` → fuso IANA via mapa `UF_TO_TIMEZONE` (26 UFs, zonas oficiais tzdb —
     `America/Manaus`, `America/Rio_Branco`, `America/Porto_Velho`, `America/Boa_Vista`,
     `America/Cuiaba`, `America/Campo_Grande` cobrem os offsets UTC-4/UTC-5 que realmente mudam
     o resultado; as demais usam os identificadores regionais da tzdb);
  3. Fallback `America/Sao_Paulo` — idêntico ao comportamento global anterior, então leads sem
     sinal de localização não mudam de comportamento.
- `isValidIanaTimeZone` — valida via `Intl.DateTimeFormat`; valor inválido nunca propaga
  `RangeError`.
- `isWithinCadenceBusinessWindow(now, timeZone?, window?)` — mesmos horários/dias de
  `DEFAULT_CALL_WINDOW` (09:00–18:00, seg–sex) com `timeZone` do destinatário; `now` inválido
  → `false` (cadência espera em vez de despachar às cegas). DST resolvido pelo `Intl` por data.

### 2. Propagação do fuso (contrato estendido de forma retrocompatível)

- `LeadSubject` (application/cadenceService.ts) ganhou `timeZone?: string | null`.
- `PrismaLeadSubjectResolver` resolve o fuso **na mesma query** que já buscava o contato
  (`customFields` + `company.state` no `select`) — zero I/O extra. Não existe coluna
  `timezone` em Lead/Org nem `timezone` em Organization — verificado no schema; por isso a
  cadeia customFields→UF→SP é a regra de negócio real implementada.
- `isWithinBusinessWindow` passou a aceitar `leadTimeZone` como 2º argumento em toda a cadeia:
  `CadenceExecutionPort`, `CadenceExecutionServiceDeps`, `AdvanceCadenceRunDeps`,
  `CadenceDecisionContext` e `decideCadenceAction`. Implementações antigas `(now) => boolean`
  continuam válidas (parâmetro opcional) — teste dedicado prova isso.
- Worker injeta `isWithinCadenceBusinessWindow` em vez de `isWithinCallWindow` fixo em SP.

### 3. Achados secundários do 44→17 (ambos defeitos reais, corrigidos)

- **Achado 2 — scan sem tenant/soft-delete:** `scanAndAdvanceCadenceRuns` agora filtra
  `deletedAt: null` na query de `CadenceSequence` (sequência soft-deletada não despacha mais
  toques — run é encerrado `failed`/`policy-guardrail` como sequência inválida) e carrega
  `organizationId` da linha no mapa. A validação `sequence.organizationId === run.organizationId`
  foi extraída para o domínio como `sequenceDefinitionForRun` (`domain/cadence.ts`) — testável
  sem banco; o worker consome. `active: false` **não** foi filtrado de propósito: o contrato
  documentado (`application/sequenceService.ts`/`cadence.routes.ts`) diz que desativar só impede
  NOVOS runs — runs em andamento continuam (decisão de produto, não defeito).
- **Achado 3 — `take: 500` sem `orderBy`:** adicionado `orderBy: { startedAt: 'asc' }` — varredura
  justa/determinística; quem espera há mais tempo vai primeiro.

## Bordas cobertas por teste

`__tests__/businessWindow.test.ts` (12 testes): mesmo instante UTC dentro em SP/fora em Manaus
(o bug original), bordas 08:59/09:00/17:59/18:00 (fim exclusivo), fim de semana em qualquer fuso,
virada de dia (23:30 local), DST real (`America/New_York` verão vs inverno no mesmo horário UTC),
timezone ausente/inválido → fallback SP, `Date` inválido → `false`. UF→fuso para as 26 UFs,
minúsculas/espaços, rejeição de lixo/nome por extenso/sigla estrangeira.

`cadenceService.test.ts` (+3): `timeZone` do resolvedor chega ao avaliador injetado; resolvedor
legado sem `timeZone` passa `null`; implementação de 1 argumento continua compatível.

`cadence.test.ts` (+4): `sequenceDefinitionForRun` — mesmo tenant resolve, outro tenant → null,
ausente (inclui soft-deletada filtrada na query) → null, definição malformada → null.

Opt-out por canal preservado: nenhum caminho de opt-out foi alterado; a resolução de sujeito
continua única e alimenta `isOptedOut` antes da janela, como antes.

## Gates executados (neste worktree)

- `npx tsc --noEmit` — limpo (exit 0)
- `npx biome lint src/features/cadence` — limpo (1 warning `noNonNullAssertion` corrigido)
- `npx vitest run -c vitest.unit.config.ts --no-file-parallelism src/features/cadence` —
  **15 arquivos / 218 testes, todos verdes** (inclui os 19 novos)
- `npm run build` e suíte de integração **não executados** neste worktree (build pesado; a suíte
  de integração exige Postgres/Redis reais — ver "Pendências").

## Pendências / decisões para o 00

1. **Divergência de horários entre avaliadores (não alterada — fora de escopo):** o worker de
   cadência usa 09:00–18:00 (`DEFAULT_CALL_WINDOW`); o avaliador do CRM
   (`src/features/crm/cadences/cadence.worker.ts`, dono do Agente 04) usa 08:00–19:00. Esta
   missão corrigiu o **fuso**, não os horários. Se a decisão for unificar, é handoff 17↔04.
2. **Fallback quando `SDR_CALL_TIMEZONE` está configurado:** no caminho do worker o fuso do lead
   SEMPRE vence (lead sem localização → SP). No caminho `CadenceExecutionService` sem
   `isWithinBusinessWindow` injetado, o fuso do lead sobrescreve apenas `timeZone` da janela env
   (horários `SDR_CALL_WINDOW_*` preservados). Se a intenção for "env timezone é o default do
   tenant e lead sem localização deve herdar dele", é uma decisão de produto a registrar.
3. **Teste de integração sugerido (pro Agente 08/QA ou próxima onda):** em
   `tests/integration/cadenceRun.worker.test.ts` — sequência soft-deletada com run ativo deve
   encerrar `failed`/`policy-guardrail` sem despachar; `CadenceRun` apontando para sequência de
   outro tenant (dado manual) idem. Não editei `tests/**` por ownership (Agente 08).
4. `Lead.customFields.timezone` é escape hatch sem migration; se o produto quiser timezone por
   `Organization` ou coluna nativa em `Lead`, é proposta de schema para 11/01 (fora do meu
   ownership — `prisma/schema.prisma`).
