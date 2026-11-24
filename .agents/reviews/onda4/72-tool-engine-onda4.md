# Parecer de Revisão Independente — Agente 09 (Silas) — Onda 4

- **Entrega auditada:** `agente/72-tool-engine-onda4` — Agente 72 (Ada), Tool Engine / B-08
- **Base SHA:** `32d07c3750c370b63da8b720019413c9a40e0e68`
- **SHAs auditados:** `a6807f9f6` (fix), `9bf9eb1ed` (docs SHA no handoff)
- **Runtime auditor:** Devin subagent (diferente do autor — Devin subagent)
- **Data:** 2026-11-24

## Veredito: APROVADO

## Escopo auditado

```
 .agents/handoffs/onda4/72-para-00-tool-engine-onda4.md        | docs
 .agents/handoffs/onda4/72-para-12-toolengine-permission-listing.md | docs
 src/lib/ai/tools/__tests__/aiToolRegistry.test.ts             | 221 + (novo, 12 testes)
 src/lib/ai/tools/executor.ts                                  | 180 + (novo)
 src/lib/ai/tools/registry.ts                                  |  ~15 +-
```

## Análise

### (a) Propriedade / escopo — OK
Todo o código está dentro de `src/lib/ai/tools/**`. O engine subjacente
(`src/lib/voice-runtime/ToolEngine.ts`, dono Agente 12) foi apenas
**consumido** via import — a limitação encontrada nele
(`getAvailableTools` não filtra `requiredPermission`) foi escalada via
handoff 72→12 em vez de editada. Conduta correta.

### (b) Evidência de testes — OK
12 testes novos cobrindo: split-brain (registry ≡ toolEngine singleton),
validação `argsSchema` (tool não executa com args inválidos), filtro de
permissão em `listToolsForModel`, fail-closed de `isAvailable` (erro no
health-check → indisponível), propagação de erros sem sucesso falso.
Regressão declarada: `toolEngineTimeout.test.ts` + `HttpToolExecutor.test.ts`
→ 16/16; `tsc --noEmit` e `biome lint` limpos. O teste de identidade do
singleton é reproduzível contra o baseline (falharia antes da correção).

### (c) Segredos / LGPD — OK
Sem segredos; camada de IA não lida com PII diretamente.

### (d) Auth / tenancy / permissões — OK (e reforçado)
A correção **elimina um split-brain de segurança**: `toolRegistry` era um
`new ToolExecutionEngine()` paralelo e vazio — tools registradas ficavam
invisíveis ao engine que o runtime executa. Agora `toolRegistry ===
toolEngine`. A nova camada só **restringe** exposição
(`allowedTools` + `requiredPermission` + `isAvailable` fail-closed) e valida
entrada via zod antes de delegar ao engine — nunca amplia permissões.
Isolamento de tenant permanece delegado ao engine (`ctx.allowedTools`/
`grantedPermissions`).

### (e) Regressões — OK
Mudança de semântica consciente e documentada: consumidores do antigo
registry vazio passam a compartilhar o singleton real — era exatamente o
bug. Autor verificou que não há consumidor de produção dos dois caminhos
(engine dormente; function-calling real usa LangChain em
`AgentExecutor.ts`, fora do ownership). Risco residual baixo e honesto.

### (f) P1–P4 — OK
Causa raiz estrutural identificada (P1), solução mínima sobre o engine
existente sem duplicá-lo (P2), diff cirúrgico (P3), testes + evidência de
gates + handoffs (P4).

## Observações (não bloqueantes)

- `listToolsForModel`/`AiToolRegistry` ainda não têm consumidor de produção
  — infraestrutura pronta, não fiação. Aceitável dado que o bloqueador B-08
  era o split-brain latente.
- Dead code `toolPermissionPolicy.ts` sem consumidor foi apenas registrado
  (não removido) — correto, fora do escopo.

## Conclusão
Correção de defeito estrutural real (B-08), com camada de disponibilidade/
schema bem desenhada, fail-closed e testes adequados. **APROVADO** para o
SHA `9bf9eb1ed` (ponta da branch no momento da auditoria).
