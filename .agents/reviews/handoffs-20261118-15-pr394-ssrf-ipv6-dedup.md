# Parecer Agente 24 — Revisão Independente — PR #394 (Agente 15) + decisão de dedup SSRF #381×#394

- **Data:** 2026-11-18
- **Revisor:** Agente 24 — Revisão Independente
- **PR:** #394 `fix(15): saneamento handoffs segurança`
- **Branch/revisão:** `agente/15-handoffs-20261117` @ `70b429c5012d6d635fafd703fe76147dff456b1d` (base `origin/main` @ `f8d4bc76d`)
- **Método:** diff integral via `git diff origin/main...<branch>`; comparação linha a linha com a implementação equivalente do PR #381; execução real dos testes no worktree `agente-24-inspect-394` (detached no head do PR).

## Escopo entregue

1. Código: `src/lib/security/ssrfGuard.ts` e `src/shared/security/urlGuard.ts` — parser `ipv6ToHextets` + classificador `embeddedIpv4FromIpv6` **duplicados nos dois arquivos** (~70 linhas cada), cobrindo: `::ffff:` mapped (dotted E hex), 6to4 `2002::/16`, Teredo `2001:0000::/32` → `'block'` integral, NAT64 `64:ff9b::/96`, IPv4-compatible `::/96`, e fail-closed para IPv6 malformado. Bônus: `urlGuard.ts` alinha link-local para `/^fe[89ab]/` (fe80::/10 completo — antes só `fe80:` literal).
2. Testes: `ssrfGuard.test.ts` (arrays parametrizados — 8 vetores rejeitados, 3 públicos) e `urlGuard.test.ts` (`it.each` — 9 casos DNS-level incluindo mapped hex).
3. Docs/handoffs: atualização de `15-para-01-ssrf-ipv6-transition-ranges` (status `resolvido` com seção Resolução), `15-para-07-webhook-fetch-safeFetch`, `15-para-00-rotacao-segredos-devstack-2375`, `00-para-15-forense`.

## Verificações

### Autorização de propriedade
- O handoff `onda-2/15-para-01-ssrf-ipv6-transition-ranges.md` tem destinatário **"Agente 01 — Plataforma, Segurança e Dados (ou 15)"** — o Agente 15 assumiu explicitamente e registrou a decisão na seção Resolução. Portanto tocar `src/lib/security/ssrfGuard.ts` e `src/shared/security/urlGuard.ts` está **autorizado**; não há violação de propriedade.

### Correção funcional (comparada ao main e ao PR #381)
- Vetores cobertos corretamente: mapeado/hex, 6to4, Teredo (bloqueio conservador — IPv4 ofuscado por XOR, correto), NAT64, IPv4-compatible `::/96`. IPv6 nativo público segue o fluxo normal (testes "aceita" comprovam).
- `ipv6ToHextets` é um parser próprio (não usa `net.isIPv6` como pré-validação interna, mas os callers já checam `net.isIPv6(ip)` antes) — fail-closed em forma não-expansível.
- Testes executados: **146/146 verde** (`ssrfGuard.test.ts` 90, `urlGuard.test.ts` 56).

### Problema central — DUPLICAÇÃO com PR #381 (decisão de dedup pedida na missão)

O PR #381 (Agente 01, head `6cc360611`) implementa **o mesmo escopo** do mesmo handoff de forma diferente:

| Dimensão | PR #381 | PR #394 |
|---|---|---|
| Estrutura | módulo único `src/shared/security/ipv6.ts` (`ipv6ToBytes` byte-level + `classifyIpv6Transition` + `isPrivateIpv6Transition` com política IPv4 **injetada** por camada) | `ipv6ToHextets` + `embeddedIpv4FromIpv6` **duplicados verbatim** em `ssrfGuard.ts` e `src/shared/security/urlGuard.ts` (~70 linhas × 2 arquivos) |
| Diff nos guards | +3 linhas em cada guard (uma chamada) | reescrita da função inteira em cada guard |
| `::ffff:` hex em urlGuard | **NÃO coberto** (gap pré-existente de `main` mantido: o bloco `::ffff:` de `urlGuard.ts` só trata cauda dotted) | **Coberto** (`groups[5]===0xffff` → IPv4 embutido) |
| `fe80::/10` em urlGuard | **NÃO corrigido** (segue `startsWith('fe80:')` literal — `fe90:`–`febf:` escapam) | **Corrigido** (`/^fe[89ab]/`) |
| IPv6 malformado | `ipv6ToBytes` → `null` → tratado como não-transição (fail-open teórico, inalcançável na prática pois `net.isIPv6` precede) | `'block'` explícito (fail-closed) |
| Testes | equivalentes nos vetores de transição; urlGuard com 4 vetores DNS + 1 público | equivalentes + mapped hex + mais casos parametrizados |

**Análise:**
- **Arquitetura:** #381 é superior — fonte única de verdade, política de IPv4 injetada por camada (ssrfGuard e urlGuard têm listas de privados ligeiramente diferentes e ambas são respeitadas), diffs mínimos nos guards. #394 viola P2 (simplicidade/não-duplicação: ~140 linhas duplicadas nos dois arquivos) e criaria conflito direto de merge com #381 nas mesmas regiões dos mesmos arquivos.
- **Cobertura funcional:** #394 é estritamente superior **somente em `urlGuard.ts`** — cobre `::ffff:` em forma hexadecimal (ex.: `::ffff:7f00:1`, forma que `new URL()`/WHATWG produz e que pode vir de DNS) e completa `fe80::/10`. Esses dois gaps existem em `main` hoje e **não são regressão do #381** — são débitos pré-existentes que o #394 corrigiu e o #381 não tocou.
- **Veredito de dedup: prevalece a implementação do PR #381** como base canônica (mergear #381 primeiro). O PR #394 deve ser **rebaseado para um diff mínimo** que preserve apenas o delta exclusivo: (a) tratamento de `::ffff:` hex e (b) `fe80::/10` em `src/shared/security/urlGuard.ts`, de preferência estendendo `ipv6.ts`/`urlGuard.ts` sobre a base pós-#381 — sem reintroduzir parser paralelo. Alternativa aceitável: fechar o diff de código do #394 e abrir handoff 15→01/15 para portar os dois fixes incrementais.

### Escopo/propriedade
- Código: autorizado pelo handoff ("01 ou 15") — sem violação.
- Handoffs/docs: dentro do domínio do 15.

## Veredito

**BLOQUEADO para merge do diff de código como está** — não por correção (os vetores estão certos e testados), mas por **duplicação integral com o PR #381 já em revisão** (mesmo escopo, mesmos arquivos, implementações concorrentes) combinada com violação de P2 (~140 linhas duplicadas). A parte de handoffs/docs do PR é aprovada em conteúdo.

**Recomendação de merge:**
1. Mergear **PR #381 primeiro** (implementação canônica `ipv6.ts`).
2. PR #394: **rebasear** removendo `ipv6ToHextets`/`embeddedIpv4FromIpv6` duplicados; manter como diff mínimo apenas os dois fixes incrementais de `urlGuard.ts` (mapped hex + `fe80::/10`) + testes correspondentes, sobre a nova base. Se o 15 preferir, descartar o código e registrar handoff para o 01 portar os deltas.
3. Registrar neste parecer que os gaps `::ffff:`-hex e `fe80::/10` em `urlGuard.ts` são **débitos de `main`** que o #394 corrigiu — não podem se perder no dedup.

---

## Evidência executável

- `npx vitest run tests/unit/lib/security/ssrfGuard.test.ts tests/unit/shared/security/urlGuard.test.ts` (worktree `agente-24-inspect-394`) → **146/146 verde** (exit 0).
- Comparação de implementação feita sobre os blobs completos dos dois branches (`git show <branch>:<path>`).

**Revisão exata:** head `70b429c5012d6d635fafd703fe76147dff456b1d`.
**Arquivos:** 8 no diff (2 guards, 2 testes, 4 handoffs).
**Riscos:** conflito de merge direto com #381; regressão de arquitetura (parser duplicado) se ambos mergearem.
**Pendências:** rebase/dedup do diff de código; port dos fixes incrementais de `urlGuard.ts`.
**Autor:** Agente 15 — Segurança Aplicada. **Auditor:** Agente 24.
**Veredito:** BLOQUEADO (diff de código) / APROVADO (parte documental).
**Escopo exato da aprovação:** apenas os arquivos `.agents/handoffs/**` do PR #394; nenhuma aprovação do código SSRF até dedup.
**Reauditoria:** obrigatória após rebase do #394.
**Segredos/PII:** nenhum.
**Recomendação final ao 00:** sequenciar merges 381 → (394 rebaseado ou handoff de port).

*Estrutura do parecer conforme `.agents/prompts/24-revisao-independente.md`.*
