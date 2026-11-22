---
name: vitest-mutation-testing
description: Testes de mutação para Vitest no Birth Hub 360. Avalia a eficácia real dos testes unitários e de integração injetando alterações no código de produção (operadores invertidos, retornos alterados) para verificar se os testes falham.
---

# Vitest Mutation Testing — Birth Hub 360

## Objetivo
Garantir que os testes automatizados do Vitest (`npm run test:unit` e `npm run test:integration`) sejam verdadeiramente sensíveis a falhas e não apenas testes cosméticos que aumentam percentual de cobertura sem assertivas substanciais.

## Governança e Dependências (`AGENTS.md` §15)
- **Status atual no repositório:** Os pacotes `@stryker-mutator/core` e `@stryker-mutator/vitest-runner` **não estão instalados** atualmente em `package.json`.
- **Regra obrigatória:** Qualquer instalação de pacotes Stryker ou inclusão de scripts em `package.json` e `package-lock.json` exige **aprovação explícita do Agente 00 (Coordenador)** antes da modificação (`AGENTS.md` §15). Enquanto não instalado, a análise de sensibilidade a mutações pode ser aplicada na revisão de qualidade de assertivas dos testes Vitest existentes.

## Como Funciona o Teste de Mutação
1. O avaliador introduz "mutantes" intencionais no código (ex: trocar `>` por `<`, remover chamada de função, retornar `null` em vez de objeto).
2. A suíte de testes é executada para cada mutante:
   - Se o teste **falha**, o mutante foi **morto (killed)** → Teste eficaz!
   - Se os testes continuam **passando verde**, o mutante **sobreviveu (survived)** → Lacuna de teste identificada!

## Áreas Prioritárias para Teste de Mutação
No Birth Hub 360, aplique testes de mutação com foco nas áreas críticas:
1. **Cálculos Financeiros e Comissões:** Cálculos de propostas comerciais e metas do CRM.
2. **Autorização e RBAC:** Regras que decidem se um usuário tem permissão para visualizar ou editar recursos.
3. **Filtros Multi-Tenant / RLS:** Garantir que suprimir o `organizationId` quebre imediatamente os testes.
4. **Validações Zod / Regras de Negócio:** Tratamento de entradas inválidas ou dados corrompidos.

## Práticas Recomendadas
- Não rode testes de mutação sobre todo o repositório a cada commit (é computacionalmente caro).
- Execute mutações de forma cirúrgica sobre os arquivos modificados no PR ou em rotas com lógica de negócio densa.
- Foque na taxa de mutantes mortos (*Mutation Score Indicator* > 80% como meta experimental).
