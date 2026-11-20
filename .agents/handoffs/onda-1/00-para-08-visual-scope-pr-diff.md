De: 00
Para: 08
Onda: 1
Status: resolvido
Prioridade: normal
Bloqueador-ref: QA-002
Sprint destino: -

## Problema
O job `Detectar escopo visual` marca `relevant=true` em PRs só de documentação quando a `main` avançou depois da abertura do PR, disparando Visual Regression sem necessidade.

## Arquivo(s) envolvido(s)
`.github/workflows/visual-regression.yml` (propriedade do 08)

## Evidência
PR #420: o log listou `.agents/runs/*.md`, `LeadUseCases.ts`, `Landing360.tsx`, `Landing360.test.tsx` vindos da main.

## Alteração necessária
Calcular apenas as mudanças do próprio PR.

## Teste esperado
Com head 4d5749b6b e base original 03546a77f: relevant=false com a regra nova; true com a antiga.

## Contexto adicional
Origem da regra antiga: `git diff base.sha...HEAD` (HEAD = merge ref).

## Resolução
Causa raiz: `base.sha` é congelado na abertura do PR. O head do PR #420 contém um merge de `origin/main` (102db1fbe); então `base.sha...head` (e o merge ref) incluem os commits da main entrados depois. Observação: a sugestão original (`base.sha...head.sha`) NÃO resolve esse caso, pois o head já contém o merge da main (mesma lista de 31 arquivos, 14 casando o filtro).
Correção: `git diff --name-only "origin/${BASE_REF}...${HEAD_SHA}"` (merge-base com o tip atual da base, equivalente a "Files changed"). Padrões e workflow_dispatch inalterados.
Validação (grep do workflow sobre as duas listas): regra antiga relevant=true (14 matches); regra nova 17 arquivos, todos docs/.agents/.claude, relevant=false. YAML válido (PyYAML). Não executado em Actions real; revisão do Agente 24 pendente.
