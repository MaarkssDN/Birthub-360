---
name: k6-load-testing
description: Modelagem e execução de testes de carga, estresse e concorrência com k6 no Birth Hub 360. Cobre scripts existentes (load:k6, load:k6:crm, load:k6:ai-voice), thresholds de latência (p95 < 200ms) e prevenção de degradação sob pico.
---

# k6 Load Testing — Birth Hub 360

## Objetivo
Validar a capacidade do servidor (`server.ts`), workers e banco de dados PostgreSQL de suportar tráfego concorrente sem degradação inaceitável de latência, vazamento de memória ou aumento da taxa de erros 5xx.

## Scripts Integrados no Projeto
O `package.json` disponibiliza comandos prontos executados via Docker Compose:
- `npm run load:k6`: Teste de carga geral nos endpoints centrais da aplicação.
- `npm run load:k6:crm`: Teste de estresse nas listagens paginadas, buscas e mutações do CRM.
- `npm run load:k6:ai-voice`: Simulação de múltiplos streams concorrentes de áudio e telemetria de telefonia.

## Métricas e Thresholds Obrigatórios
Todo cenário de teste de carga deve declarar limites (*thresholds*) rígidos para aprovação:
```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up
    { duration: '1m',  target: 100 }, // Carga de pico
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% das requisições devem responder em menos de 200ms
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    // Taxa de falhas deve ser inferior a 1%
    http_req_failed: ['rate<0.01'],
  },
};
```

## Diretrizes de Execução
1. **Ambiente Isolado:** Execute testes de carga em ambiente de homologação ou local com infraestrutura de containers (`npm run infra:up`). Nunca execute testes de estresse contra bancos de produção com dados reais.
2. **Autenticação:** Utilize tokens JWT pré-gerados para simular múltiplos usuários e organizações distintas, exercitando o cache e o isolamento multi-tenant.
3. **Monitoramento:** Acompanhe o uso de CPU e conexões ativas do pool do PostgreSQL durante a execução do teste.
