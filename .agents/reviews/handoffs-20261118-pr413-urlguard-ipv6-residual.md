# Parecer Agente 24 — Revisão Independente — PR #413 (residual urlGuard IPv6, sucessor do #394)

- **Data:** 2026-11-18
- **Revisor:** Agente 24 — Revisão Independente
- **PR:** #413 `fix(security): urlGuard — fe80::/10 completo e ::ffff hex (residual do #394)`
- **Branch/revisão:** `fix/urlguard-ipv6-residual` @ `6c077189bb36c0ca9ec56dd002cd469d17bf7d99` (base `origin/main` @ `8b40cdb902e9cbe938ed7066579a20760bf199e9`)
- **Autor:** Coordenador (extração dos deltas exclusivos acordados no parecer do PR #394)
- **Método:** `git diff origin/main...fix/urlguard-ipv6-residual` integral; leitura de `urlGuard.ts`, `ipv6.ts` (PR #381, já em main) e `ssrfGuard.ts`; execução real dos testes no worktree `fix-urlguard-ipv6`; verificação do parser WHATWG com Node local.

## Contexto

O parecer `handoffs-20261118-15-pr394-ssrf-ipv6-dedup.md` bloqueou o diff de código do PR #394 por duplicar ~140 linhas de parser IPv6 já entregue canonicamente pelo PR #381 (`src/shared/security/ipv6.ts`, mergeado), e determinou que prevaleceria #381, com #394 reduzido aos deltas exclusivos de `urlGuard.ts`. O PR #413 é exatamente essa extração: **32 linhas de diff** (10 em `urlGuard.ts`, 24 em testes).

## Escopo entregue

1. `src/shared/security/urlGuard.ts` — `isPrivateOrReservedIp`:
   - `lower.startsWith('fe80:')` → `/^fe[89ab]/.test(lower)` — link-local `fe80::/10` completo (`fe80`–`febf`).
   - Branch `::ffff:`: novo fallback via `ipv6ToBytes(ip)` que extrai os últimos 32 bits quando a cauda não é dotted-quad (forma hex `::ffff:HHHH:LLLL`, que o parser WHATWG entrega), com guarda `bytes[10] === 0xff && bytes[11] === 0xff` antes de reavaliar o IPv4 embutido pela política IPv4 existente.
   - Import passa a incluir `ipv6ToBytes` do módulo canônico `./ipv6.js` — **sem parser paralelo**.
2. `tests/unit/shared/security/urlGuard.test.ts` — 3 testes novos: rejeita `febf::1` (link-local fora de `fe80:` literal), rejeita `::ffff:a00:1` (= 10.0.0.1, DNS-level), aceita `::ffff:808:808` (= 8.8.8.8).

## Verificações

### Correção real dos dois gaps
- **`fe80::/10`:** o regex `/^fe[89ab]/` cobre exatamente o /10 (`1111111010` nos 10 primeiros bits → `fe80`–`febf`); não alarga para `fec0`+ nem restringe. Antes, `fe90:`–`febf:` escapavam. Correto.
- **`::ffff:` hex:** confirmado o bypass pré-existente — na forma `::ffff:a00:1`, `lower.split(':').pop()` devolve `"1"` (não IPv4), caía em `isPrivateIpv6Transition` → `classifyIpv6Transition` retorna `null` (bytes 10–11 = `0xffff` não casam com nenhum mecanismo) → endereço tratado como público. O fallback agora extrai `a00:1` → `10.0.0.1` → `isPrivateOrReservedIp` → rejeita. `ipv6ToBytes` já existia em `ipv6.ts` (#381) e trata compressão/cauda dotted — reutilização correta, zero duplicação.
- **Caso público preservado:** `::ffff:808:808` → `8.8.8.8` → retorna `false` direto (não cai no fluxo de transição) — teste de aceite comprova.

### Sem bypass residual introduzido
- Formas não-canônicas (`0:0:0:0:0:ffff:a00:1`) **não** passam por `startsWith('::ffff:')`, mas são inalcançáveis nos caminhos reais: `new URL()` canonicaliza IPv6 para a forma comprimida (verificado: `https://[0:0:0:0:0:ffff:10.0.0.1]/` → hostname `[::ffff:a00:1]`) e `dns.lookup`/`getaddrinfo` devolve forma canônica. Literal IPv6 em URL cai no caminho de DNS lookup e falha fechado (comportamento pré-existente documentado no próprio teste).
- `::ffff:` com cauda dotted continua coberto pelo ramo anterior (`mapped` + `net.isIPv4`) — precedência preservada.

### Simetria com `ssrfGuard.ts` (verificação pedida na missão)
- `src/lib/security/ssrfGuard.ts:82` já tem `/^fe[89ab]/` (além do `startsWith('fe80:')` redundante) — **equivalente coberto**.
- `ssrfGuard.ts:84-99` já trata `::ffff:` dotted E hex (2 hextetos) — **equivalente coberto**, implementado de forma independente mas funcionalmente igual.
- **Gap simétrico residual (não introduzido por este PR, pré-existente em main):** ambos os guards detectam IPv4-mapeado por prefixo textual `::ffff:`. Uma string não-canônica `0:0:0:0:0:ffff:7f00:1` passada **diretamente** (sem passar por `new URL()`) a `isPrivateOrInternalHost`/`isPrivateOrReservedIp` escaparia do ramo mapped e cairia em `isPrivateIpv6Transition` → `null` → público. Risco baixo porque os callers reais recebem hostname já canonicalizado por WHATWG ou `getaddrinfo`. **Recomendo handoff** (não bloqueia este PR): canonicalizar a detecção de mapped via `ipv6ToBytes` + check de bytes 10–11 = `0xffff` em `ipv6.ts` (ex.: helper `embeddedIpv4FromIpv6`), unificando os dois guards.

### Qualidade dos testes
- Cobrem os dois lados (rejeita privado / aceita público) nos vetores novos; mocks de DNS seguem o padrão do arquivo; nomes descritivos com a forma hex explicitada. Adequados.

### Escopo cirúrgico (P3) e não-duplicação
- Diff de 32 linhas; toca apenas `urlGuard.ts` e seu teste. Nenhuma linha de `ipv6.ts`, `ssrfGuard.ts` ou código alheio alterada. Reutiliza `ipv6ToBytes` do módulo canônico — conforme a resolução acordada no parecer do #394. P2/P3 satisfeitos.

## Gates executados (worktree `fix-urlguard-ipv6`, head `6c077189b`)

| Comando | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts tests/unit/shared/security/urlGuard.test.ts` | **51/51 verde**, exit 0 |
| `npx tsc --noEmit` | **exit 0**, sem erros |

## Achados

1. **[Normal → Agente 01/15]** Detecção de IPv4-mapeado por prefixo textual `::ffff:` é frágil a formas não-canônicas em chamadas diretas (sem `new URL`). Sugerido: mover a extração para `ipv6.ts` via bytes. Pré-existente, simétrico nos dois guards — não é regressão deste PR. Pode virar handoff.
2. **[Info]** `ssrfGuard.ts:82` mantém `startsWith('fe80:') ||` redundante junto do regex — cosmético, fora de escopo (P3).

## Veredito

**APROVADO** — para merge do PR #413.

- Os dois deltas exclusivos acordados no parecer do #394 estão implementados corretamente, com teste de regressão nos dois sentidos.
- Zero duplicação com `ipv6.ts`; escopo mínimo; gates verdes.
- O gap simétrico restante em `ssrfGuard.ts` é pré-existente e não é regressão — fica registrado como handoff recomendado, não como condição de merge.

## Consequência para o PR #394

O PR #394 pode ser **fechado como substituído pelo #413** no que diz respeito ao código SSRF: os deltas exclusivos de `urlGuard.ts` (`fe80::/10` + `::ffff:` hex + testes) foram integralmente portados para #413. Restam no #394 apenas os updates de status dos handoffs/documentação, que o coordenador tratará (conforme orientação da missão). A parte documental do #394 já havia sido aprovada no parecer anterior.

**Revisão exata:** head `6c077189bb36c0ca9ec56dd002cd469d17bf7d99`, base `origin/main` `8b40cdb902e9cbe938ed7066579a20760bf199e9`.
**Arquivos:** `src/shared/security/urlGuard.ts`, `tests/unit/shared/security/urlGuard.test.ts`.
**Riscos:** baixos; único residual é o gap pré-existente de forma não-canônica (achado 1).
**Pendências:** nenhuma bloqueadora. Recomendado handoff para canonicalização byte-level do mapped nos dois guards.
**Autor da entrega:** Coordenador. **Auditor:** Agente 24.
**Veredito:** APROVADO.
**Escopo exato da aprovação:** diff `origin/main...fix/urlguard-ipv6-residual` @ `6c077189b` (PR #413) — 2 arquivos, 32 linhas.
**Segredos/PII:** nenhum.

*Estrutura do parecer conforme `.agents/prompts/24-revisao-independente.md`.*
