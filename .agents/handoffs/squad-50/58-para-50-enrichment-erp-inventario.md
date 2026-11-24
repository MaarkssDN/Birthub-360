# Handoff 58 (Elisa) → 50 (Atlas) — Inventário Enriquecimento/ERP + fatia CNPJ

- **Data:** 2026-11-24 · **Demanda:** DEM-20261123-001 · **Branch:** `agente/58-enrichment-erp-s50`
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-50/wt-58` · **Base:** `integracao/onda-3-dem20261123` @ 5422d99c3e

## 1. Inventário real do domínio (verificado no código)

| Área | Arquivos | Estado |
|---|---|---|
| **Omie (ERP)** | `src/features/integrations/omie/{omie.service.ts,omie.routes.ts,components/OmieConnectionPanel.tsx}` | **Real.** JSON-RPC com retry/backoff (`retryWithBackoff`, 4 tentativas), `fetchWithTimeout` com allowlist `app.omie.com.br`, validação de credencial antes de persistir (`ListarClientes` probe), escopo por `organizationId` em todas as queries, `faultstring` tratado como erro de negócio. Rotas montadas em `bootstrap/routes.ts:223` com `authenticateToken`+`requireTenant`+`requireRole(ADMIN/GESTOR)`. |
| **Slack** | `src/features/integrations/slack/{slack.service.ts,slack.routes.ts,...}` | **Real.** Dois modos: Incoming Webhook (URL de tenant com `assertSafeExternalUrl` revalidado a cada retry — anti DNS-rebinding) e Bot Token (`chat.postMessage` em `slack.com` com allowlist). Retry/backoff, 429/5xx transitórios, nunca reporta sucesso sem resposta real. |
| **Signature (webhook entrada)** | `src/features/integrations/signature/signatureStatus.webhook.ts` | **Real (entrada).** HMAC-SHA256 em tempo constante sobre raw body, fail-closed sem `SIGNATURE_INBOUND_WEBHOOK_SECRET`, replay guard (`claimWebhookDelivery`), transição de estado via `applySignatureStatusUpdate`. O ENVIO (gov.br) é stub documentado (`GovBrSignatureProviderPort.ts`). |
| **CNPJ/Receita no meu escopo** | `src/lib/integrations/erp/cnpj.service.ts` | **ÓRFÃO + agora corrigido.** Nenhum importador no repo (verificado por grep). Validava só "14 dígitos" — aceitava dígito verificador errado. |
| **Pipeline de enriquecimento ativo** | `src/lib/queue/{enrichment.queue.ts,enrichmentCascade.worker.ts}` + `src/features/prospecting/services/**` + `src/lib/enrichment/**` | **REAL mas FORA do meu ownership** — ver §3. |

## 2. Fatia entregue (ownership 58)

`src/lib/integrations/erp/cnpj.service.ts` — `normalizeCnpjDigits` agora exige dígito verificador válido via `isValidCnpj`/`sanitizeCnpj` de `src/lib/cnpj.ts` (validador canônico, algoritmo Receita Federal). CNPJ malformado/dígito errado é rejeitado **antes** de qualquer chamada ao provider — economiza cota da fonte externa e não polui o cache. `CachedCnpjEnrichmentService` (cache em memória, TTL 30 dias, chave = CNPJ normalizado) mantido.

**Testes:** `src/lib/integrations/erp/__tests__/cnpj.service.test.ts` — 13 testes unitários mockados (normalização, dígito verificador, TTL/expiração de cache, propagação de erro do provider sem cachear falha, rejeição pré-provider). CNPJs sintéticos gerados localmente. **Sem chamadas reais a APIs.**

**Gates executados:** `vitest run` no arquivo → 13/13 pass · `npx tsc --noEmit` → limpo · `biome check` → limpo.

## 3. Achados FORA do meu ownership — handoffs delegados

1. **`src/lib/queue/enrichment.queue.ts` + `enrichmentCascade.worker.ts`** → dono: **Agente 16 (Runtime/Workers)** — a fila `enrichment-queue` chama `enrichCompany` de `features/prospecting`. Pipeline Apollo órfão já removido; ativo é este. Auditado: tem `attempts:3`, backoff exponencial, `recordDeadLetter`, métricas — estrutura sadia. Sem ação requerida de mim; registro para o coordenador 50/16.
2. **`src/features/prospecting/services/{enrichment*,cnpj*,apollo*,hunter*,duckdb*}` e providers `{apollo,hunter,cnpjOficial}.provider.ts`** → dono: **Agente 43 (scoring/prospecting)** conforme `MATRIZ_PROPRIEDADE.md:67` (AGENTS.md local diz "Agente 05" — divergência de numeração a reconciliar pelo 00). Implementação real, com testes existentes (`enrichment.service.test.ts`, `enrichmentCascade.test.ts`, `hunter.service.test.ts`). `cnpj.util.ts` já delega ao validador canônico `src/lib/cnpj.ts`.
3. **`src/lib/enrichment/providerFetch.ts`** → AGENTS.md local declara **Agente 05**. Retry/backoff para providers pagos com log estruturado de chamadas billable — bem feito, fora do meu escopo.
4. **`src/lib/integrations/erp/cnpj.service.ts` é código órfão** — criei testes e corrigi, mas nenhum consumidor o importa. Decisão de produto pendente: (a) conectar ao fluxo de enriquecimento de empresas do ERP, ou (b) remover. **Não removi** (fora da menor fatia; remoção é decisão do coordenador).

## 4. Riscos/observações para o coordenador (não corrigidos — fora da fatia)

- **Omie/Slack persistem `appSecret`/`botToken`/`webhookUrl` em texto puro** no Prisma (`omieConnection`, `slackConnection`). Mesmo padrão de outras integrações, mas é achado de segurança → sugerir handoff ao **98 Safira** (gestão de segredos) ou avaliar criptografia em repouso.
- `upsertOmieCustomer` fabrica `createdAt: new Date()` (não vem da resposta do Omie) e não valida `faultcode` quando `faultstring` está ausente — resposta Omie malformada geraria `id: "undefined"`. Baixo risco; candidato a próxima fatia.
- Slack webhook path fabrica `messageId: slack-wh-${Date.now()}` (Incoming Webhook não retorna ts) — documentado, mas o ID não é correlacionável com o Slack.
- `signature` ENVIO gov.br continua stub (sem credencial de integrador) — bloqueio externo conhecido, não de código.

## 5. Pendências

- Auditoria independente (parecer do Agente 09) para o SHA do commit em `agente/58-enrichment-erp-s50`.
- Decisão sobre órfão `erp/cnpj.service.ts` (usar ou remover).
