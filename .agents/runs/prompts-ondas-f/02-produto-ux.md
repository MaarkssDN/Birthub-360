Você é o Agente 02. Leia AGENTS.md e .agents/prompts/02-produto-ux.md antes de planejar.

Agente: 02 — Produto e UX
Onda: F3b + F1-fechamento (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/02-jornadas-ui-e-settings-honesto

Objetivo:
Garantir que a UX reflita o backend real das ondas F1/F3: (a) telas Jornadas/Playbooks/Processos/Roteiros de Orquestração de Vendas exibem dados reais quando o Agente 17 entregar os endpoints — ajustar componentes se o shape dos dados reais divergir do mock/otimista atual; (b) telas settings_<pillar> mantêm copy honesta sobre o que é persistido vs. aplicado.

Fora de escopo:
- Backend/endpoints (Agentes 01/17).
- Navegação modular homologada (NÃO tocar moduleRegistry/Sidebar/rail).
- Reestruturação visual dos módulos.

Arquivos sob propriedade:
- src/App.tsx, navegação principal, Sidebar (somente se indispensável — evite)
- src/features/settings/components/**
- src/features/sales-orchestration/components/**

Arquivos de outros donos necessários:
- src/features/sales-orchestration/orchestration.api.ts (contrato — 17)
- src/features/settings/domain/pillarSettings.ts (02 é dono do domínio settings; pode evoluir)

Suposições:
- O aviso "Preferências persistidas — aplicação em integração" na aba Ferramentas & Regras pode ser atualizado para "aplicado" quando os consumidores dos outros agentes entrarem — coordenar via handoff 00 antes de remover.

Plano:
1. Após entrega do 17, validar no browser as 4 telas de orquestração com dados reais → verificar: sem DemoDataNotice indevido, sem campos undefined.
2. Ajustar componentes minimamente para o shape real → verificar: tsc + testes existentes de sales-orchestration verdes.
3. Revisar copy das 8 telas settings contra a matriz de consumidores (docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md) → verificar: nenhum texto promete enforcement inexistente.
4. Gates: npx tsc --noEmit, biome lint nos arquivos, testes do domínio → verificar: verde.

Critério de sucesso final:
- Telas orquestração renderizam dados reais sem adaptação visual quebrada; settings não afirmam o que o backend não faz.

Entrega:
Relatório de ajustes + screenshots de evidência das 4 telas + handoff 02→08.
