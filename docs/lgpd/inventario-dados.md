# Inventário Geral de Dados Pessoais & Bases Legais (LGPD)
**Bloqueador B-13 — Squad 00 (Agente 07 · Íris)**  
**Projeto:** Birth Hub 360°  
**Emissão:** 20/11/2026  
**Status de Conformidade:** 100% CONFORME — Zero campos PII sem base legal declarada.

---

## 1. Princípio de Governança
Todas as tabelas primárias e secundárias do banco de dados PostgreSQL do Birth Hub 360° que armazenam Dados Pessoais (PII), Dados Pessoais Sensíveis (saúde/biometria/voz) ou credenciais foram catalogadas com sua respectiva finalidade e enquadramento legal conforme os Artigos 7º e 11 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

---

## 2. Catálogo Oficial de Campos PII e Dados de Saúde em Tabelas do Schema

| Tabela / Model | Campo | Classificação | Criptografia em Repouso | Finalidade do Tratamento | Base Legal (LGPD) | Retenção / Expurgo |
|---|---|---|---|---|---|---|
| **Contact** | `email` | PII Direta | Sim (AES-256-GCM) | Comunicação operacional, envio de propostas e cadência | Art. 7º, IX (Legítimo Interesse) / Art. 7º, V (Contrato) | Expurgo via DSR / Opt-Out |
| **Contact** | `phone` | PII Direta | Sim (AES-256-GCM) | Contato telefônico para qualificação comercial | Art. 7º, IX (Legítimo Interesse) | Expurgo via DSR / Opt-Out |
| **Contact** | `whatsapp` | PII Direta | Sim (AES-256-GCM) | Mensageria instantânea e alertas autorizados | Art. 7º, IX (Legítimo Interesse) / Consentimento | Expurgo imediato em STOP/SAIR |
| **Contact** | `emailIndex` / `phoneLast9Index` | Pseudônimo / Blind Index | Não (HMAC unidirecional) | Busca e deduplicação sem expor valor em texto claro | Art. 7º, IX (Segurança e Integridade) | Eliminado com exclusão do contato |
| **VoiceCallLog** | `recordingUrl` | PII Sensível (Voz) | Sim (S3 SSE-KMS + AES-256) | Auditoria de atendimento e comprovação de contratação | Art. 7º, V (Execução de Contrato) / Art. 11, II, "a" | 7 anos para compliance telecom |
| **VoiceCallLog** | `transcript` | PII Sensível | Sim (AES-256-GCM) | Transcrição de áudio para copiloto e resumo CRM | Art. 7º, IX (Legítimo Interesse) | Anonimização/mascaramento de PII |
| **VoiceCallLog** | `summary` | PII Indireta | Sim (AES-256-GCM) | Resumo de chamadas gerado por IA para CRM | Art. 7º, IX (Legítimo Interesse) | Minimizado sem termos clínicos |
| **CopilotoTranscriptSegment** | `text` | PII Direta / Voz | Sim (AES-256-GCM) | Transcrição realtime de turnos de diálogo do vendedor | Art. 7º, IX (Apoio Comercial) | Expurgo programado pós-chamada |
| **Lead** | `notes` / `observations` | PII Indireta | Sim (Campos Livres) | Registro de contexto de prospecção | Art. 7º, IX (Legítimo Interesse B2B) | Expurgo em 90 dias se desqualificado |
| **DataSubjectRequest** | `emailEncrypted` | PII Direta | Sim (AES-256-GCM) | Autenticação e canal de envio de dados do titular | Art. 7º, II (Cumprimento de Obrigação Legal - Art. 18) | Retido durante tramitação do protocolo |
| **DataSubjectRequest** | `detailsEncrypted` | PII Livre | Sim (AES-256-GCM) | Detalhamento do pedido de exclusão/portabilidade | Art. 7º, II (Obrigação Legal Art. 18 LGPD) | Expurgo pós-conclusão do pedido |
| **ConsentAuditRecord** | `subjectRef` | Pseudônimo | Não (HMAC-SHA256) | Comprovação probatória de consentimento perante ANPD | Art. 8º, §2º (Ônus da prova) / Art. 16, I | Crypto-shredding via ConsentSubjectKey |
| **PublicLeadConsent** | `termsText` | Evidência Legal | Não (Texto imutável) | Versão dos termos aceitos pelo prospect no formulário | Art. 8º (Evidência probatória de consentimento) | 5 anos pós-revogação |
| **User** | `email` | PII Cadastral | Não (Índice de Login) | Autenticação e governança de acesso | Art. 7º, V (Contrato de Trabalho/Prestação) | Duração do vínculo corporativo |
| **User** | `passwordHash` | Credencial Segura | Sim (Argon2id / Bcrypt) | Autenticação segura na plataforma | Art. 7º, V (Segurança de Acesso) | Invalidação imediata no desligamento |
| **Account** | `refreshToken` / `accessToken` | Credencial Cifrada | Sim (AES-256-GCM) | Conexão OAuth com provedores terceiros | Art. 7º, V (Execução de Serviço) | Rotação automática / Revogação no logout |

---

## 3. Diretrizes de Proteção a Dados de Saúde e Voz (Art. 11 LGPD)
1. **Zero Inferência Médica:** É expressamente proibido pela Constituição de IA do Birth Hub 360° deduzir hipóteses diagnósticas, diagnósticos médicos ou patologias a partir das chamadas telefônicas ou mensagens.
2. **Minimização Obrigatória em LLMs:** O serviço `guardrails.service.ts` remove nomes, CPFs e dados de saúde de prompts antes de qualquer envio a provedores externos de IA.
3. **Criptografia Mandatória:** Gravações de voz são armazenadas em buckets S3 com criptografia SSE-KMS forçada (`src/features/voice-hub/recording/storage.ts`), rejeitando qualquer upload desprotegido.
4. **Isolamento Multi-Tenant:** Toda consulta de dados pessoais em tabelas secundárias exige o predicado `organizationId` e passa pelo contexto RLS do PostgreSQL (`src/lib/tenant-prisma.ts`).
