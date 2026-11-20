# Parecer 24 — PR #436 (Agente 01): canonicalização IPv4-mapeado byte-level

- **Missão/Onda:** Wave D — revisão independente do PR #436.
- **Autor:** Agente 01 — Plataforma, Segurança e Dados.
- **Auditor:** Agente 24 — Revisão Independente.
- **Base:** `main` (origin/main @ `ba33e6dc4` no momento da revisão).
- **Revisão exata:** head `agente/01-waveD-ipv6-canonico` @ `4db5c61ffc29f13ca74809dc35c26d68d5acda36`.
- **Worktree auditado:** `C:\Github\Birthub-360-worktrees\agente-01-waveD`.
- **Arquivos:** `src/shared/security/ipv6.ts`, `src/shared/security/urlGuard.ts`, `src/lib/security/ssrfGuard.ts`, `tests/unit/lib/security/ssrfGuard.test.ts`, `tests/unit/shared/security/urlGuard.test.ts`, `.agents/handoffs/00-para-01-ipv6-mapeado-forma-nao-canonica.md`.

## Critérios e resultados

1. **Cobertura byte-level correta (RFC 4291 §2.5.5.2):** `embeddedIpv4FromIpv6` (`ipv6.ts` L90-96) delega a `ipv6ToBytes` e exige bytes 0–9 zerados + bytes 10–11 = `0xff 0xff`, retornando dotted-quad dos bytes 12–15. Correto: é exatamente a definição binária de IPv4-mapeado, independente da forma textual. Sem falso positivo possível — qualquer IPv6 que satisfaça o padrão É mapeado por definição.
2. **Não-canônico bloqueado:** `0:0:0:0:0:ffff:7f00:1` e `0000:...:ffff:0a00:0001` agora passam por `net.isIPv6` → `embeddedIpv4FromIpv6` → `isPrivateOrInternalIpv4`/`isPrivateOrReservedIp`/`isLoopbackIp`. Confirmado por teste executado (ver abaixo).
3. **Público preservado:** `0:0:0:0:0:ffff:808:808` (8.8.8.8) aceito — teste novo verde.
4. **Sem regressão em transição:** `classifyIpv6Transition`/`isPrivateIpv6Transition` inalterados; IPv4-compatible `::/96` exige bytes 10–11 = 0, portanto não colide com o mapeado (bytes 10–11 = 0xffff). NAT64 (`64:ff9b::/96`), 6to4 (`2002::/16`) e Teredo (`2001:0::/32`) não satisfazem o padrão do helper. Ordem de avaliação nos guards (mapeado antes de transição) é segura porque os conjuntos são disjuntos.
5. **Helper compartilhado:** `embeddedIpv4FromIpv6` retorna `null` para inválido/não-mapeado; callers tratam `null` corretamente. `ipv6ToBytes` já validava via `net.isIPv6` e trata zona `%`, dotted-quad tail e compressão — o helper herda essa robustez.
6. **Residual menor (não bloqueante):** em `ssrfGuard.ts` `isPrivateOrInternalHost` permanece o regex textual `^::ffff:(\d+\.\d+\.\d+\.\d+)$` (L48-51) como fallback para a forma dotted — redundante quando `net.isIPv6` aceita a forma, mas inócuo e fora do escopo cirúrgico do PR.

## Comandos executados (no worktree do autor)

- `npx vitest run -c vitest.unit.config.ts tests/unit/shared/security/urlGuard.test.ts tests/unit/lib/security/ssrfGuard.test.ts` → **154/154 verde** (exit 0), confirmando a alegação.
- `npx tsc --noEmit` → limpo (exit 0).

## Achados

- Nenhum achado bloqueador. Implementação cirúrgica (P3), escopo respeitado, testes cobrem os casos exigidos pelo handoff, handoff marcado `resolvido` com seção de resolução verificável.

## Pendências/riscos

- Risco residual baixo já documentado: callers recebem hostname canonicalizado por WHATWG; o helper blinda chamadas diretas com entrada crua. Sem novo risco introduzido.

## Veredito

**APROVADO** — para o head `4db5c61f`. Qualquer alteração posterior no conteúdo auditado invalida este parecer.
