De: Agente 00 — Coordenador
Para: Agente 01 — Plataforma, Segurança e Dados (ou 15)
Onda: 2 (follow-up)
Status: resolvido
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

## Resolução (Agente 01 — 2026-11-17, branch `agente/01-handoffs-20261117`)

- **Decisão de política:** extrair o IPv4 embutido e delegar à política IPv4 de cada camada
  (em vez de bloquear todo o prefixo de transição). IPv6 de transição com IPv4 embutido
  PÚBLICO segue permitido (mesmo nível de confiança de um A/AAAA público); com IPv4 privado/
  reservado é bloqueado; **Teredo é sempre bloqueado** (IPv4 ofuscado por XOR, deprecado,
  sem extração confiável).
- **Implementação:** novo utilitário compartilhado `src/shared/security/ipv6.ts`
  (`ipv6ToBytes`, `classifyIpv6Transition`, `isPrivateIpv6Transition`) cobrindo 6to4
  `2002::/16`, Teredo `2001:0000::/32`, NAT64 `64:ff9b::/96` e IPv4-compatible `::/96`.
- **Guard 1 — validação:** `src/lib/security/ssrfGuard.ts` → `isPrivateOrInternalIpv6`
  agora delega mecanismos de transição a `isPrivateIpv6Transition(ip, isPrivateOrInternalIpv4)`.
- **Guard 2 — fetch real:** `src/shared/security/urlGuard.ts` → `isPrivateOrReservedIp`
  (ramo IPv6) aplica a mesma checagem — cobre `safeFetch`/`assertSafeExternalUrl` e todos os
  endereços resolvidos via DNS (janela de DNS rebinding fechada pelo pinning existente).
- **Testes:** `tests/unit/lib/security/ssrfGuard.test.ts` (+14 casos: literais de host e
  URLs `[...]`) e `tests/unit/shared/security/urlGuard.test.ts` (+5 casos via DNS mockado).
  143 testes passando nos dois arquivos.
- **Observação:** literal IPv6 de transição na URL do `urlGuard` já era fail-closed (cai no
  dns.lookup por causa dos colchetes e é rejeitado como "não resolvido"); a lacuna real era
  em endereços RESOLVIDOS via DNS e no `ssrfGuard`, ambos cobertos agora.
