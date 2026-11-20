# Correção UX-11 (P3 / DEBT-0065) — Deep link `?lead=<id>` com falha silenciosa

**Agente:** 04 — CRM e BI
**Onda:** WB-1 · **Data:** 2026-11-19
**Handoff de origem:** `.agents/handoffs/onda-WB1/02a-para-04-deadlink-lead-invalido.md`
**Evidência:** `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-11, CONFIRMADO)

## Diff resumido

Arquivo alterado (único): `src/features/crm/components/LeadDetailDrawer.tsx`

1. **Helper `isLeadNotFoundError`** (~:74-79): `apiFetch` (`src/lib/api.ts`) propaga erros HTTP
   como `Error(message)` sem expor `status`. O backend responde 404 de `GET /api/leads/:id` com
   `{error:'Lead not found'}` (`LeadController.ts:53`), que `apiFetch` transforma em
   `Error('Lead not found')`; falhas de rede/timeout geram mensagens próprias
   ("Não foi possível conectar ao servidor." / "A API demorou demais…"). A distinção 404↔rede
   é feita pela mensagem — regex `/lead not found|status 404/i`.
2. **Estado `loadError: 'network' | null`** (~:166).
3. **`fetchLead`** (~:181-206): catch bifurcado —
   - 404 → `toast.error('Lead não encontrado ou sem permissão de acesso')` + `onClose()`
     (comportamento de fechar mantido, agora com mensagem específica);
   - demais erros → `toast.error('Falha ao carregar detalhes do lead')` + `setLoadError('network')`,
     **sem** `onClose()` — drawer permanece aberto.
   - `setLoadError(null)` no início de cada tentativa (retry limpa o estado).
4. **Render** (~:481): novo ramo `loadError && !lead` entre `loading` e o conteúdo do lead —
   painel centralizado "Falha ao carregar — tente novamente." com botões `Button outline sm`
   "Tentar novamente" (`fetchLead()`) e `ghost sm` "Fechar" (`onClose()`). O guard `&& !lead`
   evita que uma falha de re-fetch (ex.: `handleExportToBitrix`) mascare um lead já carregado.

Sem alteração de rota, contrato de API ou `api.ts`. `CrmBoard.tsx` não tocado.

## Verificação

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | **exit 0**, sem saída (limpo) |
| `npm run lint` (biome, `src`) | **exit 0** — 1561 warnings + 2 infos **pré-existentes** no repo; zero diagnósticos em `LeadDetailDrawer.tsx` ou `features/crm/**` (grep no output completo) |
| Teste do drawer | **não existe** teste dedicado (`find tests src -iname "*LeadDetailDrawer*"` → só o próprio arquivo); `src/features/crm/__tests__` contém apenas `leadScoreCalculator.test.ts` — não executado (não cobre o drawer) |

**Limitação conhecida:** a distinção 404↔rede depende da mensagem do erro (status HTTP não é
exposto por `apiFetch`). Se o backend mudar a mensagem de 404, o caso cairia no ramo de erro de
rede (drawer permanece com retry) — degradação segura, sem fechar silenciosamente. Expor
`status` no erro exigiria alterar `src/lib/api.ts` (fora do escopo desta missão).

**Não commitado**, conforme instrução. Nenhum git executado.
