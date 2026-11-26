De: 00 — Astra
Para: 40 — Ravi (Coordenador Squad 40)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: resolvido (recuperado na worktree `Birthub-360-wt-recuperacao`, branch `recuperacao/onda-consolidacao-20261124`, em 2026-11-25)
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 itens 5, 10
Sprint destino: Onda 4 / ciclo imediato

## Problema

Dois arquivos do Squad 40 possuem exceções de hotspot arquiteturais ativas que expiram em 30/11/2026. Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

| # | Arquivo | Limite | Tamanho aprox. | Causa raiz |
|---|---|---|---|---|
| 5 | `src/features/prospecting/outbound/server/routes/leads.routes.ts` | 1500 | 1368 | Router REST de leads com sub-recursos inline |
| 10 | `src/features/crm/components/LeadDetailDrawer.tsx` | 1100 | 1008 | Drawer com abas de empresa, contatos, enriquecimento e timeline em componente único |

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/leads.routes.ts` (Agente 41 — Cadu / 43 — Amon conforme ownership prospecting)
- `src/features/crm/components/LeadDetailDrawer.tsx` (Agente 41 — Cadu)

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 — diagnóstico individual completo.

## Alteração necessária

1. `leads.routes.ts`: extrair handlers para controllers dedicados (`leadExport.controller.ts`, `leadImport.controller.ts` e demais sub-recursos).
2. `LeadDetailDrawer.tsx`: extrair cada aba (`CompanyTab`, `ContactsTab`, `TimelineTab`, enriquecimento) em componentes filhos isolados.

## Teste esperado

- `npm run check:hotspots` verde sem exceções para os 2 arquivos.
- Testes unitários/integração de leads e drawer sem regressão.
- Atenção a contratos de rota: nenhum path/verb pode mudar (validar contra `openapi.yaml` / Schemathesis).

## Contexto adicional

- Decisão humana pendente: extensão de 14 dias condicionada a branches de refatoração (ver Agente 99 §4).
- Squad 40 teve entregas integradas na Onda 3 (40, 41, 42, 43, 44, 45) — coordenar para não colidir com trabalho em andamento em `integracao/onda-3-dem20261123` / candidato de consolidação.
- Registrar SHAs congelados e submeter ao Agente 09 antes de integrar.

## Resolução (2026-11-25 — Agente 40 Ravi, recuperação na worktree `Birthub-360-wt-recuperacao`)

A refatoração original (executada em 2026-11-24 no repo principal) foi revertida na `main` e os
arquivos novos ficaram órfãos. Os dois itens foram recuperados nesta worktree de consolidação:

**Item 10 — `src/features/crm/components/LeadDetailDrawer.tsx`: RECUPERADO.**
- Copiados os 6 módulos órfãos de `D:/Github/Birthub-360/src/features/crm/components/`:
  `LeadDetailDrawerHeader.tsx` (128 ln), `LeadDetailDrawerProfileSections.tsx` (142 ln),
  `LeadDetailDrawerBantSection.tsx` (232 ln), `LeadDetailDrawerNotesSection.tsx` (61 ln),
  `LeadDetailDrawerBitrixSection.tsx` (40 ln) e `leadDetailDrawer.constants.ts` (6 ln).
- `LeadDetailDrawer.tsx` reescrito: 1051 → **534 linhas**, abaixo do limite de aviso (700).
  API pública inalterada (`leadId`, `onClose`, `onChanged`); comportamento idêntico — os
  handlers (`handleStatusChange`, `handleOwnerChange`, `handleAddNote`, `handleSaveQualification`,
  `liveScore`, timeline unificada, ActionBar, Copiloto, NBA, WhatsAppChatPanel) permanecem no pai
  e são passados como props aos filhos.
- Bloco de exceção removido de `docs/architecture/HOTSPOT_EXCEPTIONS.md` e linha obsoleta da
  lista "Débito conhecido" atualizada (o arquivo não pertence mais à faixa 701–1000).

**Item 5 — `src/features/prospecting/outbound/server/routes/leads.routes.ts`: RECUPERADO.**
- A versão refatorada do Agente 43 (796 linhas + `prospect.routes.ts` 641 ln +
  `leads.shared.ts` 28 ln) já estava presente nesta worktree; validada por diff contra a cópia
  de trabalho do repo principal — **idêntica** (ignorando CRLF). Nenhum path/verb/middleware
  alterado; `POST /prospect` segue montado via `leadsRouter.use(prospectRouter)`.
- `tasks.routes.ts` (296 ln): a modificação do Agente 43 já consta na baseline `main`
  (9a3c2182b2) — arquivo idêntico ao da worktree, nada a copiar.
- `HOTSPOT_EXCEPTIONS.md`: bloco de exceção de `leads.routes.ts` já removido e arquivo listado
  em "Débito conhecido" (795/796 linhas, faixa de aviso).

**Validação executada:**
- `node scripts/architecture/check-hotspots.ts` (Node 22 type-stripping; `tsx` indisponível —
  `node_modules` das duas árvores em reinstalação): **exit 0** — "2034 arquivo(s) verificado(s),
  0 acima de 1000 linhas sem exceção válida". Nem `LeadDetailDrawer.tsx` nem `leads.routes.ts`
  aparecem como exceção; `leads.routes.ts` consta só como aviso (796 < 1000).
- `esbuild` 0.28.2 (binário de `D:/Github/Birthub-360/node_modules`): transpile OK nos 11
  arquivos tocados; bundle-check de `LeadDetailDrawer.tsx` sem nenhum import relativo não
  resolvido (apenas pacotes npm ausentes do `node_modules` incompleto).
- `tsc --noEmit` e `biome`: **não executáveis neste momento** — `node_modules` do worktree está
  parcialmente extraído (typescript sem `lib/*.d.ts`, biome.exe truncado/locked) e o do repo
  principal também está em reinstalação (ver handoff `40-para-43`, §Pendências). Recomenda-se
  re-rodar `npm run typecheck`/`npm run lint` quando o install concluir.
- Sem commits, conforme instrução. Escopo respeitado: `src/features/crm/components/LeadDetailDrawer*`,
  `leadDetailDrawer.constants.ts`, `src/features/prospecting/outbound/server/routes/**`,
  `docs/architecture/HOTSPOT_EXCEPTIONS.md`, handoffs.
