# Reconciliação Mobile — linhagem Onda 4 (9f80c07ed) × base Squad 80 (93e82c220)

- Agente 80 — Navi · DEM-20261123-001 · coord/squad-80 @ squads/squad-80/wt-coord
- Determinação do Orquestrador Humano (§8): reconciliar alterações do Agente 85 (Bóris)
  presentes na linhagem `9f80c07ed` antes de qualquer promoção. **Nada foi mergeado/cherry-pickado.**

## 1. Ancestralidade confirmada

| Pergunta | Resposta | Evidência |
|---|---|---|
| `1e0f77b45` (commit Bóris) é ancestral de `93e82c220` (base squad)? | **NÃO** | `git merge-base --is-ancestor` → false |
| `1e0f77b45` é ancestral de `9f80c07ed` (head Onda 4)? | **SIM** | via merge `d0c9f3b0d` ("incorporar Agente 85 — APROVADO") |
| merge-base(93e82c220, 9f80c07ed) | `32d07c375` (head `integracao/onda-3-dem20261123`) | divergência real a partir da Onda 3 |

### Topologia real das linhagens

```
32d07c375 (onda-3 head, comum)
 ├──► linhagem SQUAD (clone C:): Rodada 3 merges (0141f258a …) → 93e82c220 (governança squads)
 │      └── coord/squad-80 → 062b12044 (plano+inventário)
 └──► linhagem ONDA-4 (clone D:): merges onda-4 incl. Bóris d0c9f3b0d → 9f80c07ed
        └── coord/squad-30 (sem commits próprios)
```

- Ambas as linhagens são **locais-only** (não existem no remoto `origin`): verificado via
  `git ls-remote`/`git fetch origin <sha>` → "couldn't find remote ref".
- Os objetos da linhagem Onda 4 foram trazidos ao clone C: via
  `git fetch /d/Github/Birthub-360 integracao/onda-4-dem20261123` (FETCH_HEAD; sem efeito
  destrutivo, sem branch criada).
- Alerta do Silas confirmado e refinado: `coord/squad-30` está em `9f80c07ed` (linhagem Onda 4),
  enquanto squads 10/20/40/50/60/70/90 estão em `93e82c220` ou SHAs próprios — **bases divergentes
  entre squads confirmadas**; squad-30 é o único na linhagem Onda 4.

## 2. Diff mobile entre as linhagens — resultado cirúrgico

`git diff 93e82c220 9f80c07ed -- <todos os paths mobile>`:

- `src/mobile/offline/sync.ts` — 17 linhas alteradas (validação de `base.id/base.tenantId` +
  remoção de chaves `undefined` pós-merge)
- `src/mobile/offline/__tests__/sync.test.ts` — NOVO, 169 linhas (9 testes)
- **Zero diferenças** em: `capacitor.config.ts`, `android/**`, `ios/**`, `src/mobile/{index,deeplinks,security,telemetry,native-audio,ui,plugins,ios}/**`,
  `src/features/mobile/**`, `tests/unit/{mobile,features/mobile,navigation}/**`, e2e mobile.

Drill-down: `32d07c375→93e82c220` tocou **zero** arquivos mobile; `32d07c375→9f80c07ed` tocou
**exatamente** os 2 arquivos do Bóris. Ou seja: **todo o delta mobile entre as linhagens é o
commit `1e0f77b45` do Agente 85** (mais o handoff `.agents/handoffs/onda4/85-para-00-...` que veio
no merge `d0c9f3b0d`).

## 3. Conflitos semânticos

- **offline-sync (`sync.ts`)**: versões divergem apenas no guard de integridade e na limpeza de
  `undefined`. A versão squad aceita `base` de outro tenant/entidade silenciosamente (merge
  corrompido) e mantém chave `undefined` após deleção local — ambos corrigidos na Onda 4.
  **Sem conflito de merge**: o diff aplica limpo (contexto idêntico).
- **deeplinks**: idênticos nas duas linhagens — a divergência nativo×handler.ts (ver §6) existe
  em ambas; não é efeito da linhagem.
- **storage/security**: idênticos; achados A1 (sem `X-Idempotency-Key` HTTP), A2 (chaves sem
  escopo de tenant), A3 (`offlineSyncQueue.service.ts` morto) permanecem **abertos nas duas
  linhagens** — não foram endereçados pela Onda 4.
- **`src/features/mobile/**`**: idêntico nas linhagens; ownership gap (R4) inalterado.

## 4. Proposta de integração não destrutiva (NÃO executada)

Como o delta mobile é exatamente um commit já aprovado pelo Silas, o caminho limpo é
**cherry-pick com proveniência** — não merge da linhagem inteira (que traria 206 arquivos de
delta não-mobile e misturaria escopo):

```bash
# em coord/squad-80 (worktree wt-coord), após OK do Astra:
git cherry-pick 1e0f77b45
# esperado: limpo — toca apenas src/mobile/offline/{sync.ts,__tests__/sync.test.ts}
# validação:
npx vitest run -c vitest.unit.config.ts src/mobile/offline/__tests__/sync.test.ts \
  tests/unit/mobile tests/unit/features/mobile src/features/mobile/__tests__
npx tsc --noEmit
```

- Alternativa equivalente (se cherry-pick for vetado): `git checkout 9f80c07ed -- src/mobile/offline/sync.ts src/mobile/offline/__tests__/sync.test.ts` — mesmo resultado de conteúdo, sem proveniência de commit.
- O handoff `.agents/handoffs/onda4/85-para-80-mobile-offline-onda4.md` (cópia do doc do Bóris) deve acompanhar via cherry-pick de `d0c9f3b0d` **somente se** o Astra quiser o artefato na linhagem squad; caso contrário referenciar no handoff 80→85.
- Após cherry-pick: SHA → Silas (09) → merge em `integracao/squad-80` → promoção via Astra.
- **Nada foi executado**: nenhum merge/cherry-pick/checkout foi feito nesta sessão.

## 5. Validação de testes na base correta (executada)

Base `93e82c220` + commit de docs `062b12044` (sem alteração de código mobile):

- `npx vitest run -c vitest.unit.config.ts tests/unit/mobile tests/unit/features/mobile` → **43/43**
- `npx vitest run -c vitest.unit.config.ts src/features/mobile/__tests__` → **35/35**
- **Total 78/78 verde.** `sync.test.ts` do Bóris ainda não existe nesta base (será criado pelo
  cherry-pick); os 9 testes novos devem passar pois o `sync.ts` resultante será byte-a-byte o
  aprovado na Onda 4 — a validar no gate pós-cherry-pick.

## 6. Deep link P0 — handoff preparado para Agente 84 (ver handoff dedicado)

Três divergências reais documentadas em `.agents/handoffs/squad-80/84-para-84-deeplink-parsers-divergentes.md`:
1. `handler.ts` testa `protocol === 'birthhub:'`, mas o scheme real é `birthhub360:` → todo link
   custom cai em `'/app'` (fallback silencioso).
2. Mapa `ALLOWED_DEEP_LINK_HOSTS` (5 hosts) diverge dos `VALID_TABS` nativos (~46 tabs);
   `voice` → `/app/voice-hub` (web) vs `/app/voice` (nativo).
3. `handler.ts`/`MobileDeepLinkRouter` só é referenciado pelo próprio teste — código dormente
   cujo contrato precisa ser unificado antes de qualquer uso.

## 7. Owners propostos para `src/features/mobile/**` (14 arquivos) — handoff ao Astra

| Subconjunto | Arquivos | Owner proposto |
|---|---|---|
| outbox/sync offline | `offlineSync.service.ts`, `services/offlineSyncQueue.service.ts`, `services/offlineStorageAdapter.ts` | **85 Bóris** (com handoff backend p/ idempotency — 20/24) |
| storage criptografado | `services/encryptedOfflineStorage.service.ts` | **88 Sasha** (com 85 em revisão) |
| áudio/gravação | `audioRecording.service.ts`, `components/FieldMeetingRecorder.tsx` | **87 Tomás** (overlap c/ Squad 60 — Sol/Lena) |
| edge AI mobile | `mobileEdgeAi.service.ts` | **85 Bóris** (geofencing/briefing) ou 74 Luca — decidir |
| server/rotas campo | `server/mobileFieldMeeting.{routes,service}.ts` | **20 Ciro** (backend) com revisão 85 |
| índice/contratos | `index.ts`, `__tests__/` | **80 Navi** (coordenação) |

Registrado em `.agents/handoffs/squad-80/00-para-00-matriz-features-mobile.md`.
