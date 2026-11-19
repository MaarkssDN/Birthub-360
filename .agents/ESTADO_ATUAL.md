# ESTADO DA ONDA ATUAL — BIRTH HUB 360
*Última atualização: (Adicionar Timestamp)*
*Atualizado por: (Agente Coordenador ou 09)*

> **Atenção Runtimes:** Consulte este ficheiro para obter o contexto de execução atual sem necessidade de varrer os relatórios da pasta `.agents/runs/`.

## 1. Contexto da Onda
- **Onda Ativa:** Onda N
- **Fase Atual:** `[PLANEJADA | EM_EXECUCAO | EM_REVISAO | GATE_VERDE | RELEASE_APPROVED]`
- **Branch de Integração:** `integracao/onda-<n>`
- **Objetivo Principal:** (Breve descrição da meta da onda)

## 2. Esquadrões (Squads) Acionados
- (Ex: Squad 20 - Backend)
- (Ex: Squad 30 - UI)

## 3. Estado dos Bloqueadores Prioritários (B-01 a B-14)
*Marcar com [x] quando validado ou mitigado na onda atual. Se for um problema contínuo, indicar o Agente responsável pelo Handoff.*

- [ ] **B-01** — RBAC duplicado ou divergente.
- [ ] **B-02** — Rotas administrativas sem autorização adequada.
- [ ] **B-03** — Risco ou dependência insegura na autenticação.
- [ ] **B-04** — Credenciais armazenadas sem proteção.
- [ ] **B-05** — Deploy capaz de iniciar sem migrações.
- [ ] **B-06** — Dados fictícios misturados com dados reais.
- [ ] **B-07** — Comando de voz que afirma executar ação sem executá-la.
- [ ] **B-08** — Ferramentas do Hub de IA inacessíveis.
- [ ] **B-09** — Erros de frontend em Integrações.
- [ ] **B-10** — Separação visual sem isolamento real de dados.
- [ ] **B-11** — Sincronizações Bitrix que falham silenciosamente.
- [ ] **B-12** — Extrações Bitrix incompletas tratadas como definitivas.
- [ ] **B-13** — Tratamento de dados pessoais sem base legal, retenção ou exclusão.
- [ ] **B-14** — Dumps/backups de banco versionados no Git.

## 4. Handoffs Críticos Abertos
*Lista de dependências ativas que bloqueiam o progresso.*
- (Ex: `52-para-11-campos-bitrix.md` - Aguardando schema)
