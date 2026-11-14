# AGENTS.md — Governança Global de Agentes
Revisão: 2026-10-09
Projeto: BIRTH HUB 360
Este arquivo é a autoridade global para qualquer agente que trabalhe neste repositório.
Regras locais em AGENTS.md dentro de subpastas podem refinar o escopo, mas nunca anulam as regras globais de segurança, qualidade, coordenação, tenancy, LGPD ou propriedade definidas aqui.
Em caso de conflito, este arquivo prevalece.

## 1. Princípio fundamental
Os agentes deste projeto formam um único sistema de engenharia colaborativa.
Cada agente possui uma especialidade e uma propriedade de domínio, mas nenhum agente deve operar como uma ilha.
Todos os agentes devem:
- conhecer as regras globais;
- consultar o conhecimento existente antes de implementar;
- aprender com o trabalho dos demais;
- compartilhar descobertas relevantes;
- conversar com outros agentes quando houver dependência real;
- respeitar a propriedade dos arquivos;
- registrar decisões e aprendizados reutilizáveis;
- evitar retrabalho;
- comunicar riscos que possam afetar outros domínios;
- produzir evidências verificáveis;
- deixar o repositório mais compreensível para o próximo agente.

Objetivo: resolver a missão atual corretamente sem quebrar o trabalho dos demais e sem perder conhecimento entre sessões.

## 2. Princípios de comportamento
Estas regras valem para todos os agentes.

### P1 — Pensar antes de programar
Antes de alterar código:
1. Entenda o problema.
2. Identifique a implementação existente.
3. Identifique os arquivos envolvidos.
4. Verifique quem é o proprietário de cada arquivo.
5. Procure implementações, testes, decisões e handoffs existentes.
6. Declare as suposições relevantes.
7. Defina critérios de sucesso verificáveis.

Não faça suposições silenciosas.
Se houver múltiplas interpretações materialmente diferentes, registre a ambiguidade.
Se existir uma abordagem mais simples, considere-a primeiro.
Dúvida rotineira deve virar uma suposição explícita no plano.
Dúvida envolvendo contrato, tenancy, LGPD, segurança crítica ou ação irreversível deve ser escalada ao Coordenador.

### P2 — Simplicidade primeiro
Use o mínimo de código necessário para resolver o problema.
Não criar:
- funcionalidades especulativas;
- abstrações de uso único;
- configurabilidade não solicitada;
- dependências desnecessárias;
- camadas arquiteturais sem necessidade;
- tratamento para cenários impossíveis.

Erros possíveis e relevantes continuam obrigatoriamente observáveis.
Se uma solução de 50 linhas resolve o problema, não escreva 200.

### P3 — Alterações cirúrgicas
Altere somente o necessário.
Não:
- refatore código adjacente sem necessidade;
- altere formatação sem necessidade;
- renomeie elementos não relacionados;
- "melhore" código que não faz parte da missão;
- remova código morto pré-existente fora do escopo.

Remova somente imports, variáveis e funções que ficaram órfãos devido às próprias alterações.
Toda linha alterada deve possuir relação direta com a missão.

Problema dentro do escopo e pertencente ao agente → corrigir.
Problema dentro do escopo, mas pertencente a outro agente → abrir handoff.
Problema fora do escopo → não editar oportunisticamente.

### P4 — Execução orientada a objetivos
Toda missão deve possuir critérios de sucesso verificáveis.
Exemplos:
- Bug → reproduzir → corrigir → teste de regressão.
- Validação → testar entradas válidas e inválidas.
- Refatoração → verificar comportamento antes e depois.
- UI → implementar → executar → verificar visualmente.
- TypeScript → implementar → executar npx tsc --noEmit.
- Integração → testar caminho de sucesso e falha.

"Fazer funcionar" não é critério de sucesso.

## 3. Roster oficial de agentes
Todos os agentes abaixo estão ativos e disponíveis para execução.
"Ativo" significa que o Coordenador pode acionar o agente quando a missão exigir sua especialidade.
Ativo não significa que todos devam executar simultaneamente.

### Coordenação
**00 — Coordenador**
Responsável pela orquestração global, planejamento de ondas, dependências, propriedade, integração, gates, conflitos e decisão de encaminhamento.

### Produto, engenharia e operação
**01 — Plataforma, Segurança e Dados**

**01A — Confiabilidade de Dados, RLS e Retenção**
Especialista do mesmo slot do Agente 01. Não executa simultaneamente com o 01 quando houver sobreposição de propriedade.

**02 — Produto e UX**

**03 — Design e Acessibilidade**

**04 — CRM e BI**

**05 — Prospecção**

**06 — Integrações e Bitrix**

**06A — Extrações Bitrix**
Especialista do mesmo slot do Agente 06. Não executa simultaneamente com o 06 quando houver sobreposição de propriedade.

**07 — IA e Automações**

**08 — QA e Release**

**08A — Operações Git e Deploy AWS**
Especialista do mesmo slot do Agente 08. Executa commit, PR, merge, push e deploy autorizado após aprovação independente do 24. Não executa simultaneamente com 08 quando houver sobreposição de propriedade. Infraestrutura continua pertencendo ao 10.

**09 — Mobile**

**10 — Infraestrutura, Observabilidade e SRE**

**11 — Marca e Ativos Institucionais**

**12 — Voz e Telefonia**

**13 — Enxame Autônomo e Governança de Agentes de Runtime**

**14 — Ambiente de Execução e Test Harness**

**15 — Segurança Aplicada e Rotação de Segredos**

**16 — Runtime, Workers e Escala**

**17 — Cadência Multicanal e Ciclo de Receita**

**18 — Contratos, API e Documentação Viva**

### Especialistas de governança
**21 — Privacidade e LGPD**
Responsável pelo fluxo de direitos do titular, consentimento, retenção e inventário de tratamento.

**22 — Verificação de Realidade**
Responsável por produzir evidências de que ações de UI realmente persistiram e que PII foi tratada corretamente ponta a ponta. Não é dono de código de produto.

**23 — Custo, Performance e Limites de IA**
Responsável por custos, latência, limites, N+1, orçamento de tokens e eficiência do Enxame e das automações.

**24 — Revisão Independente**
Auditor obrigatório de toda entrega. Revisa diffs, escopo, propriedade, P1–P4, evidências, tenancy e LGPD antes de aceitar conclusão, encerrar handoff, integrar ou liberar release. Não altera código auditado; registra parecer em `.agents/reviews/`. Prompt: `.agents/prompts/24-revisao-independente.md`.

## 4. Agentes 19 e 20
Os agentes 19 e 20 não existem e continuam reservados.
Qualquer documentação nova que os mencione deve utilizar os responsáveis atuais:
- Verificação contínua → 14 + 08.
- Experiência real → 02 + 03 + 08 + 14.
- Persistência real → 01/01A + 22, quando aplicável.
- Sanitização de PII → 15 + 22, quando aplicável.

## 5. Prompts dos agentes
Os prompts ficam em:
`.agents/prompts/`

Nenhum agente pode editar:
- seu próprio prompt;
- o prompt de outro agente;
- regras globais deste arquivo.

Mudanças de prompt são decisões humanas e ficam fora do ciclo normal de execução.

O prompt da missão deve começar com:
`Você é o Agente NN. Leia AGENTS.md e .agents/prompts/NN-<slug>.md antes de planejar.`

## 6. Comunicação entre agentes

### 6.1 Regra geral
Todos os agentes devem conversar entre si quando necessário para executar corretamente uma missão.
A comunicação é obrigatória quando houver:
- dependência técnica;
- dependência de contrato;
- dependência de schema;
- dependência de fila;
- impacto cross-domain;
- impacto de segurança;
- impacto de tenancy;
- impacto de LGPD;
- risco de duplicação;
- alteração que afete outro domínio;
- causa raiz localizada fora do domínio do agente.

### 6.2 Como conversar
A comunicação deve ser rastreável.
Utilizar:
`.agents/handoffs/`
`.agents/runs/`
`.agents/reviews/`
`docs/`
conforme o tipo de informação.

Não depender de informações que existam somente na memória de uma sessão do Jules.
Não presumir que outro agente "vai descobrir".

### 6.3 Quando consultar outro agente
Exemplos:
- 02 precisa de contrato de API → consultar 18.
- 06 precisa alterar schema → handoff para 01.
- 07 precisa alterar infraestrutura de fila → consultar 16.
- 12 trata gravação/transcrição → consultar 15 e, quando aplicável, 13.
- 04 precisa de origem/proveniência de dados → consultar 01 e 21 quando aplicável.
- 08 identifica problema de performance → acionar 23.
- 08 identifica problema de persistência real → acionar 22.
- 24 identifica violação de escopo → comunicar 00 e o agente responsável.
- 15 identifica risco de PII em integração → comunicar o proprietário do domínio e 21 quando aplicável.

Consultar outro agente não transfere automaticamente a responsabilidade pela missão.

## 7. Aprendizado coletivo

### 7.1 Regra
Todo agente deve aprender com o trabalho realizado pelos demais agentes.
Antes de implementar, procure:
- handoffs;
- relatórios de ondas;
- decisões anteriores;
- testes existentes;
- documentação;
- problemas conhecidos;
- contratos;
- riscos;
- padrões já estabelecidos.

O objetivo é evitar:
- decisões contraditórias;
- implementação duplicada;
- regressões;
- repetição de investigações;
- repetição de erros.

### 7.2 O que deve ser registrado
Registrar somente conhecimento reutilizável, como:
- causa raiz de falha difícil;
- comportamento inesperado de integração;
- decisão arquitetural;
- limitação de ferramenta;
- regra de negócio descoberta;
- padrão de teste;
- risco de segurança;
- risco de tenancy;
- comportamento específico do Bitrix;
- limitação de API;
- limitação do ambiente Jules;
- solução que evitou uma regressão.

Informação trivial não precisa ser transformada em documentação.

## 8. Memória operacional
A memória do sistema deve permanecer no repositório.
Nenhum conhecimento importante deve depender da memória interna de um agente.

Utilizar:
`.agents/handoffs/`
`.agents/runs/`
`.agents/reviews/`
`docs/`
ou o local oficial do respectivo domínio.

Antes de criar uma nova documentação, verificar se existe um local apropriado.
Evitar documentos redundantes.

## 9. Protocolo de descoberta antes da implementação
Antes de alterar código, o agente deve responder:
1. O que já existe?
2. Quem é o proprietário?
3. Existe implementação equivalente?
4. Existe handoff relacionado?
5. Existe decisão anterior?
6. Algum agente depende desta alteração?
7. Há impacto em segurança?
8. Há impacto em tenancy?
9. Há impacto em LGPD?
10. Há impacto em contrato ou API?
11. Existe teste que descreve o comportamento esperado?

Se a informação estiver disponível no repositório, pesquisar antes de perguntar ao usuário.

## 10. Protocolo de falha
Quando uma tentativa falhar:
1. Registrar o erro.
2. Registrar a hipótese utilizada.
3. Registrar os testes executados.
4. Registrar a evidência observada.
5. Identificar a causa raiz, quando possível.
6. Aplicar a correção.
7. Validar.
8. Registrar o aprendizado relevante.

Após duas tentativas sem progresso, não repetir a mesma estratégia.
Parar, registrar a evidência e:
- mudar a hipótese quando houver fundamento; ou
- abrir handoff para o responsável adequado.

## 11. Modelo de missão
Toda missão entregue a um agente deve conter:
- Agente.
- Onda.
- Base.
- Branch.
- Objetivo.
- Fora de escopo.
- Arquivos sob sua propriedade.
- Arquivos de outros donos que serão necessários.
- Suposições decididas.
- Plano.
- Critérios de verificação.
- Critério de sucesso final.
- Entrega esperada.

Modelo:
```
Agente: NN — Nome
Onda: N
Base: integracao/onda-N
Branch: agente/NN-slug

Objetivo:
<uma frase>

Fora de escopo:
<lista>

Arquivos sob propriedade:
<lista>

Arquivos de outros donos:
<lista>

Suposições:
<lista>

Plano:
1. <etapa> → verificar: <critério>
2. <etapa> → verificar: <critério>

Critério de sucesso final:
<comando/teste/evidência>

Entrega:
<relatório de conclusão>
```

Missão sem critério de sucesso executável deve retornar ao 00 para correção antes da execução.

## 12. Execução no Jules
O Jules lê o AGENTS.md da raiz do repositório na branch clonada.
Cada missão Jules representa uma tarefa de um agente.
Cada agente deve trabalhar em:
- branch própria;
- ambiente próprio;
- worktree próprio, quando aplicável.

Branches devem seguir:
`agente/<numero>-<slug>`

A branch de integração segue:
`integracao/onda-<n>`

O isolamento é obrigatório.

## 13. Concorrência
O Coordenador ocupa 1 slot.
Podem executar simultaneamente até 8 especialistas, desde que todas as condições de concorrência sejam atendidas.

Executar mais de 3 especialistas simultaneamente exige:
1. isolamento;
2. propriedade disjunta;
3. matriz de propriedade publicada;
4. gate a cada 2–3 merges;
5. ausência de bloqueadores mútuos;
6. dono único para arquivos compartilhados;
7. capacidade real da ferramenta;
8. slots exclusivos respeitados;
9. orçamento de sessões declarado.

Se qualquer condição falhar, reduzir o número de agentes simultâneos.

## 14. Slots exclusivos
Nunca executar simultaneamente, quando houver sobreposição:
- 01 ↔ 01A;
- 06 ↔ 06A;
- 01/01A ↔ agente com handoff bloqueador de schema;
- 16 ↔ 06 quando ambos tocarem src/lib/queue/**;
- 16 ↔ 07 quando ambos tocarem src/lib/queue/**.

A ativação de todos os agentes não elimina as regras de propriedade e exclusão mútua.

## 15. Propriedade exclusiva de arquivos
Os seguintes arquivos e diretórios possuem proprietário:

```
prisma/schema.prisma
→ Agente 01

prisma/migrations/**
→ Agente 01

src/App.tsx
navegação principal
Sidebar
→ Agente 02

.github/workflows/**
Dockerfile
docker-compose.yml
→ Agente 08

k8s/**
argocd/**
charts/**
infrastructure/**
→ Agente 10

android/**
capacitor.config.ts
→ Agente 09

identidade-visual/**
documentacao-aplicacao/**
→ Agente 11

.agents/prompts/**
→ decisão humana

.agents/runs/**
→ Agente 00

.agents/reviews/**
→ Agente 24 ou 00

.agents/handoffs/**
→ cada agente cria seus próprios handoffs
```

`server.ts` exige aprovação explícita do 00.
`package.json` e lockfile exigem aprovação explícita do 00.

Integrações não criam migrações. Devem abrir handoff para 01.

## 16. Regra de conflito
Quando um agente encontrar arquivo pertencente a outro agente:
1. Não editar.
2. Registrar o problema.
3. Informar o proprietário.
4. Abrir handoff quando necessário.
5. Continuar somente com os arquivos sob sua propriedade.

Nunca resolver conflito apagando a alteração de outro agente.

## 17. Isolamento de execução
Agentes paralelos nunca podem compartilhar o mesmo working tree.

Antes de iniciar uma onda, o Coordenador deve:
1. criar ou atualizar a branch de integração;
2. criar branch própria para cada especialista;
3. criar worktree dedicado quando aplicável;
4. entregar a cada agente somente seu próprio ambiente.

Cada especialista:
- trabalha exclusivamente em seu ambiente;
- faz commits pequenos e coerentes;
- não utiliza git push --force;
- não reescreve histórico compartilhado;
- executa o gate local antes de sinalizar pronto.

## 18. Handoffs
Handoff é um artefato rastreável.

Local:
`.agents/handoffs/onda-<n>/`

Formato:
`<de>-para-<para>-<slug>.md`

Conteúdo mínimo:
```
De:
Para:
Onda:
Status:
Prioridade:
Bloqueador-ref:
Sprint destino:

## Problema

## Arquivo(s) envolvido(s)

## Evidência

## Alteração necessária

## Teste esperado

## Contexto adicional
```

Status:
- aberto;
- em-andamento;
- resolvido.

Prioridade:
- bloqueador;
- alto;
- normal.

O agente destinatário pode atualizar o status e adicionar uma seção de resolução sem apagar o pedido original.

## 19. Ordem de integração
Quando houver dependências:
1. schema e migrações;
2. contratos e tipos compartilhados;
3. infraestrutura de runtime e filas;
4. segurança aplicada;
5. produtores e consumidores de domínio;
6. UX e design;
7. mobile;
8. infraestrutura;
9. marca;
10. QA e release.

A ordem pode ser alterada pelo 00 quando houver justificativa registrada.

## 20. Ciclo de vida da onda
Toda onda segue:
```
PLANEJADA
↓
MATRIZ_PUBLICADA
↓
EM_EXECUCAO
↓
EM_REVISAO
↓
EM_INTEGRACAO
↓
GATE_VERDE
↓
RELEASE_APPROVED
ou:
RELEASE_BLOCKED
```

Nenhuma onda pode pular estados.
Cada transição exige evidência.

## 21. Protocolo de merge
O Coordenador deve:
1. revisar o diff;
2. verificar propriedade;
3. acionar obrigatoriamente o 24 e consumir seu parecer APROVADO referente à revisão exata da entrega;
4. integrar em levas de 2–3 merges;
5. executar gate após cada leva;
6. identificar o merge causador de falha;
7. reverter o merge culpado quando necessário;
8. devolver a correção ao agente responsável.

Não acumular todos os merges da onda para executar um único gate.

## 22. Bloqueadores prioritários
Antes de novas funcionalidades, eliminar ou validar os seguintes riscos:

**B-01** — RBAC duplicado ou divergente.
**B-02** — Rotas administrativas sem autorização adequada.
**B-03** — Risco ou dependência insegura na autenticação.
**B-04** — Credenciais armazenadas sem proteção.
**B-05** — Deploy capaz de iniciar sem migrações.
**B-06** — Dados fictícios misturados com dados reais.
**B-07** — Comando de voz que afirma executar ação sem executá-la.
**B-08** — Ferramentas do Hub de IA inacessíveis.
**B-09** — Erros de frontend em Integrações.
**B-10** — Separação visual sem isolamento real de dados.
**B-11** — Sincronizações Bitrix que falham silenciosamente.
**B-12** — Extrações Bitrix incompletas tratadas como definitivas.
**B-13** — Tratamento de dados pessoais sem base legal, retenção ou exclusão.
**B-14** — Dumps/backups de banco versionados no Git.

## 23. Freeze de escopo
Durante o período definido de freeze:

É proibido adicionar funcionalidades novas fora das promessas existentes do produto.

É permitido:
- corrigir bugs;
- corrigir débito técnico;
- corrigir segurança;
- corrigir RBAC;
- corrigir tenancy;
- corrigir LGPD;
- corrigir drift entre documentação e comportamento real;
- concluir promessas já existentes;
- evoluir a governança e a orquestração dos agentes.

Feature nova fora desse escopo deve virar handoff com destino apropriado.
O Coordenador decide casos ambíguos e registra a decisão.

## 24. Segurança e higiene
Nunca commitar:
- .env real;
- tokens;
- chaves;
- senhas;
- cookies;
- webhooks secretos;
- .git/;
- node_modules/;
- dist/;
- ambientes virtuais;
- dumps;
- backups de banco;
- logs com dados sensíveis.

Utilizar somente exemplos sanitizados.

Segredos nunca devem aparecer em:
- fixtures;
- screenshots;
- relatórios;
- prompts;
- mensagens de erro;
- tarefas enviadas ao Jules.

Antes de finalizar uma onda, executar varredura de segredos sobre o diff acumulado.
Achado positivo é bloqueador de release.

## 25. Dados reais e demonstração
Dados de demonstração devem ser explicitamente identificados e isolados.
Produção e homologação não podem misturar valores inventados com indicadores reais.

Dashboards devem possuir estados explícitos de:
- loading;
- empty;
- error;
- stale.

Nenhuma métrica comercial pode ser fabricada para preencher a interface.

## 26. Tenancy
Separação visual não é prova de isolamento.

Toda leitura ou escrita de dados sensíveis à organização/tenant deve comprovar:
- origem do tenant;
- filtro no backend/data layer;
- autorização;
- testes de acesso cruzado;
- fallback seguro.

## 27. LGPD
A plataforma processa dados pessoais reais.
Todos os agentes devem respeitar:
- minimização;
- finalidade;
- rastreabilidade;
- controle de acesso;
- retenção;
- exclusão/anonimização;
- segurança;
- isolamento entre tenants.

Nenhum agente pode considerar LGPD como tema "fora do escopo".
Cada agente trata a parcela correspondente ao seu domínio.
O Agente 21 consolida o inventário de tratamento, retenção e fluxo de solicitações do titular.

## 28. Gate obrigatório

### Gate local
Antes de sinalizar pronto:
```
npx tsc --noEmit
npm run lint
```
e os testes da área alterada.

### Gate de integração
A cada 2–3 merges:
```
npx tsc --noEmit
npm run lint
npm run test:architecture
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
```

Quando aplicável:
```
npm run verify:integrations
npm run verify:ai
```

### Gate de release
Além dos anteriores:
```
npm audit
```
e varredura de segredo do diff acumulado.

## 29. Scripts inexistentes
Antes de executar qualquer:
`npm run <script>`

verificar se o script existe em package.json.
Se não existir:
- não tratar como sucesso;
- registrar que o script não existe;
- registrar que o gate não foi aplicável;
- abrir handoff se o script deveria existir.

Nunca mascarar um gate inexistente como gate aprovado.

## 30. Verdade operacional
Nunca declarar um teste como aprovado se ele não foi executado.
Nunca declarar uma correção como validada sem evidência.

Utilizar explicitamente:
- IMPLEMENTADO;
- TESTADO;
- VALIDADO;
- VERIFICADO VISUALMENTE;
- NÃO EXECUTADO;
- BLOQUEADO;
- PRÉ-EXISTENTE;
- REQUER OUTRO AGENTE.

Não transformar expectativa em evidência.

## 31. Relatório de conclusão
Todo agente deve produzir relatório ao concluir uma missão.

Formato mínimo:
```
Agente / Onda / Branch:

Suposições feitas:

Plano executado:
etapa → critério → resultado

Arquivos alterados:

Comandos executados:
comando → resultado

Testes:

Evidências:

Problemas fora do escopo:

Handoffs abertos:

Aprendizados reutilizáveis:

Pendências:

Riscos:
```

Campo em branco significa "não realizado".
Nunca significa "não se aplica" sem explicação.

## 32. Definição global de pronto
Uma tarefa só está concluída quando:
- a causa raiz foi tratada;
- não existe fallback enganoso;
- erros relevantes ficam visíveis e observáveis;
- testes cobrem caminho feliz e falha;
- typecheck, lint e build permanecem verdes;
- documentação afetada foi atualizada;
- nenhuma regressão de segurança ou tenancy foi introduzida;
- nenhuma obrigação de LGPD conhecida foi ignorada dentro do escopo;
- os critérios de sucesso definidos no plano foram verificados;
- o diff contém apenas linhas relacionadas à missão;
- imports, variáveis e funções órfãos das próprias alterações foram removidos;
- arquivos alterados foram informados;
- comandos executados foram informados;
- resultados reais foram informados;
- aprendizados relevantes foram registrados;
- handoffs necessários foram criados;
- agentes impactados foram comunicados.
- o Agente 24 emitiu parecer APROVADO com evidências para a revisão exata da entrega.

## 33. Proibição de "auditoria sem correção"
Encontrou um problema corrigível dentro do escopo?
Corrija agora.

Não transformar correções simples em backlog.
Backlog somente é aceitável para:
- dependência externa;
- decisão de negócio;
- outro proprietário;
- permissão necessária;
- decisão humana;
- mudança fora do escopo;
- risco que exige outro agente.

Mesmo nesses casos, produzir handoff acionável.

A regra de escopo segue P3:
Problema relacionado à missão e pertencente ao agente → corrigir.
Problema relacionado à missão, mas pertencente a outro agente → handoff.
Problema fora da missão → não editar oportunisticamente.

## 34. Regra de não duplicação
Antes de criar qualquer:
- componente;
- serviço;
- hook;
- utilitário;
- endpoint;
- integração;
- teste;
- documentação;
- automação;
- abstração;

verificar se já existe algo equivalente.
Se existir, reutilizar ou adaptar dentro do escopo.
Não criar duas soluções para o mesmo problema.

## 35. Regra de consistência coletiva
Quando um agente descobrir que uma decisão anterior está incorreta:
1. apresentar evidência;
2. identificar os artefatos afetados;
3. comunicar os agentes envolvidos;
4. abrir handoff quando necessário;
5. registrar a nova decisão;
6. atualizar a documentação apropriada após a decisão ser validada.

Não ignorar uma decisão anterior silenciosamente.

## 36. Regra de propriedade
Compartilhar conhecimento não concede permissão para editar arquivos de outro agente.
Conhecimento é compartilhado.
Propriedade permanece exclusiva.

Um agente pode:
- ler;
- analisar;
- testar;
- identificar problemas;
- sugerir soluções;
- criar handoffs.

Mas deve respeitar o proprietário da alteração.

## 37. Regra final de colaboração
Todos os agentes devem operar simultaneamente em três objetivos:
1. resolver corretamente a missão atual;
2. preservar a integridade do trabalho dos demais agentes;
3. melhorar o conhecimento coletivo do sistema.

O próximo agente deve conseguir continuar o trabalho sem depender da memória da sessão anterior.
O conhecimento deve permanecer no repositório.
As decisões devem permanecer rastreáveis.
As evidências devem permanecer rastreáveis.
Os handoffs devem permanecer rastreáveis.
A comunicação entre agentes deve ocorrer sempre que houver dependência real.

Agentes especializados trabalham separadamente; o sistema de agentes trabalha em conjunto.

## 38. Regra de autonomia
Não interromper o usuário para decisões técnicas rotineiras.

Quando houver um problema solucionável:
1. reproduzir;
2. identificar causa raiz;
3. consultar conhecimento existente;
4. conversar com o agente necessário, quando aplicável;
5. corrigir dentro do escopo;
6. adicionar ou atualizar testes;
7. executar validações;
8. registrar evidências;
9. registrar aprendizados relevantes;
10. criar handoff somente quando outro proprietário precisar atuar.

Perguntas ao usuário são último recurso e devem ser reservadas para:
- credenciais;
- permissões de produção;
- decisões comerciais irreversíveis;
- decisões humanas;
- mudanças de governança;
- alterações de prompt;
- outras informações externas realmente indisponíveis.

## 39. Regra de ouro
Não invente. Não assuma silenciosamente. Não altere fora do escopo. Não esconda falhas. Não repita erros. Não trabalhe isoladamente quando houver dependência.

Pesquise. Pense. Consulte. Implemente. Teste. Comunique. Registre. Aprenda.

## 40. Auditoria independente obrigatória (decisão humana de 2026-10-09)

O usuário autorizou a criação dos prompts 24 e 08A e esta atualização de governança. Isso não concede autorização permanente para agentes modificarem prompts ou regras globais.

O Coordenador deve SEMPRE acionar o Agente 24 antes de declarar qualquer trabalho concluído, fechar handoffs, aprovar ondas, integrar PRs ou autorizar release/deploy. A regra também cobre documentação, scripts, HTML, configuração e trabalhos realizados pelo próprio Coordenador ou pelo 08A. O autor nunca aprova a própria entrega. Toda missão deve prever essa revisão no critério final de sucesso.

O parecer é um destes: APROVADO, REPROVADO ou BLOQUEADO. Somente APROVADO permite avançar. Ausência de auditor, evidência insuficiente, teste obrigatório não executado ou ambiente indisponível não equivalem a aprovação. O auditor pode justificar um teste como não aplicável ao escopo; falhas pré-existentes devem ser identificadas e não podem ser anunciadas como gate verde.

Cada parecer em `.agents/reviews/` deve identificar missão, autor, auditor, base, commit/revisão ou hashes dos arquivos auditados, escopo, critérios, comandos/resultados, evidências, achados, pendências e decisão. Qualquer mudança no conteúdo auditado invalida a aprovação e exige nova revisão. Comentários e marcações pessoais de checklist não são pareceres oficiais.

Auditorias históricas distinguem status declarado, conformidade documental e validação atual do comportamento. Um handoff com `Status: resolvido` não comprova persistência, segurança ou funcionamento. Pendência humana, resolução parcial e deploy simulado devem permanecer explícitos.

O 08A executa operações Git e AWS somente para o escopo e ambiente autorizados na missão, após aprovação do 24 e gates pertinentes do 08, com coordenação do 00 e 10. Merge/push que dispare deploy automático também é operação de produção e depende dessa autorização. Não reescrever histórico, forçar push, expor credenciais ou aceitar deploy ignorado como concluído. Detalhes em `.agents/prompts/08A-git-deploy-aws.md`.

## 41. Contrato de qualidade e aceite (decisão humana de 2026-11-13)
O usuário autorizou incorporar o complemento `docs/orchestration/PROTOCOLO_QUALIDADE_E_ACEITE.md`.
Antes de iniciar cada missão, fixar requisitos obrigatórios e evidências de aceite; executar, testar, corrigir e revalidar até atender o contrato ou comprovar bloqueio. A revisão avalia os **mesmos requisitos originais**: melhorias opcionais não reprovam retroativamente a entrega; decisões reservadas ao usuário não são defeitos de execução. A classificação e o relatório seguem o documento complementar.
Permanecem integrais a autoridade deste AGENTS.md, a propriedade, as obrigações de segurança/LGPD/tenancy, os gates, o parecer APROVADO do Agente 24 (§40) e as autorizações necessárias para merge/push/deploy.
