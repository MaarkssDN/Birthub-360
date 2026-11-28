De: 00 — Astra
Para: 70 — Orion (Coordenador Squad 70)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: resolvido (recuperado na worktree `Birthub-360-wt-recuperacao`, branch `recuperacao/onda-consolidacao-20261124`, em 2026-11-26 — pendente de typecheck/testes por npm install em curso e auditoria do Agente 09)
Prioridade: bloqueador (vencimento 30/11/2026; checkpoint 29/11 21h BRT)
Bloqueador-ref: AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md §2 itens 7, 8
Sprint destino: Onda 4 / ciclo imediato

## Problema

Dois arquivos do Squad 70 possuem exceções de hotspot arquiteturais ativas que expiram em 30/11/2026. Sem refatoração ou decisão humana de extensão, `npm run check:hotspots` falha (CI BREAK) a partir do vencimento.

| # | Arquivo | Limite | Tamanho aprox. | Causa raiz |
|---|---|---|---|---|
| 7 | `src/features/intelligence/routes/intelligence.routes.ts` | 1100 | ~1060 | Rotas agregadas de swarms, prompts, automações e telemetria em arquivo único |
| 8 | `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts` | 1020 | 1016 | Formatação de linhas longas ultrapassou 1000 linhas por 16; enriquecimento B2B |

## Arquivo(s) envolvido(s)

- `src/features/intelligence/routes/intelligence.routes.ts` (Agente 76 — Dex)
- `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts` (Agente 74 — Luca)

## Evidência

`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md` §2 — diagnóstico individual completo.

## Alteração necessária

1. `intelligence.routes.ts`: fatiar em sub-routers (`swarm.routes.ts`, `eval.routes.ts`, `agent.routes.ts`) com montagem no router pai — sem alterar paths/contratos.
2. `marketIntelligenceCompany.service.ts`: extrair queries auxiliares e parsers de resposta da Receita/CNPJ para helpers específicos (~50 linhas).

## Teste esperado

- `npm run check:hotspots` verde sem exceções para os 2 arquivos.
- Testes de rotas de intelligence e do serviço de market-intelligence sem regressão; validar paths contra `openapi.yaml`.
- B-08: tools do Hub de IA devem permanecer acessíveis — não quebrar registry.

## Contexto adicional

- Decisão humana pendente: extensão de 14 dias condicionada a branches de refatoração.
- Agente 77 (Gaia) entregou guardrails na Onda 3 R3 (`a5c862847`, APROVADO) — verificar interseção em `src/features/intelligence/**`.
- Registrar SHAs congelados e submeter ao Agente 09 antes de integrar.

## Resolução — 2026-11-26 (Agente 00 — coordenação da recuperação)

Recuperação executada na worktree isolada `D:\Github\Birthub-360-wt-recuperacao` (branch `recuperacao/onda-consolidacao-20261124`, baseline main `9a3c2182b29cdd4700d8ce48cc144889cf58bd94`), após reversão acidental da working tree original.

- `intelligence.routes.ts`: 1053 → **893 linhas** (extraído `report.routes.ts`, ~175 linhas; paths Express inalterados).
- `marketIntelligenceCompany.service.ts`: 1015 → **621 linhas** (dados de amostra extraídos para `marketIntelligenceSampleData.ts`, API pública preservada via re-export).
- `check:hotspots` executado pelo coordenador em 2026-11-26: **exit 0 — 2034 arquivos, 0 acima de 1000 sem exceção válida**.
- Pendências registradas: typecheck e testes unitários pendentes do término do `npm install` na worktree; validação de paths contra `openapi.yaml` e B-08 (registry de tools) a confirmar na auditoria do Agente 09.
