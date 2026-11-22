# Jules — Fase 1.1 — Security Tech Debt

## Autoridade

Este arquivo NÃO substitui `AGENTS.md`.

A ordem de autoridade é:

1. `AGENTS.md`
2. `TECH_DEBT_REMEDIATION_PLAN.md`
3. este arquivo
4. prompt da sessão Jules

## Objetivo

Remediar somente os findings de segurança P1 relacionados à Fase 1.1.

## Escopo

Priorizar:

- `.env.test`
- `.gate-backups/**`
- `.npmrc`
- segredos hardcoded identificados pela auditoria
- `eval()` / `new Function()` somente quando a análise comprovar risco ou permitir correção segura

## Restrições

NÃO:

- reescrever histórico Git;
- executar `git filter-repo`;
- executar BFG;
- executar force push;
- apagar branches;
- alterar `AGENTS.md`;
- alterar ownership de arquivos;
- modificar migrations;
- alterar `prisma/schema.prisma`;
- alterar `package.json` ou lockfiles sem necessidade e aprovação;
- copiar valores secretos para PRs, logs, relatórios ou evidências;
- assumir que uma string detectada pela auditoria é um segredo real sem verificar o contexto.

## Segredos

Para cada finding:

1. determinar se é segredo real, mock ou falso positivo;
2. se for mock, tornar explícito que é mock;
3. se for segredo real, substituir o valor por variável/configuração segura;
4. não tentar rotacionar credenciais reais automaticamente;
5. registrar a necessidade de rotação como ação humana quando aplicável.

## Histórico Git

Qualquer segredo existente em commits históricos deve ser tratado como incidente separado.

Não reescrever histórico automaticamente.

## Validação

Executar, quando aplicável:

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`

Também executar uma verificação de segredos no diff.

## Resultado esperado

Uma alteração pequena, revisável e reversível.

Jules deve:

1. gerar plano;
2. executar somente o escopo aprovado;
3. testar;
4. apresentar arquivos alterados;
5. apresentar evidências;
6. criar branch/PR;
7. não misturar outras fases de Tech Debt.

## Critério de parada

Parar e pedir revisão humana se:

- for necessário rotacionar uma credencial;
- houver dúvida sobre segredo real;
- houver necessidade de modificar histórico;
- houver alteração de migration;
- houver alteração cross-owner;
- houver risco de quebra de produção;
- o teste exigir infraestrutura/credencial que não esteja disponível.
