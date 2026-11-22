# Definition of Done (DoD) para Produção — Birth Hub 360°

**Data de Validade:** Outubro/2026  
**Responsável Técnico:** Marcelo do Nascimento (Marks) — CTO / Arquiteto de Software  
**Repositório:** [Marks-Mah/Birthub-360](https://github.com/Marks-Mah/Birthub-360)  
**Baseline de Referência:** `BASELINE-001`

---

## 1. Princípios Gerais

Este documento é a referência única e inegociável de qualidade e governança para a promoção de qualquer código, hotfix ou refatoração para os ambientes de Homologação e Produção do **Birth Hub 360°**.

Nenhuma Pull Request será aprovada para merge se violar qualquer um dos critérios listados abaixo.

---

## 2. Critérios de Aceite por Dimensão

### 2.1 Qualidade de Código & Tipagem (Clean Code & TypeScript)
1. **Compilação TypeScript Sem Erros:** Execução limpa de `npx tsc --noEmit` sem adição de flags permissivas ou supressões arbitrárias (`@ts-ignore`, `@ts-expect-error` sem justificativa formal).
2. **Eliminação de Tipos `any`:** Proibido o uso de `as any` ou tipagem implícita `any` em fronteiras de domínio, casos de uso ou chamadas de API.
3. **Clean Architecture & SOLID:**
   - Camadas de Domínio não importam ORMs (`@prisma/client`), bibliotecas de transporte HTTP (`express`, `fastify`) ou frameworks externos.
   - Acesso a banco mediado exclusivamente por interfaces de Repositório (`Repository` interface).
   - Injeção de dependência explícita via construtor ou container central (`src/shared/di`).
4. **Linting & Formatação:**
   - `npm run lint` com 0 erros bloqueantes.
   - `biome check` ou Prettier formatado uniformemente em todos os arquivos modificados.

### 2.2 Testes Automatizados & Regressão
1. **Testes Unitários:**
   - 100% dos testes unitários passando (`npm run test:unit`).
   - Todos os novos serviços e casos de uso devem conter suítes unitárias isoladas utilizando Repositórios em Memória (`FakeRepository`), sem tocar em banco de dados ou redes externas.
2. **Testes de Integração:**
   - Validados sob isolamento rigoroso de tenant (`requestContext.run({ tenantId })`), verificando políticas de RLS e integridade referencial.
3. **Regressão Visual & E2E:**
   - Cenários críticos (Autenticação, Dashboard 360°, Pipeline CRM, Lead Card) validados via Playwright.
   - Snapshots visuais gerados e conferidos contra os baselines oficiais em ambiente padronizado (Linux / CI).

### 2.3 Segurança, Multi-Tenancy & LGPD
1. **Detecção de Segredos:**
   - Pipeline de secret scanning (Gitleaks) 100% verde.
   - Nenhuma credencial, token de API, chave privada ou senha hardcoded no código ou nos arquivos de teste.
2. **Isolamento de Banco (Row-Level Security - RLS):**
   - RLS ativo e forçado em todas as tabelas de negócio do tenant.
   - Proibido uso de bypass genérico (`app.bypass_rls`) fora do allowlist restrito de bootstrap (`User`, `Organization`, `Session`, `Verification`).
3. **Privacidade & LGPD:**
   - Sanitização de logs para evitar registro de dados pessoais identificáveis (PII).
   - Verificação obrigatória de consentimento explícito do titular (`assertPiiExternalConsent`) antes de qualquer disparo de chamada de voz ou interação via agentes de IA.

### 2.4 Banco de Dados & Migrações Seguras
1. **Zero-Downtime & Migrações Não-Destrutivas:**
   - Estritamente proibido o uso de `DROP TABLE`, `DROP COLUMN` ou `ALTER COLUMN ... DROP` em migrações diretas sem execução do padrão **Expand -> Migrate -> Contract**.
   - Toda alteração de schema deve ser retrocompatível com a versão anterior do backend em execução.
2. **Performance Relacional:**
   - Criação mandatória de índices compostos para queries frequentes e foreign keys.

### 2.5 Design System & Acessibilidade
1. **Identidade Visual Command Center:**
   - Aplicação estrita da paleta institucional: Base Navy Obsidian (`#0b132b`) + Destaque Dourado (`#d4af37`) + Fundos neutros.
   - Eliminação de artefatos visuais genéricos de IA (gradientes púrpura/ciano arbitrários, bordas pulsantes e animações excessivas).
2. **Acessibilidade (WCAG 2.2 AA):**
   - Contraste de cor mínimo de 4.5:1 para textos normais em ambos os modos (Dark/Light).
   - Navegação acessível por teclado com estados de `:focus-visible` evidentes e gerenciamento de foco em modais/drawers.
   - Respeito mandatório à preferência do sistema `prefers-reduced-motion`.

### 2.6 Infraestrutura, Resiliência & Observabilidade
1. **Tolerância a Falhas & Resiliência:**
   - Fallback fail-open seguro caso serviços auxiliares (Redis, MeiliSearch) estejam indisponíveis durante o boot.
   - Proteção de idempotência e anti-replay baseada em fingerprint para todos os webhooks externos recebidos.
2. **Observabilidade:**
   - Logs estruturados em formato JSON com correlação de `requestId` e `tenantId`.
   - Métricas e healthchecks expostos para monitoramento contínuo da aplicação.

---

## 3. Checklist de Liberação para Deploy (Release Gate)

| Item de Verificação | Responsável | Status Requerido |
| :--- | :--- | :--- |
| Validação de Branch | Tech Lead | Branch de release atualizada e sincronizada |
| TypeScript Check (`tsc`) | CI / QA | Exit code 0 |
| Linter (`eslint` / `biome`) | CI / QA | Exit code 0 |
| Suíte de Testes Unitários | CI / QA | 100% PASS |
| Scan de Segurança & Segredos | SecOps / CI | 0 Alertas High/Critical |
| Migrações Analisadas | DBA / Tech Lead | Política Não-Destrutiva Aprovada |
| Imagem Docker Construída | DevOps | Build multi-stage sem erros |
| Plano de Rollback Pronto | SRE / DevOps | Documentado e validado |

---

**Assinatura de Governança:**  
*Marcelo do Nascimento (Marks) — CTO, COO & Arquiteto de Software*
