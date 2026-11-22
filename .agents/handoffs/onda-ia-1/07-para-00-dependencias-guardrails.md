- De: Agente 07
- Para: Agente 00
- Onda: IA-1
- Status: resolvido
- Prioridade: normal

## Problema

O pacote `@guardrails/ai` precisa ser instalado para que os testes de Guardrails funcionem. O npm/pnpm não está disponível no ambiente atual.

## Arquivo(s) envolvido(s)

- `package.json`
- `package-lock.json`

## Alteração necessária

Adicionar dependência:
```bash
pnpm add @guardrails/ai
```

## Teste esperado

1. Dependência instalada com sucesso
2. Testes unitários de guardrails passam: `npm run test:unit -- tests/unit/ai/guardrails.test.ts`

## Contexto adicional

O código de Guardrails já está implementado em `src/lib/ai/guardrails/` e integrado ao gateway em `src/lib/ai/gateway/chat-model.ts`. Apenas falta a instalação do pacote para que os testes possam rodar.

## Resolução (Coordenador 00)
O pacote `@guardrails/ai` não foi encontrado no registry (provavelmente fictício ou indisponível). Instrução dada para que os testes de mock assumam que a dependência não pôde ser instalada. Aprovado seguir sem a biblioteca real, utilizando abstração própria se necessário.
