# 03 — MATRIZ DE RESPONSABILIDADES POR AGENTE RECONCILIADA — BIRTHUB 360°

**Autoridade:** Agente 00 — Supervisor Geral de Engenharia  
**Auditoria:** Agente 24 — Revisão Independente  
**Referência Canônica:** `AGENTS.md` (Revisão 2026-10-09)  
**Data:** 2026-11-10  

---

## 1. LIMITES OPERACIONAIS E GOVERNANÇA COMPROVADA

Em estrito cumprimento ao **`AGENTS.md` vigente**, foram auditadas e reafirmadas as seguintes regras de execução:
1. **Slots Mutuamente Exclusivos (`AGENTS.md` §14):**
   - Agente **01** (Plataforma) e Agente **01A** (RLS/Retenção) NUNCA executam simultaneamente.
   - Agente **06** (Integrações) e Agente **06A** (Extrações) NUNCA executam simultaneamente.
   - Agente **08** (QA/Release) e Agente **08A** (Git/Deploy AWS) NUNCA executam simultaneamente.
   - Agente **16** (Workers) e Agente **06/07** não tocam simultaneamente `src/lib/queue/**`.
2. **Propriedade Estrita e Inviolável de Arquivos (`AGENTS.md` §15):**
   - `prisma/schema.prisma` e `prisma/migrations/**`: Agente **01/01A**.
   - `src/App.tsx` e navegação central: Agente **02**.
   - `.github/workflows/**` e Dockerfiles: Agente **08**.
   - Infraestrutura K8s/ArgoCD/Terraform: Agente **10**.
   - Android e Capacitor: Agente **09**.
   - Identidade Visual e Ativos: Agente **11**.
   - Pareceres Oficiais: Agente **24**.
3. **Limite de Execução Paralela (`AGENTS.md` §13):** Máximo de **8 especialistas simultâneos**, desde que com isolamento em branches dedicadas (`agente/<numero>-<slug>`) e arquivos 100% disjuntos.
4. **Revisão Independente Mandatória (`AGENTS.md` §40):** Toda entrega, sem exceção, exige parecer formal `APROVADO` do Agente 24 em `.agents/reviews/`.

---

## 2. MATRIZ DE DISTRIBUIÇÃO DAS 97 DÍVIDAS ENTRE OS 26 AGENTES

| Agente | Nome Oficial | Total Dívidas | Resolvidas | Pendentes | P0 | P1 | P2 | P3 | Dependências Obrigatórias | Ordem de Atuação |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| **10** | Infraestrutura, Observabilidade e SRE | **3** | 2 | **1** | 0 | 0 | 1 | 0 | 01, 16 | Onda 2 |
| **11** | Marca e Ativos Institucionais | **3** | 0 | **3** | 0 | 0 | 0 | 3 | 03, 09 | Onda 5 |
| **12** | Voz e Telefonia (Birthub Voices) | **4** | 3 | **1** | 0 | 1 | 0 | 0 | 01, 15, 21 | Onda 3 |
| **13** | Enxame Autônomo e Governança de Runtime | **4** | 1 | **3** | 0 | 1 | 2 | 0 | 01, 07, 23 | Onda 4 |
| **14** | Ambiente de Execução e Test Harness | **3** | 1 | **2** | 0 | 0 | 2 | 0 | 01, 08, 10 | Onda 2 |
| **15** | Segurança Aplicada e Rotação de Segredos | **3** | 0 | **3** | 1 | 1 | 1 | 0 | 00, 01, 24 | Onda 0 (Imediata) |
| **16** | Runtime, Workers e Escala | **3** | 3 | **0** | 0 | 0 | 0 | 0 | 00, 06, 10 | Onda 2 |
| **17** | Cadência Multicanal e Ciclo de Receita | **3** | 2 | **1** | 0 | 0 | 1 | 0 | 01, 06, 21 | Onda 3 |
| **18** | Contratos, API e Documentação Viva | **3** | 1 | **2** | 0 | 0 | 2 | 0 | 01, 07, 24 | Onda 5 |
| **21** | Privacidade e LGPD | **4** | 2 | **2** | 0 | 0 | 1 | 1 | 01, 16, 17 | Onda 1 |
| **22** | Verificação de Realidade | **3** | 1 | **2** | 0 | 0 | 2 | 0 | 01, 02, 08 | Onda 5 |
| **23** | Custo, Performance e Limites de IA | **4** | 2 | **2** | 0 | 0 | 2 | 0 | 01, 07, 16 | Onda 4 |
| **24** | Revisão Independente | **3** | 3 | **0** | 0 | 0 | 0 | 0 | 00, 08A | Contínua em Todas |
| **00** | Coordenador e Orquestrador Geral | **4** | 2 | **2** | 0 | 0 | 1 | 1 | 08A, 14, 18, 24 | Onda 0 |
| **01** | Plataforma, Segurança e Dados | **6** | 3 | **3** | 0 | 0 | 2 | 1 | 01A, 15, 18, 21 | Onda 1 (Leva A) |
| **01A** | Confiabilidade de Dados, RLS e Retenção | **3** | 2 | **1** | 0 | 0 | 1 | 0 | 01 (pré-requisito), 10, 21 | Onda 1 (Leva B) |
| **02** | Produto e UX | **3** | 0 | **3** | 0 | 1 | 2 | 0 | 01, 03, 18 | Onda 5 (Leva A) |
| **03** | Design e Acessibilidade | **4** | 2 | **2** | 0 | 1 | 1 | 0 | 02, 11 | Onda 5 (Leva B) |
| **04** | CRM, BI e Analytics | **4** | 3 | **1** | 0 | 0 | 1 | 0 | 01, 10, 18 | Onda 5 |
| **05** | Prospecção Comercial | **4** | 2 | **2** | 0 | 0 | 2 | 0 | 01, 16, 21 | Onda 4 |
| **06** | Integrações e Bitrix | **4** | 2 | **2** | 0 | 1 | 0 | 1 | 02, 12, 16 | Onda 3 (Leva A) |
| **06A** | Extrações Bitrix | **4** | 2 | **2** | 0 | 0 | 1 | 1 | 06 (pré-requisito), 16, 21 | Onda 3 (Leva B) |
| **07** | IA, Copiloto e Automações | **6** | 2 | **4** | 0 | 2 | 2 | 0 | 01, 13, 23 | Onda 4 |
| **08** | QA, Testes e Release | **5** | 2 | **3** | 0 | 1 | 1 | 1 | 00, 08A, 14, 24 | Onda 0 / Gate Final |
| **08A** | Operações Git e Deploy AWS | **3** | 0 | **3** | 0 | 0 | 3 | 0 | 08 (slot exclusivo), 24 | Onda 0 |
| **09** | Mobile e PWA (Capacitor/Android) | **4** | 2 | **2** | 0 | 0 | 1 | 1 | 01, 02, 15 | Onda 5 |

---

## 3. AUDITORIA DE SOBRECARGA E SLOTS CONCORRENTES

- **Agente 01 (Plataforma/Dados):** 4 pendências técnicas (índices compostos, soft-deletes, modularização prisma.ts e validação Better-Auth). Atua na Leva A da Onda 1.
- **Agente 15 (Segurança):** 3 pendências, com destaque para a única **P0** do sistema (`BT360-DT-0072`), com execução mandatória e imediata na Onda 0.
- **Agentes 02 e 03 (Produto e Design):** Maior volume de refatoração modular (`CrmBoard.tsx`, `App.tsx`, eliminação de `!important`). Executam em paralelismo seguro na Onda 5.
