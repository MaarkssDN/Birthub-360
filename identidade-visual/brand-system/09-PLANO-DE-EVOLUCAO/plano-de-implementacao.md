# Plano de Implementação — Conformidade do Brand System

**Propósito:** sequência realista de execução para levar o sistema de legado a canônico, em fases, com dependências explícitas — sem iniciar trabalho que dependa de decisões pendentes.

**Escopo:** plano de alto nível; cada item vira missão de agente com critério de sucesso próprio (modelo AGENTS.md §11). Não executa mudanças.

**Estado da informação:** sequência **[PROPOSTO]**; todas as decisões humanas permanecem **PENDENTE** — o plano as trata como gates, não como resolvidas.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md`; `.agents/experience/05-roadmap.md` (Ondas A–F); `../00-GOVERNANCA/roadmap-de-conformidade.md`; `decisoes-pendentes.md`; `backlog-priorizado.md`; handoff PR #368.

**Documentos relacionados:** todos os demais arquivos desta biblioteca.

---

## Visão da sequência

```
FASE 0 — Decisões humanas (gate)
   │
   ├─► FASE 1 — Saneamento documental (paralelo, sem código)
   │
   ├─► FASE 2 — Canonização de superfícies (após decisões de ativo/landing)
   │
   ├─► FASE 3 — Migração de tokens/cores (após destino do PR #368)
   │
   └─► FASE 4 — Conteúdo e motion comercial (após homologação V2)
   │
   └─► FASE 5 — Governança contínua (contínua, desde já)
```

Regra de ouro: **nenhuma fase posterior pode "resolver" uma decisão pendente por implementação** — código/docs só adotam o que foi decidido.

---

## FASE 0 — Decisões humanas (gate de entrada)

**Objetivo:** destravar as decisões que bloqueiam as demais fases.

| Ordem | Decisão | Bloqueia | Esforço |
|---|---|---|---|
| 0.1 | D12 — reportar `.env` (15/00) | Segurança — não é decisão humana, executar já | Imediato |
| 0.2 | D1 — grafia oficial | Copy, brandbook, i18n, todos os docs novos | Pacote de decisão pronto |
| 0.3 | D9 — homologar V2 | D3, D11, brandbook MD, manual de componentes, motion comercial | Revisão 24 + humano |
| 0.4 | D6 — destino PR #368 | Fase 3 inteira | Após diagnóstico de gates |
| 0.5 | D5 — destino CSS morto/docs/landings | Fase 1 parcial + Fase 2 | 00 + humano (landing) |
| 0.6 | D8, D2, D10, D7 — logo, personagens, área proteção, canvas | Fase 2 (ativos) + docs de norma | Humano |
| 0.7 | D4, D3, D11 — contraste CTA, módulo→accent, motion 2 níveis | Fase 3 parcial + Fase 4 | Após 0.3/0.6 |

**Saída da fase:** ata/registro de decisões (sugestão: seção em `decisoes-pendentes.md` atualizada + handoff `00-para-*`).
**Critério de sucesso:** nenhuma pendência D1–D12 sem status; decisões registradas em artefato rastreável.

---

## FASE 1 — Saneamento documental (curto prazo, paralelo)

**Objetivo:** eliminar fontes de autoridade errada — maior retorno por menor risco.

1. Marcar docs navy/gold/Bodoni como SUPERSEDED com banner → brand-system (**P0-04**; responsável 08; verificar: banner presente + link correto).
2. Corrigir `.claude/CLAUDE.md` (paleta Neon; birthhub360/ é identidade ATUAL, não anterior) e `.claude/skills/design-system/SKILL.md` (**P0-05**; dono conforme §15; verificar: grep por "Strategic Command Center"/"Bodoni" retorna só contexto histórico).
3. Atualizar `.agents/skills/birthhub-*` para apontar autoridade correta (**P0-05**; prompts exigem decisão humana — preparar diff para aprovação).
4. Arquivar CSS morto após confirmar zero imports (**P1-01**; 03; verificar: `grep` por imports + build verde).
5. Remover/aposentar resíduo `#FF5618` em `public/tools/social-selling/` (**P0-06**; 11/02; verificar: rota `/tools` sem laranja).
6. Criar/atualizar este brand-system como referência canônica de documentação (**em curso**; 11).

**Dependências:** Fase 0 itens 0.2, 0.5 (parcial — marcação de superseded não exige decisão de grafia, mas sim de autoridade).
**Risco:** baixo. **Gate:** parecer 24 se tocar `.claude/`/`docs/` fora da propriedade do executor.

---

## FASE 2 — Canonização de superfícies e ativos (curto-médio prazo)

**Objetivo:** uma identidade por superfície pública e por ativo oficial.

1. **Landings:** canonizar `Landing360`; decidir destino de `Landing360Impeccable`, `/landing-new`/`LandingInnovative` (handoff Agente 12), `landing/` e `landing-page.html` (**P1-08**; 02+11; **exige autorização humana** por ser superfície pública — Onda E do roadmap de experiência).
2. **Logos:** executar decisão D8 — migrar `BirthHubLogo.tsx` para Neon ou documentar exceção; depreciar `BirthubLogo.tsx`/`Birthub360Logo.tsx`; promover SVGs Neon oficiais se confirmado (**P1-04/P1-05**; 03/11).
3. **Personagens:** aplicar decisão D2 (contagem oficial) e consolidar catálogo (**P1-06**; 11 + dono do módulo).
4. **Sub-apps:** convergir `prospecting/outbound/` para tokens ou registrar exceção justificada (**P2-05**).
5. **voice-hub DS:** convergir hex residuais para cadeia canônica (**P1-03**; alinhado à Onda C do roadmap de experiência).

**Dependências:** Fase 0 itens 0.5, 0.6; Onda C do roadmap de experiência para tokens/landings.
**Risco:** médio — landings públicas e componentes de marca visíveis; exige QA visual (goldens em `04_ASSETS_VISUAIS/` como referência).
**Gate:** evidência visual real (verificação do 22/03F) + parecer 24.

---

## FASE 3 — Migração de cores e tokens (médio prazo)

**Objetivo:** eliminar hardcoded colors fora dos tokens canônicos.

1. **Destino do PR #368** (já em diagnóstico no `wt-368-rebase`):
   - Se integrar: gates verdes → QA visual completo (desktop/mobile × light/dark + gráficos — pendente registrado no handoff) → parecer 24 → merge.
   - Se fatiar: priorizar por domínio seguindo matriz de propriedade — maiores ofensores: `Landing360.tsx` (125 hex), `NewLoginScreen.tsx` (39), `landing/luxury Act*.tsx` (~200), `Analytics.tsx` (19), `PredictiveScoringNbaCard.tsx` (18), `Button.tsx`.
2. Após migração: reavaliar overrides `official-identity.css:264-315` (podem tornar-se desnecessários) (**P2**) — 03.
3. Governança de tokens: documento de regras + avaliação de lint anti-hex (**P2-04**; 03+23).
4. Decisão D4 (contraste CTA light): implementar ajuste aprovado (**P2-02**; 03).
5. Decisão D3 (módulo→accent): aplicar mapeamento homologado (**P2-10**; 03+11).

**Dependências:** Fase 0 item 0.4 (destino #368); decisões D4/D3.
**Risco:** alto se merge em massa — mitigar com QA visual e fatiamento.
**Gate:** `npx tsc --noEmit` + lint + testes + Visual Regression verde + QA visual registrado + parecer 24.

---

## FASE 4 — Conteúdo documental e motion comercial (médio-longo prazo)

**Objetivo:** completar o brand system como produto documental.

1. **Brandbook markdown consolidado** a partir dos HTMLs oficiais (**P1-09**; 11) — depende de D1 (grafia) e D9.
2. **Manual de componentes completo** (~95 ui + layout + brand) (**P2-03**; 03+11) — pode ser suprido por `v2/05-componentes` se homologado.
3. **Guia de aplicação para agentes** (**P2-08**; 11+03).
4. **Motion comercial / 2 níveis** (**P3-01**; 03) — só após D11.
5. **Kit de aplicação** (og-images, social, email) (**P3-02**; 11).
6. **Especificações de domínio** (accent/personagens/microcopy por módulo) (**P3-03**; 11+donos).
7. **Auditoria WCAG atual** (**P2-06**; 03+08) — pode antecipar para logo após Fase 2 se P2-01/P2-02 resolvidos.

**Dependências:** Fase 0 itens 0.2, 0.3, 0.6, 0.7; Fase 1 (autoridade doc correta).
**Risco:** baixo-médio; principal risco é retrabalho se V2 for rejeitado após docs baseados nele — por isso P1-07 precede.

---

## FASE 5 — Governança contínua (contínua)

1. **ADR de marca**: registrar D1–D12 quando decididas (**P3-05**; 11/00).
2. **Baseline de regressão visual honesto**: reconciliar 11 snapshots divergentes + drift `tests/AGENTS.md` (**P2-07**; 08/14 — Onda F do roadmap de experiência).
3. **Gate anti-hex no CI** (**P3-06**; 03/16/08).
4. **Protocolo de depreciação de identidade**: regra formal para aposentar paleta/doc/ativo (lição do resíduo `#FF5618`) — **[PROPOSTO]** escrever em `00-GOVERNANCA/` quando houver 2º caso ou decisão humana.
5. **Re-auditoria periódica** deste brand-system: após cada marco (merge #368, homologação V2, decisões de marca) — ver `controle-de-versoes.md` §4.6.
6. **i18n de microcopy de marca** quando produto priorizar (**P3-04**).

---

## Marcos de sincronização com o roadmap de experiência

| Marco | Relação |
|---|---|
| Onda B (auditoria/estabilização UX) | Paralela; não bloqueia Fases 1–2; débitos UX alimentam P2-06 |
| Onda C (design system) | **Sobrepõe Fases 2–3** — convergência de tokens, voice-hub, landings já prevista lá; este plano deve ser executado **em conjunto**, não duplicado |
| Onda D (jornadas) | Independente; especificações de domínio (P3-03) beneficiam-se dela |
| Onda E (landing) | **É a Fase 2.1** — landing exige autorização humana explícita |
| Onda F (release) | Inclui P2-07 (baseline visual) |

**Aviso de coordenação:** antes de despachar qualquer missão desta lista, o 00 deve verificar sobreposição com `.agents/experience/05-roadmap.md` e publicar matriz de propriedade — vários itens tocam `src/styles/**`, `src/components/ui/**` (03) e features de outros donos.
