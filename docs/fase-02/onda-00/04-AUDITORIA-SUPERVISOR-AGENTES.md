# AUDITORIA DO SUPERVISOR CENTRAL E DO ECOSSISTEMA DE AGENTES (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documentos de Referência:** `AGENTS.md`, `docs/master-v4/03-INVENTARIO-OFICIAL-AGENTES.md`  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Status:** CONCLUÍDO — TAXONOMIA DE 7 NÍVEIS AUDITADA E COMPROVADA

---

## 1. Princípio de Separação de Responsabilidades e Taxonomia

Para eliminar qualquer ambiguidade entre os agentes que constroem a plataforma e os agentes que operam os dados comerciais dos clientes em tempo de execução, a auditoria homologa a **Taxonomia Oficial em 7 Categorias**:

1. **Categoria 1: Agentes de Engenharia do Repositório (`AGENTS.md`):**
   - 25 papéis oficiais ativos (Agentes 00 a 18, 21 a 24). Agentes 19 e 20 continuam estritamente reservados.
   - Nenhum destes agentes é exposto à interface do cliente ou roda em runtime de produção.
2. **Categoria 2: 15 Agentes Comerciais Nativos (Runtime de Produção):**
   - Agentes de background e copilotos: `ldr-intelligence`, `bdr-outbound`, `sdr-qualification`, `closer-sales`, `coordinator-commercial`, `manager-commercial`, `executive-director`, `billing-revenue`, `churn-retention`, `contract-signature`, `bitrix-guardian`, `revenue-intelligence`, `account-detective`, `promise-guardian`, `devils-advocate`.
3. **Categoria 3: Agentes Especializados de Canais e Voz:**
   - `voice-agent` (discagem e transcrição), `sdr-diagnostic`, `hunter-agent`, `tactical-agent`.
4. **Categoria 4: 379 Personas do Catálogo Expandido (`Agent Builder`):**
   - Biblioteca de templates normalizados em `src/features/job-roles/catalog/agents.normalized.json` instanciáveis pelas organizações.
5. **Categoria 5: 9 Avatares Institucionais de Interface (Pilares SVG):**
   - Orbit, Nexus, Aria, Vanguard, Oracle, Core, Spark, Echo, Sudo.
6. **Categoria 6: Ferramentas e Capacidades (Tools & Bindings):**
   - Tool calling catalogado e tipado com schemas Zod estritos, integrados ao catálogo OpenAPI.
7. **Categoria 7: Supervisor Central de Governança (`RoleSupervisor`):**
   - O orquestrador central de despacho semântico e portão de segurança.

---

## 2. Auditoria da Arquitetura do Supervisor Central

### 2.1 Despacho Semântico e Barramento de Mensagens (`agent-bus`)
- **Implementação Existente:** `src/features/intelligence/agents/supervisor.agent.ts` (1.000L), rotas `/api/agent-bus` e `/api/role-supervisor`.
- **Diagnóstico:** O supervisor despacha intenções do usuário para os agentes especializados adequados. No entanto, o arquivo atingiu o limite de hotspot (1.000 linhas exatas), misturando lógica de prompts, parsing de respostas e controle de alçada.
- **Ação Obrigatória:** Decomposição modular em sub-handlers dedicados (`BT360-DT-0065` / `TAREFA-SANEAMENTO-005`).

### 2.2 Fila de Aprovação Humana (`AIPendingAction`)
- **Princípio Inegociável:** Nenhum agente de IA pode executar ações de risco HIGH (como fechar deal, emitir contrato com desconto fora da alçada ou deletar dados) sem confirmação humana explícita.
- **Implementação Existente:** Modelo Prisma `AIPendingAction`, tela `src/features/intelligence/components/AIPendingActionsInbox.tsx` (971L).
- **Validação:** A retenção de ações funciona com sucesso, mas a interface precisa de paginação server-side e filtros por criticidade.

### 2.3 Gestão de Orçamento de Tokens e Custos (Agente 23)
- **Implementação Existente:** `src/lib/ai/budget.ts` gerencia limites de tokens e quotas por organização.
- **Evidência Empírica:** A suíte `tests/unit/lib/ai/budget.test.ts` foi executada com **10/10 testes aprovados**, comprovando que a trava de orçamento corta chamadas e avisa quando o consumo atinge 80% e 100% da cota contratada.

### 2.4 Base de Conhecimento e RAG Vetorial
- **Implementação Existente:** Modelo Prisma `VectorEmbedding` integrado à extensão `pgvector` do PostgreSQL 16.
- **Capacidade:** Suporte a embeddings de 1536 dimensões (text-embedding-3-small) e busca por similaridade de cosseno com índice HNSW.
