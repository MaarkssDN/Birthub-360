# 13 — PLANO DE TESTES, CARGA E HOMOLOGAÇÃO
**Birthub 360° — Central de Inteligência e Comando Operacional**  
**Autor:** Agente 00 — Astra (Coordenador Global)  
**Data:** 2026-11-21 · **Base Canônica:** `origin/main @ 0d790443d`  
**Governança Oficial:** AGENTS.md (Arquitetura 100 Agentes) | **Auditoria Independente:** Agente 09 — Silas  

---

## 1. Pirâmide e Estratégia de Qualidade

A esteira de qualidade do **Birthub 360°** opera sob o princípio da verificação rigorosa em múltiplos níveis, com foco em dados reais e rejeição de simulações falsas (Princípio P4).

```
          / \
         / E2E \        -> 15-20 Jornadas Críticas Playwright (Staging)
        /-------\
       / Carga k6 \      -> Cockpit Analytics & Latência (p95 < 500ms)
      /-------------\
     /  Integração   \    -> APIs Efêmeras, Schemathesis & RLS Policies
    /-----------------\
   /   Unitários / TS  \  -> 7.360+ Testes Unitários + Typecheck Estrito
  /---------------------\
```

---

## 2. Suítes de Testes e Comandos Canônicos

| Nível de Teste | Ferramenta / Runner | Arquivo de Configuração | Escopo Principal | Critério de Sucesso |
|---|---|---|---|:---:|
| **Tipagem Estática** | `tsc` | `tsconfig.json` | 100% dos módulos TS em `src/` e `scripts/` | `npm run typecheck` (Exit code 0) |
| **Arquitetura & Ciclos** | `dependency-cruiser` | `.dependency-cruiser.cjs` | 2.022 módulos analisados | 0 violações de fronteira de camada |
| **Hotspots de Código** | Custom script | `scripts/governance/check-hotspots.ts` | Arquivos >1.000 linhas | 0 arquivos sem exceção justificada |
| **Deriva de OpenAPI** | Custom script | `scripts/contracts/verify-openapi-drift.ts` | 510 endpoints em `docs/openapi.yaml` | 0 endpoints divergentes |
| **Testes Unitários** | Vitest | `vitest.unit.config.ts` | Lógicas de domínio, use cases e DTOs | 100% aprovados (>7.360 asserções) |
| **Testes de Integração** | Vitest + Testcontainers | `vitest.integration.config.ts` | Repositórios Prisma, Redis e BullMQ | 100% aprovados contra Postgres real |
| **Cobertura RLS** | Custom script | `scripts/security/rls-coverage.ts` | Todas as tabelas do PostgreSQL | 100% das entidades isoladas por tenant |
| **Fuzzing de Contratos** | Schemathesis | `tests/contracts/schemathesis.sh` | Todos os endpoints REST documentados | Zero erros HTTP 5xx sob payloads aleatórios |
| **Testes de Carga** | k6 | `tests/load/k6-analytics-*.js` | 5 endpoints de Cockpit Analytics | p50 < 200ms, p95 < 500ms, p99 < 800ms |
| **Jornadas E2E** | Playwright | `playwright.config.ts` | Fluxos críticos (Auth &rarr; CRM &rarr; DSR) | 100% aprovados em Chrome/Firefox/WebKit |
| **Acessibilidade Web** | axe-core | `@axe-core/playwright` | 70 rotas `/app/*` autenticadas | Zero violações de contraste crítico AA |

---

## 3. Protocolo de Execução dos Testes de Carga (k6)

O cenário de carga implementado no commit `ed5dce387` (`tests/load/k6-analytics-commercial-intelligence.js`) valida o comportamento sob estresse dos relatórios analíticos:
1. **Configuração de Ambiente:** Utiliza `docker-compose.opensource.yml` provisionando Postgres 16 e Redis 7 com pooling de conexões calibrado.
2. **Setup Autenticado:** A função `setup()` invoca a API real do Better Auth para criar uma organização e usuário `ADMIN`, gerando cookies de sessão autênticos sem burlar o RLS.
3. **Carga Simétrica:** 50 Usuários Virtuais (VUs) executam requisições paralelas durante 5 minutos contra os endpoints:
   - `/api/analytics/cockpit/overview`
   - `/api/analytics/cockpit/performance`
   - `/api/analytics/cockpit/aging`
   - `/api/analytics/cockpit/pipeline-creation`
   - `/api/analytics/cockpit/bitrix-sync-health`
4. **Exportação de Evidência:** A execução gera relatório JSON padronizado (`--summary-export=k6-analytics-report.json`) arquivado em `docs/performance/`.

---

## 4. Bateria de Homologação em Staging (Jornadas Críticas)

Antes da emissão do laudo de release, o Squad 00 (QA) executará 5 jornadas obrigatórias em ambiente de staging:
1. **Jornada J-01 (Onboarding e Tenancy):** Registro de nova organização &rarr; Criação do primeiro usuário &rarr; Validação de que nenhuma consulta acessa dados de outro tenant.
2. **Jornada J-02 (Ciclo Comercial Completo):** Entrada de Lead &rarr; Qualificação e Scoring &rarr; Atribuição por Round-Robin Ponderado &rarr; Cálculo determinístico de Next Best Action.
3. **Jornada J-03 (Voz e Redação LGPD):** Simulação de chamada WebRTC &rarr; Gravação e Diarização &rarr; Verificação em banco comprovando redação de CPF e telefone no texto gravado.
4. **Jornada J-04 (Resiliência de Filas e Outbox):** Enfileiramento de 500 cadências com desconexão súbita do Redis &rarr; Reconexão &rarr; Comprovação de processamento at-least-once sem duplicação de disparos.
5. **Jornada J-05 (Direitos do Titular LGPD):** Solicitação pública de DSR via formulário externo &rarr; Autenticação de token por e-mail &rarr; Download do pacote de portabilidade de dados em JSON.
