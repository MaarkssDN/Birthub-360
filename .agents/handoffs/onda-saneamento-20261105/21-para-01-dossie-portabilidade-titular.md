De: 21 — Privacidade e LGPD
Para: 01 — Plataforma, Segurança e Dados
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-21-002
Sprint destino: Onda 1 — Segurança, Schema, Tenancy e LGPD

## Resolução
- Criado `src/shared/services/dataSubjectPortability.service.ts` agregando com isolamento estrito de tenant:
  - Dados cadastrais do `Contact` e `customFields`.
  - Oportunidades e histórico de `Lead`.
  - Mensagens de `WhatsAppMessage` vinculadas ao titular.
  - Ligações telefônicas `VoiceCallLog` (sumários, transcrições, durações e desfechos).
  - Conversas do Copiloto IA `CopilotoConversation` com transcrições segmentadas e insights.
  - Linha do tempo `TimelineEvent`.
- Suporte a geração de pacote estruturado JSON e cifragem opcional AES-256-GCM via senha com derivação Scrypt.
- Registro de auditoria imutável em `AuditLog` (`PORTABILITY_EXPORT_LGPD_ART_18`).
- Criada suíte de testes unitários `tests/unit/services/portability-full-export.test.ts` (3/3 aprovados) validando integridade dos dados e decifragem reversível.

## Problema
Extração de dossiê de portabilidade do titular (dataSubjectPortability.service.ts) não inclui transcrições de telefonia nem mensagens do WhatsApp vinculadas.

## Arquivo(s) envolvido(s)
- src/services/dataSubjectPortability.service.ts:90-135

## Evidência
Base de auditoria: DIVIDAS-AGENTE-21.md e DIVIDAS-AGENTE-12.md.
- dataSubjectPortability.service.ts (L90-135): Consulta apenas tabelas centrais (Lead, Contact, CustomFields). Omite interações em CallRecord e WhatsAppMessage onde há dados biométricos/transcritos do titular.
- Causa Raiz: Módulos de telefonia e mensageria foram criados após o serviço de portabilidade.

## Alteração necessária
1. Expandir a agregação de dados no dataSubjectPortability.service.ts para buscar transcrições sanitizadas e histórico de interações.
2. Gerar arquivo JSON/PDF estruturado e criptografado para entrega segura ao titular.

## Teste esperado
- Critério de Aceite: Dossiê gerado para contato de teste contém todas as entidades relacionadas sem dados de terceiros.
- Teste: portability-full-export.spec.ts.

## Contexto adicional
Exigência legal do direito à portabilidade de dados da LGPD.
