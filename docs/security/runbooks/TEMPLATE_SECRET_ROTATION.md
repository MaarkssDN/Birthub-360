# Runbook — Rotação de Segredo: [NOME_DO_SEGREDO]

**ID:** RB-SEC-[NUMERO]  
**Criticidade:** [Tier 0 / Tier 1 / Tier 2 / Tier 3 / Tier 4]  
**Propriedade:** Agente 15 (Segurança Aplicada) em coordenação com [Agente Dono]  
**Status:** [Rascunho / Operacional / Concluído]  

---

## 1. Contexto e Motivação
- Qual é o propósito desta credencial?
- Onde ela é consumida no código-fonte?
- Quais variáveis de ambiente e arquivos estão envolvidos?
- Qual é o blast radius (impacto de indisponibilidade caso rotacionada incorretamente)?

---

## 2. Pré-requisitos
- Acessos necessários (painel externo, Infisical, Render, banco de dados).
- Ferramentas de apoio necessárias.

---

## 3. Procedimento de Execução Passo a Passo

### Passo 1: Geração / Emissão da Nova Credencial
- Comando ou rota de geração segura.

### Passo 2: Atualização de Variáveis de Ambiente / Cofre
- Onde atualizar e como sincronizar.

### Passo 3: Reinício e Propagação
- Comandos ou triggers de deploy.

---

## 4. Validação Positiva (Confirmação da Nova Credencial)
- Comando cURL, teste automatizado ou tela com critério de aceite explícito (`200 OK`).

---

## 5. Validação Negativa (Comprovação de Invalidação da Antiga)
- Comando obrigatório testando a credencial antiga, comprovando rejeição (`401` / `403`).

---

## 6. Registro de Conclusão e Auditoria
- Registro em `AuditLog`, ata de incidente ou `.gitleaksignore` (se histórico).
