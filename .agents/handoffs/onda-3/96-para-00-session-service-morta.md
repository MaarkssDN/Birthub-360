# Handoff — `src/lib/auth/session.service.ts` (RTR/JWT) não está integrado ao fluxo real de autenticação

```
De: 96 — Nera (Autenticação, Sessões e OAuth)
Para: 00 — Coordenador
Onda: 3
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: a definir pelo 00
```

## Problema

`src/lib/auth/session.service.ts` implementa Refresh Token Rotation (RTR) com detecção de reuso
e fingerprint de cliente (bloqueador B-03, entregue no PR #485 / commit `29979fab3`). Porém,
verificação em `agente/96-auth-onda3` (baseline `32d07c375`) confirma que o serviço **não é
importado por nenhum caminho de produção**: o único consumidor é
`tests/unit/lib/auth/sessionService.test.ts`. A autenticação real usa Better Auth com sessões
persistidas em banco (`src/lib/auth.ts` + `src/bootstrap/auth.ts`), que já possui expiração
(7 dias), `updateAge` (24h), revogação em troca/reset de senha e gestão de sessões em
`/api/auth-extra/sessions`.

Consequências do estado atual:

- O código é efetivamente morto em runtime (só testes o exercitam).
- Se um dia for integrado, os `Map`s em memória não sobrevivem a restart nem funcionam em
  deploy multi-instância, e os tokens expiram sem nunca serem removidos dos Maps (vazamento
  lento de memória).
- O `accessToken` retornado (`act_<uuid>`) não possui mecanismo de validação em lugar nenhum.

## Arquivo(s) envolvido(s)

- `src/lib/auth/session.service.ts` (dono: este agente / pasta `src/lib/auth/**`)
- `tests/unit/lib/auth/sessionService.test.ts`
- `src/lib/auth.ts`, `src/bootstrap/auth.ts` (contexto — Better Auth é o fluxo real)

## Evidência

```
grep -rn "auth/session.service" src tests → apenas tests/unit/lib/auth/sessionService.test.ts
git log: único commit de origem 29979fab3 (onda-1, B-01..B-14)
```

## Alteração necessária (decisão do 00)

Escolher uma das opções:

1. **Remover** `session.service.ts` + teste, registrando que B-03 foi coberto pela semântica
   de sessões DB do Better Auth (revogação, expiração, updateAge, revokeSessionsOnPasswordReset).
2. **Persistir/Integrar** o RTR ao fluxo real (ex.: tabela de refresh tokens + integração com
   `authenticateToken`) — trabalho de desenho maior, provavelmente fora do escopo de onda.
3. **Manter como está** com comentário explícito de "não integrado / reservado", se houver
   valor de auditoria do desenho B-03.

Recomendo a opção 1 ou 3 — manter código de segurança morto pode confundir auditorias futuras
("RTR implementado?" → sim, mas nunca exercido em produção).

## Teste esperado

Após decisão: `npx tsc --noEmit`, `npm run lint`, `vitest run tests/unit/lib/auth` verdes.

## Contexto adicional

Auditoria completa do domínio de auth na missão ONDA3-96-AUTH encontrou e corrigiu dois achados
reais dentro de `src/lib/auth/**` (commits `7632f3a93` e `f8a1763ab`):

1. `password-hash.ts`: parâmetros Argon2id lidos do hash persistido não tinham teto (DoS por
   memória) e exceção do Argon2 em hash malformado propagava para o login — agora há limites
   (m≤1GiB, t≤10, p≤8, v∈[16,19], salt/hash com teto) e try/catch → `false`.
2. `session.service.ts`: Maps in-memory cresciam sem limite (tokens expirados/`used` nunca eram
   removidos) — agora `sweepExpired()` com throttle de 60s + validação de entradas em
   `createSession`. Comentário de cabeçalho do arquivo agora registra explicitamente que o
   serviço NÃO está conectado à produção.

Este handoff permanece válido: a decisão sobre remover/integrar/manter o RTR morto continua
sendo do Agente 00. Nada encontrado relacionado a certificados (PGSSLROOTCERT) no domínio de
auth — sem handoff adicional para 98/99 por esse tema.
