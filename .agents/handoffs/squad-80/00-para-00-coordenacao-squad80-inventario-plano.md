# Handoff 80 → 00 — Coordenação Squad 80: inventário + plano (DEM-20261123-001)

- De: Agente 80 — Navi (Coordenador Squad 80)
- Para: Agente 00 — Astra
- Status: entregue para revisão
- Branch: coord/squad-80 · Worktree: squads/squad-80/wt-coord · Base: 93e82c220
- Plano completo: .agents/runs/squads/squad-80-plano.md

## Pedidos ao coordenador
1. Adendo à MATRIZ_PROPRIEDADE: `src/features/mobile/**` (14 arquivos) sem dono formal — sugiro
   rateio 85 (offline/services), 87 (audio/recorder), 80 (index/contratos).
2. Escalar R1/R2 à infra (90/91/94): backend canônico para `capacitor.config.ts server.url`
   (app.birthhub360.com.br sem DNS; Render desativado) e publicação de assetlinks.json /
   apple-app-site-association.
3. Divergência de linhagem R11: correções do Bóris (merge 3-way, commit 1e0f77b45) existem na
   linhagem Onda 4 (9f80c07ed) mas NÃO na base squad/onda-3 (93e82c220) — definir como reconciliar
   antes da promoção para integracao/onda-3-dem20261123.
4. Registrar divergência de nomenclatura: REGISTRO_GLOBAL prevê branches `agente/<id>-squad80-*`
   e worktrees `ondaN/wt-*`; estrutura-10 prevê `agente/<id>-<slug>-s80` e `squads/squad-80/wt-*`
   (adotado).
5. Toolchain mobile ausente (sem JDK/Android SDK/Xcode) — builds nativos bloqueados; priorizar
   auditoria estática até provisionamento.
