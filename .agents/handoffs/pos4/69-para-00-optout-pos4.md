# Handoff 69 → 00 — POS4-69-OPTOUT2: opt-out por sujeito identificável sem lead

De: 69 — Eli (Opt-Out e Conformidade de Canal)
Para: 00 — Astra (Coordenador Global)
Missão: POS4-69-OPTOUT2
Onda: POS4
Status: concluído (aguardando integração/auditoria)
Prioridade: alto
Bloqueador-ref: LGPD Art. 18 / supressão de envios

## Resumo

O serviço de opt-out (`src/features/notifications/opt-out/optout.service.ts`) agora
suporta opt-out por sujeito identificável **sem `leadId`** — telefone (`phoneE164`) e/ou
`email` bastam para persistir o `OptOutRecord` (`leadId: null`) e purgar jobs pendentes
das filas BullMQ. Trabalho parcial herdado de sessão anterior do agente foi avaliado,
completado (1 erro de tipo corrigido + 1 teste adicionado) e commitado.

## O que foi entregue

### `optout.service.ts` (ownership 69)

- `recordOptOutAndPurgePendingJobs(repo, input, queueInstance?)`:
  - `input.subject` aceita `leadId`/`email`/`phoneE164` com `leadId` omitido ou `null`;
    normalização (`normalizeOptOutSubject` → `toE164BR`, e-mail trim/minúsculo) é a MESMA
    de `recordOptOut`, então o persistido é o que a purga persegue.
  - Sujeito sem nenhum identificador → `record: null`, purga vazia, fila nem varrida
    (WARN) — simétrico ao comportamento de `recordOptOut`.
  - `queueInstance` agora aceita `Queue | Queue[] | null`; omitido (`undefined`) mantém o
    default histórico `whatsappCommandQueue` (retrocompatível). `null` = não purgar.
    Arrays permitem purga agregada em múltiplas filas comerciais.
  - Purga itera as filas e agrega `jobIds`; `cancelledJobsCount` = total removido.
- `cancelPendingJobsForOptOut(params, queueInstance)`:
  - `params.leadId`/`phoneE164`/`email` todos opcionais, mas exige ≥1 identificador
    aproveitável (early return com WARN antes de `getJobs`).
  - Assinatura alargada para `Queue<any> | null` (o corpo já tratava `null`; era erro de
    tipo TS2345 na chamada interna — corrigido).
  - Inalterado: estados `waiting|delayed|prioritized|waiting-children`, casamento por
    leadId/telefone(sufixo 8 dígitos)/e-mail, isolamento `organizationId` por job,
    isolamento de falhas por job (`remove()` que falha não aborta a varredura).

### Testes — `__tests__/optout.service.test.ts` (11/11 verdes)

Novos casos POS4: opt-out por telefone sem lead (persiste `leadId:null`, purga só job do
mesmo número/tenant), opt-out por e-mail sem lead (normalização do e-mail persistido),
sujeito sem identificador (no-op, `getJobs` não chamado), array de filas com agregação,
early-return direto de `cancelPendingJobsForOptOut`. Casos anteriores (estados BullMQ,
falha por job, payload malformado, fila nula, opt-out por leadId) seguem verdes —
retrocompatibilidade confirmada.

## Gates executados

- `npx vitest run -c vitest.unit.config.ts src/features/notifications/opt-out/__tests__/optout.service.test.ts` → **11/11**
- `npx tsc --noEmit` → **0 erros** (incluindo o erro pré-existente introduzido pelo trabalho parcial, corrigido)
- `npx biome lint src/features/notifications/opt-out/` → **limpo**

## Contrato para consumidores

Handoff dedicado: `.agents/handoffs/pos4/69-para-06-optout-pos4.md` — documenta assinatura
exata, semântica de `queueInstance` (undefined/null/fila/array), regra do identificador
mínimo, ausência de `subjectId`/`contactId` no contrato (contato sem lead é coberto por
email/phoneE164 e resolvido pelo gate de envio), garantias LGPD inalteradas e o gap do
lado do Agente 06: o handler de STOP inbound hoje está sob `if (lead && ...)` e precisa
chamar o serviço também quando `lead === null`.

## Race residual check-then-send

Reproduzível apenas como janela teórica (job `active` entre `getJobs` e `remove` falha o
`remove()` — coberto por teste). Não corrigível sem lock/versão no registro; mitigação
real é o gate de envio (`isOptedOut`/`checkOptOutStatus`) consultado no momento do envio.
Documentado como limitação aceita no handoff 69→06 e já registrado na Onda 4 (69→56).

## Arquivos alterados

- `src/features/notifications/opt-out/optout.service.ts` (M)
- `src/features/notifications/opt-out/__tests__/optout.service.test.ts` (M)
- `.agents/handoffs/pos4/69-para-06-optout-pos4.md` (novo)
- `.agents/handoffs/pos4/69-para-00-optout-pos4.md` (novo)

Sem envios reais, sem enfraquecimento de LGPD/RLS, commits apenas locais na branch
`agente/69-optout-pos4`.
