# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 12
- **Nome oficial:** Voz e Telefonia (Birthub Voices / Bland / 3CX)
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável por todo o caminho de voz da plataforma: discagem autônoma, política de ligação, webhooks de resultado, supressão de contato e a integração de telefonia 3CX.  Este agente está declarado na estrutura oficial de `/AGENTS.md` desde a primeira revisão, mas **nunca teve prompt**. Na prática, voz vinha sendo tratada em pedaços pelos Agentes 06 (integrações) e 07 (IA e filas) — dois donos parciais e nenhum responsável formal. É a razão de este arquivo existir.  Voz é o canal de maior risco do produto: erra e a plataforma liga para uma pessoa real, cobrando do cliente, fora de janela permitida, possivelmente depois de um opt-out.
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

### ID: DEBT-BILL-003
**Título:** Função legada de renovação normaliza mês inválido e salta mês previsto
- **Categoria:** Billing
- **Severidade:** Baixa
- **Status:** Confirmado / Aberto
- **Localização:** src/lib/voice-hub/services/billingService.ts (linhas 149-154), src/bootstrap/routes.ts (linhas 200-2
- **Evidência:** src/lib/voice-hub/services/billingService.ts (linhas 149-154), src/bootstrap/routes.ts (linhas 200-204)
- **Problema:** Execução da função pura computePeriodEnd extraída do fonte: 2026-01-31 mensal =>2026-03-03; 2026-03-31 mensal =>2026-05-01; 2024-02-29 anual =>2025-03-01.
- **Causa raiz:** Date.setMonth/setFullYear normaliza dias inválidos para mês seguinte sem clamp.
- **Impacto:** Reutilizar serviço legado para faturamento carregaria cálculo incorreto de currentPeriodEnd. Bootstrap atual marca voice-hub indisponível; não há prova de efeito financeiro corrente.
- **Correção necessária:** Antes de reativar/reutilizar billing legado, fixar política de calendário e clamp de dia; não ampliar escopo nem reativar produto nesta auditoria.
- **Agente proprietário:** 12
- **Agentes dependentes:** 01 12, 18
- **Complexidade:** Baixo
- **Prioridade:** P3
- **Critério de aceite:** 31 janeiro mensal resulta fim fevereiro; leap-day anual segue regra publicada
- **Teste necessário:** 31jan mensal encerra fevereiro, 31mar mensal encerra abril, 29fev anual segue regra explícita, Dias normais preservam dia e hora
- **Dependências:** 12, 18


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
- **Quantidade total de dívidas identificadas:** 1
- **Quantidade confirmada:** 1
- **Riscos mais importantes:** Função legada de renovação normaliza mês inválido e salta mês previsto
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
