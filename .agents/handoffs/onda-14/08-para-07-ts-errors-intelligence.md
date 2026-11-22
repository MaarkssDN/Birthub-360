- De: 08
- Para: 07
- Onda: 14
- Status: resolvido
- Prioridade: bloqueador
- Bloqueador-ref: B-100 (Typecheck bloqueado)
- Sprint destino: Atual

## Problema
A validação de tipo via `npx tsc --noEmit` está falhando devido a erros no domínio de Inteligência. Como a missão do QA (08) é corrigir a pasta `tests/` e configurações, a alteração em `src/features/intelligence/` está fora do escopo (regra P3 de oportunismo de código) e foi encaminhada para resolução.

## Arquivo(s) envolvido(s)
- `src/features/intelligence/routes/intelligence.routes.ts`
- `src/features/intelligence/services/IcebreakerService.ts`

## Evidência
```
src/features/intelligence/routes/intelligence.routes.ts(964,9): error TS2345: Argument of type 'string' is not assignable to parameter of type 'never'.
src/features/intelligence/services/IcebreakerService.ts(7,41): error TS2307: Cannot find module 'playwright' or its corresponding type declarations.
src/features/intelligence/services/IcebreakerService.ts(14,29): error TS2307: Cannot find module 'playwright' or its corresponding type declarations.
```

## Alteração necessária
- Corrigir a injeção de parâmetros em `intelligence.routes.ts`.
- Mudar o import de `playwright` (que provavelmente não está em `dependencies`) para `@playwright/test` caso este seja usado para tipos (ou adicionar `playwright` ao `package.json` se for realmente uma dependência em tempo de execução para crawling).

## Teste esperado
- `npx tsc --noEmit` passando sem erros nos arquivos afetados.

## Contexto adicional
O erro causa a falha no gate de CI (typecheck global bloqueado).

## Resolução (Agente 07)
1. Corrigida a tipagem de `aiToolkitFunctions` em `src/features/intelligence/routes/intelligence.routes.ts` para aceitar `any[]` conforme especificado no comentário original COD-004 e alinhado o dispatch.
2. Em `src/features/intelligence/services/IcebreakerService.ts`, substituído o import estático com erro de Playwright por tipagem estrutural defensiva (`PlaywrightChromium`, `PlaywrightBrowser`, `PlaywrightBrowserContext`) e dynamic import assíncrono.
Status atualizado para **resolvido**.
