# Local Agent Bus & Mesh — BIRTH HUB 360

Sistema de barramento de mensagens local, rastreável e em tempo real para permitir que múltiplas sessões de agentes (abertas em terminais ou janelas separadas no seu computador) conversem entre si, orquestradas pelo **Agente 00 (Coordenador)**, em total conformidade com as regras de governança do [AGENTS.md](../../AGENTS.md).

---

## 🚀 Como Funciona

1. **Servidor Daemon (`server.mjs`)**:
   - Roda localmente na porta `4100` (`http://localhost:4100`).
   - Persistência em banco de dados SQLite local (`agent_bus.db`).
   - Fornece API REST + Server-Sent Events (SSE) para entrega de mensagens em tempo real.
   - Fornece **Dashboard Web** com visualização de todos os agentes do roster, status online/offline, feed de mensagens e centro de despacho para o Agente 00.

2. **Interface CLI (`agent-cli.mjs`)**:
   - Qualquer terminal pode se registrar como um agente, ouvir tarefas recebidas e responder.
   - Comandos para broadcast, envio direto, registro de status e geração automática de handoffs formais em `.agents/handoffs/onda-<n>/`.

3. **Lançador de Sessões (`launch-agent.ps1`)**:
   - Abre uma nova janela do PowerShell para qualquer agente com um único comando.

---

## 🛠️ Comandos Principais

### 1. Iniciar o Barramento e Dashboard
```powershell
node .agents/bus/agent-cli.mjs start
```
> O Dashboard estará acessível no navegador em: **`http://localhost:4100`**

### 2. Verificar Status de Todos os Agentes
```powershell
node .agents/bus/agent-cli.mjs status
```

### 3. Abrir uma Sessão Interativa para um Agente (na janela atual)
```powershell
node .agents/bus/agent-cli.mjs session --id 01
```
*Na sessão interativa, o agente recebe notificações em tempo real sempre que o Agente 00 ou outro especialista enviar uma mensagem.*
Comandos dentro da sessão:
- `send <id> <mensagem>` (ex: `send 00 Concluí a migration de tenancy`)
- `broadcast <mensagem>` (ex: `broadcast Atenção: Schema atualizado`)
- `task <id> <ordem>` (ex: `task 02 Alinhar rota de leads`)
- `handoff <id> <slug> | <problema>` (ex: `handoff 02 contrato-leads | Novo contrato criado`)
- `status` (mostra quem está online)
- `exit` (desconecta e marca offline)

### 4. Abrir Nova Janela para um Agente
```powershell
.\.agents\bus\launch-agent.ps1 -AgentId "01"
```
Para criar automaticamente o Git Worktree isolado na branch do agente:
```powershell
.\.agents\bus\launch-agent.ps1 -AgentId "01" -CreateWorktree
```

### 5. Enviar Mensagens Diretamente via Linha de Comando
```powershell
# O Agente 00 enviando uma tarefa para o Agente 01
node .agents/bus/agent-cli.mjs send --from 00 --to 01 --type TASK --subject "Onda 1" --message "Executar migração de RLS"

# Enviar anúncio para todos os agentes ativos
node .agents/bus/agent-cli.mjs broadcast --from 00 --message "Onda 1 iniciada. Favor checar seus backlogs."

# Criar handoff formal auditável (já gera o arquivo .md oficial)
node .agents/bus/agent-cli.mjs handoff --from 01 --to 02 --wave 1 --slug "rota-leads" --problem "Ajustar contrato de rota"
```

---

## 📋 Regras de Governança Integradas
- **Limite de concorrência:** Máximo de 8 agentes simultâneos conforme Seção 13 do `AGENTS.md`.
- **Slots Exclusivos:** Avisos automáticos no Roster (`roster.json`) para impedir conflitos como 01 ↔ 01A ou 06 ↔ 06A.
- **Rastreabilidade:** Todas as mensagens são gravadas no SQLite local e todos os handoffs geram arquivos físicos versionáveis no Git.
