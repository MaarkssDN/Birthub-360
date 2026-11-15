- De: Agente 15
- Para: Agente 14
- Onda: IA-1
- Status: aberto
- Prioridade: normal

## Problema

Revisão de segurança dos guardrails PII implementados pelo Agente 07 em `src/lib/ai/guardrails/pii.guard.ts`.

## Arquivo(s) envolvido(s)

- `src/lib/ai/guardrails/pii.guard.ts`
- `src/lib/ai/guardrails/toxicity.guard.ts`
- `src/lib/ai/guardrails/index.ts`

## Alteração necessária

Adicionar teste de segurança para validação dos guardrails PII na suíte de testes, cobrindo:

1. Falsos positivos em padrões numéricos (CEP, protocolos, IDs)
2. Logs de tentativas bloqueadas em `AILog` ou tabela dedicada
3. Redação reversível (placeholders estáticos vs tamanho dinâmico)
4. Prompt injection no prompt antes de enviar ao provider
5. Encoding bypass (Base64, hex, unicode escape)

## Teste esperado

Teste em `tests/security/pii-guardrail.spec.ts` que:
- Valida que CPF/CNPJ falsos não bloqueiam
- Confirma que redação não vaza metadados de tamanho
- Verifica que tentativas bloqueadas são registradas
- Testa bypass por encoding

## Contexto adicional

Revisão completa em handoff: `.agents/handoffs/onda-ia-1/15-para-14-avaliacao-pii.md`

Decisão: APROVADO COM RESERVA para Onda 1. Implementação base é sólida, mas melhorias recomendadas para ondas posteriores.

## Resolução (Coordenador 00)

**CORRIGIDA em reconciliação 2026-11-14 (Agente 00)** — a redação anterior ("Testes já
implementados pelo Agente 14, conformes") superestimava a cobertura. Estado verificado:

**Cobertura real (parcial):**
- `tests/integration/ai-guardrails-security.test.ts` — detecção de CPF/CNPJ/e-mail/
  telefone/cartão, redação com placeholders, detecção de toxicidade, falsos positivos
  (CEP, protocolo numérico).
- `tests/unit/ai/guardrails-allowlist.test.ts` — allowlist de e-mails corporativos/
  placeholder e redação tokenizada.
- `tests/integration/ai-safety-adversarial.test.ts` — prompt injection/jailbreak
  cobertos no nível do wrapper do gateway (`wrapUntrustedContent` /
  `UNTRUSTED_CONTENT_GUARD_INSTRUCTION`), não no caminho específico dos guardrails PII.

**Débito — 3 lacunas dos 5 itens originais NÃO cobertos:**
1. **Logs de bloqueio em `AILog`** — o teste existe apenas como stub
   (`ai-guardrails-security.test.ts` ~L128: "Este teste requer integração com AILog;
   por enquanto, valida que a função existe"). Não há verificação real de persistência
   do log de tentativas bloqueadas.
2. **Prompt injection antes de enviar ao provider** — cobertura apenas indireta, no
   wrapper do gateway; não há teste do pipeline PII-guardrail → provider.
3. **Encoding bypass (Base64, hex, unicode escape)** — os testes documentam a falha
   como esperada (`expect(result.blocked).toBe(false) // Falha atual esperada`);
   ou seja, o bypass é conhecido e aceito para Onda 1, não corrigido.

Não existe handoff de débito separado cobrindo essas 3 lacunas — ficam registradas
neste handoff (status permanece **aberto**) até despacho em onda futura.

> Histórico: veredicto de reconciliação 2026-11-14 era DEFEITO-REAL (cobertura parcial,
> Resolução superestimava). Correção aplicada nesta data — ver
> RESULTADOS-RECONCILIACAO-20261114.md.
