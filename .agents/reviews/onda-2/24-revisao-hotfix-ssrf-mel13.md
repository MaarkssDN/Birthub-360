# Parecer 24 — Hotfix SSRF MEL-13 (bypass IPv4-mapeado-em-IPv6 hex)
- Branch: fix/ssrf-mel13-onda2 | Commit: ef1ef1664 | Base: origin/main
- VEREDITO: APROVADO (com ressalvas de execução e achados residuais)

## Verificações
- Conversão hex `HHHH:HHHH` → IPv4 byte a byte correta (::ffff:7f00:1→127.0.0.1,
  ::ffff:a00:1→10.0.0.1, ::ffff:c0a8:1→192.168.0.1, ::ffff:808:808→8.8.8.8 público).
- Edge cases fail-closed: 3+ grupos hex, grupo >4 dígitos, tail vazio, dotted inválido
  → return false → hostname → DNS lookup falha → 400.
- Early-return em assertSafeOutboundUrl correto: net.isIP cobre IPv6-mapped;
  isPrivateOrInternalHost executa ANTES — mapeados privados rejeitados, públicos retornam.

## Achados residuais (NÃO bloqueiam — pré-existentes, mesma classe)
- 6to4 `2002::/16`, Teredo `2001::/32`, IPv4-compatible `::a.b.c.d`, NAT64 `64:ff9b::/96`
  continuam sem bloqueio em isPrivateOrInternalIpv6 → handoff de follow-up aberto
  (.agents/handoffs/onda-2/15-para-01-ssrf-ipv6-transition-ranges.md).

## Execução
- vitest reexecutado pelo orquestrador: 79/79 testes verdes (o auditor contou ~46 `it`
  estaticamente; a suíte inclui it.each expandidos — contagem real confirmada em runtime).
