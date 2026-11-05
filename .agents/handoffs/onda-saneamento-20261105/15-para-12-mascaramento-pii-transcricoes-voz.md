De: 15 — Segurança Aplicada e Rotação de Segredos
Para: 12 — Voz e Telefonia
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-12-002 (B-13)
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Transcrições de áudio de ligações (transcription.service.ts) gravam texto com menção a CPF, cartão de crédito e dados médicos sensíveis sem filtro de PII antes de persistir.

## Arquivo(s) envolvido(s)
- src/services/telephony/transcription.service.ts:140-185

## Evidência
Base de auditoria: DIVIDAS-AGENTE-15.md, DIVIDAS-AGENTE-12.md e DIVIDAS-AGENTE-21.md.
- transcription.service.ts (L140-185): Recebe texto gerado pelo modelo Whisper/ASR e salva diretamente no campo transcript de CallRecord sem passar por regex de dados sensíveis.
- Violação direta de AGENTS.md §22 (B-13: LGPD) e §27 (Minimização de dados).

## Alteração necessária
1. Integrar pipeline de sanitização de PII em transcription.service.ts substituindo números de cartão, CPF e dados bancários por tags [REDACTED_CPF], [REDACTED_CARD].
2. Aplicar a mesma sanitização aos embeddings gerados para busca vetorial de chamadas.

## Teste esperado
- Critério de Aceite: Texto com menção explícita de CPF gravado no banco de testes tem os dígitos devidamente ofuscados.
- Teste: transcription-pii-masking.spec.ts.

## Contexto adicional
Blindagem de dados pessoais de clientes e pacientes em gravações telefônicas.
