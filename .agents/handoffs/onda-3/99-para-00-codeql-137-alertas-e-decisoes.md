# Handoff 99 → 00 — CodeQL: 137 alertas abertos + decisões de governança

- **De:** Agente 99 — Vito (AppSec/SAST/Secret Scanning)
- **Para:** Agente 00 — Astra (Coordenador Global)
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `integracao/onda-3-dem20261123` @ `027f42b18`
- **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## Fato verificado
`gh api repos/MaarkssDN/Birthub-360/code-scanning/alerts?state=open` retorna **exatamente 137 alertas** (41 `error` / 96 `warning`), confirmando o número da demanda. Coleta completa em `/tmp` da sessão do agente; resumo por regra/arquivo no relatório de triagem.

## Decisões solicitadas ao Agente 00 / Orquestrador Humano

1. **Repositório público + secret scanning desligado** (item 7 da demanda): permanece decisão humana. Recomendo manter gitleaks no CI como compensação e avaliar ativar secret scanning nativo ou tornar o repo privado antes de qualquer push.
2. **`agente-codigo-local/`** (58 arquivos git-tracked, app Firebase Studio com `server.ts` próprio): concentra 6+ alertas CodeQL (`request-forgery:758`, `system-prompt-injection:76,304`, `polynomial-redos`, `missing-rate-limiting`). Está em `.dockerignore` mas **é analisado pelo CodeQL e versionado**. Decidir: remover do repo, mover para submódulo/externo, ou designar owner e corrigir.
3. **Gate `security:codeql-sarif` em PRs:** com 41 `error` pré-existentes em `main`, PRs que tocarem arquivos afetados podem falhar sem terem introduzido o problema. Decidir se o gate deve comparar com baseline ou se a dívida deve ser saneada antes (ver handoffs por squad).
4. **Confirmação pendente herdada da Onda 2:** verificar que `BIRTHHUB360_WEBHOOK_SECRET` em produção ≠ valor histórico `segredo_compartilhado_atlasgr_123` (commit `9236028b`, ver `docs/security/GITLEAKS_HISTORICAL_FINDINGS_2026-09-05.md` item 2).

## Nenhum segredo novo encontrado
Varredura `git grep` de padrões de alto sinal na árvore rastreada: zero achados reais (apenas fixtures/docs). Não reproduzo valores neste handoff por política.
