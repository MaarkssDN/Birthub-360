- De: 00 (Coordenador)
- Para: 00 (Coordenador - decisório)
- Onda: techdebt-2026-09-29
- Status: aberto
- Prioridade: normal

## Problema

Auditoria de tech debt identificou arquivos monolíticos que não são código de produto principal:

1. `.agents/skills/impeccable/scripts/live-browser.js` - 12990 linhas (duplicado em `.claude/skills/impeccable/scripts/live-browser.js`)
2. `public/design-lab/assets/audit-data.js` - 4754 linhas
3. `scripts/agent-import/source-prompts.ts` - 2122 linhas
4. `agente-codigo-local/src/App.tsx` - 1660 linhas

## Arquivo(s) envolvido(s)

- `.agents/skills/impeccable/scripts/live-browser.js` (12990 linhas)
- `.claude/skills/impeccable/scripts/live-browser.js` (12990 linhas - duplicata)
- `public/design-lab/assets/audit-data.js` (4754 linhas)
- `scripts/agent-import/source-prompts.ts` (2122 linhas)
- `agente-codigo-local/src/App.tsx` (1660 linhas)

## Alteração necessária

**Decisão do Coordenador:** Avaliar prioridade real destes arquivos:

- `live-browser.js`: script de skill externo (impeccable) - pode não precisar de refatoração imediata se não é código de produção
- `audit-data.js`: dados estáticos para design lab - pode ser aceitável como está
- `source-prompts.ts`: script de importação de prompts - verificar se ainda é usado
- `agente-codigo-local`: parece ser código local de desenvolvimento - verificar se ainda é relevante

Ações:
1. Remover duplicata de `live-browser.js` (manter apenas uma versão)
2. Avaliar se arquivos são relevantes para produção ou podem ser removidos
3. Para arquivos mantidos, decidir se refatoração é prioritária

## Teste esperado

- N/A (avaliação de relevância primeiro)

## Contexto adicional

Audit completo em: `c:\Users\marce\OneDrive\Desktop\BirthHub360-Debt-Audit\BirthHub360-TechDebt-Report-20260929-120403.html`

Classificados como P1 (Architecture) no audit, mas podem não ser código de produção crítico.

## Resolução

**Decisão do Coordenador (2026-09-29):**

- **Prioridade baixa/ignorar** para estes arquivos (não são código de produção crítico)
- **Executado:** Removida duplicata de `live-browser.js` (manter apenas em `.agents/skills/`)
- **Ignorado por enquanto:** `audit-data.js`, `source-prompts.ts`, `agente-codigo-local/` (não afetam produção)
- Justificativa: Skills/scripts externos não são código de produção crítico, podem ser tratados em momento oportuno

**Ação executada:** `rm .claude/skills/impeccable/scripts/live-browser.js` (sucesso)

> Reconciliação 2026-11-14 (Agente 00): veredicto DEFEITO-REAL — live-browser.js duplicata regressão em .claude/. Correção pendente de despacho. Ver RESULTADOS-RECONCILIACAO-20261114.md.
