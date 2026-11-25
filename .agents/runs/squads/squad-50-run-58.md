# Run doc — Agente 58 (Elisa) · Squad 50 · DEM-20261123-001

- **Data:** 2026-11-24 · **Runtime:** Devin (subagente) · **Branch:** `agente/58-enrichment-erp-s50`
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-50/wt-58` · **Base:** `integracao/onda-3-dem20261123` @ 5422d99c3e
- **Lease:** `.agents/runs/leases/squad-50-wt58.lease` (portas 22500-22599)
- **Escopo autorizado:** `src/lib/integrations/erp/**`, `src/features/integrations/{omie,signature,slack}/**`, handoffs/runs do squad-50.

## Missão executada

1. **Inventário real** de enriquecimento CNPJ/Receita, ERPs (Omie), Apollo/Hunter — resultado completo em `.agents/handoffs/squad-50/58-para-50-enrichment-erp-inventario.md` §1/§3. Pipeline ativo de enriquecimento (`enrichment.queue.ts`/`enrichmentCascade.worker.ts`/`prospecting/**`/`lib/enrichment/**`) é real mas pertence a 16/23 e 43/05 — auditado, sem edição, handoff registrado.
2. **Menor fatia de valor:** validação de CNPJ com dígito verificador no serviço de enriquecimento do ERP (`src/lib/integrations/erp/cnpj.service.ts`, meu ownership) — rejeita CNPJ inválido antes de chamar provider externo.
3. **Implementação cirúrgica + testes unitários mockados + tsc no escopo.**

## Arquivos alterados/criados

- `src/lib/integrations/erp/cnpj.service.ts` (editado): `normalizeCnpjDigits` passa a exigir dígito verificador válido via `isValidCnpj`/`sanitizeCnpj` de `src/lib/cnpj.ts`; erro agora orienta "14 dígitos com dígitos verificadores válidos".
- `src/lib/integrations/erp/__tests__/cnpj.service.test.ts` (criado): 13 testes — normalização formatada/dígitos, rejeição de tamanho/dígito verificador/dígitos repetidos/vazio, cache hit dentro do TTL, expiração no TTL, erro de provider propagado sem cachear, rejeição pré-provider.
- `.agents/handoffs/squad-50/58-para-50-enrichment-erp-inventario.md` (criado)
- `.agents/runs/leases/squad-50-wt58.lease` (criado)
- `.agents/runs/squads/squad-50-run-58.md` (este arquivo)

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts src/lib/integrations/erp/__tests__/cnpj.service.test.ts` | 13/13 pass (2 execuções, antes e depois do format) |
| `npx tsc --noEmit` | exit 0, sem erros |
| `npx biome check src/lib/integrations/erp/` | limpo (após `--write` de formatação) |

Sem chamadas reais a APIs externas; CNPJs de teste são sintéticos (dígitos verificadores gerados localmente). Credenciais não envolvidas nesta fatia.

## Pendências / bloqueios

- Parecer do auditor independente (Agente 09) pendente para o SHA commitado.
- `erp/cnpj.service.ts` é órfão (sem importadores) — mantido e testado; decisão de conectar/remover escalada ao 50.
- Achados de segurança fora da fatia (segredos Omie/Slack em texto puro; `createdAt` fabricado em `upsertOmieCustomer`) documentados no handoff para o coordenador.
- `squad-50-plano.md` e `squad-50-matriz-prontidao-conectores.md` citados na missão **não existem** em `.agents/runs/squads/` nesta base — usei `matriz-reconciliacao-proposta-20261124.md`, `onda-3-matriz-ownership.md` e `MATRIZ_PROPRIEDADE.md` como fonte de ownership.
