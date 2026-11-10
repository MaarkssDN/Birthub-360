# MAPA DE DEPENDÊNCIAS ARQUITETURAIS DA RECONSTRUÇÃO (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Em conformidade com:** `AGENTS.md` (Seções 13, 14, 19 e 21)  
**Status:** CONCLUÍDO — GRAFO DIRECIONADO SEM CICLOS BLOQUEANTES

---

## 1. Grafo Direcionado de Precedência Arquitetural

A ordem de reconstrução e saneamento é estritamente governada pelo princípio de dependência em camadas:
```mermaid
flowchart TD
    subgraph CAMADA_0 ["Camada 0 — Segurança Crítica & Emergências (Onda 0)"]
        AUTH_LEAK["Saneamento Vazamento Auth (BT360-DT-0072)"]
        CSP_HEADERS["Hardening Headers CSP (BT360-DT-0073)"]
    end

    subgraph CAMADA_1 ["Camada 1 — Fundação, Tenancy & Hotspots (Onda 1)"]
        RLS_POLICIES["PostgreSQL RLS Policies (MOD-09)"]
        HOTSPOT_CRM["Modularização CrmBoard.tsx"]
        HOTSPOT_BITRIX["Modularização BitrixImportPanel.tsx"]
        HOTSPOT_SUPERVISOR["Modularização supervisor.agent.ts"]
        EVENT_MESH["Domain Event Mesh & Redis DLQ"]
    end

    subgraph CAMADA_2 ["Camada 2 — Core Transacional Comercial (Onda 2)"]
        MOD01["MOD-01 Hub Comercial (Deals, Contratos, Ficha 360°)"]
        MOD02["MOD-02 Inteligência de Mercado (Enriquecimento Atômico)"]
        MOD03["MOD-03 Orquestração de Vendas (Cadências & Auto-Stop)"]
    end

    subgraph CAMADA_3 ["Camada 3 — Inteligência Executiva & IA (Onda 3)"]
        MOD04["MOD-04 Performance Comercial (BI & Otimização N+1)"]
        MOD05["MOD-05 Previsibilidade (Forecast & War Room SSE)"]
        MOD06["MOD-06 Enxame de IA (Supervisor Semântico & RAG)"]
        MOD07["MOD-07 Automação & Conectividade (Dry-Run Engine)"]
    end

    subgraph CAMADA_4 ["Camada 4 — Canais, Voz & Mobilidade (Onda 4)"]
        MOD08["MOD-08 Engajamento Comercial (VoiceHub & WebRTC)"]
        MOD10["MOD-10 Mobile & Field Sales (SQLite Criptografado & DLQ)"]
        MOD11["MOD-11 Social Selling (Timeline CRM & Limiter)"]
    end

    subgraph CAMADA_5 ["Camada 5 — Hardening de Release & A11y (Onda 5)"]
        A11Y_AUDIT["Acessibilidade WCAG 2.2 AA (Agente 03)"]
        MUTATION_GATE["Mutation Testing & Flaky Isolation (Agente 08)"]
        FINAL_AUDIT["Auditoria Independente de Release (Agente 24)"]
    end

    AUTH_LEAK --> RLS_POLICIES
    CSP_HEADERS --> RLS_POLICIES
    RLS_POLICIES --> MOD01
    HOTSPOT_CRM --> MOD01
    HOTSPOT_BITRIX --> MOD07
    HOTSPOT_SUPERVISOR --> MOD06
    EVENT_MESH --> MOD03
    MOD01 --> MOD02
    MOD01 --> MOD03
    MOD01 --> MOD04
    MOD04 --> MOD05
    MOD02 --> MOD06
    MOD03 --> MOD06
    MOD07 --> MOD08
    MOD01 --> MOD10
    MOD08 --> MOD10
    MOD02 --> MOD11
    MOD01 --> MOD11
    MOD05 --> A11Y_AUDIT
    MOD06 --> A11Y_AUDIT
    MOD10 --> MUTATION_GATE
    A11Y_AUDIT --> FINAL_AUDIT
    MUTATION_GATE --> FINAL_AUDIT
```

---

## 2. Slots Exclusivos e Regras de Concorrência (`AGENTS.md` §14)

Para garantir que a execução não gere conflitos nem sobreescrita de arquivos compartilhados:
- **Slots Exclusivos (Nunca rodam em paralelo):**
  - Agente 01 (Plataforma) $leftrightarrow$ Agente 01A (RLS e Retenção).
  - Agente 06 (Integrações) $leftrightarrow$ Agente 06A (Extrações Bitrix).
  - Agente 16 (Workers/Runtime) $leftrightarrow$ Agente 06/07 quando alterarem `src/lib/queue/**`.
- **Propriedade Exclusiva Inegociável (`AGENTS.md` §15):**
  - `prisma/schema.prisma` e migrações $ightarrow$ Exclusivo Agente 01.
  - `src/App.tsx` e navegação principal $ightarrow$ Exclusivo Agente 02.
  - `.github/workflows/**` e Dockerfiles $ightarrow$ Exclusivo Agente 08 / 08A.
  - `k8s/**` e `infrastructure/**` $ightarrow$ Exclusivo Agente 10.
  - `android/**` e `capacitor.config.ts` $ightarrow$ Exclusivo Agente 09.
  - `.agents/reviews/**` $ightarrow$ Exclusivo Agente 24.
  - `server.ts` e `package.json` $ightarrow$ Exigem aprovação explícita do Agente 00.

---

## 3. Prevenção de Bloqueadores Mútuos e Ciclos

Nenhum módulo de nível superior (ex: Mobile ou BI) poderá introduzir campos no banco de dados sem passar pelo Agente 01 através de handoff formal em `.agents/handoffs/`. As integrações não criam migrações diretamente.
