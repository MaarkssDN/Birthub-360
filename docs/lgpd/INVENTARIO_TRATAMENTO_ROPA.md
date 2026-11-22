# Inventário de Operações de Tratamento de Dados Pessoais (ROPA) — LGPD Art. 37
**Controlador:** Birth Hub 360  
**Encarregado pelo Tratamento de Dados Pessoais (DPO):** Agente 21 — Privacidade e LGPD  
**Data da Última Revisão:** 18 de novembro de 2026  
**Status:** HOMOLOGADO E CONFORME

---

## 1. Identificação das Finalidades e Bases Legais

| Categoria de Titular | Dados Pessoais Coletados | Finalidade do Tratamento | Base Legal (Lei 13.709/2018) | Prazo de Retenção | Destino pós-retenção |
|---|---|---|---|---|---|
| **Contatos Comerciais (Leads)** | Nome, e-mail comercial, telefone/WhatsApp, cargo, empresa | Qualificação e prospecção B2B de novos negócios | Art. 7º, V (Contrato preliminar) e Art. 7º, IX (Legítimo interesse) | Duração do ciclo comercial + 12 meses | Anonimização irreversível |
| **Interlocutores em Ligações (VoiceHub)** | Voz, transcrição da chamada, áudio gravado | Coaching comercial, registro de reuniões e sumarização IA | Art. 7º, I (Consentimento explícito pré-chamada) e Art. 7º, IX | 90 dias para áudio bruto; transcrição anonimizada | Exclusão do blob e redação de PII |
| **Usuários da Plataforma (Operadores)** | Nome, e-mail corporativo, logs de acesso, IP | Autenticação, controle de RBAC e auditoria de segurança | Art. 7º, II (Cumprimento de obrigação legal) e Art. 7º, V | 6 meses para logs de conexão (Marco Civil da Internet) | Exclusão com arquivamento frio |
| **Assinantes de Propostas Comerciais** | Nome, CPF, e-mail, hash criptográfico de assinatura | Formalização e celebração de contratos mercantis | Art. 7º, V (Execução de contrato) | 5 anos pós-encerramento contratual (Código Civil) | Exclusão segura |
| **Leads de Demonstração (Landing 360°)** | Nome, e-mail, WhatsApp (opcional), equipe | Agendamento e confirmação da demonstração solicitada pelo titular | Art. 7º, I (Consentimento — opt-in desmarcado por padrão, prova versionada em `PublicLeadConsent`/`ConsentAuditRecord`) | 90 dias sem avanço (critério conservador confirmado pelo controlador; prazo "demo + 30 dias" não aplicável — não existe campo de demo agendada) | Anonimização irreversível via `eraseDataSubject` no sweep diário `landingLeadRetention.worker.ts` |
| **Solicitantes de Direitos do Titular — canal público (DSR)** | E-mail do titular (cifrado AES-256-GCM + blind index), protocolo opaco, tipo de direito, canal preferencial, detalhes do pedido (cifrado) | Atendimento aos direitos do art. 18 e confirmação de prazo do art. 19 (15 dias) via canal self-service | Art. 7º, II (cumprimento de obrigação legal — LGPD) para o ciclo do pedido; prova do consentimento do lead conforme linha acima | Ciclo do pedido + prazo necessário ao ônus da prova (art. 8º, §2º e art. 16, I); tokens de verificação/status expiram em 72h | Expurgo/anonimização do titular; expurgo do registro DSR ao fim do prazo legal; dossiê de portabilidade nunca persistido (devolvido uma única vez) |

---

## 2. Medidas de Segurança Técnicas e Administrativas

1. **Criptografia em Trânsito e em Repouso:**
   - Tráfego HTTP/WS 100% criptografado com TLS 1.3 / HTTPS.
   - Banco de dados PostgreSQL com criptografia AES-256 e backups criptografados com chave assimétrica GPG.
2. **Minimização de Dados e Tokenização em Voo:**
   - Redação automática de números de CPF, cartões de crédito e telefones via `piiTokenizer.service.ts` antes de repasse a provedores externos de LLM/STT.
3. **Mecanismo de Descarte e Esquecimento (DSR — Data Subject Request):**
   - Canal self-service público implementado (PR #381 backend + PR #385 frontend):
     `POST /api/public/data-subject-requests` + `/verify` + `/status/:token`, com
     verificação de identidade por token de uso único (72h), respostas
     anti-enumeração, rate limit dedicado e páginas `/privacidade/dsr/*` +
     formulário em `/privacy`. Modelo `DataSubjectRequest` com RLS por tenant.
   - Canal interno autenticado preservado (`/api/lgpd/titular/*`, ADMIN/GESTOR) e
     canal manual via DPO como fallback.
   - Serviço automatizado e idempotente `src/shared/services/dataSubjectErasure.service.ts`,
     acrescido do sweep diário de retenção dos leads da landing
     (`src/features/lgpd/jobs/landingLeadRetention.worker.ts` — 90 dias sem avanço).
   - Remoção de nomes, telefones, e-mails, notas livres, metadados de mensagens e áudios gravados, preservando unicamente identificadores opacos para integridade contábil e referencial da empresa.
