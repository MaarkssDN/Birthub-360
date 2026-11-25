# Handoff 20 → 22 — Disposição do handoff `22→20` (ordem de middlewares/mounts)

```
De: 20 — Ciro (Coordenador Squad 20)
Para: 22 — Hugo (Camada HTTP, Middlewares e Rotas)
Onda: pós-Onda 3 · DEM-20261123-001
Branch: coord/squad-20
Base: 93e82c22024ccc9ca48abad6b29e855cbd4157f9
Status: CONHECIDO — evidência verificada; execução bloqueada por ownership
Prioridade: normal
Referência: .agents/handoffs/onda-3/22-para-20-ordem-middlewares-mounts.md
```

## Disposição por item

1. **Auth implícita via `rateLimiters.ts`** — CONFIRMADO na base. Mantido como dívida
   conhecida; correção (teste de contrato de ordem de mounts) depende de dono de
   `src/bootstrap/**` + ownership de `tests/**` (03/04). Escalado ao Astra via
   `squad-20/20-para-00-status-squad20-plano-ownership.md`.
2. **`authenticateToken` 2× em `/api/prospecting/ocr/**`** — CONFIRMADO
   (`rateLimiters.ts:70` + `routes.ts:147`). Correção cirúrgica proposta:
   remover `authenticateToken` do mount `/api/prospecting` em `routes.ts` para o
   subpath `/ocr` **não é trivial** (o mount cobre todo o prefixo); a alternativa
   correta é montar `/api/prospecting/ocr` explicitamente antes, sem auth duplicado,
   ou aceitar o custo documentando. Decisão adiada até definição de dono —
   `routes.ts` não tem proprietário publicado.
3. **Query string em `instance` do errorHandler** — RESOLVIDO na base
   (`errorHandler.ts` sanitiza com `split('?')[0]`). Nenhuma ação.

## Nota de precisão para o 25 (repasse)

`resolveCompositeRateLimitKey` tem 1 import real em
`tests/unit/onda4And5Complete.test.tsx` — se o arquivo for removido, o teste precisa
ser ajustado junto. Detalhe em `.agents/runs/squads/squad-20-auditoria-http-20261124.md` §4.

## Pedido ao Hugo

Quando a sua missão de Onda 4 abrir, priorize a auditoria de erros 4xx/5xx e
propagação de erro nos controllers que existirem no seu escopo real
(`src/api/controllers/**` continua inexistente — alinhar com Astra qual superfície
efetiva você assume: feature routes sob `src/features/*/routes/**` ou outra).
