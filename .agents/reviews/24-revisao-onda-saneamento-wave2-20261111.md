# Parecer do Agente 24 — Revisão Independente

**Missão/Onda:** Wave 2 da `onda-saneamento-20261110` (4 merges na `integracao/onda-saneamento-20261110`)
**Auditor:** Agente 24 — Revisão Independente
**Autores auditados:** Agentes 05, 17, 23, 09
**Base/Branch de integração:** `integracao/onda-saneamento-20261110` @ `251f7c8e9` (worktree `Birthub-360-worktrees/integracao-saneamento`, tree limpa, ahead 11)
**Data:** 2026-11-11

## Veredito geral: APROVADO (4/4)

Todos os critérios aplicáveis demonstrados com evidência executável. Nenhum bloqueador. Três achados não-bloqueantes registrados para acompanhamento (seção final).

---

## 1. Agente 05 — `agente/05-supressao-optout` — **APROVADO**

**Commits:** `f635264b6` (código+testes), `b68d927f8` (docs/handoff/run — só documentação)
**Arquivos:** `src/features/prospecting/services/cold-email.service.ts` (+92), `__tests__/cold-email.service.test.ts` (+111)

**Verificações:**
- `sendColdEmailBatch` usa corretamente `isOptedOut` (re-export via `cadence/application/optOutService.js` → `shared/services/optOutService.ts:80`), `prismaOptOutRepository` (`shared/infra/PrismaOptOutRepository.ts`, `findMatches` com `where: { organizationId, OR }` — tenant-scoped) e `toE164BR` (`lib/phone.ts:29`). Assinatura `(repo, organizationId, subject, 'email')` confere.
- Outcomes honestos: suprimidos recebem `opt-out-suppressed` e **nunca** chegam a `sendColdEmail`/transporte; elegíveis recebem `sent`/`failed` do resultado real de `sendColdEmail` (que mantém checagem de borda + deliverability — defesa em profundidade, não enfraquecida).
- Fail-closed: `organizationId` vazio → `invalid` sem consultar supressor; erro de `isOptedOut` propaga (teste confirma `rejects.toThrow` + `sendEmail` não chamado).
- LGPD/PII: log agregado só com contagens; `sendColdEmail` já loga apenas `toDomain`/`campaignId`. Sem PII nova.
- Escopo: aditivo, arquivo do próprio domínio (05). Sem código morto; tipos exportados são o contrato da feature.

**Evidência executada por mim:** `npx vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/cold-email.service.test.ts` → **9/9 passed** (worktree do agente).

**Observações não-bloqueantes:**
- Checagem por item = 1 query `findMatches` por campanha (N+1 em listas grandes). O próprio executor registrou no handoff como melhoria futura; aceitável no escopo cirúrgico.
- `sendColdEmailBatch` ainda não tem chamador de produção (a rota `POST /cold-email` segue item a item). O entregável da missão era o ponto de entrada sanitizador — coerente, mas o ganho real depende de um consumidor futuro adotá-lo.

## 2. Agente 17 — `agente/17-optout-cadencia` — **APROVADO**

**Commits:** `e6c5b8bcc` (regra pura), `af7f1071c` (wiring em `cadence.routes.ts` + 8 testes + handoffs — fiação completada pelo Agente 00 após morte do executor; auditada com o mesmo rigor)
**Arquivos:** `src/features/cadence/domain/cadenceEligibility.ts` (novo, 112 linhas), `src/features/cadence/cadence.routes.ts` (+56), `__tests__/cadenceEligibility.test.ts` (novo)

**Verificações:**
- **Equivalência com `checkOptOutStatus`** (`shared/services/optOutCheck.service.ts:108-297`): a regra pura cobre as mesmas fontes — contato anonimizado (`name === ANONYMIZED_CONTACT_NAME || deletedAt`), flags `optOut`/`optedOut` + `optOut<Canal>` em `customFields` de contato **e** de lead, `OptOutRecord` casando por leadId/e-mail/telefoneE164 com `scopeBlocksChannel` (`global` ou canal da sequência). É **igual ou mais estrita**: avalia todos os canais da sequência (vs. só `firstChannel` na camada antiga) e aceita `optedOut` também em flags de lead.
- **Tenant:** `prismaOptOutRepository.list(organizationId)` → `where: { organizationId }` (`PrismaOptOutRepository.ts:99`). Isolamento garantido na query; o teste "subjectsMatch NÃO compara organizationId" documenta o contrato corretamente.
- **Select do lead** inclui `customFields` + `contact { name, deletedAt, customFields, email, phone, whatsapp }` — suficiente para todas as fontes. `phoneE164` usa `whatsapp ?? phone`, idêntico ao `checkOptOutStatus`.
- **Canais da sequência:** `sequence` vem de `parseCadenceSequenceDefinition`, que valida `channel ∈ {email, whatsapp, voice}` (`cadenceRun.worker.ts:63-72`) — o cast `as CadenceChannel[]` é seguro.
- **Segunda camada coerente:** `checkOptOutStatus` mantido quando `lead.contactId` existe — cobre leads irmãos do mesmo contato que a avaliação por-lead não vê. Complementar, não redundante.
- **409 honesto:** inelegível → `AppError` 409 com `reason` + `matchedScope`, sem PII.
- **Gap real corrigido:** lead sem `contactId` antes não passava por checagem alguma — agora é avaliado por leadId/flags próprios.

**Evidência executada por mim:** `npx vitest run -c vitest.unit.config.ts src/features/cadence/__tests__/cadenceEligibility.test.ts` → **8/8 passed**. (00 reportou 26/26 incluindo suíte `optOut`.)

**Achado não-bloqueante (médio, recomendado follow-up):** `prismaOptOutRepository.list` tem `limit = 200` default, `orderBy createdAt desc` (`PrismaOptOutRepository.ts:99-104`). Em organização com >200 `OptOutRecord`s, um registro antigo pode ficar fora da janela — para leads **com** `contactId` a segunda camada (`checkOptOutStatus`, `findMany` sem teto) ainda captura; para leads **sem** `contactId` resta uma janela residual de fail-open. Estado anterior era zero cobertura nesse caso, então a mudança é melhora líquida estrita; sugiro handoff ao 17/01A para paginar ou usar `findMatches` por lote de identificadores.

**Governança exemplar:** o executor descobriu fora de escopo que `START_SDR_CADENCE` (`market-intelligence/server/actionExecutor.service.ts`, domínio 07) cria `CadenceRun` sem opt-out — abriu `17-para-07-optout-ausente-no-start-sdr-cadence.md` em vez de editar arquivo alheio.

## 3. Agente 23 — `agente/23-n1-metricas-ia` — **APROVADO**

**Commit:** `a6972ed8f`
**Arquivos:** `src/features/intelligence/services/agentCostAnalysis.service.ts` (cirúrgico, 1 função), `__tests__/agentCostAnalysis.service.test.ts` (novo), handoff+run docs.

**Verificações:**
- **Bug real confirmado:** schema `AILog` (`prisma/schema.prisma:1826-1846`) tem `tokens Int`, `cost Float`, `agentRole String?` — os campos antes selecionados (`costUsd`/`promptTokens`/`completionTokens`) não existem; a query falharia em runtime. Correção usa os campos reais.
- **Shape preservado:** `AgentCostAnalysis` mantém `agentType`, `totalExecutions`, `totalCostUsd`, `avgCostPerExecution`, `totalTokens`, `avgTokensPerExecution`, ordenação desc por custo, `mostExpensiveAgent`/`mostEfficientAgent`.
- **Edge cases:** `agentRole` null → `'UNKNOWN'` (`row.agentRole || 'UNKNOWN'`); `_sum` null → `0` (`?? 0`); `count > 0` garantido por `groupBy`; divisão por zero guardada.
- **Tenancy:** `where: { organizationId, createdAt: { gte: since } }` — igual ao anterior.
- **Propriedade:** arquivo é domínio do 07, mas o handoff `00-para-23-consulta-n-1-...` listou explicitamente o arquivo como escopo da missão — autorização registrada. Mudança cirúrgica (1 função, sem refatoração adjacente). Observação: um FYI ao 07 seria cortesia, mas o mecanismo de missão do 00 é a via formal de autorização.
- N+1 eliminado: 1 `groupBy` vs. `findMany` ilimitado + agregação em memória — alinhado à missão do 23.

**Evidência executada por mim:** `npx vitest run -c vitest.unit.config.ts src/features/intelligence/services/__tests__/agentCostAnalysis.service.test.ts` → **4/4 passed**.

## 4. Agente 09 — `agente/09-pwa-icons` — **APROVADO**

**Commits:** `a5150a56b` (asset + 2 linhas de config), `e5aea6404` (docs)
**Arquivos:** `public/icons/icon-512-maskable.png` (novo), `vite.config.ts` (1 linha), `index.html` (1 linha)

**Verificações:**
- PNG válido: `file` reporta **PNG 512×512, 8-bit RGBA, non-interlaced** (84556 bytes).
- **Todos os `src` do manifest PWA resolvem:** `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-512-maskable.png` existem em `public/icons/`; `purpose: 'maskable'` agora aponta para asset dedicado (correto — maskable exige safe-zone própria).
- `apple-touch-icon.png` existe em `public/` e está em `includeAssets` do VitePWA (`vite.config.ts:18`).
- Nenhuma referência quebrada; nenhum asset existente alterado.
- **Observação de propriedade:** `vite.config.ts` e `index.html` não constam da lista explícita do §15; PWA/mobile é domínio natural do 09 e o handoff `00-para-09-icones-...` autorizou a tarefa — diff mínimo (2 linhas + binário). Registrado como observação, não violação.

**Evidência:** diff de não-código; sem testes aplicáveis (justificado). Gates de build cobertos pelo `tsc --noEmit` global.

---

## Gates

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` na integração (`251f7c8e9`) | **Verificado por mim: exit 0, limpo** |
| vitest 05 `cold-email.service.test.ts` | Verificado por mim: **9/9** |
| vitest 17 `cadenceEligibility.test.ts` | Verificado por mim: **8/8** (00 reportou 26/26 com suíte optOut) |
| vitest 23 `agentCostAnalysis.service.test.ts` | Verificado por mim: **4/4** |
| vitest 09 | Não aplicável (diff não-código) — justificado |

## Achados registrados (não-bloqueantes)

1. **[Médio → Agente 17/01A]** `prismaOptOutRepository.list` truncado em 200 registros (createdAt desc) pode deixar opt-out antigo fora da janela para leads sem `contactId`. Recomendo handoff para paginação ou `findMatches` em lote. Não bloqueia: estritamente melhor que o estado anterior (zero checagem) e a segunda camada cobre leads com contato.
2. **[Baixo → Agente 05]** `sendColdEmailBatch` sem chamador de produção ainda; N+1 de `isOptedOut` por item em listas grandes. Ambos já reconhecidos pelo executor no handoff.
3. **[Baixo → Agente 23/07]** Edição de arquivo do domínio 07 autorizada formalmente pelo handoff do 00; sugiro notificação de cortesia ao 07.
4. **[Info → Agente 09/00]** `vite.config.ts`/`index.html` fora da lista explícita §15 — propriedade discutível mas dentro do domínio PWA e autorizada por handoff.

## Escopo da aprovação

Este parecer aprova **exatamente** os diffs dos commits auditados (`f635264b6`, `b68d927f8`, `e6c5b8bcc`, `af7f1071c`, `a6972ed8f`, `a5150a56b`, `e5aea6404`) conforme mergeados em `integracao/onda-saneamento-20261110` @ `251f7c8e9`. Não aprova: (a) o handoff aberto `17-para-07` (START_SDR_CADENCE sem opt-out — pendente do Agente 07); (b) qualquer trabalho futuro fora destes diffs; (c) release/deploy em produção — decisão do 00/08A conforme ciclo de vida da onda.

**Veredito: APROVADO — Wave 2 apta a prosseguir para GATE_VERDE/integração.**
