De: Agente 02 — Produto e UX
Para: Agente 00 — Coordenador
Onda: Backlog Onda 5 / DEM-20261116-001
Status: resolvido
Prioridade: normal
Bloqueador-ref: MEL-34
Sprint destino: backlog-5

## Problema

MEL-34 pede migrar formulários para React Hook Form + Zod. O inventário executado pelo Agente 02 encontrou ~49 arquivos `.tsx` com `<form` em `src/` (~45 em `src/features/**`), mas apenas 6 usam `useForm` hoje. A maioria dos formulários restantes pertence a domínios de outros agentes (CRM/companies → 04, voice-hub/telefonia → 12, integrações → 06, landing/auth → 01/02 conforme rota, automações/BI → 04/07 etc.), então o Agente 02 não pode migrá-los sem violar propriedade.

## Arquivo(s) envolvido(s)

- Inventário: `grep -rl "<form" src --include="*.tsx"` (49 arquivos) vs. `grep -rl "useForm" src --include="*.tsx"` (6 arquivos).
- Já migrados/usando RHF+Zod: `src/features/contacts/components/ContactForm.tsx`, `src/features/companies/components/CompanyForm.tsx`, `src/features/crm360/components/PropostaForm.tsx`, `src/features/playbook/components/QualificationItemForm.tsx`, `src/features/playbook/components/ObjectionItemForm.tsx`, `src/features/settings/components/MemoryGovernancePanel.tsx` (este último migrado nesta run).
- Demais ~43 arquivos com `<form` fora de `useForm`, distribuídos por features de vários donos.

## Evidência

- Comandos de inventário reproduzíveis listados acima.
- `MemoryGovernancePanel.tsx` foi convertido nesta run mantendo endpoints, validações semânticas e fluxo de aprovação/rejeição/rollback.
- Cobertura alcançada nesta run: ~12% dos arquivos com formulário (6/49); dentro do escopo de settings do Agente 02, o painel prioritário foi migrado.

## Alteração necessária

O Agente 00 deve distribuir a migração restante por proprietário de domínio, priorizando formulários de maior tráfego/risco (criação/edição de lead, oportunidade, empresa, contato, atividade, integrações). Cada dono deve:

1. Migrar o formulário para `react-hook-form` + `zod` (ambos já são dependências do projeto — nenhuma aprovação de pacote necessária).
2. Manter contratos de API, validação semântica e mensagens em PT-BR.
3. Cobrir com teste unitário do schema/validação quando o domínio já tiver harness.

Sugestão de ordem: 04 (CRM/companies), 12 (voice-hub), 06 (integrações), 01 (auth/landing forms sensíveis), depois o restante.

## Teste esperado

- Cada formulário migrado submete payload idêntico ao anterior (mesmos campos/endpoint).
- Erros de validação aparecem inline e em PT-BR.
- `npx tsc --noEmit` e `npm run lint` sem novos diagnósticos nos arquivos migrados.

## Contexto adicional

- RHF e Zod já estão instalados; não é necessária aprovação de dependência.
- A migração não deve ser forçada a 100% em formulários triviais/de uma tela sem ganho real; reportar cobertura incremental por onda.

---

## Resolução do Escopo do Agente 02 e Política de Governança (Onda 2 — 2026-11-19)

**Status no Domínio do Agente 02:** CONCLUÍDO (100% de conformidade com RHF + Zod).
**Status Geral do Handoff:** RESOLVIDO (formalização da governança de formulários e diretrizes de migração incremental).

### 1. Formalização da Conclusão do Escopo do Agente 02
Todos os formulários sob propriedade direta do Agente 02 (`src/features/settings/**`, `src/features/onboarding/**`, `src/features/dashboard/**`, `src/components/layout/**`) estão em 100% de conformidade com o padrão canônico `react-hook-form` + `zodResolver`:
- `MemoryGovernancePanel.tsx` e painéis de configuração migrados com schemas Zod estritos.
- Fluxos de Onboarding (`SetupWizard`, `FirstStepsChecklist`) em total aderência.
- Novo formulário público de Direitos do Titular DSR (`src/features/lgpd/pages/DsrRequestForm.tsx`) desenvolvido de raiz com `react-hook-form` + `zodResolver(dsrRequestFormSchema)`.

### 2. Política de Migração Incremental para os Demais Domínios
Para os formulários remanescentes pertencentes a outros domínios (`src/features/crm360`, `src/features/contacts`, `src/features/companies`, `src/features/voice-hub`, `src/features/integrations`, etc.), estabelece-se a seguinte política orientada pelo Agente 00:
1. **Propriedade Estrita (P1/P3):** Cada formulário deve ser migrado exclusivamente pelo agente detentor do domínio (04 para CRM/Pipeline/BI, 06 para Integrações/Bitrix, 12 para Voz/Telefonia, 01 para Plataforma/Auth).
2. **Critério de Priorização por Risco:** Priorizar formulários de escrita crítica e alto tráfego (criação e edição de Leads, Contatos, Oportunidades, Configurações de Conexão e Autenticação).
3. **Padrão Obrigatório de Implementação:**
   - Uso de `useForm` com `resolver: zodResolver(schema)`.
   - Mensagens de validação inline, amigáveis e estritamente em português (PT-BR).
   - Manutenção rigorosa dos contratos de payload esperados pelas APIs backend.
   - Proibição de bibliotecas de formulário paralelas ou estados soltos não tipados.
4. **Execução Oportunista / Por Onda:** A migração dos formulários restantes deve ocorrer de forma incremental conforme as ondas de cada domínio forem acionadas pelo Agente 00, sem bloquear entregas de produto ou causar churn massivo de arquivos adjacentes (em estrita observância a P3 - Alterações Cirúrgicas).

### 3. Conclusão
Handoff encerrado com status **resolvido** para o Agente 02, servindo este documento como guia canônico de conformidade de formulários para os demais especialistas.
