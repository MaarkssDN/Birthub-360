# Handoff 20 → 00 — Squad 20 operante na topologia de squads; pendências de ownership e deliberações

```
De: 20 — Ciro (Coordenador Squad 20)
Para: 00 — Astra (Coordenador Global)
Onda: pós-Onda 3 · DEM-20261123-001
Branch: coord/squad-20 · Worktree: squads/squad-20/wt-coord
Base: 93e82c22024ccc9ca48abad6b29e855cbd4157f9
Status: ABERTO — decisões de governança solicitadas
Prioridade: alta (bloqueia execução de código do squad)
```

## 1. Setup confirmado

- Worktree/branch criados conforme topologia §2 da estrutura oficial.
- Lease emitido: `.agents/runs/leases/squad-20.lease` (portas 22200–22299).
- Plano do squad: `.agents/runs/squads/squad-20-plano.md`.
- Primeira missão real executada: auditoria de verificação da camada HTTP —
  `.agents/runs/squads/squad-20-auditoria-http-20261124.md`.

## 2. Handoffs herdados do squad (estado na base 93e82c220)

| Handoff | Estado | Observação do coordenador |
|---|---|---|
| `onda-3/20-para-00-ownership-api-inexistente.md` | ABERTO | Reiterado: sem deliberação, o squad não pode executar correções na camada HTTP real |
| `onda-3/20-para-11-12-modelos-auditaveis-sem-deletedby.md` | ABERTO | Aguarda Pietro/Vera (Squad 10); Opção A recomendada permanece válida |
| `onda-3/22-para-20-ordem-middlewares-mounts.md` | RECEBIDO → evidência produzida | Item 3 já resolvido na base; itens 1–2 confirmados; correção depende de dono de `routes.ts`/`rateLimiters.ts` |
| `onda-3/22-para-25-rate-limit-composite-dead-code.md` | RECEBIDO (transitado) | Precisão corrigida: `resolveCompositeRateLimitKey` tem 1 import em `tests/unit/onda4And5Complete.test.tsx` — remoção exige ajustar o teste |
| `onda-3/21-para-00-paths-fantasma-openapi.md` | ABERTO (ciência) | Squad 20 toma ciência; sem ação pendente do nosso lado |
| `onda-3/23-para-00-queue-outbound-dedup.md` | RESOLVIDO | Dedup de jobId outbound integrado na Onda 3 |

## 3. Deliberações solicitadas ao Astra

1. **Ownership real da camada HTTP** — publicar na `MATRIZ_PROPRIEDADE.md` o dono de
   `src/bootstrap/routes.ts`, `src/bootstrap/rateLimiters.ts` e
   `src/shared/middlewares/errorHandler.ts` (sugestão já registrada no handoff
   `20→00` da Onda 3: concentrar no Coordenador 20 como equivalente funcional de
   `src/api/index.ts|router.ts`, ou designar dono explícito). Sem isso, os itens 1–2 do
   handoff 22→20 ficam bloqueados.
2. **Squad 20 e billing/webhooks (26, 29)** — confirme a régua de cautela: propostas de
   código para `src/features/billing/**` e `src/features/webhooks/outbound/**` passarão
   por handoff prévio ao Astra antes de qualquer edição, dado o caráter financeiro/PII.
3. **Promoção do plano** — se a topologia `coord/squad-20` → `integracao/squad-20` →
   Silas estiver correta, peço confirmação do SHA de referência para os executores
   (`agente/<id>-<slug>-s20`) cortarem a base.

## 4. Riscos comunicados

- `src/api/index.ts|router.ts` inexistentes: risco de agentes 21/22/25 trabalharem sobre
  paths fantasma — mitigado enquanto o handoff de ownership estiver aberto.
- Billing/webhooks sem execução até deliberação — backlog P2 do squad.
