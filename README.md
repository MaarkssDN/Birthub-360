# BirthHub 360º — Enterprise Revenue Operations & Autonomous AI Platform

![Build & Quality](https://img.shields.io/badge/Health%20Index-96%2F100-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)
![Prisma](https://img.shields.io/badge/Prisma-ORM-indigo)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20RLS-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue)
![ArgoCD](https://img.shields.io/badge/GitOps-ArgoCD-orange)

> **BirthHub 360º** é uma plataforma corporativa integrada de **Revenue Operations (RevOps)**, Inteligência Comercial, CRM Preditivo e Automação Agêntica com IA e Telefonia de Voz (VoiceHub). Projetada para fornecer previsibilidade de receita, governança de dados e execução operacional de alto impacto.

---

## 🏛️ 1. Arquitetura de Software

A plataforma adota **Clean Architecture Modular** orientada a Domínio (DDD) com injeção de dependências desacoplada, garantindo escalabilidade e testabilidade:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│     React 18 + Vite + Tailwind CSS + Storybook + Capacitor      │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / WebSocket / WebRTC
┌────────────────────────────────▼────────────────────────────────┐
│                     APPLICATION LAYER                           │
│   UseCases, Command & Query Handlers, Event Listeners, Workers  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Dependency Inversion (DI)
┌────────────────────────────────▼────────────────────────────────┐
│                       DOMAIN LAYER                              │
│   Entities, Value Objects, Domain Services, Repository Contracts│
└────────────────────────────────┬────────────────────────────────┘
                                 │ Interfaces
┌────────────────────────────────▼────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│  PostgreSQL (Prisma + RLS), Qdrant (Vetores), Redis, LiteLLM    │
└─────────────────────────────────────────────────────────────────┘
```

- **Injeção de Dependências**: Container centralizado em `src/shared/di/container.ts`.
- **Isolamento Multi-Tenant**: Row Level Security (RLS) nativo do PostgreSQL em todas as entidades corporativas (`tenant_id`/`organization_id`).
- **Governança Arquitetural**: Gates contínuos de importação via `dependency-cruiser` (`.dependency-cruiser.cjs`) e controle estrito de complexidade ciclomática (`scripts/architecture/check-hotspots.ts`).

---

## 📦 2. Stack Tecnológica

| Componente | Tecnologia | Papel |
| :--- | :--- | :--- |
| **Frontend Web** | React 18, TypeScript, Vite, Tailwind CSS, Lucide | Cockpit executivo e interfaces operacionais |
| **Mobile** | Capacitor (Android & iOS) | Execução mobile nativa |
| **Backend Core** | Node.js (>=20), Express/Fastify, TypeScript | API RESTful, micro-serviços e workers de background |
| **Persistência Relacional** | PostgreSQL 16 + Prisma ORM | Modelagem transacional completa |
| **Busca Vetorial & Semântica** | Qdrant Vector Database | Embeddings de IA, inteligência de leads e memória RAG |
| **Cache & Mensageria** | Redis | Filas de background (BullMQ) e caching de baixa latência |
| **Voz & Telefonia** | VoiceHub (WebRTC, Whisper, TTS) | Agentes autônomos de prospecção e qualificação por voz |
| **CI/CD & DevOps** | GitHub Actions, Docker, K8s, Helm, ArgoCD | Pipelines de qualidade, SonarQube, Trivy, CodeQL |

---

## 🚀 3. Guia de Inicialização Rápida

### Pré-requisitos
- **Node.js**: `>= 20.0.0`
- **Docker & Docker Compose**: `>= 24.x`
- **PostgreSQL 16** e **Redis**

### Instalação e Execução Local

```bash
# 1. Clonar o repositório
git clone https://github.com/Marks-Mah/Birthub-360.git
cd Birthub-360

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente (não sobrescreve um .env existente)
[ -f .env ] || cp .env.example .env
#    3a. PLATFORM_OPERATOR_TOKEN (>= 16 chars; protege /admin/queues e /metrics).
#        Fica vazio no .env.example; sem ele o boot falha com
#        "Too small: expected string to have >=16 characters". Gere e cole no .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#    3b. BETTER_AUTH_SECRET: troque o placeholder do .env por um valor novo:
openssl rand -base64 32
#        Nunca versione o .env nem reutilize chaves de outro ambiente.

# 4. Subir containers de infraestrutura (Postgres, Redis, Qdrant)
docker compose -f docker-compose.services.yml up -d

# 5. Gerar o Prisma Client, executar migrações do banco de dados e seeds
npx prisma generate
npx prisma migrate dev   # ou `npx prisma migrate deploy` para só aplicar as migrações existentes
npx prisma db seed

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

Ambiente Windows: utilize o script pronto `Iniciar-Servidor-BirthHub360.bat`.

> Estes passos substituem o bootstrap automático do antigo Codespace (`.devcontainer/post-create*.sh`, removido).

---

## 🧪 4. Qualidade de Código & Esteira de Testes

O repositório possui uma pirâmide completa de testes e gates bloqueantes de qualidade:

```bash
# Executar testes unitários e de integração
npm run test

# Executar testes end-to-end com Playwright
npm run test:e2e

# Verificar integridade arquitetural (dependency-cruiser)
npm run lint:architecture

# Validar hotspots de complexidade
npm run check:hotspots

# Auditoria de formatação e linting
npm run lint
```

---

## 🛡️ 5. Governança, Segurança e Dívida Técnica

- **Plano de Remediação de Tech Debt**: Monitorado ativamente através de [`TECH_DEBT_REMEDIATION_PLAN.md`](TECH_DEBT_REMEDIATION_PLAN.md) com meta de `Health Index >= 98`.
- **Blindagem de Migrações**: Políticas estritas de migração não-destrutiva (`Expand -> Migrate -> Contract`), proibindo `DROP` sem plano de contingência e rollback.
- **Segurança Aplicada**: Análise de segredos com Gitleaks (`.gitleaks.toml`), auditoria de vulnerabilidades com Trivy (`.github/workflows/security-trivy.yml`) e varredura estática CodeQL.

---

## 📄 6. Licença e Contatos
Desenvolvido por **Marcelo do Nascimento (Marks)** — CTO, COO & Arquiteto de Software.  
Todos os direitos reservados.
