# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 02
- **Nome oficial:** Product Architecture, Navigation & UX Specialist
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é o dono da arquitetura de navegação, composição do produto, dashboard, onboarding, configurações e experiência de uso.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** src/App.tsx, src/components/layout, src/features/dashboard, src/features/onboarding, src/features/settings

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** src/App.tsx, src/components/layout, src/features/dashboard, src/features/onboarding, src/features/settings
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-NOT-001
**Título:** Leitura broadcast silencia unread para colegas
- **Categoria:** Notificações
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/notifications/notification.service.ts (linhas 94-98), prisma/schema.prisma (linhas 2048
- **Evidência:** src/features/notifications/notification.service.ts (linhas 94-98), prisma/schema.prisma (linhas 2048-2052)
- **Problema:** Notification tem readAt único;markRead de broadcast altera mesmo registro para toda organização.
- **Causa raiz:** Modelo mistura notificação e estado por destinatário.
- **Impacto:** Colegas deixam de receber indicação não lida de alerta que não abriram.
- **Correção necessária:** Manter leitura por usuário com modelo01 e contrato18,sem alterar conteúdo broadcast.
- **Agente proprietário:** 02
- **Agentes dependentes:** 06, 00, 01, 18 Agente01 schema leitura por usuário, Agente18 contrato API
- **Complexidade:** M
- **Prioridade:** P2
- **Critério de aceite:** UsuárioA lê broadcast;B continua unread até lê-lo;estado não compartilhado.
- **Teste necessário:** UsuárioA lê broadcast;B continua unread até lê-lo;estado não compartilhado.
- **Dependências:** Agente01 schema leitura por usuário, Agente18 contrato API

### ID: DEBT-ARCH-001
**Título:** Arquivos Monolíticos Excessivos (>1000 linhas)
- **Categoria:** Arquitetura
- **Severidade:** Alta
- **Status:** Confirmado
- **Localização:** src/features/prospecting/outbound/components/LeadCard.tsx
- **Evidência:** src/features/prospecting/outbound/components/LeadCard.tsx
- **Problema:** Componentes UI e lógicas de routes muito grandes, ex: LeadCard.tsx.
- **Causa raiz:** Falta de refatoração para SOLID/desacoplamento em Sprints anteriores.
- **Impacto:** Custo cognitivo alto, lentidão na IDE e dificuldade em testar.
- **Correção necessária:** Decompor em hooks, serviços menores e pequenos componentes.
- **Agente proprietário:** 02
- **Agentes dependentes:** 00
- **Complexidade:** G
- **Prioridade:** P1
- **Critério de aceite:** Complexidade ciclomática abaixo de 10.
- **Teste necessário:** Typecheck, lint, dependency-cruiser aprovados.
- **Dependências:**


## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Validada por inferência do número de débitos (relativo ao tamanho do sistema).
- **Cobertura automatizada de testes:** Conforme débitos reportados na plataforma.
- **Segurança:** Riscos levantados nas análises gitleaks e dependency cruiser.
- **Arquitetura:** Complexidade analisada estruturalmente.
- **Confiabilidade:** Otimizações listadas no REMEDIATION_PLAN.

## PLANO DE SANEAMENTO
1. Resolver bloqueadores classificados como Críticos ou P0.
2. Endereçar dívidas relacionadas à exposição de dados.
3. Consertar funcionalidades quebradas/simuladas (P1).
4. Saneamento e Testes adicionais em dívidas médias.

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 2
- **Quantidade confirmada:** 2
- **Riscos mais importantes:** Leitura broadcast silencia unread para colegas; Arquivos Monolíticos Excessivos (>1000 linhas)
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
