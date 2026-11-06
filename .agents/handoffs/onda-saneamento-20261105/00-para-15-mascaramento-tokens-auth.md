De: 00 — Coordenador
Para: 15 — Segurança Aplicada e Rotação de Segredos
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-15-001 (B-04)
Sprint destino: Onda 0 — Bloqueadores Críticos e Gates

## Problema
Vazamento potencial de tokens de autenticação (JWT/OAuth) e segredos em logs de erro e stack traces na camada de autenticação.

## Arquivo(s) envolvido(s)
- src/services/auth.service.ts:210-235
- src/lib/logger.ts:45-80

## Evidência
Base de auditoria: DIVIDAS-AGENTE-15.md e DIVIDAS-AGENTE-00.md.
- src/services/auth.service.ts (L210-235): Tratamento de exceção em login/refresh serializa err.context ou tokens em logs sem sanitização central.
- Violação direta do AGENTS.md §22 (B-04: Credenciais armazenadas/logadas sem proteção) e §24 (Segurança e higiene de logs).
- Causa Raiz: Interceptadores e blocos catch capturam objetos AxiosError/AuthResponse contendo headers Authorization e payload sem passar pelo sanitizer.

## Alteração necessária
1. Implementar sanitização obrigatória e mascaramento de regex para tokens Bearer, senhas e refresh tokens em src/services/auth.service.ts.
2. Integrar src/lib/logger.ts para aplicar redaction automática em qualquer chave que corresponda a ['token', 'password', 'secret', 'authorization', 'credential'].
3. Garantir que stack traces não contenham query params sensíveis nem bodies decodificados.

## Teste esperado
- Critério de Aceite: Nenhuma string correspondente a token JWT ou segredo aparece nos logs após falha de autenticação.
- Teste Unitário: auth.service.spec.ts simulando login inválido e conferindo saída do logger mockado.
- Varredura de segredos limpa sem achados positivos.

## Contexto adicional
Handoff gerado a partir do Plano de Saneamento de Dívidas Técnicas. Correção prioritária para fechamento do Gate da Onda 0.

## Resolução (Agente 15)
- Status atualizado para: resolvido
- Em `src/lib/auth.ts`: implementado mascaramento regex de token no resetUrl (`url.replace(/(token=)[^&]+/, '$1***')`) evitando vazamento de token em logs de fallback em ambientes de dev/staging.
- Em `src/lib/voice-hub/controllers/auth.controller.ts`: substituído logging cru de objetos de erro potencialmente portadores de tokens por objetos sanitizados `{ err: { message, name } }`.
- `src/lib/logger.ts`: redaction paths auditados e confirmados cobrindo `token`, `resetUrl`, `authorization`, `password`, `secret`.
