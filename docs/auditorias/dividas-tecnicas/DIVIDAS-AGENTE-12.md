# Relatório de Auditoria de Dívidas Técnicas — Agente 12

## IDENTIFICAÇÃO
- **ID do agente:** 12
- **Nome oficial:** Voz e Telefonia (Birthub Voices & Telephony Specialist)
- **Especialização:** Telefonia IP, discador preditivo e progressivo, WebRTC, inteligência de voz (Birth Voice), provedores de TTS/STT (ElevenLabs, Whisper, Bland AI, Kokoro TTS), gravação de chamadas e tarifação de telefonia
- **Responsabilidades:** Gestão da infraestrutura de telecomunicações do CRM, gateway de chamadas ativas e receptivas, qualidade de áudio (jitter, latência de pacotes RTP), transcrição e análise de sentimento em ligações, medição de minutos falados e faturamento de consumo.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/voice/**`, `src/features/voice-hub/**`, `src/features/ai-voice/**`, `src/features/cadence/dialer/**`, serviços de tarifação de telefonia.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Motor de discagem, estúdio de voz, clientes de streaming de áudio, serviços de transcrição, pipeline de tarifação de minutos de ligação.
- **Arquivos relevantes:**
  - `src/features/voice-hub/store/useStudioStore.ts` (1103 linhas, sob exceção)
  - `src/features/voice-hub/pages/Dashboard/Overview.tsx` (1431 linhas, sob exceção)
  - `src/features/voice-hub/components/design-system/index.tsx` (1099 linhas, sob exceção)
  - `src/features/ai-voice/flowise-router.service.ts`
  - `src/features/billing/services/billing.service.ts`
  - `src/lib/voice-hub/services/workflowRuntimeService.ts` (1402 linhas, sob exceção)
- **Serviços existentes:** `VoiceDialerService`, `AudioStreamManager`, `TranscriptionService`, `CallBillingService`.
- **APIs e integrações:** ElevenLabs API, Bland AI, Faster-Whisper local, Kokoro TTS local, WebRTC MediaStream API.
- **Funcionalidades implementadas:** Discagem em lote com 1 clique, gravação de áudio estéreo, transcrição em tempo real, detecção de caixa postal (AMD - Answering Machine Detection), clone de voz para SDRs.
- **Testes encontrados:** `tests/unit/voice/dialer.test.ts`, `tests/unit/billing.service.test.ts`.
- **Dependências externas:** Provedores de telefonia e áudio, `webrtc`, `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-12-001 (DEBT-BILL-003)
- **Título:** Função de faturamento de consumo de telefonia salta meses de 31 dias em ciclos de cobrança
- **Categoria:** Regra de Negócio e Financeiro
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/billing/services/billing.service.ts` (linhas 140-165)
- **Evidência:** A função de cálculo de renovação de créditos de telefonia manipula datas adicionando `month + 1` sem normalizar o último dia do mês (ex.: adicionando 1 mês a 31 de janeiro, o JavaScript converte para 2 ou 3 de março, saltando o mês de fevereiro por completo).
- **Problema:** Clientes corporativos com contratos faturados em dias 29, 30 ou 31 sofrem pulo involuntário de faturas em meses menores, gerando faturamento duplicado ou interrupção indevida do crédito de ligações.
- **Causa raiz:** Manipulação aritmética ingênua do objeto `Date` nativo do JavaScript em vez do uso de funções com proteção de overflow de calendário (ex.: `addMonths` do `date-fns`).
- **Impacto:** Perda de receita para a plataforma e bloqueio incorreto da discagem de clientes que pagaram em dia.
- **Correção necessária:** Refatorar a função de renovação utilizando `addMonths` da biblioteca `date-fns`, que garante que o último dia do mês anterior seja mantido (31 de janeiro -> 28/29 de fevereiro).
- **Agente proprietário:** 12
- **Agentes dependentes:** 01 (Schema de Faturamento), 04 (Métricas Financeiras de BI)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Teste com datas 29/01, 30/01 e 31/01 comprova renovações agendadas exatamente no último dia de fevereiro sem pular para março.
- **Teste necessário:** Suíte de testes unitários parametrizados para todos os meses do ano em anos bissextos e não bissextos.
- **Dependências:** Nenhuma.

### ID: DIV-12-002
- **Título:** Parâmetro prompt não utilizado em flowise-router.service.ts indicando refatoração incompleta
- **Categoria:** Qualidade de Código e Confiabilidade
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `src/features/ai-voice/flowise-router.service.ts` (linha 13)
- **Evidência:** O método `routePrompt(sessionId: string, prompt: string, context: Record<string, unknown>)` recebe `prompt`, mas a implementação interna envia apenas o `context` para o endpoint do Flowise, ignorando o texto original falado pelo usuário (alerta de linter Biome `noUnusedFunctionParameters`).
- **Problema:** O comando de voz transcrito não é repassado para o motor de decisão do Flowise, fazendo com que o agente de voz responda baseado apenas no contexto estático da sessão sem ouvir a instrução do usuário.
- **Causa raiz:** Refatoração de migração de payload que omitiu o mapeamento do campo de mensagem na chamada HTTP.
- **Impacto:** O roteamento de comandos de voz do Voice Hub opera de forma degradada e ignora instruções orais específicas.
- **Correção necessária:** Mapear o parâmetro `prompt` no corpo da requisição enviada ao Flowise (`{ question: prompt, overrideConfig: context }`).
- **Agente proprietário:** 12
- **Agentes dependentes:** 07 (IA e Automações)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O payload enviado ao Flowise contém o texto do prompt e os testes unitários comprovam a passagem do parâmetro.
- **Teste necessário:** Teste unitário com mock de requisição verificando o body JSON enviado.
- **Dependências:** Nenhuma.

### ID: DIV-12-003
- **Título:** Hotspots severos em componentes de estúdio de voz (Overview.tsx e useStudioStore.ts)
- **Categoria:** Arquitetura de Frontend e Manutenibilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/voice-hub/pages/Dashboard/Overview.tsx` (1431 linhas), `src/features/voice-hub/store/useStudioStore.ts` (1103 linhas)
- **Evidência:** Ambos os arquivos superam 1100 linhas de código e estão incluídos em `HOTSPOT_EXCEPTIONS.md` com prazo de reavaliação até 30/11/2026.
- **Problema:** A tela de visão geral e a store de estado concentram manipulação de buffers de áudio PCM, visualizadores de onda (waveforms), controles de volume, estatísticas de chamadas ativas e gerenciamento de microfones em arquivos monolíticos.
- **Causa raiz:** O módulo Voice Hub foi desenvolvido como uma aplicação completa embutida em uma única pasta sem modularização de serviços de áudio.
- **Impacto:** Lentidão na renderização de gráficos de onda em tempo real durante chamadas; alto risco de vazamento de memória em sessões longas de discagem.
- **Correção necessária:** Modularizar a store separando estado de UI de estado de áudio (`useAudioStreamStore`, `useCallMetricsStore`), e decompor `Overview.tsx` em widgets isolados.
- **Agente proprietário:** 12
- **Agentes dependentes:** 03 (Design System)
- **Complexidade:** Grande (3 a 4 dias)
- **Prioridade:** P1
- **Critério de aceite:** `Overview.tsx` e `useStudioStore.ts` reduzidos para menos de 450 linhas cada, mantendo 100% da fluidez na renderização de áudio.
- **Teste necessário:** Testes de montagem e renderização com simulação de fluxo WebRTC ativo.
- **Dependências:** Nenhuma.

### ID: DIV-12-004
- **Título:** Ausência de mascaramento automático de PII sensível em transcrições de voz de ligações
- **Categoria:** Privacidade, LGPD e Segurança
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/voice/services/transcriptionProcessor.service.ts` (linhas 60-85)
- **Evidência:** O texto gerado pelo serviço de Speech-to-Text (Whisper/Bland) é gravado integralmente na tabela `CallTranscription` no banco de dados sem passar por filtro de sanitização ou regex de mascaramento de números de cartão de crédito, códigos de segurança (CVV) ou senhas ditadas pelo cliente na ligação.
- **Problema:** Dados confidenciais de pagamento e PII sensível ficam persistidos em texto aberto no banco de dados e acessíveis no histórico de ligações de qualquer usuário com acesso ao CRM.
- **Causa raiz:** O processamento de transcrição foi implementado focando apenas na acurácia do áudio sem filtros de privacidade na saída.
- **Impacto:** Violação grave de normas de segurança de dados de pagamento (PCI-DSS) e da LGPD (Art. 46); exposição desnecessária de dados financeiros de clientes.
- **Correção necessária:** Implementar pipeline de higienização de transcrição com regex de detecção de cartões de crédito e CPFs, substituindo-os por `[DADO_SENSIVEL_MASCARADO]` antes de persistir no PostgreSQL.
- **Agente proprietário:** 12
- **Agentes dependentes:** 15 (Segurança Aplicada), 21 (LGPD)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Áudio transcrito contendo "meu cartão é 4111 2222 3333 4444" é gravado como "meu cartão é [CARTAO_MASCARADO]".
- **Teste necessário:** Teste unitário do processador de transcrição com 15 exemplos de dados sensíveis falados.
- **Dependências:** Validação de padrões com o Agente 15 e 21.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (discador, gravação, síntese de voz e roteamento de áudio funcionais).
- **Cobertura automatizada de testes:** Média (testes de rotas presentes, mas testes de streaming de áudio e billing incompletos).
- **Segurança:** Média (comprometida pela falta de mascaramento de dados de cartão em transcrições).
- **Arquitetura:** Média (hotspots densos em `Overview.tsx` e na store de áudio).
- **Confiabilidade:** Média (afetada por falhas na renovação de crédito em meses de 31 dias).
- **Observabilidade:** Alta (métricas de chamadas, duração e taxa de sucesso registradas).
- **Manutenibilidade:** Média (complexidade elevada em componentes WebRTC).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Corrigir a lógica de cálculo de faturamento de meses de 31 dias em `billing.service.ts` (DIV-12-001).
2. **Segurança e integridade de dados:** Implementar mascaramento automático de PII e dados de pagamento em transcrições (DIV-12-004).
3. **Falhas funcionais:** Conectar o parâmetro `prompt` na chamada do Flowise (DIV-12-002).
4. **Confiabilidade:** Modularizar a store de áudio e a tela `Overview.tsx` (DIV-12-003).
5. **Testes:** Criar testes unitários para todos os cenários de fim de mês no faturamento.
6. **Arquitetura:** Desacoplar a lógica de processamento WebRTC dos componentes visuais de estúdio.
7. **Melhorias estruturais:** Adicionar métricas de jitter e perda de pacotes no painel de chamadas.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 3 Altas, 0 Médias, 1 Baixa
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-12-002, DIV-12-003)
- **Problemas compartilhados:** 2 (DIV-12-001 com 01/04, DIV-12-004 com 15/21)
- **Handoffs necessários:**
  - Handoff para 15: Validação das expressões regulares de sanitização de cartões em transcrições.
- **Riscos mais importantes:** Gravação de dados financeiros de clientes em texto plano nas transcrições expõe a empresa a multas graves; falhas no faturamento de fim de mês impactam a receita e o crédito de telefonia dos usuários.
- **Recomendação final:** Aplicar imediatamente o mascaramento de PII nas transcrições e corrigir a manipulação de datas no `billing.service.ts`.
