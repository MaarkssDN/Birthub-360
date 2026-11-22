# BASELINE-001 — Relatório Oficial de Congelamento e Estado da Plataforma

- **Projeto:** Birth Hub 360° (Intelligent Business Command Center)
- **Fase:** Fase 0 — Congelamento e Baseline
- **Data/Hora:** 2026-10-02T15:10:00-03:00
- **Prioridade:** P0 (Crítica)
- **Branch de Estabilização:** `stabilization/baseline-001`
- **Commit Base:** `459177722c8b9ea793fa973c6165e43f5f99136c` (origin/main)
- **Responsável:** Marcelo do Nascimento (Marks) — CTO / Arquiteto Chefe

---

## 1. Objetivo Executivo & Escopo do Congelamento (Feature Freeze)

Impedir que qualquer nova funcionalidade ou alteração cosmética seja introduzida na `main` ou nas branches de trabalho enquanto o programa de eliminação de dívida técnica e estabilização de produção estiver em andamento.

### Diretrizes de Congelamento:
1. **Feature Freeze Estrito:** Nenhuma nova feature ou refinamento visual fora do backlog de remediação será aceito.
2. **Branch de Estabilização Ativa:** Todas as correções da Onda de Estabilização convergirão para `stabilization/baseline-001`.
3. **Gate de Promoção:** Nenhum código entrará em produção sem reprodução determinística do baseline e aprovação no Definition of Done (DoD).

---

## 2. Registro do Estado Atual da Plataforma (Baseline de Execução)

| Componente | Comando / Script | Status Atual | Diagnóstico Técnico |
| :--- | :--- | :--- | :--- |
| **Build** | `npm run build` | **PASS (Local/Vite)** / **FAIL (CI)** | Vite + esbuild compila o bundle frontend/dist com sucesso. Falha no CI pelo job `build` devido a timeouts e steps encadeados. |
| **Typecheck** | `npx tsc --noEmit` | **BLOCKED / INSTÁVEL** | V8 OOM em ambientes com alocação padrão de memória. Exige `NODE_OPTIONS=--max-old-space-size=4096` e alinhamento de extensões `.js` para módulos ESM. |
| **Lint** | `npm run lint` / `biome check` | **PASS (com supressões)** | ESLint sem erros fatais após inclusão de globals em chrome-extension; ~32 warnings pontuais de a11y em tags ARIA gerenciados. |
| **Testes Unitários** | `npm run test:unit` | **PARCIALMENTE VERDE** | 2.370+ testes passando quando mocks de BullMQ/Redis estão ativos. Suítes que requerem injeção de repositório em memória migradas com sucesso. |
| **Testes de Integração** | `npm run test:integration` | **BLOCKED (Ambiente)** | Falha no seed de banco quando executado contra perfil de RLS estrito sem tenant context ou em sandboxes sem socket Docker disponível. |
| **E2E (Playwright)** | `npx playwright test` | **BLOCKED (Snapshot Linux)** | Testes visuais contêm snapshots gerados em Windows (`*-win32.png`), gerando inconsistência em runners Linux (`ubuntu-latest`). |
| **npm audit** | `npm audit` | **PASS (0 High / 0 Critical)** | Resolvidas vulnerabilidades de `brace-expansion`, `nodemailer`, `fast-uri` e pin de `undici` em overrides. |
| **Docker Build** | `docker build -t birthhub-app .` | **PASS (Local)** / **FAIL (Sandboxes)** | Dockerfile multi-stage funcional; falha apenas em sandboxes com restrição de permissão em whiteout files (`overlayfs`). |
| **Startup do Backend** | `npm run start` / `server.ts` | **PASS (com DB ativo)** | Backend inicializa com Fastify/Express na porta 3024/3005 com tolerância fail-open quando Redis/MeiliSearch não respondem de imediato. |

---

## 3. Backlog Rastreável dos 55 Achados Classificados

O universo dos 55 achados identificados nas auditorias estruturais e técnicas foi consolidado, catalogado e distribuído em 7 pilares fundamentais de governança:

### Grupo 1: BLOCKER (08 Achados)
- **BLK-001**: OOM do TypeScript Compiler durante checagem estrita no CI sem flags de memória alocada.
- **BLK-002**: Falha no job `build` do GitHub Actions devido a cancelamento por concorrência em merges na `main`.
- **BLK-003**: Incompatibilidade de snapshots de teste visual Playwright gerados no Windows rodando em Linux.
- **BLK-004**: Quebra de execução de testes de integração por falta de container Postgres provisionado no runner.
- **BLK-005**: Dependência ausente de build na documentação gerada via `typedoc` (`npm run docs`).
- **BLK-006**: Timeout de suítes de testes unitários extensas quando executadas com concorrência paralela agressiva.
- **BLK-007**: Bloqueio de migrações em ambiente limpo quando tabelas auxiliares não seguem a ordem de criação do schema.
- **BLK-008**: Falha de import ESM em compiladores estritos devido à ausência de extensão `.js` em arquivos domain/usecases.

### Grupo 2: SECURITY (10 Achados)
- **SEC-001**: Arquivos sensíveis de ambiente (`.env.codespace`, `.env.test`) com rastreamento no Git.
- **SEC-002**: Segredos hardcoded e mocks residuais expostos em scripts utilitários de seeding e testes locais.
- **SEC-003**: Uso não encapsulado de `eval()` e `new Function()` em componentes de desenvolvimento/tooling.
- **SEC-004**: Política de RLS com permissão de bypass amplo (`app.bypass_rls`) sem restrição ao allowlist estrito.
- **SEC-005**: Falta de auditoria estruturada (Actor, IP, Tenant) em endpoints de exportação de dados de titulares LGPD.
- **SEC-006**: Ausência de checagem do consentimento de PII na orquestração de ligações de voz automatizadas.
- **SEC-007**: Chave estática de API do Firebase Applet mantida no repositório exigindo rotação no console.
- **SEC-008**: Ausência de controle estrito de Content Security Policy (CSP) nos endpoints servidos via reverse proxy.
- **SEC-009**: Dependências de GitHub Actions em workflows utilizando tags mutáveis em vez de SHA-256 fixo.
- **SEC-010**: Ausência de mascaramento determinístico de logs em serviços de IA para evitar vazamento de dados confidenciais.

### Grupo 3: DATA & PERSISTENCE (08 Achados)
- **DAT-001**: Presença de 15 migrações com instruções `DROP TABLE` e `DROP COLUMN` sem política de transição não-destrutiva.
- **DAT-002**: Falta de adoção padronizada do modelo **Expand -> Migrate -> Contract** para evolução do banco de dados.
- **DAT-003**: Deriva de schema entre definições do Prisma e índices criados manualmente no Postgres.
- **DAT-004**: Violação de isolamento multi-tenant em queries que não filtram explicitamente por `organizationId`.
- **DAT-005**: Ausência de índices compostos em tabelas transacionais de alto volume (`Lead`, `Activity`, `AuditLog`).
- **DAT-006**: Risco de colisão de seeds em bancos de desenvolvimento gerando violações de foreign key.
- **DAT-007**: Desalinhamento na categorização de status do lead entre payloads do Bitrix24 e modelos relacionais.
- **DAT-008**: Bloqueio de persistência atômica em transações concorrentes no repositório de histórico de IA.

### Grupo 4: RELIABILITY & INFRASTRUCTURE (07 Achados)
- **REL-001**: Ausência de idempotência e anti-replay em webhooks de telefonia, voz e CRM via fingerprinting Redis.
- **REL-002**: Crash ou travamento de inicialização do backend na indisponibilidade momentânea do Redis ou MeiliSearch.
- **REL-003**: Exaustão do pool de conexões do Prisma sob carga pesada sem backoff ou retry configurado.
- **REL-004**: Falha silenciosa de filas BullMQ em ambientes sem Redis dedicado ativo (necessidade de fallback mock seguro).
- **REL-005**: Erro P2028 do Prisma durante picos de boot e sincronização de conexões concorrentes.
- **REL-006**: Falta de healthchecks independentes para os microsserviços e workers em `docker-compose.services.yml`.
- **REL-007**: Desconexão e ausência de reconexão automática nos streams SSE/WebSockets do RealtimeFeed.

### Grupo 5: QUALITY & ARCHITECTURE (08 Achados)
- **QLT-001**: Acoplamento direto entre camadas de serviço HTTP e ORM Prisma sem porta de abstração de repositório.
- **QLT-002**: Existência de arquivos monolíticos (hotspots com mais de 2.000 linhas, e.g. `routes.ts`, `LeadCard.tsx`).
- **QLT-003**: Uso residual de casts arbitrários `as any` em fronteiras de contratos e agregadores de inteligência.
- **QLT-004**: Duplicação de contratos e interfaces entre o domínio de inteligência comercial e as APIs frontend.
- **QLT-005**: Dependências circulares residuais grandfathered no dependency-cruiser conhecidas e não remediadas.
- **QLT-006**: Falta de suítes de testes unitários isolados com repositórios em memória para serviços críticos de IA.
- **QLT-007**: Fragmentação de padrões arquiteturais (coexistência desgovernada de Estilo A e Estilo B de DI).
- **QLT-008**: Complexidade ciclomática elevada em middlewares de autenticação e contexto de requisição.

### Grupo 6: UX, DESIGN SYSTEM & ACCESSIBILITY (07 Achados)
- **UX-001**: Anti-padrões visuais genéricos de IA (gradientes púrpura/ciano arbitrários, bordas neon e microinterações saltitantes).
- **UX-002**: Bug no componente compartilhado `Dialog.tsx` que renderizava `display: flex` mesmo quando fechado (`isOpen=false`).
- **UX-003**: Falhas de contraste de cores (WCAG 2.2 AA) em botões e badges sob o tema claro (`--ok` e `--warn`).
- **UX-004**: Inconsistência de tokens entre definições JavaScript legadas e a folha global do Tailwind v4 (`globals.css`).
- **UX-005**: Quebra de layout e sobreposição de gavetas (`Drawer`) em telas menores ou dispositivos móveis.
- **UX-006**: Uso de diálogos nativos bloqueantes do navegador (`alert()`, `confirm()`) substituíveis por toasts acessíveis.
- **UX-007**: Ausência de suporte rigoroso a `prefers-reduced-motion` em animações de órbitas e partículas.

### Grupo 7: HARDENING & GOVERNANCE (07 Achados)
- **HRD-001**: Ausência de validação automatizada de detecção de segredos (Gitleaks) pré-commit obrigatória.
- **HRD-002**: Vulnerabilidades transitivas em pacotes de terceiros sem política de verificação semanal (Trivy).
- **HRD-003**: Falta de barreira automatizada para impedir novas migrations com comandos destrutivos sem aprovação.
- **HRD-004**: Falta de auditoria de acessibilidade contínua na esteira de integração contínua (CI com `axe-core`).
- **HRD-005**: Scripts utilitários temporários mantidos na raiz do projeto poluindo o working tree.
- **HRD-006**: Ausência de política de retenção e expurgo programado de logs operacionais e métricas antigas.
- **HRD-007**: Falta de verificação de integridade e deriva de especificações OpenAPI (`openapi.yaml`) contra rotas ativas.

---

## 4. Definition of Done (DoD) para Produção — Birth Hub 360°

Para que qualquer correção, módulo ou entrega seja considerada **CONCLUÍDA** e apta a ser promovida para ambiente de Produção, todos os critérios abaixo devem ser verificados:

### A. Qualidade de Código & Tipagem
- [ ] Compilação limpa via `npx tsc --noEmit` sem erros e sem acréscimo de supressões `@ts-ignore`.
- [ ] Linters executados (`npm run lint` e `biome check`) sem novos erros ou advertências graves.
- [ ] Proibição total de novos tipos `any` não justificados nas camadas de domínio e aplicação.
- [ ] Conformidade estrita com Clean Architecture (domínios isolados, dependências apontando para dentro).

### B. Cobertura de Testes & Regressão
- [ ] 100% dos testes unitários da suíte passando sem dependência de banco de dados real.
- [ ] Testes de integração cobrindo fluxos críticos multi-tenant com contexto de isolamento estrito.
- [ ] Testes de regressão visual Playwright aprovados e consistentes entre ambientes Linux e Windows.
- [ ] Gates de cobertura mantidos dentro ou acima dos thresholds baseline estabelecidos.

### C. Segurança, RLS & LGPD
- [ ] Scan de segredos (Gitleaks) 100% verde sem chaves, senhas ou tokens expostos.
- [ ] Nenhuma nova policy de banco com bypass de RLS desgovernado; validação contra allowlist estrito.
- [ ] Conformidade com a LGPD: endpoints com expurgo, minimização de PII e trilha de auditoria completa.
- [ ] Varredura de vulnerabilidades de dependências (npm audit / Trivy) sem falhas High ou Critical.

### D. Banco de Dados & Migrações
- [ ] Migrações 100% não-destrutivas (proibido `DROP TABLE` / `DROP COLUMN` sem script de migração bifásica).
- [ ] Scripts de migration idempotentes validados em banco limpo e banco populado.
- [ ] Índices devidamente criados para campos de busca frequente e chaves de tenant (`organizationId`).

### E. Design System & Acessibilidade
- [ ] Conformidade com a identidade Command Center (Navy Obsidian `#0b132b` + Dourado `#d4af37`).
- [ ] Contraste visual atendendo aos requisitos mínimos do WCAG 2.2 AA (mínimo de 4.5:1 para texto normal).
- [ ] Suporte integral a navegação por teclado e `prefers-reduced-motion`.

### F. CI/CD & Deploy
- [ ] Pipeline do GitHub Actions verde em todos os jobs obrigatórios (`application gate`, `security`, `bundle budget`).
- [ ] Imagem Docker construída e aprovada em ambiente containerizado.
- [ ] Rollback documentado e testado com procedimentos claros de recuperação de desastres.

---

## 5. Gate de Conclusão da Fase 0

> **REGRA DO GATE:** Não avançar para as fases subsequentes de refatoração ou novas features sem a reprodução determinística do estado atual da plataforma e a aprovação formal deste documento de baseline.

- **Status do Gate:** **APROVADO & HOMOLOGADO**
- **Artefato Gerado:** `BASELINE-001`
