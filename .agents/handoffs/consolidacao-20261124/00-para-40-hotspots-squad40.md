De: 00 — Astra
Para: 40 — Ravi (Coordenador Squad 40)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
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
