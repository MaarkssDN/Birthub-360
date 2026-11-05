# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 16
- **Nome oficial:** Runtime, Workers e Escala
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável pelo runtime de execução assíncrona da plataforma: as 13 filas BullMQ, o cron, os agendadores recorrentes e o ciclo de vida do processo.  Hoje **tudo isso roda dentro do processo HTTP**. `server.ts` sobe o Express, os workers BullMQ, os agendadores recorrentes e mantém as sessões Baileys de WhatsApp em memória — no mesmo processo que serve o SPA. Está documentado em `.agents/completion/01-bloqueadores.md` como débito arquitetural conhecido, mitigado por `queuesEnabled` e graceful shutdown, mas nunca resolvido.  O efeito prático: qualquer réplica adicional duplica cron e sessões de WhatsApp, e um worker pesado compete por event loop com requisição de usuário. Sua missão é separar os runtimes sem perder nenhuma funcionalidade existente.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Domínio abrangente definido no prompt

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** Domínio abrangente definido no prompt
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-OPS-006
**Título:** Guard classifica falhas de qualquer origem como Redis
- **Categoria:** Observabilidade
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/lib/process-guards.ts (linhas 48-52), src/lib/process-guards.ts (linhas 48-52)
- **Evidência:** src/lib/process-guards.ts (linhas 48-52), src/lib/process-guards.ts (linhas 48-52)
- **Problema:** matchesKnownPattern && (looksLikeIoredis || matchesKnownPattern) reduz a matchesKnownPattern; ECONNRESET de serviço não Redis segue processo.
- **Causa raiz:** Predicado origem tornado tautológico por repetição do termo.
- **Impacto:** Bugs não tratados de outros clientes seguem execução em estado possivelmente inconsistente;log continua existindo.
- **Correção necessária:** Exigir proveniência Redis com mensagem compatível;caso desconhecido fatal.
- **Agente proprietário:** 16
- **Agentes dependentes:** 06, 00 Ambiente isolado homologação, Revisão24, Autorização específica correção
- **Complexidade:** P
- **Prioridade:** P1
- **Critério de aceite:** Erro application ECONNRESET termina fatal;erro Redis conhecido segue log.error.
- **Teste necessário:** Erro application ECONNRESET termina fatal;erro Redis conhecido segue log.error.
- **Dependências:** Ambiente isolado homologação, Revisão24, Autorização específica correção

### ID: DEBT-OPS-007
**Título:** Shutdown HTTP espera fechar conexão SSE antes de encerrá-la
- **Categoria:** Disponibilidade
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/bootstrap/shutdown.ts (linhas 69-73), src/features/notifications/sse.service.ts (linhas 55-59)
- **Evidência:** src/bootstrap/shutdown.ts (linhas 69-73), src/features/notifications/sse.service.ts (linhas 55-59)
- **Problema:** Await httpServer.close callback precede sseService.closeAll;SSE mantém callback pendente e código não tem deadline.
- **Causa raiz:** Ordem de dreno com ciclo e falta de limite/best-effort prometido em comentário.
- **Impacto:** Deploy pode exigir kill e perder encerramento ordenado;falha em closeAll/worker também impede cleanup posterior.
- **Correção necessária:** Iniciar fechamento HTTP,fechar SSE,drenar com deadline e cleanup best-effort.
- **Agente proprietário:** 16
- **Agentes dependentes:** 06, 00 Ambiente isolado homologação, Revisão24, Autorização específica correção
- **Complexidade:** P
- **Prioridade:** P1
- **Critério de aceite:** SIGTERM com SSE ativo fecha SSE e HTTP dentro deadline;uma etapa falha não impede restantes.
- **Teste necessário:** SIGTERM com SSE ativo fecha SSE e HTTP dentro deadline;uma etapa falha não impede restantes.
- **Dependências:** Ambiente isolado homologação, Revisão24, Autorização específica correção

### ID: DEBT-QUEUE-001
**Título:** Worker é classificado como processo web e pode reenfileirar mensagens WhatsApp sem enviar
- **Categoria:** Filas e eventos
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/lib/queue/redis.ts (linhas 8-14), src/features/integrations/whatsapp/whatsapp.service.ts (linhas
- **Evidência:** src/lib/queue/redis.ts (linhas 8-14), src/features/integrations/whatsapp/whatsapp.service.ts (linhas 408-420), src/lib/queue/whatsappCommand.worker.ts (linhas 22-30)
- **Problema:** Em src/lib/queue/redis.ts:10, a expressão regular que detecta se o processo atual é um worker possui escape incorreto e avalia como false para worker.cjs e worker.ts. Quando a sessão WhatsApp não está ativa, o próprio whatsappCommand.worker.ts chama sendWhatsAppMessage, que julga estar no processo web, enfileira um novo job na fila BullMQ e retorna true.
- **Causa raiz:** Escape duplo acidental na literal RegExp de detecção de entrypoint do worker combinada com reutilização do método de serviço entre web e worker.
- **Impacto:** Reenfileiramento em loop e falso positivo de job concluído quando sessão WhatsApp do tenant está desconectada.
- **Correção necessária:** Corrigir a expressão regular de detecção de worker em src/lib/queue/redis.ts:10 (patch de 1 linha já validado em verify-worker-detector.mjs) e garantir que o worker falhe explicitamente quando a sessão estiver indisponível.
- **Agente proprietário:** 16
- **Agentes dependentes:** 16, 06, 07, 00 Coordenação slot de filas entre Agentes 16 e 06, Revisão independente Agente 24
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** verify-worker-detector.mjs passa 6/6 cenários (Unix/Windows, .ts/.cjs/.js) e job do worker sem sessão ativa falha sem criar novo job recursivo.
- **Teste necessário:** Matriz de 6 caminhos de entrypoint (Unix/Windows, worker vs server), Teste unitário de whatsappCommand.worker com sessão ausente
- **Dependências:** Coordenação slot de filas entre Agentes 16 e 06, Revisão independente Agente 24


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
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade confirmada:** 3
- **Riscos mais importantes:** Guard classifica falhas de qualquer origem como Redis; Shutdown HTTP espera fechar conexão SSE antes de encerrá-la; Worker é classificado como processo web e pode reenfileirar mensagens WhatsApp sem enviar
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
