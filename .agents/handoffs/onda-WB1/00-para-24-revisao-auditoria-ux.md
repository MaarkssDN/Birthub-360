# Handoff — Revisão independente da auditoria UX-01…UX-11 (Onda WB-1)

```
De: 00 — Coordenador (em nome da execução 02A)
Para: 24 — Revisão Independente
Onda: WB-1
Status: resolvido
Prioridade: normal
Bloqueador-ref: —
Sprint destino: encerramento da onda WB-1
```

## Problema

Solicito revisão independente da re-verificação dos achados UX-01…UX-11 da auditoria de 2026-11-18, executada pelo Agente 02A (perfil interno do 02) conforme missão `.agents/runs/00-missao-02a-auditoria-ux-01-11-20261118.md`.

## Arquivo(s) envolvido(s)

- Relatório: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md`
- Handoffs emitidos: `.agents/handoffs/onda-WB1/` (7 arquivos + este)
- Achados fonte: `.agents/runs/audit-2026-11-18/ux-completude.md`
- Inventário: `.agents/runs/audit-2026-11-18/inventario-mestre.md`

## Evidência

**v2 — reauditoria sobre `main @ 8b40cdb90`** (worktree limpo `C:\Github\birthub-360-audit-main`, somente leitura). A v1 auditou a branch errada e foi reprovada; v1 preservada em `revisao-ux-01-11.v1-base-errada.md`.

Placar v2: **7 CONFIRMADOS** (UX-01, 02, 03, 07, 09, 10, 11), **2 PARCIAIS** (UX-05, UX-08), **2 REFUTADOS** (UX-04, UX-06). Delta principal: UX-01 subiu para CONFIRMADO — os intents `open-create`/`qa-opportunity`/`ctx-crm-create` ainda existem em main; UX-06 evidência corrigida (serviço tem consumidores em tests/**); UX-10 ganhou evidência de que `GET /api/crm/pipelines` já existe (crm360).

Severidades re-avaliadas: UX-07 e UX-09 subiram P3→P2; demais mantidas. Itens bloqueados por NO-GO marcados sem workaround. 3 achados novos cosméticos (UX-N1…N3) em formato completo do protocolo.

Diff restrito a `.agents/**` — zero alteração em código de produto.

## Alteração necessária

Revisar: (1) se cada status CONFIRMADO/PARCIAL/REFUTADO está sustentado pela evidência `arquivo:linha` citada; (2) se as severidades re-avaliadas são justificadas; (3) se os donos atribuídos nos handoffs estão corretos frente aos AGENTS.md locais (sales-orchestration e gamification não têm AGENTS.md — atribuições inferidas por histórico, sinalizadas no relatório); (4) se os bloqueios DEBT-* foram respeitados.

## Teste esperado

Parecer APROVADO / APROVADO-COM-RESSALVAS / REPROVADO registrado em `.agents/reviews/` conforme protocolo.

## Contexto adicional

Pontos que merecem atenção especial na revisão: (a) UX-01 tem decisão de produto pendente (criar form vs. assumir prospecção-only) — handoff ao 04 explicitamente condiciona a implementação a essa decisão; (b) UX-10 — o endpoint `/api/crm/pipelines` EXISTE (crm360, auto-semeia defaults por tenant); resta decidir dono de `CrmBoard.tsx` (sem AGENTS.md local em `src/components/` raiz — ambíguo 02/04, histórico cita dúvida); (c) `src/features/sales-orchestration/**` e `src/features/gamification/**` não têm AGENTS.md local — donos marcados "a definir" para decisão do 00; (d) esta é a SEGUNDA revisão do mesmo objeto — a v1 foi reprovada por base errada (branch `agente/03-estabilizacao-tokens-v2`); a v2 corrige base, consumidores em tests/**, donos e formato de achados conforme achados A-01…A-05 do parecer anterior.

## Rodada 3 — correções pós-parecer v2 (R-01/R-02)

O parecer v2 (REPROVADO, `.agents/reviews/24-revisao-auditoria-ux-wb1-v2-20261118.md`) apontou: (R-01) handoffs de correção ainda continham afirmações da v1; (R-02) cauda corrompida no relatório. Ambos resolvidos pelo coordenador:

- **R-02:** cauda corrompida (linhas 143+) removida de `revisao-ux-01-11.md` — arquivo agora termina no rodapé legítimo.
- **R-01:** handoffs corrigidos — `02a-para-04-criacao-manual-lead-oportunidade.md` (intents existem em main, palette é do 03, CrmBoard ambíguo→00); `02a-para-04-funil-negocio-stages-hardcoded.md` (endpoint `/api/crm/pipelines` existe, sem schema novo); `02a-para-17-selfdrivingcrm-orfao.md` (consumidores em tests/** + coordenação 08); `02a-para-05-outbound-spa-codigo-morto.md` (3 testes consumidores + 08); `02a-para-00-codigo-morto-auth-promptstudio-triagem.md` (NewLoginScreen.contactCards.test.tsx:19 + 08).

Solicito revalidação formal por hash dos handoffs alterados + verificação da cauda do relatório, conforme sua recomendação (sem nova amostragem de evidências).
