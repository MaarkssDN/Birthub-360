# Protocolo de execução, qualidade e aceite

**Status:** proposta de governança autorizada pelo usuário em 2026-11-13; entra em vigor após revisão independente e integração conforme `AGENTS.md`.
**Aplicação:** Agente 00 e todos os especialistas, em tarefas de código, UI, documentos, brandbook, integrações, testes e pesquisas com entregáveis.
**Hierarquia:** complementa `/AGENTS.md` (§§2, 10, 11, 28–40), `/docs/AGENTS.md` e `docs/orchestration/PROTOCOLO.md`. Não dispensa proprietário de arquivos, gates, Agente 24, segurança, LGPD ou autorizações de merge/push/deploy. Não substitui as fontes de verdade de cada domínio.

## Objetivo

Evitar o ciclo "solicitar → executar → receber ressalvas inventadas após a entrega → abrir nova missão". O contrato de aceite é estabelecido **antes** da execução e é o mesmo usado para julgar o resultado. A missão não termina só porque houve implementação, nem é reprovada por preferências novas que não faziam parte do pedido.

## 1. Preparação e contrato de aceite

O responsável deve, antes de implementar:

1. Consultar `AGENTS.md`, regras locais, fontes de verdade, decisões e implementações anteriores; confirmar branch, propriedade, ambiente, acesso a repositórios/arquivos e ferramentas. **Não presumir acesso a laboratório, conta externa, agente ou sistema apenas porque foi mencionado.**
2. Traduzir a demanda para uma **matriz de aceite pequena, verificável e congelada**, registrando requisito, origem, prioridade, prova necessária e responsável. Não transformar sugestões em obrigações por conta própria.
3. Classificar cada item:
   - **OBRIGATÓRIO:** explicitamente solicitado, necessário à correção/segurança ou imposto por governança; sua ausência impede aceite.
   - **OPCIONAL:** melhoria que pode ser sugerida separadamente; não reprova a missão.
   - **DECISÃO HUMANA:** escolha reservada ao usuário (ex.: grafia de marca, preferência entre propostas); preparar alternativas e evidências, sem decidir por ele nem tratar a pendência como defeito técnico.
   - **FORA DO ESCOPO / OUTRO DONO:** não editar oportunisticamente; registrar handoff se for dependência real.
4. Registrar limitações que impeçam a prova obrigatória; não declarar `NÃO SE APLICA` por conveniência. Verificar scripts reais antes de planejar comandos.
5. Alterar um critério de aceite durante a execução somente com justificativa verificável e registro explícito: mudança solicitada pelo usuário, obrigação de segurança/governança ou descoberta intrínseca ao requisito original. **Preferência nova na revisão vira proposta para outra missão, nunca reprovação retroativa.**

Modelo mínimo de matriz:

| ID | Requisito e origem | Classe | Evidência / verificação | Resultado |
|---|---|---|---|---|
| A-01 | O que deve existir e por quê | OBRIGATÓRIO | Arquivo, teste ou inspeção concreta | PENDENTE |

## 2. Ciclo de execução

`VERIFICAR PRÉ-REQUISITOS → DEFINIR ACEITE → EXECUTAR → TESTAR → CORRIGIR → REVALIDAR → REVISÃO INDEPENDENTE → ENTREGAR`

- Executar com autonomia dentro do escopo e da propriedade atribuída. Coordenador 00 delega e acompanha conforme o protocolo de orquestração, sem simular respostas ou execução de outros agentes.
- Testar os incrementos relevantes assim que possível. Achado corrigível no escopo e sob propriedade do agente **deve ser corrigido e retestado antes da entrega**, conforme `AGENTS.md` §33.
- Após duas tentativas improdutivas, trocar a hipótese ou abrir handoff fundamentado, conforme §10; não iniciar ciclos infinitos nem omitir o bloqueio.
- Testes, screenshots, gravações, medições e arquivos citados devem existir e estar acessíveis na entrega. Um relatório que apenas *afirma* que houve teste não substitui evidência.
- Falha pré-existente, teste não executado e dependência externa devem ser identificados com causa e impacto. Nunca converter `NÃO EXECUTADO` em `APROVADO`.
- O Agente 24 deve emitir parecer **APROVADO para a revisão exata** antes de declarar missão concluída, encerrar handoff ou integrar, conforme §40. Ausência de parecer mantém a etapa de revisão pendente.

## 3. Avaliação fiel ao contrato

A revisão final deve comparar **os mesmos critérios definidos no início** com o que foi comprovado. Separar claramente:

| Situação | Tratamento |
|---|---|
| Obrigatório não atendido, corrigível neste escopo | Corrigir e revalidar antes de entregar |
| Obrigatório impedido por falta comprovada de acesso, permissão, dependência ou outro dono | BLOQUEADA, com evidência e handoff quando aplicável |
| Implementação pronta, decisão legitimamente reservada ao usuário | EM_VALIDAÇÃO / aguardando decisão humana; **não** classificar a escolha pendente como defeito |
| Melhoria opcional ou ideia surgida depois | Sugestão futura; não reduz o aceite da missão original |
| Risco material de segurança, LGPD, tenancy ou regressão, mesmo descoberto na revisão | Bloqueador real conforme governança; documentar e encaminhar, sem esconder |

A palavra "ressalva" não é um status genérico. Descrever exatamente **qual requisito obrigatório foi violado, qual evidência o demonstra, qual impacto e quem pode corrigir**. Não confundir aprovação de artefato técnico com aprovação estética ou comercial reservada ao usuário.

## 4. Fechamento e prova

Relatório final conciso, respeitando `AGENTS.md` §31:

1. **Contrato de aceite:** matriz A-01… com `ATENDIDO`, `NÃO ATENDIDO`, `NÃO EXECUTADO` ou `DECISÃO HUMANA`, com evidências vinculadas.
2. **Entregues:** arquivos, commits/PR quando autorizados, links verificáveis, testes/comandos e resultados reais.
3. **Pendências reais:** somente requisitos obrigatórios abertos, bloqueios comprovados e handoffs com responsável.
4. **Sugestões opcionais:** seção separada, sem contaminar o veredito.
5. **Revisão 24:** parecer, hash/revisão auditada e status; sem parecer aprovado, não escrever "concluído".

Usar os status oficiais de `docs/orchestration/PROTOCOLO.md`:
- **EM_VALIDAÇÃO:** artefatos implementados, aguardando revisão 24 e/ou decisão humana prevista; não significa falha de execução.
- **BLOQUEADA:** requisito obrigatório ou gate impedido por dependência comprovada.
- **CONCLUÍDA:** critérios obrigatórios evidenciados **e** parecer APROVADO do 24, além de outras autorizações exigidas para o escopo.
- **HOMOLOGADA:** conforme o fluxo da demanda; homologação de produto/marca pelo usuário não é presumida.

## 5. Regra para quem escrever ou revisar prompts

Antes de enviar uma missão a qualquer IA, **definir o resultado verificável, os materiais aos quais ela terá acesso, os limites de autonomia e o critério de encerramento**. Não exigir que a IA compare com uma fonte inacessível ou obtenha uma aprovação humana impossível por conta própria. Avaliar a resposta usando a matriz original, sem inventar critérios após a execução.

Este protocolo reduz ambiguidades; **não garante excelência por redação**. Excelência exige execução, inspeção real, correções e evidências proporcionais ao risco.
