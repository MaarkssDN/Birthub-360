---
name: llm-cost-and-token-budgeter
description: Controle de custos, latência e orçamento de tokens para agentes de runtime e automações de IA (OpenAI, Anthropic, Gemini) no Birth Hub 360. Práticas para prompt caching, compressão de contexto, truncamento seguro e roteamento de modelos.
---

# LLM Cost & Token Budgeter — Agente 23 (Custo & Performance)

## Objetivo
Evitar explosão de custos em APIs de LLM e lentidão na experiência do usuário. Garantir que cada automação, assistente de voz ou agente do Enxame utilize o modelo mais eficiente com o menor número viável de tokens, utilizando a infraestrutura real do projeto (`src/lib/ai/budget.ts`, `src/lib/ai/usage-log.ts` e modelo `AILog` em `prisma/schema.prisma`).

## Boas Práticas de Engenharia de Prompt e Custo

### 1. Roteamento Inteligente de Modelos (Model Cascading)
- Não use modelos de raciocínio pesado ou modelos caros para tarefas mecânicas ou estruturação de dados.
- Tarefas simples (classificação de intenção, extração de entidades JSON, sumarização curta) devem usar modelos ultrarrápidos e econômicos (ex: Gemini Flash, GPT-4o-mini).
- Reserve modelos maiores apenas para raciocínio complexo, síntese médica ou análise profunda de conversas de vendas.

### 2. Aproveitamento de Prompt Caching
- Mantenha instruções de sistema, esquemas de ferramentas (tools) e contexto fixo no início do prompt.
- Não injete timestamps voláteis ou IDs dinâmicos no topo do system prompt (pois isso invalida o cache de prefixo dos provedores).

### 3. Compressão de Contexto e Janela Deslizante
- Ao alimentar históricos de chat longos no CRM, comprima mensagens antigas em resumos periódicos em vez de enviar 200 mensagens brutas a cada turno.
- Trunque ou pagine resultados de consultas RAG: injete no máximo os 3 a 5 chunks mais semanticamente relevantes.

### 4. Structured Outputs com Schema Rígido
- Prefira recursos nativos de `response_format: { type: "json_schema" }` ou chamada de funções (*tool calling*) em vez de pedir "responda em JSON" via prompt livre. Isso reduz tentativas frustradas de parse e retentativas desnecessárias.

## Métricas Obrigatórias de Observabilidade (`AILog`)
- Registrar por requisição no modelo `AILog` (`prisma/schema.prisma:1826-1846`, via `src/lib/ai/usage-log.ts`) utilizando exclusivamente as colunas reais do schema:
  - `id`, `organizationId`, `model`, `promptId`, `agentRole`, `createdAt`
  - `tokens` (total de tokens consumidos na chamada)
  - `cost` (custo calculado da chamada)
  - `latencyMs` (duração da requisição em milissegundos)
- Validar orçamento por organização via `src/lib/ai/budget.ts` e alertar caso uma organização ou job atinja o limite orçamentário configurado.
