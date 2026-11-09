---
name: lgpd-pii-sanitizer
description: Proteção de Dados Pessoais e Conformidade com a LGPD (Lei Geral de Proteção de Dados) no Birth Hub 360. Identifica e sanitiza PII (CPF, telefone, e-mail, prontuários, dados de saúde) em logs, erros, telemetria e dumps de banco.
---

# LGPD & PII Sanitizer — Birth Hub 360

## Objetivo
Prevenir o bloqueador crítico **B-13** ("Tratamento de dados pessoais sem base legal, retenção ou exclusão") e o bloqueador **B-14** ("Dumps/backups de banco versionados no Git"). Garantir conformidade com a LGPD em todas as camadas da aplicação.

## Diretrizes de Proteção

### 1. Mascaramento em Logs e Mensagens de Erro
- **Nunca logar:** CPFs, senhas em texto puro, tokens de sessão, cartões de crédito ou detalhes clínicos de pacientes/gestantes.
- Em logs estruturados (Pino / Winston / console), utilize mascaramento:
  - CPF: `123.***.***-45`
  - Telefone: `(11) 9****-1234`
  - E-mail: `m***@empresa.com`
- Utilize a biblioteca de sanitização interna do projeto ou o script `scripts/security/backfill-contact-pii.ts` quando aplicável.

### 2. Minimização de Dados
- Colete e trafegue apenas os dados estritamente necessários para a finalidade da operação.
- Se o frontend precisa exibir apenas o primeiro nome do contato no card do Kanban, não envie o objeto completo com endereço, data de nascimento e documentos no endpoint de listagem.

### 3. Direitos do Titular (Agente 21)
- Toda organização deve suportar:
  - **Direito de Acesso / Exportação:** Rota para gerar dump JSON legível dos dados do titular.
  - **Direito ao Esquecimento / Anonimização:** Rota que substitui dados identificáveis por hashes irreversíveis (`Anonimizado-XXXX`), mantendo apenas os identificadores agregados necessários para integridade fiscal e contábil.

### 4. Backups e Fixtures
- Arquivos de fixtures de teste e mocks do Vitest devem usar nomes e números 100% fictícios (ex: gerados via Faker).
- Nunca faça commit de exports de banco real no repositório Git.

## Checklist LGPD
- [ ] O endpoint expõe dados sensíveis sem necessidade operacional?
- [ ] O histórico de auditoria (`AuditLog`) registra quem acessou ou alterou os dados pessoais?
- [ ] A base legal do tratamento (ex: Execução de Contrato, Consentimento) está definida no modelo?
