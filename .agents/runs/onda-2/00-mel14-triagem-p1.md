# MEL-14 — Triagem dos 215 findings P1 (Agente 00, Onda 2)

Data: 2026-11-13 · Fonte: TECH_DEBT_REMEDIATION_PLAN.md (base JSON 2026-09-29)
Escopo desta onda: TRIAGEM + fechamento do que já foi resolvido por ondas
anteriores. O épico completo (215→0) excede uma onda — segue como programa.

## 1.1 Security — 188 findings P1

### 1.1.1 Arquivos sensíveis no working tree (10 findings) — ✅ RESOLVIDO (verificado 2026-11-13)
- `.env.test`: gitignored (`.env*` no .gitignore), contém apenas credenciais
  locais de dev/test (docker-compose), sem segredos reais — confirmado por
  inspeção do cabeçalho e valores.
- `.npmrc`: contém apenas `legacy-peer-deps=true` (justificativa documentada
  inline: peer pin do mem0ai). Sem tokens.
- `.gate-backups/`: não existe mais no working tree atual.
- `.env.test.example` existe como template.

### 1.1.2 Segredos hardcoded — ✅ MAIORIA RESOLVIDA / FALSOS POSITIVOS
Verificação arquivo a arquivo (sem reproduzir valores):
- `litellm-config.yaml`: `api_key: 'os.environ/OPENROUTER_API_KEY'` — referência
  a env, não segredo.
- `docs/security/runbooks/ROTATE_GEMINI_API_KEY.md`: sem chave embutida.
- `prisma/migrations/20260802220000_...migration.sql`: sem segredo.
- `prisma/schema.prisma` L3012: apenas comentário citando formato xoxb-.
- `scripts/create-user-marcelin.ts`, `scripts/qa-sweep-mobile.ts`,
  `scripts/test/prepare-integration-env.js`: sem padrões de segredo real.
- Incidente histórico SEC-2026-001 (chave Gemini em scripts deletados):
  documentado em `docs/security/incidents/`; rotação é ação fora do repo —
  PENDENTE DE CONFIRMAÇÃO HUMANA (não verificável em código).

### 1.1.3 Eval/dynamic code (4 findings) — ⏳ PENDENTE (pequeno)
- `agente-codigo-local/src/components/TerminalDrawer.tsx` (eval/new Function)
- `scripts/pwa/verify-precache.ts`
Ação: revisar se são dev-only ou produção; encapsular/sandbox ou documentar.
Dono sugerido: 15 (próxima onda ou handoff).

## 1.2 Database — 16 findings P1 (migrations destrutivas) — ⏳ TRIADO
15 migrations com DROP/ALTER listadas no plano (DEBT-5127 a 5142).
Ação correta NÃO é reverter — é documentar status (aplicada em prod?),
backup e rollback por migration. Dono: Agente 01A/01.
Recomendação: transformar em checklist por migration no runbook
`docs/security/runbooks/MIGRATION_ROLLBACK.md` — handoff para 01.

## 1.3 Architecture — 11 findings P1 (hotspots/monolitos) — ⏳ PARCIAL
11 arquivos >1.600 linhas. Ações imediatas do plano:
1. `live-browser.js` duplicado em `.agents/skills/` e `.claude/skills/` —
   ✅ VERIFICAR/ELIMINAR duplicata (trivial, fazer já).
2. `routes.ts` prospecting/outbound (3.614 linhas), `LeadCard.tsx` (2.451) —
   refactors grandes → Onda 4 (MEL-25 hotspots), dono por domínio.
Demais arquivos → backlog de ondas futuras.

## Resumo da triagem
| Categoria | Findings | Status Onda 2 |
|---|---|---|
| 1.1.1 arquivos sensíveis | ~10 | ✅ fechado (verificado) |
| 1.1.2 segredos hardcoded | ~170 | ✅ triado: env-refs/mocks; pendente só confirmação de rotação histórica (ação humana) |
| 1.1.3 eval/dynamic | 4 | ⏳ handoff p/ 15 |
| 1.2 migrations destrutivas | 16 | ⏳ handoff p/ 01 (checklist) |
| 1.3 monolitos | 11 | ⏳ Onda 4 (MEL-25); duplicata live-browser trivial |

Conclusão honesta: os 215 findings P1 NÃO fecham nesta onda — a maioria já
estava mitigada por trabalhos anteriores (Onda 1 + higiene de secrets).
O que resta é: 1 ação humana (confirmar rotação Gemini), 1 item pequeno
(eval), 1 documento de migrations (01) e refactors de hotspots (Onda 4).
