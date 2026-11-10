---
name: k6-load-testing
description: Modelagem e execução de testes de carga, estresse e concorrência com k6 no Birth Hub 360. Cobre scripts existentes (load:k6, load:k6:crm, load:k6:ai-voice), thresholds de latência (p95 < 200ms) e prevenção de degradação sob pico.
---

# k6 Load Testing — Birth Hub 360

## Objetivo
Validar a capacidade do servidor (`server.ts`), workers e banco de dados PostgreSQL de suportar tráfego concorrente sem degradação inaceitável de latência, vazamento de memória ou aumento da taxa de erros 5xx.

## Scripts Integrados no Projeto (`package.json`)
O `package.json` disponibiliza três comandos distintos de teste de carga:
- `npm run load:k6`: Executa `docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.opensource.yml --profile tools run --rm k6`, que monta e roda `tests/load/k6-api.js` (`/tests/k6-api.js`).
- `npm run load:k6:crm`: Executa `docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.opensource.yml --profile tools run --rm k6-crm`, que monta e roda `tests/load/k6-crm-authenticated.js` (`/tests/k6-crm-authenticated.js`).
- `npm run load:k6:ai-voice`: Executa o harness Node local `node scripts/test/run-k6-ai-voice-stress.mjs` para simulação de concorrência em fluxos de IA e voz.

## Métricas e Thresholds Obrigatórios
Todo cenário de teste de carga deve declarar limites (*thresholds*) explícitos para aprovação:
```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up
    { duration: '1m',  target: 100 }, // Carga de pico
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% das requisições devem responder em menos de 200ms nas rotas críticas de leitura
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    // Taxa de falhas deve ser inferior a 1%
    http_req_failed: ['rate<0.01'],
  },
};
```

## Diretrizes de Execução
1. **Ambiente Isolado:** Execute testes de carga em ambiente de homologação ou local com infraestrutura de containers (`npm run infra:up`). Nunca execute testes de estresse contra bancos de produção com dados reais.
2. **Autenticação (`better-auth`):** Utilize cookies/tokens de sessão válidos gerados pelo `better-auth` (`auth.api.getSession` em `src/shared/middlewares/authenticateToken.ts`) para simular múltiplos usuários e organizações distintas, exercitando o cache e o isolamento multi-tenant.
3. **Monitoramento:** Acompanhe o uso de CPU e conexões ativas do pool do PostgreSQL durante a execução do teste.
