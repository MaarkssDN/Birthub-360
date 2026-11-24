# ESTRUTURA OFICIAL — 10 SQUADS / 10 COORDENADORES (DEM-20261123-001)

Data: 2026-11-24 · Autoridade: Orquestrador Humano · Coordenação global: Agente 00 — Astra (Devin)
Base técnica: `integracao/onda-3-dem20261123` @ `0141f258a` (Onda 3: 17/17 entregas auditadas e integradas — ver `REGISTRO_GLOBAL_100_AGENTES_20261124.md`)
Postura: **NO-GO** até homologação e decisão humana.

## 1. Hierarquia

| Papel | Agente | Squad |
|---|---|---|
| Coordenador Global | 00 — Astra | 00 |
| Coordenador Squad 10 | 10 — Mara | 10 Dados |
| Coordenador Squad 20 | 20 — Ciro | 20 Backend/APIs |
| Coordenador Squad 30 | 30 — Violeta | 30 Produto/UX |
| Coordenador Squad 40 | 40 — Ravi | 40 CRM |
| Coordenador Squad 50 | 50 — Atlas | 50 Integrações |
| Coordenador Squad 60 | 60 — Aurora | 60 Voz/Omnichannel |
| Coordenador Squad 70 | 70 — Orion | 70 IA/Automações |
| Coordenador Squad 80 | 80 — Navi | 80 Mobile |
| Coordenador Squad 90 | 90 — Hélio | 90 Infra/Segurança |

Agente 09 — Silas: auditoria independente, instancia unica, reporta ao Astra. Squads nao auditam a si mesmos.

## 2. Topologia de branches e worktrees (anti-colisao)

- Cada squad possui branch de integracao propria: `integracao/squad-NN` (NN = 10..90).
- Worktrees raiz por squad: `C:\Github\Birthub-360-worktrees\squads\squad-NN\`
  - `wt-coord` — worktree do coordenador (branch `coord/squad-NN`).
  - `wt-<agente>` — worktrees dos executores (branch `agente/<id>-<slug>-sNN`).
- Base de corte: SHA fixo registrado no ato do corte (inicial: `0141f258a`).
- Proibido: escrever em `integracao/onda-3-dem20261123`, em worktrees `dem-20261123-*` ou em branches de outro squad/agente.
- node_modules: junction para `C:\Github\Birthub-360\node_modules` em cada worktree novo.

## 3. Fluxo de entrega

Especialista → Coordenador de Squad (merge em `integracao/squad-NN`) → SHA congelado → Agente 09 Silas (parecer) → Astra (promocao a `integracao/onda-3-dem20261123` ou sucessora) → Gates.

## 4. Leases e exclusao mutua

- Um escritor por arquivo (MATRIZ_PROPRIEDADE.md e REGISTRO_GLOBAL sao a fonte).
- Lease de recurso compartilhado (porta, banco, fila): arquivo `.agents/runs/leases/<recurso>.lease` commitado na branch do squad requerente, contendo `session_id`, `squad`, `timestamp`, `escopo`. Lease expira em 4h sem heartbeat; recuperacao segura = remover lease expirado e registrar no handoff.
- Portas: squad NN usa faixa `22000 + NN*10` para servidores efemeros (ex.: squad 40 → 22400-22499).
- Bancos de teste: um schema/banco por squad quando houver mutacao; nunca compartilhar banco de escrita entre squads.

## 5. Capacidade

- `scripts/orchestration/capacity-scheduler.ts` e a fonte de verdade de capacidade (AGENTS.md §13 rev. 2026-11-24, sem limite fixo de 8).
- Politica inicial conservadora: cada squad coordenador mantem no maximo 3 executores concorrentes ate o scheduler indicar folga; suites pesadas (integracao, E2E, build) em fila por squad.
- Agente 09 mantem slot reservado permanente enquanto houver entregas pendentes.

## 6. Conflitos de coordenacao registrados (secao G do despacho)

1. **Dupla atuacao de coordenador global**: alem desta sessao Devin (Astra), existe sessao Antigravity/Gemini que vem executando funcoes de Agente 00 (merges em `integracao/onda-3-dem20261123`, alteracao de AGENTS.md, publicacao do REGISTRO_GLOBAL). Enquanto o Orquestrador Humano nao designar papel formal a essa sessao, os squads coordenados por esta sessao DEVEM ignorar os worktrees `dem-20261123-*` e usar exclusivamente a topologia da secao 2. Nenhuma das duas sessoes pode ceder autoridade global a si mesma.
2. **Divergencia de pareceres Silas**: duas instancias do Agente 09 emitiram pareceres paralelos na Onda 3 (21: APROVADO vs REPROVADO — resolvido por reenvio v2 `af91a3e0d`). Regra: uma unica instancia Silas ativa por vez; pareceres divergentes sobre o mesmo SHA => REPROVADO por padrao ate reconciliacao do Astra.
3. **Ownership 45 vs 41** (`src/features/activities/**`): resolvido — 41 e o dono; 45-R2 reprovado e nao integrado. Decisoes de ownership futuras exigem publicacao na matriz, nunca decreto verbal em prompt.

## 7. Estado real dos squads (baseline desta publicacao)

- Squads com entregas Onda 3 integradas: 00 (parcial), 10 (10), 20 (20,21,22,23), 30 (31,34), 40 (40,41,42,43,44,45-parcial), 50 (50), 60 (65), 70 (77), 90 (94,96,97,99).
- Squads sem entrega de codigo ainda: 80 (mobile — worktrees nao criados).
- Backlog prioritario herdado: soft-delete models sem `deletedBy`/`deleteReason` (handoffs 20→11/12), ownership de `src/bootstrap/routes.ts` e `src/api/**` inexistente, `legacyModuleGate` bloqueando `/api/voice-hub/*` (decisao humana), ~80% dead code voice-hub (decisao humana), waivers Trivy/Hotspots vencendo 29-30/11, spec Postman sincronizada (resolvido), a11y debt cross-squad.
