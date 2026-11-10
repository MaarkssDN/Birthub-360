---
name: openapi-contract-keeper
description: Governança de contratos de API no Birth Hub 360 (docs/openapi.yaml, Schemathesis e validação Zod). Garante que schemas do backend, tipos do frontend e especificações OpenAPI estejam perfeitamente sincronizados sem drift.
---

# OpenAPI Contract Keeper — Birth Hub 360

## Objetivo
Eliminar divergências entre a documentação da API (`docs/openapi.yaml`), a validação em runtime no Express 5 (`server.ts` e rotas de domínio via Zod/TypeScript) e o cliente consumido pelo frontend.

## Fluxo de Trabalho e Verificação de Contratos

### 1. Scripts Oficiais de Contrato (`package.json`)
O projeto conta com dois scripts complementares:
- `npm run verify:openapi-drift`: Executa `tsx scripts/verify-openapi-drift.ts` para verificar estaticamente se as rotas registradas possuem correspondência na especificação `docs/openapi.yaml`.
- `npm run test:api-schema`: Executa `.\\.venv-opensource\\Scripts\\schemathesis.exe run docs/openapi.yaml --url http://127.0.0.1:3000` contra a especificação `docs/openapi.yaml` e a URL da aplicação.

### 2. Regras para Novos Endpoints ou Modificações
1. **Zod + OpenAPI Sincronizados:** Ao criar ou alterar uma rota no backend Express:
   - Defina os schemas de entrada (`params`, `query`, `body`) e saída (`response 200`, `400`, `401`, `404`) usando Zod.
   - Atualize a definição correspondente em `docs/openapi.yaml`.
2. **Sem Tipos `any`:** Não exponha respostas com estruturas opacas ou campos dinâmicos sem schema declarado.
3. **Erros Padronizados:** Respostas de erro devem seguir o padrão oficial do projeto:
   ```json
   {
     "error": "BAD_REQUEST",
     "message": "Mensagem clara para o usuário",
     "details": [ ... ]
   }
   ```

### 3. Prevenção de Breaking Changes
- Nunca renomeie ou remova propriedades de resposta existentes em versões ativas da API.
- Se um campo novo for adicionado, deve ser opcional (`nullable` ou com default) para não quebrar clientes existentes (incluindo o app mobile Capacitor).

## Checklist de Contrato
- [ ] O arquivo `docs/openapi.yaml` foi atualizado com a nova rota e seus exemplos de payload?
- [ ] `npm run verify:openapi-drift` executa com código de saída `0`?
- [ ] O schema Zod rejeita payloads maliciosos ou propriedades adicionais não mapeadas?
