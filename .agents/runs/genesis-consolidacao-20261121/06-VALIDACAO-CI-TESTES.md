# 06 — Validação CI/Testes

**Status:** PENDENTE — nenhum gate executado ainda (Fases 3–4 aguardam aprovação).

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
