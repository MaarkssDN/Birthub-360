---
name: openapi-contract-keeper
description: Governança de contratos de API no Birth Hub 360 (docs/openapi.yaml, Schemathesis e validação Zod). Garante que schemas do backend, tipos do frontend e especificações OpenAPI estejam perfeitamente sincronizados sem drift.
---

# OpenAPI Contract Keeper — Birth Hub 360

## Objetivo
Eliminar divergências entre a documentação da API (`docs/openapi.yaml`), a validação em runtime no Express/Fastify (via Zod/TypeScript) e o cliente consumido pelo frontend.

## Fluxo de Trabalho e Teste com Schemathesis

### 1. Testes Automatizados de Contrato
O projeto conta com o script:
`npm run test:api-schema`
que executa o Schemathesis contra a especificação `docs/openapi.yaml` e a URL da aplicação (`http://127.0.0.1:3000`).

### 2. Regras para Novos Endpoints ou Modificações
1. **Model First ou Zod to OpenAPI:** Ao criar ou alterar uma rota no backend:
   - Defina os schemas de entrada (`params`, `query`, `body`) e saída (`response 200`, `400`, `401`, `404`) usando Zod.
   - Atualize correspondente em `docs/openapi.yaml`.
2. **Sem Tipos `any`:** Não exponha respostas com estruturas opacas ou campos dinâmicos sem schema declarado.
3. **Erros Padronizados:** Respostas de erro devem seguir o padrão RFC 7807 (`Problem Details`) ou o padrão oficial do projeto:
   ```json
   {
     "error": "BAD_REQUEST",
     "message": "Mensagem clara para o usuário",
     "details": [ ... ]
   }
   ```

### 3. Prevenção de Breaking Changes
- Nunca renomeie ou remova propriedades de resposta existentes em versões ativas da API.
- Se um campo novo for adicionado, deve ser opcional (`nullable` ou com default) para não quebrar clientes antigos (incluindo o app mobile Capacitor).

## Checklist de Contrato
- [ ] O arquivo `docs/openapi.yaml` foi atualizado com a nova rota e seus exemplos de payload?
- [ ] O schema Zod rejeita payloads maliciosos ou propriedades adicionais não mapeadas (`.strict()`)?
- [ ] O comando de validação de schema passa sem falhas?
