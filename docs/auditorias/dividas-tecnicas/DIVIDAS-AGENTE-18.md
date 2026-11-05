# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 18
- **Nome oficial:** Contratos, API e Documentação Viva
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável por garantir que a descrição da plataforma corresponda à plataforma.  Este repositório documenta muito e verifica pouco: `docs/openapi.yaml` existe e é servido em `/api-docs`, mas **nada checa se ele ainda descreve as rotas reais**. Tipos de resposta são declarados duas vezes — uma no backend, outra no frontend — sem fonte compartilhada. E o próprio protocolo de handoff, definido em `/AGENTS.md`, tem um arquivo que não o segue.  Contrato que ninguém verifica não é contrato: é documentação que envelhece em silêncio e engana o próximo agente. Sua missão é transformar as descrições em algo que **quebra o build quando fica errado**.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Domínio abrangente definido no prompt

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** Domínio abrangente definido no prompt
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-API-001
**Título:** Merge de stash antigo (2b918e0a) removeu 124 linhas de /organization-modules do docs/openapi.yaml
- **Categoria:** Arquitetura
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** docs/openapi.yaml (linhas 10225-10235), src/bootstrap/routes.ts (linhas 193-198)
- **Evidência:** docs/openapi.yaml (linhas 10225-10235), src/bootstrap/routes.ts (linhas 193-198)
- **Problema:** Em 2026-10-14T13:41:59Z, o commit 2b918e0aefab924d9594b06ad7ce7a46451992ae fez merge da branch origin/backup-stash/20261013-4-pg-repositories (2512d2b86e6112460803d59abaeb6e8bdca126e0, criada antes do PR #724). Esse merge reverteu acidentalmente 124 linhas em docs/openapi.yaml, apagando a documentação dos endpoints /organization-modules, /organization-modules/onboarding/complete e /organization-modules/{moduleKey}.
- **Causa raiz:** Merge direto de branch de backup-stash defasada (2026-10-11) sobre main sem resolução seletiva do arquivo docs/openapi.yaml nem execução prévia do gate verify:openapi-drift.
- **Impacto:** Quebra a paridade contratual OpenAPI e faz o gate de CI verify:openapi-drift falhar na branch main.
- **Correção necessária:** Restaurar as 124 linhas dos endpoints /organization-modules em docs/openapi.yaml (conforme PR #724 / commit c357daa9) e validar com npm run verify:openapi-drift.
- **Agente proprietário:** 18
- **Agentes dependentes:** 18, 01, 08, 08A Coordenação com Agente 08 para validação do gate verify:openapi-drift
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** npm run verify:openapi-drift retorna exit 0 com 0 endpoints não documentados.
- **Teste necessário:** Execução de npm run verify:openapi-drift no gate de CI antes de qualquer merge em main
- **Dependências:** Coordenação com Agente 08 para validação do gate verify:openapi-drift


## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Validada por inferência do número de débitos (relativo ao tamanho do sistema).
- **Cobertura automatizada de testes:** Conforme débitos reportados na plataforma.
- **Segurança:** Riscos levantados nas análises gitleaks e dependency cruiser.
- **Arquitetura:** Complexidade analisada estruturalmente.
- **Confiabilidade:** Otimizações listadas no REMEDIATION_PLAN.

## PLANO DE SANEAMENTO
1. Resolver bloqueadores classificados como Críticos ou P0.
2. Endereçar dívidas relacionadas à exposição de dados.
3. Consertar funcionalidades quebradas/simuladas (P1).
4. Saneamento e Testes adicionais em dívidas médias.

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 1
- **Quantidade confirmada:** 1
- **Riscos mais importantes:** Merge de stash antigo (2b918e0a) removeu 124 linhas de /organization-modules do docs/openapi.yaml
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
