# 06 — Validação CI/Testes

**Status:** ONDA I validada (21/11/2026); gates de código pendentes para após Ondas II–III.

## Gates — Onda I (executados 21/11/2026)

| Gate | Resultado |
|---|---|
| Diff acumulado vs `main@0d790443` | ✅ somente `.agents/**` — 23 arquivos, +1594/−52; **zero** alterações em `src/ tests/ prisma/ docs/ .github/` |
| Não-regressão PR#485 | ✅ diff não toca nenhum arquivo B-01..B-14 (enforcer, session, optout, voice, bitrix, baileys, mobile, ToolEngine, inventario-dados, checklist Prisma) |
| Integridade referências do índice | ✅ todas as refs `NN-*.md` do `00-INDICE` resolvem para arquivos existentes (00–17) |
| Encoding UTF-8 | ✅ corrigido cp1252→UTF-8 em `02-BACKLOG-MESTRE.md`; demais validados |
| Scan de segredos no diff | ✅ nenhum segredo/credencial detectado |
| Duplicações | ✅ 2 handoffs antigravity da raiz = byte-idênticos às branches (versão commitada prevalece); 2 handoffs `03-*` já na main |
| Biome/lint/tsc/build | n/a — diff 100% markdown em `.agents/` (sem código) |
| Gates de código/CI completos | pendentes — Fases 3–4 (após Ondas II–III) |

## Gates programados para a base consolidada

| Gate | Escopo | Status |
|---|---|---|
| Formatação (Biome `format:check`) | todo o diff | pendente |
| Lint | todo o diff | pendente |
| `npx tsc --noEmit` | todo o diff | pendente |
| Ownership/architecture (dependency-cruiser) | todo o diff | pendente |
| OpenAPI drift | se contratos mudarem | pendente |
| RLS coverage | se rotas mudarem | pendente |
| `prisma validate` / migrate diff | se schema mudar | pendente |
| Testes unitários relacionados | voice-hub, CommandPalette (do Agente 08) | pendente |
| Schemathesis workflow | novo workflow do Agente 08 | pendente — verificar URL `/api`, permissões, gatilhos, disponibilidade do pacote no CI |
| Builds (web/backend/worker) | base consolidada | pendente |

## Validações já executadas (Fase 0 — forense)

- `git merge-tree --write-tree` em todas as 13 branches à frente: 12 limpas, 1 conflito (descartada).
- `git cherry` patch-equivalence em todas as branches.
- `sha256sum -c` dos backups: 16/16 OK.
- Diff de árvores: snapshot órfão ≡ remoto (0 arquivos).

## Pendências de infraestrutura

- Docker remoto / Redis / IA: conectividade não verificada nesta sessão — reexecutar checks na base consolidada antes de declarar gates.
- 41 testes unitários reprovados + falhas de middleware/contrato/LGPD/crypto-backup catalogados na missão — **reproduzir na base consolidada** para separar falhas reais de obsoletas (ver 08).
