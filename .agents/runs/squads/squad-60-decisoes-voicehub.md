# Squad 60 — Documento de Decisões Pendentes (D1–D3) — v2 técnico completo

- **Autor:** Agente 60 — Aurora
- **Para:** Orquestrador Humano (deliberação) / Agente 00 — Astra (registro e publicação de ownership)
- **Base:** `coord/squad-60` @ `93e82c220` + `4fe14b956`
- **Autorização parcial recebida:** §9 do Orquestrador Humano autorizou a **preparação** da migração para endpoints canônicos (inventário, comparação de contratos, plano). Execução e mudanças irreversíveis seguem bloqueadas até deliberação.
- **Data:** 2026-11-24
- **Documento técnico detalhado:** `.agents/runs/squads/squad-60-migracao-voicehub.md`

---

## D1 — Destino do gate `/api/voice-hub/*` e dos endpoints de workflow

### Texto técnico completo

**Estado atual (evidências):**
- `src/bootstrap/routes.ts:211` monta `unavailableLegacyModule('voice-hub')` → 503 `MODULE_NOT_READY` para todo o prefixo `/api/voice-hub/*`.
- O frontend do Studio faz **5 chamadas** a `/api/voice-hub/workflow*` (inventário completo em `squad-60-migracao-voicehub.md` §1): `GET|POST /workflow`, `POST /workflow/publish`, `GET /workflow/:id/versions`, `POST /workflow/:id/versions/:v/rollback`.
- **Não existe router montado** para esses paths: `src/lib/voice-hub/routes/index.ts` (24 routers) não é importado por `server.ts` nem `src/bootstrap/**` — backend HTTP voice-hub está 100% desmontado.
- **O router legado `workflow.routes.ts` já implementa exatamente esses 5 endpoints** (+7 extras), com service layer canonical-adapted: `workflowService.ts` → `workflowRepository.ts` → models canônicos `Workflow`/`WorkflowVersion` (`prisma/schema.prisma:5292,5318`, `organizationId` + RLS), gates server-side `ValidationEngine` + `validateRuntimeCompatibility`, audit via BullMQ → `AuditLog` canônico.
- Auth compatível: `requireTenant` do voice-hub resolve sessão a partir de `req.user` canônico (`voiceHubSessionOf`, `rbac.ts:15-31`) — funciona atrás de `authenticateToken` sem adaptação.
- **Gap de authz:** rotas de workflow não têm role gate — qualquer membro autenticado do tenant (incl. VISUALIZADOR) pode salvar/publicar/fazer rollback de workflow que dirige ligações reais de telefonia. Padrão canônico de mutações sensíveis exige `requireRole` (ver `birthVoice.routes.ts:28,61,123`).

**Conclusão:** a decisão D1 não é "reabrir vs manter gate" — é **"montar o router de workflow adaptado atrás do auth canônico, com ou sem role gate"**. O caminho técnico de menor risco está pronto; depende apenas de ownership de `src/bootstrap/routes.ts` (sem dono na matriz) e da decisão de authz.

**Opções:**
- **(a) Recomendada — mount cirúrgico:** montar somente `workflow.routes.ts` (fatiado aos endpoints necessários + PUT/DELETE se desejado) em `/api/voice-hub/workflow` atrás de `authenticateToken`+`requireTenant`, adicionando `requireRole(['ADMIN','GESTOR'])` em publish/rollback (e decidindo save). Manter `unavailableLegacyModule` para o restante do prefixo `/api/voice-hub/*`. Zero diff no frontend; Studio volta a funcionar.
- **(b) Router novo canônico:** reescrever como `src/features/integrations/birth-voice/workflow.routes.ts` (ou `src/features/voice-hub/api/`) delegando ao `workflowService` existente, path `/api/workflows` — exige mudar 5 call-sites + 6 arquivos de teste (diff pequeno mas real) e decide nomenclatura definitiva. Mais "limpo" arquiteturalmente, mais trabalho.
- **(c) Manter 503 permanente:** declarar o Studio descontinuado, remover os 5 call-sites + código morto associado (ver D2). Produto decide se Voice Hub Studio é feature viva.

**Recomendação da coordenação:** (a), com role gate ADMIN/GESTOR em publish/rollback. Se o produto confirmar que o Studio está morto, (c) é mais honesto que carregar ~30k linhas de UI sem backend.

---

## D2 — Destino do código sem owner em `src/features/voice-hub/**` e `src/lib/voice-hub/**`

### D2a — `src/features/voice-hub/**` (frontend, ~130 arq / ~29k linhas)

Subdirs com dono na matriz: `index.ts`→60, `ui/`→65, `voip/|sip/`→61, `recording/`→62, `transcription/`→63, `commands/`→64. **Sem dono:** `api/`, `components/` (63 arq), `pages/` (37), `store/` (14), `services/` (5), `hooks/` (2), `lib/` (2+studio), `infra/` (1). Ou seja, ~90% da árvore de feature não pode ser legalmente editada por ninguém hoje — incluindo os 5 call-sites da D1.

**Proposta (detalhada em `squad-60-migracao-voicehub.md` §6a):** 65-Lena absorve `api|components|pages|store|hooks|lib|services` (é o dono funcional do Studio, já entregou a UI); 60-Aurora fica com `index.ts`+`infra/`; 61–64 mantêm subdirs. Preserva exclusão mútua 65×64.

### D2b — `src/lib/voice-hub/**` (backend, 162 arq / ~18.7k linhas) — gap NÃO mapeado anteriormente

Descoberta desta rodada: existe uma segunda árvore voice-hub inteira fora da matriz. Contém os routers/controllers/services/repositories que implementam (desmontados) a API legada + partes vivas (`webhook.worker.ts` em `bootstrap/workers.ts:110`; `settingRepository.ts` usado por organization-modules/settings; repositories usados no teste RLS `tests/integration/voice-hub-rls.test.ts`).

**Proposta (detalhada §6b do doc de migração):**
- `routes|controllers|services|validators|middlewares|repositories|infrastructure|types|lib` de `src/lib/voice-hub/**` → **Squad 60** como domínio (60 coordena; execução por 61–64 conforme subdomínio: telephony→61, recording→62, transcription→63, commands/workflow→64).
- Alternativa conservadora: todo para Squad 20 — rejeitada por afastar o domínio do squad responsável.

### D2c — `src/features/voice-hub/AGENTS.md` (drift de governança)

Declara "Dono: Agente 12 — Voz e Telefonia" com handoffs para "Agente 02/03/07/16" — numeração do roster **legado** (pré-100-agentes), incompatível com a matriz vigente. **Proposta:** após D2a definir owners, reescrever o cabeçalho apontando para `.agents/MATRIZ_PROPRIEDADE.md` ou arquivar o arquivo. Edição depende de D2a (owner do arquivo raiz do feature dir).

---

## D3 — (fundida em D2c) Drift de governança local

Ver D2c acima. Sem ação independente.

---

## Resumo das decisões solicitadas ao Orquestrador Humano

| # | Decisão | Recomendação da coordenação | Bloqueia |
|---|---|---|---|
| D1 | Montar workflow routes (opção a/b/c) + authz role gate | **(a)** mount cirúrgico + `ADMIN/GESTOR` em publish/rollback | Fase 1 da migração; Studio funcional |
| D2a | Ownership dos subdirs sem dono em `features/voice-hub/**` | 65-Lena absorve Studio; 60 fica com index/infra | Qualquer edição de código nesses paths (incl. call-sites) |
| D2b | Ownership de `src/lib/voice-hub/**` (162 arq) | Squad 60 detém o domínio backend de voz | Fase 1 (router vive lá) |
| D2c | `src/features/voice-hub/AGENTS.md` legado | Reescrever/arquivar após D2a | Higiene de governança |
| Extra | Ownership `src/bootstrap/routes.ts` + `src/api/**` | Squad 20 (22-Hugo/21-Zara) ou designação explícita | Fase 1 (mount) |

**Nenhuma escrita em `src/**` foi realizada.** Aguardando deliberação.
