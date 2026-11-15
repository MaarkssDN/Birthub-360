De: Agente 00 — Coordenador
Para: Agente 01 — Plataforma, Segurança e Dados (ou 15)
Onda: 2 (follow-up)
Status: aberto
Prioridade: alto
Bloqueador-ref: revisão 24 hotfix MEL-13
Sprint destino: próxima onda de segurança

## Problema

`isPrivateOrInternalIpv6` em `src/lib/security/ssrfGuard.ts` não bloqueia vetores de
transição IPv4-em-IPv6 além do mapeado `::ffff:` (corrigido no hotfix ef1ef1664):

- **6to4** `2002::/16` — IPv4 embutido nos bits 16-48 (ex.: `[2002:7f00:1::]` = 127.0.0.1)
- **Teredo** `2001::/32` — IPv4 ofuscado nos últimos 32 bits
- **IPv4-compatible** `::a.b.c.d` deprecado (RFC4291 §2.5.5.1) — ex.: `[::7f00:1]`
- **NAT64** `64:ff9b::/96` — IPv4 embutido nos últimos 32 bits

Explorabilidade depende de conectividade IPv6/transition na rede de saída, mas são
vetores SSRF reais da mesma classe do achado A-1 já corrigido.

## Arquivo(s) envolvido(s)

- `src/lib/security/ssrfGuard.ts` — `isPrivateOrInternalIpv6`
- `tests/unit/lib/security/ssrfGuard.test.ts`

## Alteração necessária

Decidir política: bloquear os prefixos de transição ou extrair o IPv4 embutido e
delegar a `isPrivateOrInternalIpv4`. Adicionar casos de teste para cada vetor.
Avaliar também se `urlGuard.ts`/`safeFetch` (camada de fetch real) tem a mesma lacuna.

## Teste esperado

`isPrivateOrInternalHost('[2002:7f00:1::]')` → true; idem Teredo/compat/NAT64 com IPv4
interno; IPv6 público de transição legítimo → comportamento documentado.

## Contexto adicional

Parecer: `.agents/reviews/onda-2/24-revisao-hotfix-ssrf-mel13.md`.
