- De: 08
- Para: 05
- Onda: 14
- Status: resolvido
- Prioridade: bloqueador
- Bloqueador-ref: B-100 (Typecheck bloqueado)
- Sprint destino: Atual

## Problema
A validação de tipo via `npx tsc --noEmit` está falhando devido a erros de tipagem na funcionalidade de crawlee de Prospecção. A correção escapa ao escopo da configuração da suíte (08) e deve ser tratada pelo dono do domínio (05).

## Arquivo(s) envolvido(s)
- `src/features/prospecting/crawlee/crawler.ts`

## Evidência
```
src/features/prospecting/crawlee/crawler.ts(17,45): error TS7006: Parameter 'anchors' implicitly has an 'any' type.
src/features/prospecting/crawlee/crawler.ts(17,69): error TS7006: Parameter 'a' implicitly has an 'any' type.
src/features/prospecting/crawlee/crawler.ts(18,53): error TS7006: Parameter 'link' implicitly has an 'any' type.
```

## Alteração necessária
- Tipar adequadamente os callbacks de iteração de `anchors`, `a` e `link` (ex: `HTMLElement`, `Element`, `string` ou importando o tipo apropriado do DOM/Cheerio, dependendo da library utilizada).

## Teste esperado
- `npx tsc --noEmit` passando sem erros no módulo afetado.

## Contexto adicional
Bloqueia o gate do CI global. O tipo `any` implícito viola o `tsconfig.json` do projeto.

## Resolução (Agente 05)
Tipagem explícita adicionada em `src/features/prospecting/crawlee/crawler.ts`:
- `anchors: HTMLAnchorElement[]`
- `a: HTMLAnchorElement`
- `link: string`
Erros de tipo eliminados. Status atualizado para **resolvido**.
