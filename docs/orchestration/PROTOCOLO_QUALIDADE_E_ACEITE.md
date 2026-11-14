# PROTOCOLO PERMANENTE DE EXECUÇÃO, QUALIDADE E ACEITE
## Governança de Homologação, Testes, Evidências e Revisão Independente
**Projeto:** Birth Hub 360°  
**Autoridade:** AGENTS.md §2, §28, §30, §32 · Agente 00 (Coordenação) & Agente 24 (Revisão Independente)  
**Aplicação:** Obrigatório para todas as missões e demandas multiagente.

---

## 1. Princípio Fundamental de Qualidade

Nenhuma entrega no Birth Hub 360° é aceita com base em mera autodeclaração ("fazer funcionar" não é critério).  
Toda conclusão exige:
1. Critérios objetivos e verificáveis definidos a priori.
2. Evidências de execução real (comandos executados e suas saídas autênticas).
3. Testes progressivos e revalidação de regressões após correções.
4. Parecer formal e fundamentado do **Agente 24 (Revisão Independente)** emitido sobre a revisão exata submetida.

---

## 2. O Ciclo Obrigatório de Execução em 10 Fases

Toda demanda ou sub-missão deve percorrer estritamente as seguintes fases:

```
[1. VERIFICAR PRÉ-REQUISITOS]
           ↓
[2. DEFINIR ACEITE]
           ↓
[3. PLANEJAR]
           ↓
[4. DELEGAR]
           ↓
[5. EXECUTAR]
           ↓
[6. TESTAR]
           ↓
[7. CORRIGIR]
           ↓
[8. REVALIDAR]
           ↓
[9. REVISAR (Agente 24)]
           ↓
[10. ENTREGAR]
```

### Detalhamento das Fases

1. **VERIFICAR PRÉ-REQUISITOS**:
   - Inspecionar fontes de verdade: `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `docs/orchestration/PROTOCOLO.md`.
   - Verificar permissões, acessos, dependências upstream e propriedade de arquivos.
   - Declarar limitações do ambiente se alguma referência estiver inacessível antes de iniciar o trabalho.

2. **DEFINIR ACEITE**:
   - Estabelecer critérios de sucesso mensuráveis antes de escrever código ou alterar configurações.
   - Categorizar os requisitos claramente em Obrigatórios vs. Opcionais vs. Decisões Humanas.

3. **PLANEJAR**:
   - Decompor a demanda em passos cirúrgicos e atômicos (P1 - Pensar antes de programar).
   - Identificar arquivos sob propriedade do agente e arquivos de terceiros (necessitam de handoff se alterados).
   - Associar cada passo a um teste ou evidência verificável.

4. **DELEGAR**:
   - O Agente 00 despacha a tarefa ao especialista via Agent Bus (`http://localhost:4100`), sessão ou subagente.
   - A delegação inclui: ID da demanda, escopo, critérios de aceite e instruções de retorno.

5. **EXECUTAR**:
   - Aplicação de alterações mínimas e cirúrgicas (P2 - Simplicidade primeiro; P3 - Alterações cirúrgicas).
   - Proibido refatorar código adjacente sem necessidade ou editar oportunisticamente fora de escopo.

6. **TESTAR**:
   - Execução progressiva durante a implementação (não acumular tudo para o final).
   - Testar caminho feliz e cenários de falha.

7. **CORRIGIR**:
   - Problema comprovado dentro do escopo e pertencente ao agente deve ser corrigido imediatamente ("proibição de auditoria sem correção", AGENTS.md §33).
   - Proibido transformar correções simples em novo backlog.

8. **REVALIDAR**:
   - Ao corrigir qualquer defeito, reexecutar imediatamente todos os testes afetados para garantir ausência de regressões.

9. **REVISAR (Agente 24)**:
   - Encaminhar a entrega ao Agente 24 para auditoria independente.
   - O autor nunca aprova a própria entrega.

10. **ENTREGAR**:
    - Consolidação da ficha da demanda, diários dos agentes e parecer aprovado do Agente 24.
    - Notificação formal de conclusão ao usuário e atualização do `demands/INDEX.md`.

---

## 3. Taxonomia de Classificação de Achados e Requisitos

Para eliminar ambiguidade e impedir aprovações subjetivas ou bloqueios indevidos, toda constatação deve ser classificada estritamente em uma das 4 categorias:

| Categoria | Definição | Impacto no Aceite |
|---|---|---|
| **OBRIGATÓRIO** | Requisito explícito da demanda, preceito de governança (AGENTS.md), segurança, tenancy, LGPD, integridade de dados ou gate de CI quebrado. | **Bloqueia conclusão** até correção e revalidação comprovada. |
| **OPCIONAL** | Melhoria de estilo, refatoração de oportunidade, otimização não crítica ou feature futura que não constava no aceite original. | **Não bloqueia.** Não deve ser motivo de reprovação pelo Agente 24 nem transformar o escopo. Registrado como recomendação. |
| **DECISÃO HUMANA** | Escolha arquitetural, estética, comercial ou de negócio reservada exclusivamente ao usuário/proprietário do produto. | **Não bloqueia tecnicamente.** Deve ser sinalizada de forma explícita e isolada, sem ser classificada falsamente como defeito. |
| **BLOQUEIO REAL** | Impedimento técnico intransponível (falta de credencial externa, ferramenta de terceiros fora do ar, limite de infraestrutura física). | **Sinalizado formalmente.** Deve registrar: causa raiz comprovada, evidência observada, responsável pelo desbloqueio e plano de contingência. |

---

## 4. Auditoria Obrigatória do Agente 24 (Revisão Independente)

O Agente 24 atua como quality gate autônomo e independente do autor da alteração:

### Roteiro de Auditoria do Agente 24:
1. **Verificação de Escopo:** O diff contém apenas linhas relacionadas à missão? Houve refatoração oportunista?
2. **Propriedade de Arquivos:** Algum arquivo com dono exclusivo (AGENTS.md §15) foi alterado sem autorização/handoff?
3. **Princípios P1–P4:** Simplicidade observada? Ausência de complexidade especulativa?
4. **Ausência de Código Morto:** Não foram deixados imports órfãos, variáveis não utilizadas ou logs de debug?
5. **Tenancy e LGPD:** Não há vazamento de dados entre organizações ou PII desprotegida?
6. **Evidências:** Os testes foram realmente executados e comprovados?

### Pareceres Oficiais:
- **`APROVADO`**: Todos os critérios obrigatórios foram atendidos com evidências válidas.
- **`REPROVADO`**: Falha em critério obrigatório, quebra de gate, violação de propriedade ou falta de evidência. Retorna ao responsável com os apontamentos objetivos.
- **`BLOQUEADO`**: Existência de bloqueio real comprovado ou necessidade de decisão humana mandatória antes do prosseguimento.

O parecer é sempre registrado fisicamente em `.agents/reviews/` identificando a branch/commit auditado.

---

## 5. Critérios de Encerramento (Definição de Pronto)

Uma demanda somente atinge o status **`CONCLUÍDA`** quando:
- [ ] Critérios obrigatórios atendidos integralmente.
- [ ] Evidências de teste anexadas à ficha (comandos + saídas completas).
- [ ] Typecheck (`npx tsc --noEmit`) e Linting verdes.
- [ ] Gates da área alterada validados.
- [ ] Correções revalidadas com sucesso.
- [ ] Parecer `APROVADO` do Agente 24 registrado em `.agents/reviews/`.
- [ ] Ficha da demanda em `docs/orchestration/demands/DEM-*.md` assinada pelos agentes participantes.
- [ ] `docs/orchestration/demands/INDEX.md` atualizado pelo Agente 00.
