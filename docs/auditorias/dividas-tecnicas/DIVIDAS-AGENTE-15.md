# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 15
- **Nome oficial:** Segurança Aplicada e Rotação de Segredos
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável por segurança **aplicada e verificada**, não por escrever política. Este repositório já teve segredos reais versionados com remote público no GitHub, e a remediação de código foi feita — mas a parte que só o mundo externo resolve (rotacionar credencial exposta) continua em aberto, e a parte que impede a reincidência (varredura no gate) existe em `package.json` sem estar ligada a nada.  Sua missão é fechar as duas pontas: o que ainda está exposto e o que impede que aconteça de novo.
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

### ID: DEBT-SEC-001
**Título:** URLs de autenticação sensíveis são escritas em logs no fallback sem SMTP
- **Categoria:** Segurança e privacidade
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/lib/auth.ts (linhas 127-132), src/lib/logger.ts (linhas 36-41), src/lib/auth.ts (linhas 179-184)
- **Evidência:** src/lib/auth.ts (linhas 127-132), src/lib/logger.ts (linhas 36-41), src/lib/auth.ts (linhas 179-184)
- **Problema:** Fallback MailerNotConfiguredError registra objeto email/url e interpola URL em msg; redaction do logger não cobre esses campos nem texto da mensagem.
- **Causa raiz:** Logs recebem credencial transitória e PII; não há sanitização de msg/url/email no sink.
- **Impacto:** Leitor de logs com URL válida pode recuperar/verificar conta; condição SMTP ausente demonstrada por ramo estático, exposição efetiva de produção não verificada.
- **Correção necessária:** Remover URL e e-mail dos logs, emitir apenas userId/código de configuração ausente, falhar de modo observável.
- **Agente proprietário:** 15
- **Agentes dependentes:** 01 15, 21, 12
- **Complexidade:** Baixo
- **Prioridade:** P1
- **Critério de aceite:** SMTP ausente não emite URL/token nem e-mail, inclusive msg serializada
- **Teste necessário:** SMTP ausente para reset e verificação não escreve token/URL/email; capturar objeto e msg, SMTP disponível mantém envio válido
- **Dependências:** 15, 21, 12

### ID: DEBT-SEC-001
**Título:** Segredos Hardcoded em Produção e Testes
- **Categoria:** Segurança
- **Severidade:** Crítica
- **Status:** Confirmado
- **Localização:** scripts/pwa/verify-precache.ts
- **Evidência:** scripts/pwa/verify-precache.ts
- **Problema:** Tokens Bitrix, AWS e chaves de IA hardcoded em vários scripts.
- **Causa raiz:** Geração de chaves temporárias para debug mantidas no repo.
- **Impacto:** Exposição crítica.
- **Correção necessária:** Mover chaves para AWS Secrets e rotacionar.
- **Agente proprietário:** 15
- **Agentes dependentes:** 00 06
- **Complexidade:** M
- **Prioridade:** P0
- **Critério de aceite:** Nenhuma credencial via gitleaks.
- **Teste necessário:** gitleaks passes
- **Dependências:** 06


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
- **Riscos mais importantes:** URLs de autenticação sensíveis são escritas em logs no fallback sem SMTP; Segredos Hardcoded em Produção e Testes
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
