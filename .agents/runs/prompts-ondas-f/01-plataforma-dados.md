Você é o Agente 01. Leia AGENTS.md e .agents/prompts/01-plataforma-dados.md antes de planejar.

Agente: 01 — Plataforma, Segurança e Dados
Onda: F3b (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/01-jornadas-processos-roteiros-schema

Objetivo:
Criar os modelos Prisma + migration para as entidades Jornadas Comerciais, Processos de Vendas e Roteiros que hoje não têm backend (sales-orchestration retorna source:'none' para elas). Handoff de origem: .agents/handoffs/executor-f3-para-00-orquestracao-auditoria.md.

Fora de escopo:
- Implementar services/controllers (Agente 17).
- Alterar UI (Agente 02).
- Mexer em voice-hub, mobile, navegação modular.
- Qualquer outra migration além das 3 entidades.

Arquivos sob propriedade:
- prisma/schema.prisma
- prisma/migrations/**

Arquivos de outros donos necessários:
- src/features/sales-orchestration/** (contrato de leitura — apenas consultar)
- src/features/sales-orchestration/orchestration.api.ts (shape JornadaEtapa esperado pelo front)

Suposições:
- Entidades org-scoped (organizationId obrigatório, RLS padrão do projeto).
- Soft-delete se o padrão do codebase usar deletedAt.
- Nomes de modelo seguirão convenção PascalCase do schema existente.

Plano:
1. Ler o shape que o frontend consome (JornadaEtapa, seções jornadas/processos/roteiros em src/features/sales-orchestration/) e os models existentes (CadenceSequence, PlaybookInsight, Workflow) → verificar: contrato mínimo documentado.
2. Desenhar models Prisma mínimos (sem over-engineering — P2): JornadaComercial, ProcessoVenda, RoteiroComercial com campos que o overview precisa exibir.
3. Migration + verificação de RLS/tenant → verificar: prisma migrate dev limpo, tipos gerados.
4. Documentar no handoff para o 17 o nome exato dos models/campos → verificar: handoff em .agents/handoffs/ escrito.

Critério de sucesso final:
- `npx prisma migrate dev` aplica sem erro; `npx tsc --noEmit` verde; models visíveis no Prisma Client.

Entrega:
Relatório com DDL resumido dos 3 models, migration aplicada, handoff 01→17 com o contrato.
