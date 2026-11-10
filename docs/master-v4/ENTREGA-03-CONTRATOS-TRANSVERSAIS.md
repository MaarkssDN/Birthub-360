# CONTRATOS ARQUITETURAIS TRANSVERSAIS (ENTREGA 03)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documento de Referência:** Documento Mestre Oficial V4 Consolidado  
**Data:** 10 de Novembro de 2026  
**Status:** CONTRATOS FORMAIS HOMOLOGADOS

---

## 1. Multi-Tenancy e Isolamento Rigoroso de Organização

### 1.1 Princípio de Tenancy
Nenhum dado comercial, pessoal, métrica, documento ou log de execução de IA pode vazar entre organizações clientes. Toda entidade de banco de dados do domínio do produto DEVE conter a coluna `organizationId VARCHAR(36) NOT NULL`.

### 1.2 Mecanismo de Garantia em Dupla Camada (Defense in Depth)
1. **Camada de Aplicação (Prisma Middleware / Extensions):**
   - Em toda requisição autenticada, o middleware extrai o `organizationId` da sessão JWT validada.
   - Qualquer mutação (`create`, `update`, `delete`) ou consulta (`findMany`, `findFirst`, `count`) injeta compulsoriamente a cláusula `where: { organizationId: session.organizationId }`.
   - Se uma requisição tentar passar um `organizationId` diferente no corpo ou parâmetro, o middleware lança exceção imediata `SecurityException: Tenant Cross-Access Attempt` com código HTTP 403 e alerta no SIEM.
2. **Camada de Banco de Dados (Row-Level Security - RLS no PostgreSQL):**
   - Todas as tabelas sensíveis possuem políticas de RLS ativas:
     ```sql
     ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
     CREATE POLICY lead_tenant_isolation ON "Lead"
       USING ("organizationId" = current_setting('app.current_organization_id', true));
     ```
   - Antes de executar qualquer query, o pool de conexões define a variável de sessão de tenant:
     `SET LOCAL app.current_organization_id = '<organization_id>';`

---

## 2. Autenticação, Sessão e RBAC (Controle de Acesso Baseado em Papéis)

### 2.1 Gestão de Sessões
- **Mecanismo:** JSON Web Tokens (JWT) assimétricos (RS256) armazenados em cookies `HttpOnly`, `Secure` e `SameSite=Lax`.
- **Duração do Token de Acesso:** 15 minutos.
- **Refresh Token com Rotação Automática:** Duração de 7 dias com revogação instantânea de tokens antigos em caso de detecção de reuso.
- **Proteção:** Rate limiting de 5 tentativas por minuto por IP em `/api/auth/login` com bloqueio temporário e desafio CAPTCHA/OTP.

### 2.2 Matriz Canônica de Papéis (RBAC)

| Papel | Escopo de Visibilidade | Permissões de Criação/Edição | Acesso a Configurações | Aprovação de IA / Descontos |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Organização Completa | Total (todas as entidades) | Total (equipe, módulos, flags, billing) | Total (alçada máxima) |
| **GESTOR** | Organização Completa | Total em Leads, Deals e Pipelines | Parcial (metas, playbooks, relatórios) | Alçadas até 20% e Ações de IA |
| **CLOSER** | Sua Carteira / Time | Leads atribuídos, Propostas e Negócios | Nenhuma | Desconto até 10% |
| **SDR / BDR** | Fila de Prospecção | Criação de Leads, Cadências e Atividades | Nenhuma | Nenhuma |
| **VISUALIZADOR**| Relatórios Autorizados| Somente Leitura | Nenhuma | Nenhuma |

---

## 3. Feature Flags e Contratação Modular

### 3.1 Contrato de Acesso a Módulos (`ModuleGrant`)
O acesso a cada um dos 11 módulos da plataforma é governado pela tabela `ModuleGrant`, vinculada à `Organization`. Cada registro possui:
- `moduleKey`: Chave única do módulo (ex: `MOD_MARKET_INTELLIGENCE`, `MOD_VOICE_HUB`, `MOD_SOCIAL_SELLING`).
- `isEnabled`: Booleano determinando se o módulo está ativo.
- `validUntil`: Data de expiração do contrato ou ciclo de faturamento.
- `tierLimits`: JSON com quotas contratadas (ex: `{ "monthlyCredits": 1000, "seats": 15 }`).

### 3.2 Interceptador de Rotas
Se um usuário tentar navegar para uma rota de módulo não contratado (ex: `/app/market-intelligence` sem `MOD_MARKET_INTELLIGENCE`), o frontend redireciona suavemente para a página de upgrade e a API retorna imediatamente HTTP 403 com payload padronizado:
```json
{
  "code": "MODULE_NOT_GRANTED",
  "message": "Este módulo não faz parte do plano contratado da sua organização.",
  "upgradeUrl": "/app/settings/billing/upgrade?module=MOD_MARKET_INTELLIGENCE"
}
```

---

## 4. Barramento de Eventos e Domain Event Mesh

### 4.1 Padrão de Evento de Domínio
Todas as comunicações assíncronas entre módulos e o enxame de IA utilizam mensagens estruturadas com envelopes imutáveis:
```typescript
export interface DomainEvent<T = unknown> {
  eventId: string;           // UUIDv4 único
  eventType: string;         // Nome do evento (ex: 'crm.deal.won')
  occurredAt: string;        // Timestamp ISO-8601 UTC
  organizationId: string;    // ID do tenant isolado
  correlationId: string;     // Rastreamento fim a fim da transação
  causationId?: string;      // ID do evento que provocou este evento
  actor: {
    userId?: string;
    agentId?: string;
    system: boolean;
  };
  payload: T;
  schemaVersion: number;     // Versionamento semântico de payload
}
```

### 4.2 Idempotência e Tratamento de Falhas
- **Chave de Idempotência:** Chave Redis calculada como `idem:{organizationId}:{eventType}:{eventId}` com TTL de 48 horas.
- **Garantia de Entrega:** Pelo menos uma vez (At-Least-Once Delivery).
- **Dead-Letter Queue (DLQ):** Falhas transitórias sofrem até 5 tentativas com backoff exponencial (1s, 5s, 25s, 125s, 625s). Persistindo a falha, o payload é depositado na DLQ com notificação para o Sudo (Admin Ops).

---

## 5. Supervisor e Ecossistema de Agentes de IA

### 5.1 Arquitetura do Enxame
- **Supervisor Central (`RoleSupervisor`):** Ponto único de entrada para requisições complexas que demandam múltiplos agentes. Analisa o objetivo comercial, seleciona os agentes especialistas mais aderentes e divide a execução em tarefas ordenadas por dependência em um grafo acíclico dirigido (DAG).
- **Roteamento de Comandos:** Comunica-se através do `AgentBus` com isolamento de contexto e quotas individuais por chamada.

### 5.2 Fila de Aprovação Humana (Human-in-the-Loop)
Qualquer ação de agente que envolva impacto externo ou financeiro DEVE ser classificada como risco `HIGH` e retida na tabela `AIPendingAction`:
- Nenhuma mensagem para lead real pode ser disparada sem validação quando em modo semi-autônomo.
- Toda alteração de valor de contrato ou desconto sugerida pelo Closer Copilot deve ser aceita formalmente pelo vendedor ou gestor.
- Nenhuma exclusão de dados pode ser realizada por IA.

### 5.3 Mitigação de Alucinações e Ancoragem Factual
- Prompts de sistema impõem estritamente: *"Você é um agente corporativo do Birthub 360°. Você só pode citar fatos diretamente verificáveis nos dados do cliente ou na Base de Conhecimento fornecida no contexto. Caso não encontre a resposta exata, declare 'DADO_NAO_DISPONIVEL' e nunca invente valores, prazos ou termos contratuais."*

---

## 6. Base de Conhecimento Corporativa (RAG) em pgvector

### 6.1 Processamento e Indexação
- **Documentos Suportados:** PDFs de playbooks de vendas, tabelas de preço, manuais de produto, scripts de qualificação e transcrições de reuniões.
- **Divisão em Chunks:** Algoritmo recursivo de fragmentação de 512 tokens com sobreposição (overlap) de 64 tokens, respeitando quebras de parágrafo e cabeçalhos Markdown.
- **Geração de Embeddings:** Vetores densos de 1536 dimensões gerados via modelo oficial e armazenados em coluna `vector(1536)` com índice HNSW para busca rápida em sub-milissegundos.
- **Isolamento de RAG por Tenant:** Toda consulta de similaridade DEVE filtrar obrigatoriamente por `organizationId`:
  ```sql
  SELECT chunk_id, content, 1 - (embedding <=> $1) AS similarity
  FROM "KnowledgeChunk"
  WHERE "organizationId" = $2 AND 1 - (embedding <=> $1) > 0.78
  ORDER BY similarity DESC
  LIMIT 5;
  ```

---

## 7. Rate Limiting, Bilhetagem e Quotas

### 7.1 Políticas de Quotas
- Cada organização possui uma cota mensal de:
  - Tokens de IA (entrada e saída somados).
  - Créditos de enriquecimento de dados de mercado (Apollo/Hunter/CNPJ).
  - Minutos de telefonia e áudio no Voice Hub.
  - Armazenamento em Gigabytes de anexos e gravações.

### 7.2 Bloqueio Seguro e Notificação Prévia
- Ao atingir 80% do pacote: Notificação de aviso para o Administrador da conta.
- Ao atingir 100%: As chamadas que consomem recursos de IA ou dados externos retornam HTTP 429 com mensagem explicativa e opção de compra de pacote adicional de recarga imediata (add-on).
- As operações básicas de CRM (Kanban, notas, edição manual de cadastros) NUNCA são bloqueadas por estouro de cota de IA.

---

## 8. Auditoria, Logs Estruturados e Observabilidade

### 8.1 Padrão de Log
Logs são emitidos em formato JSON estrito para o stdout e ingeridos pelo subsistema de observabilidade:
```json
{
  "timestamp": "2026-11-10T11:34:00.123Z",
  "level": "info",
  "organizationId": "org_abc123",
  "userId": "usr_xyz789",
  "correlationId": "corr_998877",
  "component": "automation.engine",
  "action": "rule.executed",
  "status": "success",
  "durationMs": 42,
  "metadata": {
    "ruleId": "rule_01",
    "leadId": "lead_55"
  }
}
```

### 8.2 Métricas e Telemetria
- Exportação de métricas em formato Prometheus no endpoint `/metrics` (protegido por token de infraestrutura).
- Rastreamento distribuído via OpenTelemetry (spans propagados via cabeçalho `traceparent`).
- Health checks granulares em `/health`:
  - `status: "healthy"` apenas se PostgreSQL, Redis e provedores vitais responderem dentro do threshold de timeout de 1500ms.

---

## 9. Privacidade, LGPD e Retenção de Dados

### 9.1 Base Legal e Consentimento
- Todo dado de pessoa física (Titular) inserido no CRM deve ter sua Base Legal vinculada (Legítimo Interesse com teste LIA registrado, Execução de Contrato ou Consentimento Explícito).
- Registros de consentimento são imutáveis e mantidos em log append-only.

### 9.2 Direitos do Titular (Art. 18 da LGPD)
1. **Acesso e Confirmação de Tratamento:** Exportação em JSON/PDF de todas as informações do titular em menos de 24h.
2. **Exclusão e Anonimização:** O processo de exclusão substitui nome, e-mail, telefone e CPF por hashes unidirecionais cegos (`blind index`), mantendo a integridade referencial dos valores das negociações fechadas sem permitir reidentificação do indivíduo.
3. **Revogação de Consentimento / Opt-Out:** Inclusão imediata do contato na lista de supressão de mensagens e telefonia.

---

## 10. Segurança, Acessibilidade e Resiliência

### 10.1 Segurança da Informação
- Criptografia em trânsito com TLS 1.3 obrigatório (HSTS ativo com max-age 31536000).
- Criptografia em repouso de segredos e credenciais via AES-256-GCM.
- Proteção estrita contra SQL Injection, XSS, CSRF e SSRF em todos os endpoints de integração.

### 10.2 Acessibilidade (WCAG 2.2 AA)
- Relação de contraste mínima de 4.5:1 para texto normal e 3:1 para elementos de interface grandes e gráficos.
- Todos os elementos interativos possuem suporte completo a navegação por teclado (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
- Atributos ARIA obrigatórios em modais, dropdowns e tabelas de dados.
- Respeito à preferência do sistema operacional por movimento reduzido (`prefers-reduced-motion: reduce`).

### 10.3 Resiliência e SLA
- RPO (Recovery Point Objective): Máximo de 1 hora.
- RTO (Recovery Time Objective): Máximo de 2 horas em caso de desastre regional.
- Backups diários automatizados e testados com criptografia assimétrica de chave pública.
