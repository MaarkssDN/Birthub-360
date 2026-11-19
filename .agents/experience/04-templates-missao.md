# 04 — Templates de Missão por Especialização

Toda missão segue o modelo de §11 do `AGENTS.md`. Abaixo, o template base acrescido dos campos que cada perfil de experiência exige, e três exemplos reais prontos para uso.

## 1. Template base (obrigatório — AGENTS.md §11)

```
Agente: NN — Nome (ou perfil, ex.: 02-CRO)
Onda: N
Base: integracao/onda-N
Branch: agente/NN-slug

Objetivo:
<uma frase>

Fora de escopo:
<lista explícita — incl. o que pareceria natural mas é proibido>

Arquivos sob propriedade:
<lista>

Arquivos de outros donos (somente leitura ou via handoff):
<lista>

Suposições:
<lista>

Plano:
1. <etapa> → verificar: <critério>
2. <etapa> → verificar: <critério>

Critério de sucesso final:
<comando/teste/evidência executável>

Entrega:
<relatório de conclusão em .agents/runs/ + parecer 24>
```

## 2. Campos adicionais por perfil

| Perfil | Campos extras obrigatórios na missão |
|---|---|
| 02-UXR | lista de rotas/telas; dimensões D1–D12 a avaliar; formato de saída do protocolo de auditoria |
| 02-CJ | jornada(s) alvo (ex.: lead→conversão); pontos de entrada/saída; se a missão é mapear ou propor correção |
| 02-IA | escopo de navegação (menu, rotas, breadcrumbs); se inclui inventário de rotas órfãs |
| 02-CRO | URL/variante de landing alvo; quais variantes estão candidatas a canonização; proibição de métricas inventadas |
| 03B | telas-alvo; estados Loading/Empty/Error/Stale a implementar; breakpoints |
| 03C | tokens/componentes em escopo; proibição de redefinir paleta canônica de `identidade-visual/` |
| 03D | componentes a animar; requisito `prefers-reduced-motion`; orçamento de performance |
| 03E | rotas em escopo; WCAG 2.2 AA; distinção verificação manual × automatizada |
| 03F | breakpoints (360/390/768/1024/1440); dark/light; evidência de screenshots reais |
| 03G | comando Impeccable a executar (`detect`/`polish`/etc.); áreas proibidas (Landing/Login) |

## 3. Exemplos reais de missão

### Exemplo A — 02-CJ: auditoria da jornada "cadastrar oportunidade"

```
Agente: 02-CJ (perfil interno do Agente 02)
Onda: WB (auditoria UX)
Base: main
Branch: agente/02-cj-jornada-oportunidade

Objetivo:
Mapear ponta a ponta a jornada de criação manual de oportunidade no CRM e
produzir diagnóstico + proposta de fluxo mínimo, sem implementar.

Contexto (evidência prévia — audit-2026-11-18/ux-completude.md, UX-01/DEBT-0024):
não existe criação manual de lead/oportunidade na UI; CommandPalette navega
para intent `open-create` que CrmBoard nunca lê.

Fora de escopo:
- implementar formulário ou handler (fase posterior);
- alterar CrmBoard.tsx (dono do módulo é outro agente — verificar
  src/features/crm/AGENTS.md);
- mexer em schema/API.

Arquivos sob propriedade:
- .agents/runs/auditorias-ux/WB/jornada-criar-oportunidade.md (saída)
- .agents/handoffs/onda-WB/02-para-<dono>-<slug>.md (achados)

Arquivos de outros donos (somente leitura):
- src/components/crm/**, src/features/crm/**, src/components/ui/CommandPalette*

Plano:
1. Traçar jornada real no código (rota, componente, handlers) → verificar:
   mapa completo entrada→saída com arquivo:linha.
2. Aplicar protocolo 03-protocolo-auditoria-uxui.md dimensões D1,D3,D6,D10,D11
   → verificar: achados com evidência.
3. Propor fluxo mínimo viável respeitando regra de negócio → verificar:
   proposta revisável, sem alterar regra.

Critério de sucesso final:
Relatório em .agents/runs/auditorias-ux/WB/ com jornada mapeada,
≥3 achados com evidência código/tela, handoffs abertos para cada correção
fora do escopo, e handoff 00-para-24 solicitando revisão.
```

### Exemplo B — 03C: consolidação de tokens voice-hub

```
Agente: 03C (enxame do Agente 03)
Onda: WC (design system)
Base: integracao/onda-WC
Branch: agente/03c-tokens-voicehub

Objetivo:
Eliminar o hex hardcoded residual em voice-hub
(docs/design/TOKEN-AUDIT.md — a duplicação de arquivo já foi resolvida;
tokens.ts hoje é shim de re-export) ancorando-o nos tokens canônicos.

Fora de escopo:
- alterar src/features/voice-hub/** (dono do módulo — verificar AGENTS.md);
- redefinir paleta de identidade-visual/** (Agente 11);
- mudanças de comportamento.

Arquivos sob propriedade:
- src/features/voice-hub/components/tokens.ts (se o AGENTS.md do módulo
  confirmar que camada visual é negociável com 03 — senão, handoff)
- src/features/voice-hub/components/design-system/tokens.ts

Plano:
1. Confirmar dono do módulo e acordar escopo via handoff → verificar:
   resposta do dono ou aprovação do 00.
2. Substituir hex hardcoded por var(--token canônico) → verificar:
   diff sem valores mágicos novos.
3. Rodar gate → verificar: npx tsc --noEmit && npm run lint verdes.

Critério de sucesso final:
Hex hardcoded substituído por var(--token canônico) ou duplicata removida
com imports atualizados; typecheck+lint verdes; parecer 24 APROVADO.
```

### Exemplo C — 02-CRO: canonização da landing page

```
Agente: 02-CRO (perfil interno do Agente 02)
Onda: WE (landing/conversão)
Base: main
Branch: agente/02-cro-landing-canon

Objetivo:
Inventariar as superfícies públicas de landing — `Landing360` (roteada em
`/`, `/welcome`, `/login`), `Landing360Impeccable.tsx` (não roteada —
candidata a código morto), `/landing-new`→`LandingInnovative`
(src/features/voice-hub/, dono Agente 12), `landing/` e `landing-page.html`
na raiz — e recomendar canonização + plano de convergência. NÃO implementar.

Fora de escopo:
- alterar qualquer Landing*.tsx (proposta somente);
- criar/remover páginas públicas;
- métricas de conversão inventadas.

Arquivos sob propriedade:
- .agents/runs/auditorias-ux/WE/landing-canon.md
- .agents/handoffs/onda-WE/02-para-00-<slug>.md (recomendação de canonização
  e de propriedade de src/features/landing/**)

Arquivos de outros donos (somente leitura):
- src/features/landing/**, landing/, landing-page.html,
  src/features/voice-hub/pages/LandingInnovative.tsx (Agente 12),
  identidade-visual/** (Agente 11), src/styles/** (Agente 03)

Plano:
1. Inventariar variantes: qual é referenciada por rotas reais em App.tsx e
   server.ts → verificar: tabela variante→rota→status.
2. Auditar a variante ativa nas dimensões D1,D2,D4,D6,D10,D12 → verificar:
   achados com evidência.
3. Recomendar canonização e plano de deprecação das demais → verificar:
   proposta com riscos e ordem de migração.

Critério de sucesso final:
Relatório com variante canônica justificada, lista de variantes a deprecar,
matriz de divergências de identidade, handoffs abertos; revisão 24.
```

## 4. Critérios de entrada e saída (todos os perfis)

**Entrada:** missão no formato §1; worktree/branch próprios; matriz de propriedade publicada se onda >3 especialistas; leitura prévia de handoffs `*-para-<agente>-*` abertos.

**Saída:** relatório em `.agents/runs/`; handoffs para dependências; gate local executado quando houver alteração de código; solicitação de revisão ao Agente 24; nenhuma declaração de "concluído" sem evidência verificável (AGENTS.md §30–32).
