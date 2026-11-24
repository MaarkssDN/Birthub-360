# Parecer Agente 09 — Silas · Agente 58 (Elisa) · Enriquecimento/ERP (Squad 50) · DEM-20261123-001

- **Auditor:** Agente 09 — Silas (Auditoria Independente, Squad 00)
- **Entregador:** Agente 58 — Elisa (Squad 50, Integrações Externas)
- **Branch auditada:** `agente/58-enrichment-erp-s50`
- **SHA congelado (tip = HEAD do worktree):** `f501e8675932989f07e113a6c59ad4418879a0fb`
- **Base:** `5422d99c3e` (`integracao/onda-3-dem20261123`, Documento Mestre V5)
- **Worktree auditado:** `C:/Github/Birthub-360-worktrees/squads/squad-50/wt-58` (HEAD confirmado = SHA congelado, `git status --porcelain` limpo)
- **Run doc:** `.agents/runs/squads/squad-50-run-58.md` · **Handoff:** `.agents/handoffs/squad-50/58-para-50-enrichment-erp-inventario.md`
- **Data:** 2026-11-24
- **Veredito: APROVADO** (ver §6 — pendências são de roteamento/governança, não de correção de código)

---

## 1. Escopo do diff (verificado, não confiado)

`git diff 5422d99c3e..f501e86759 --stat`: **5 arquivos, +219 linhas, −3 linhas**.

| Arquivo | Natureza | Ownership |
|---|---|---|
| `src/lib/integrations/erp/cnpj.service.ts` | EDITADO (12 linhas) | Agente 58 — `src/lib/integrations/erp/**` conforme `MATRIZ_PROPRIEDADE.md:86` (rev. 2026-11-24) — **confirmado** |
| `src/lib/integrations/erp/__tests__/cnpj.service.test.ts` | NOVO (123 linhas) | Agente 58 — mesmo glob |
| `.agents/handoffs/squad-50/58-para-50-enrichment-erp-inventario.md` | NOVO | Handoffs próprios do squad-50 |
| `.agents/runs/squads/squad-50-run-58.md` | NOVO | Run doc |
| `.agents/runs/leases/squad-50-wt58.lease` | NOVO | Lease de execução |

**P3 (alterações cirúrgicas): OK.** O único arquivo de produção tocado teve 3 linhas substituídas por 7 (import + condição composta + mensagem de erro). Nenhuma linha adjacente refatorada; `CachedCnpjEnrichmentService` e as constantes de TTL intactos.

**Ownership: OK.** Escopo autorizado (`erp/**` + `features/integrations/{omie,signature,slack}/**`) conferido na MATRIZ_PROPRIEDADE.md linha 86 — a entrega usa apenas `erp/**`. O import de `../../cnpj.js` (`src/lib/cnpj.ts`, validador canônico compartilhado) é **consumo de contrato**, não edição — correto pela regra de não-duplicação (§34): o validador de dígito verificador já existia e é reutilizado em vez de reimplementado.

## 2. Correção da mudança (análise de código)

`normalizeCnpjDigits` (`cnpj.service.ts:13-23`):
- Antes: removia não-dígitos e exigia apenas `length === 14` — aceitava dígito verificador errado.
- Depois: `sanitizeCnpj` → exige 14 dígitos **e** `isValidCnpj(digits)` (algoritmo oficial Receita: pesos 5-4-3-2-9-8-7-6-5-4-3-2 no 1º DV e 6-5-4-3-2-9-8-7-6-5-4-3-2 no 2º, resto <2 → 0, senão 11−resto; rejeita dígitos repetidos).
- A validação ocorre **antes** de `providerFetch` em `lookupCnpj` (linha 38) — CNPJ inválido nunca consome cota externa nem entra no cache. Objetivo da missão atingido.
- **Validador canônico verificado:** `src/lib/cnpj.ts:35-45` implementa o algoritmo correto. **CNPJ de teste validado independentemente:** computei `205409120001` + DVs em Node — `20540912000163` é de fato um CNPJ sintético válido (não um CNPJ real vazado).
- Erro lançado é `Error` comum com mensagem clara; `lookupCnpj` propaga a rejeição (testado).

## 3. Gates executados pelo auditor (evidência primária)

| Gate | Comando executado por mim | Resultado |
|---|---|---|
| Testes unitários | `npx vitest run -c vitest.unit.config.ts src/lib/integrations/erp/__tests__/cnpj.service.test.ts` (no wt-58) | **13/13 pass** (89ms) — claim "13/13" **confirmado** |
| TypeScript | `npx tsc --noEmit` (repo inteiro, wt-58) | **exit 0, zero erros** — claim "tsc limpo" **confirmado** |
| Lint | `npx biome check src/lib/integrations/erp/` | **limpo** — claim "biome limpo" **confirmado** |
| Contagem de testes | grep `it(` no arquivo | **13 casos** (7 `normalizeCnpjDigits` + 5 `CachedCnpjEnrichmentService` + 1 TTL) — claim "13 testes" **confirmado** |
| Rede nos testes | leitura do arquivo | provider injetado via `vi.fn().mockResolvedValue/Rejec­ted` — **zero chamadas reais a APIs**; CNPJs sintéticos gerados localmente |
| Segredos no diff | grep de padrões (key/secret/token/password/Bearer) sobre `git show` | **0 segredos reais** — únicos matches são menções textuais no handoff (nomes de campos `appSecret`/`botToken`) |

Cobertura dos testes é adequada ao escopo: normalização formatada/dígitos, rejeição por tamanho/dígito verificador/dígitos repetidos/vazio, cache hit dentro do TTL, expiração no TTL, erro de provider propagado **sem** cachear falha, e rejeição pré-provider (`providerFetch` não chamado). Caso de borda não coberto: CNPJ com 14 dígitos mas pontuação mista — irrelevante, `sanitizeCnpj` já trata.

## 4. Avaliação do handoff e achados fora da fatia

Handoff `.agents/handoffs/squad-50/58-para-50-enrichment-erp-inventario.md` é **legítimo, bem-formado e os achados foram verificados por mim no código**:

1. **`erp/cnpj.service.ts` é órfão — CONFIRMADO.** `grep "cnpj.service" src` fora do próprio diretório retorna zero importadores; `git grep` no commit também não acha consumidores. A decisão correta foi **não remover** (fora da menor fatia; remoção é decisão do coordenador) — mantido com testes.
2. **Segredos Omie/Slack em texto puro — CONFIRMADO como achado real.** `omie.service.ts:163` persiste `appSecret` e `slack.service.ts` persiste `botToken`/`webhookUrl` (campos do schema Prisma). Mesmo padrão de outras integrações; encaminhamento sugerido ao 98 Safira é adequado. **Handoff válido → roteamento pendente para o 00.**
3. **`upsertOmieCustomer` fabrica `createdAt` e ignora `faultcode` — CONFIRMADO.** `omie.service.ts:290` usa `new Date().toISOString()` em vez de data da resposta Omie; `faultcode` existe no tipo (linha 50) mas não é validado quando `faultstring` está ausente — resposta malformada geraria `id: "undefined"`. Baixo risco real; candidato a próxima fatia.
4. **Slack webhook fabrica `messageId` — CONFIRMADO como comportamento documentado** (Incoming Webhook não retorna ts). Observação de correlação, não defeito.
5. **Inventário do pipeline ativo de enriquecimento** (`enrichment.queue.ts`, `prospecting/**`, `lib/enrichment/**`) pertence a outros donos (16/23, 43, 05) — auditoria read-only sem edição, correto.
6. **Divergência de numeração documentada** (AGENTS.md local diz "Agente 05" vs. MATRIZ atribuindo prospecting ao 43) — registro honesto, a reconciliar pelo 00.

## 5. Critérios de aceite da especialidade (enriquecimento/ERP)

- CNPJ inválido rejeitado **antes** de provider externo: **atendido** (teste explícito `providerFetch` não chamado).
- Reuso do validador canônico (`src/lib/cnpj.ts`): **atendido** — sem duplicação.
- Testes unitários mockados, sem rede: **atendido** (13/13).
- Sem secrets, sem PII real, sem regressão: **atendido** (diff aditivo no comportamento de erro apenas; nenhum consumidor de produção afetado pois o serviço é órfão).

## 6. Condições e pendências para o Agente 00 (Astra)

**Condições do parecer (não bloqueiam a integração — o código está correto e testado):**

1. **Decisão sobre `src/lib/integrations/erp/cnpj.service.ts` órfão:** conectar ao fluxo de enriquecimento de empresas do ERP ou remover. Enquanto órfão, permanece código testado sem consumidor — aceitável como biblioteca, mas deve ter decisão registrada (mesmo dilema do `withRetry` do Agente 24).
2. **Roteamento de segurança:** segredos Omie/Slack em texto puro no Prisma → emitir handoff formal ao **Agente 98 (Safira)** ou registrar decisão de criptografia em repouso.
3. **Próxima fatia candidata (58 ou sucessor):** `upsertOmieCustomer` — validar `faultcode`/`faultstring` completos e não fabricar `createdAt`.
4. **Reconciliar divergência de ownership** prospecting/enrichment entre AGENTS.md local e MATRIZ_PROPRIEDADE (05 vs 43) — já sinalizada no handoff.

**Observação P3 (não bloqueante):** `normalizeCnpjDigits` chama `isValidCnpj(digits)` que re-executa `sanitizeCnpj` internamente — redundância de O(14), irrelevante; não exige ação.

## 7. Parecer final

**APROVADO.** Entrega cirúrgica (+219/−3, 1 arquivo de produção), ownership estrito confirmado na MATRIZ_PROPRIEDADE.md:86, reuso correto do validador canônico de CNPJ, todos os gates re-executados por mim com sucesso (13/13 vitest, tsc exit 0, biome limpo, zero rede, zero segredos). O algoritmo de dígito verificador foi verificado independentemente e o CNPJ de teste é sintético válido. Achados fora da fatia são legítimos, verificados e bem encaminhados. As condições acima são de roteamento/governança para o Agente 00 — **o código pode ser integrado**.
