De: Agente 00 — Coordenador
Para: Agente 01 — Plataforma, Segurança e Dados
Onda: handoffs-20261117 (follow-up revisão 24 do PR #413)
Status: resolvido
Prioridade: normal
Bloqueador-ref: parecer 24 em `.agents/reviews/handoffs-20261118-pr413-urlguard-ipv6-residual.md`
Sprint destino: próxima onda de segurança

## Problema

Ambos os guards SSRF (`src/lib/security/ssrfGuard.ts` e
`src/shared/security/urlGuard.ts`) detectam IPv4-mapeado pela forma textual
`::ffff:`. Uma forma expandida não-canônica equivalente —
`0:0:0:0:0:ffff:7f00:1` (mesmo endereço, sem compressão `::`) — passada
diretamente a `isPrivateOrReservedIp`/`isPrivateOrInternalIpv6` escaparia da
checagem mapeada. Risco baixo: os callers reais recebem hostname já
canonicalizado por `new URL()`/getaddrinfo (WHATWG normaliza para
`[::ffff:a00:1]`), mas a função isolada não é robusta a entrada crua.

## Arquivo(s) envolvido(s)

- `src/shared/security/ipv6.ts` (parser canônico — dono efetivo: 01)
- `src/lib/security/ssrfGuard.ts`
- `src/shared/security/urlGuard.ts`

## Evidência

Parecer do Agente 24 no PR #413: "ambos os guards detectam IPv4-mapeado por
prefixo textual `::ffff:` — uma forma não-canônica passada diretamente (sem
`new URL()`) escaparia. Recomendo handoff para canonicalização byte-level em
`ipv6.ts`."

## Alteração necessária

Canonicalizar byte-level: em `classifyIpv6Transition` (ou novo helper em
`ipv6.ts`), reconhecer IPv4-mapeado pelos bytes 10–11 = 0xffff independente da
forma textual, e expor um `embeddedIpv4FromIpv6(ip)` único consumido pelos dois
guards — eliminando a dependência do prefixo textual `::ffff:`.

## Teste esperado

- `isPrivateOrReservedIp('0:0:0:0:0:ffff:7f00:1')` → privado (rejeita).
- Equivalente em `ssrfGuard`.
- Sem regressão nos 51 testes atuais de `urlGuard.test.ts`.

## Contexto adicional

Não é bloqueador de merge (risco baixo, callers canonicalizam). Registrar como
débito de hardening.

## Resolução (Agente 01 — 2026-11-18, branch `agente/01-waveD-ipv6-canonico`)

Implementado exatamente o pedido: novo helper `embeddedIpv4FromIpv6(ip)` em
`src/shared/security/ipv6.ts` que reconhece IPv4-mapeado **byte-level**
(bytes 0–9 zerados + bytes 10–11 = `0xffff`, RFC 4291 §2.5.5.2), independente
da forma textual. Consumido pelos dois guards:

- `src/shared/security/urlGuard.ts` — `isPrivateOrReservedIp` e `isLoopbackIp`
  substituíram os blocos `startsWith('::ffff:')` + parsing manual por
  `embeddedIpv4FromIpv6`; import de `ipv6ToBytes` removido (ficou sem uso).
- `src/lib/security/ssrfGuard.ts` — `isPrivateOrInternalIpv6` idem.
- `classifyIpv6Transition`/`isPrivateIpv6Transition` **inalterados** (o
  IPv4-compatible `::/96` exige bytes 10–11 ≠ 0xffff por definição — sem
  sobreposição com o mapeado).

Testes novos:
- `ssrfGuard.test.ts`: rejeita `0:0:0:0:0:ffff:7f00:1`, `...:a00:1`,
  `...:c0a8:1` e `0000:...:ffff:0a00:0001`; aceita `0:0:0:0:0:ffff:808:808`
  (8.8.8.8 público).
- `urlGuard.test.ts`: DNS resolvendo para `0:0:0:0:0:ffff:a00:1` e
  `0000:...:ffff:0a00:0001` → rejeitado; `0:0:0:0:0:ffff:808:808` → aceito.

Gate: `npx vitest run -c vitest.unit.config.ts` nos dois arquivos →
154/154 verde; `npx tsc --noEmit` limpo; `npx biome format --write` sem fixes.
