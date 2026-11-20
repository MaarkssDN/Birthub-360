# 03 — Princípios de UX

**Propósito:** derivar e registrar os princípios de experiência do usuário a partir de evidências verificadas no código e nos documentos canônicos, com classificação de cada princípio (CONFIRMADO / DOCUMENTADO-NÃO-IMPLEMENTADO / PROPOSTO).

**Escopo:** princípios transversais de UX do produto Birth Hub 360° (web + mobile). Detalhamento de cada princípio vive em `identidade-do-produto.md` e nos guias de `04-DESIGN-SYSTEM/` e `08-GUIAS-DE-IMPLEMENTACAO/`.

**Estado da informação:** cada princípio cita sua fonte. Data de referência: 2026-11-19.

**Fontes:** `PRODUCT.md`, `DESIGN.md`, `docs/BrandConstitution.md`, `BIRTHUB360_JORNADAS_OPERACIONAIS.md`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/layout/moduleRegistry.ts`, `src/components/ui/`, `src/lib/motion.ts`, `src/i18n/index.tsx`, `src/features/lgpd/`, `android/`, `capacitor.config.ts`, `_FATOS-CANONICOS.md`.

**Documentos relacionados:** `identidade-do-produto.md`, `arquitetura-da-informacao.md`, `inventario-de-telas.md`, `jornadas-do-usuario.md`, `ux-writing.md`.

---

## Legenda de classificação

- **CONFIRMADO** — implementado e verificável em código/documento citado.
- **DOCUMENTADO-NÃO-IMPLEMENTADO** — normatizado em documento, sem evidência completa de implementação.
- **[PROPOSTO]** — recomendação deste documento, sem evidência de adoção.

---

## P1 — Densidade executiva (CONFIRMADO)

- **Evidência:** `PRODUCT.md` imperativo 3 ("layouts de alta densidade (Bento Grids)", Command Palette ⌘K, resposta sub-segundo); `src/components/ui/` com ~95 arquivos incluindo `VirtualTable`, `StatsGrid`, `CompareTable`, `DealsGrid`, `CommandPalette` (`_FATOS-CANONICOS.md` §8); `AdaptiveDashboard` e `CentralModulesHome` como telas de alta densidade.
- **Norma:** informação priorizada por hierarquia visual (Sora para títulos/KPIs, IBM Plex Mono para dados tabulares — `_FATOS-CANONICOS.md` §5); scroll contido; ações contextuais na linha/card, não em páginas separadas quando evitável.
- **Exceção:** landing e login são intocáveis por regra (`PRODUCT.md` §Governança; `DESIGN.md` escopo `/app/*` modo Operate) — a densidade executiva vale para a área autenticada.

## P2 — Dark-first com neon de assinatura (CONFIRMADO)

- **Evidência:** paleta Neon homologada 2026-10-11 (`_FATOS-CANONICOS.md` §18); dark canônico `#0D0D0D`/superfícies `#14141A/#1C1C24`/texto `#F8F9FF` (`identidade-visual/birthhub360/tokens/birthhub360.css:9-117`); marca cyan `#00D4FF`, pink `#FF2D9B`, gold `#FFC107`, íris `#8B7DFF`; rampas light AA em `birthhub360.css:119-186` e overrides `src/styles/official-identity.css:62-107,264-315`.
- **Norma:** tema dark é o canônico de produto; light existe com tokens AA próprios (fundo `#F4F7FB`, ink `#0F172A`). Gradientes de assinatura: `--grad-brand` (títulos), `--grad-cta` (CTAs), `--grad-orbit` (anel 360°), glows `0 0 24px rgba(...,.45)` (`_FATOS-CANONICOS.md` §4).
- **Ressalva:** dívida conhecida — 2039 hex literais em 150 arquivos e 1275 classes arbitrárias `[#…]` em 101 arquivos (`_FATOS-CANONICOS.md` §11); migração PR #368 aberta com gates vermelhos, não integrada. Princípio permanece válido; a dívida é de implementação.

## P3 — Os 4 estados obrigatórios por tela (CONFIRMADO)

- **Evidência:** `PRODUCT.md` imperativo 4; `DESIGN.md` cap.5; `_FATOS-CANONICOS.md` §16: Loading (Skeleton), Empty (EmptyState+CTA), Error (causa+retry), Stale (timestamp de sync) via `<OperationalStateContainer>`.
- **Norma:** nenhuma tela autenticada pode renderizar apenas o estado feliz. Empty State nunca é erro disfarçado (débito conhecido UX: "erro de API como empty state" — `.agents/runs/audit-2026-11-18/ux-completude.md`).
- **Complemento:** `PRODUCT.md` — "Zero Mock em Produção: Proibido inventar dados. Na ausência de dados, exibir Zero State explícito."

## P4 — IA explicável e sob controle humano (CONFIRMADO como padrão de produto)

- **Evidência:** scores explicáveis com justificativas — "Score Explicável de ICP (88/100) e lista as justificativas" (`BIRTHUB360_JORNADAS_OPERACIONAIS.md` J03, linhas 90-91); forecast Monte Carlo com "intervalo de confiança de 90%" e "explicabilidade total dos cálculos" (J14, linhas 253-257); agentes que geram card de alerta com recomendação acionável (J15: "Recomenda-se acionar o Diretor Financeiro imediatamente"); rascunhos de IA revisados antes do envio (J07: SDR "lê a resposta sugerida, faz um pequeno ajuste e clica em Enviar").
- **Norma:** toda saída de IA deve carregar proveniência/justificativa; ação externa (enviar mensagem, publicar, avançar deal) exige confirmação humana. Supervisor bloqueia ações conflitantes com justificativa textual (J16).
- **Camada de presença:** `LiveCopilotHUD` (lazy, sempre montado no shell — `AppLayout.tsx:657-659`), `AssistantsDock`, `intelligence/pending-actions` (inbox de ações pendentes de aprovação — `AppLayout.tsx:449-450`).

## P5 — Mobile offline-first (CONFIRMADO como especificação; PARCIALMENTE IMPLEMENTADO)

- **Evidência (spec):** J18 — gravação local, transcrição/extração on-device, edições em SQLite local, fila de sincronização em background ao reconectar, "sem perda de nenhum dado" (`BIRTHUB360_JORNADAS_OPERACIONAIS.md:301-312`). M10 "Mobile & Field Sales" é módulo mobile-only (`moduleRegistry.ts:348-357`); `useIsTouchDevice` desativa tilt/magnetic/spotlight; `pageTransitionClean` otimizado para mobile; `BottomSheet`/`MobileNav`/`MobileNavDrawer` existem (`_FATOS-CANONICOS.md` §7,§8,§15).
- **Evidência (implementação):** Capacitor Android (`android/`, `capacitor.config.ts`), PWA com manifest `start_url: /app` e Workbox runtimeCaching (`_FATOS-CANONICOS.md` §15); `OfflineBanner` e `SyncIndicator` no layout (`src/components/layout/`).
- **Classificação:** PARCIALMENTE IMPLEMENTADO — o pipeline offline completo de J18 (FieldMeetingRecorder, mobileEdgeAi on-device) é especificação; a infraestrutura de shell (banner, indicador, PWA) está implementada.

## P6 — LGPD-by-design (CONFIRMADO)

- **Evidência:** canal público DSR sem sessão — `/privacidade/dsr/verificar` e `/privacidade/dsr/acompanhamento` (`src/App.tsx:123-126`, `src/features/lgpd/pages/`); `PRODUCT.md` — sanitização de PII, exclusão/anonimização do titular; multi-tenancy com RLS obrigatório em todas as queries (`PRODUCT.md` §Governança); `dataEnricher` deduplica contra base existente antes de criar registros (J03).
- **Norma de UX derivada:** dados pessoais nunca aparecem em estado vazio/mock; exportação de contatos é permissão bloqueada por padrão para SDR/Closer (J02, linha 73); ações destrutivas/transferências exigem trilha de auditoria (`audit_logs`, J02/J20).

## P7 — Acessibilidade WCAG 2.2 AA inegociável (CONFIRMADO)

- **Evidência:** `DESIGN.md`, `docs/BrandConstitution.md`, `_FATOS-CANONICOS.md` §14: contraste texto ≥4.5:1 e não-texto ≥3:1; foco visível `outline: 2px solid` + `outline-offset: 3px` (`--color-focus-ring`, `--focus-offset`); targets 44×44px; rampas light AA já implementadas nos tokens.
- **Motion acessível:** `MotionConfig reducedMotion="user"` (`src/App.tsx:70`), `@media (prefers-reduced-motion)` global, hooks de motion desativam em reduced-motion/touch (`_FATOS-CANONICOS.md` §7).
- **Dívida conhecida:** auditorias registram débitos UX-01..11 (DEBT-0024/0032/0033/0059/0060/0065): sem criação manual de lead, botão morto em Playbooks, erro de API como empty state, score heurístico apresentado como "avaliação", settings de pilar não persistem, estágios de funil hardcoded, KPI null→"R$ 0" (`.agents/runs/audit-2026-11-18/ux-completude.md`).

## P8 — Velocidade e honestidade operacional (CONFIRMADO)

- **Evidência:** lazy-loading de todas as rotas `/app/*` (React.lazy + Suspense + PageTransition — `_FATOS-CANONICOS.md` §9); `OnboardingTour` só faz fetch do chunk ~900kB na 1ª visita (`AppLayout.tsx:386-394`); redirects honestos para rotas indisponíveis (`dialer`→`cadence`, `outbound`→`dashboard` — `AppLayout.tsx:474-478`); sync Bitrix <800ms como resultado verificável (J17).
- **Norma:** nunca renderizar casca de tela que vai falhar com 403 cru — `RequireRole`/`RequireModuleAccess` no frontend espelham o gate do backend (comentários `AppLayout.tsx:424-429,451-453,524-527`; padrão documentado em `RequireRole`).

## P9 — Navegação por jornada comercial e por módulo (CONFIRMADO, com ressalva)

- **Evidência:** `documentacao-aplicacao/inventario/mapa-de-navegacao.md` — grupos Captar → Qualificar → Relacionar → Fechar → Analisar (+ IA & Capacitação, Administração), ordem variável por papel; `moduleRegistry.ts` — rail de 12 módulos com painel contextual e sub-itens reais e deep-linkáveis.
- **Ressalva:** o mapa de navegação textual descreve a Sidebar anterior; a arquitetura vigente é módulo→itens (`moduleRegistry.ts:14-25`). Ambos os modelos coexistem: o rail é o mecanismo; a jornada é a lógica de agrupamento interna.

## P10 — Consistência de idioma e escopo de i18n (CONFIRMADO, com limitação)

- **Evidência:** `src/i18n/index.tsx` — ~60 strings em pt-BR/en-US restritas a `common.*`, `setup.*`, `firstSteps.*` (ex.: `'common.retry': 'Tentar novamente'`, `'firstSteps.progress': '{{completed}} de {{total}} concluídos'`); todo o restante da UI é pt-BR hardcoded (`_FATOS-CANONICOS.md` §14).
- **Norma:** copy nova fora desses namespaces deve ser pt-BR direto; introduzir chave i18n só quando houver paridade real en-US — evitar string órfã.

## P11 — [PROPOSTO] Motion em dois níveis: Comercial vs Operacional

- Proposta registrada em `identidade-visual/v2/04-motion` e FONTE-DE-VERDADE §7 — **NÃO HOMOLOGADA** (`_FATOS-CANONICOS.md` §7). Hoje existe apenas o nível operacional implementado (`src/lib/motion.ts`). Não tratar como norma vigente.

## P12 — [PROPOSTO] Estados como parte da marca

- Os 4 estados são obrigatórios (P3), mas sua expressão visual/verbal ainda não está consolidada como "sistema de estados de marca". Recomenda-se formalizar padrões de Empty/Error/Stale no guia de UX Writing e no DS (`04-DESIGN-SYSTEM/`).

---

## Síntese: princípios → evidência → risco

| Princípio | Fonte primária | Maior risco atual |
|---|---|---|
| P1 Densidade executiva | `PRODUCT.md`, `src/components/ui/` | Sub-apps divergentes (`outbound`, `landing/`) |
| P2 Dark-first neon | `birthhub360/tokens/`, `globals.css` | 2039 hex hardcoded; docs navy/gold obsoletos |
| P3 4 estados | `DESIGN.md` cap.5, `PRODUCT.md` | Empty≠Error ainda viola em pontos (DEBT) |
| P4 IA explicável | J03/J14/J15/J16, `LiveCopilotHUD` | Score heurístico exibido como "avaliação" (DEBT) |
| P5 Offline-first | J18, Capacitor, `OfflineBanner` | Pipeline J18 é spec; implementação parcial |
| P6 LGPD-by-design | `/privacidade/dsr/*`, RLS | — |
| P7 WCAG 2.2 AA | `DESIGN.md`, tokens AA | Débitos de auditoria abertos |
| P8 Velocidade/honestidade | `AppLayout.tsx`, lazy+Suspense | — |
| P9 Jornada+Módulo | `mapa-de-navegacao.md`, `moduleRegistry.ts` | Dois modelos de navegação coexistem |
| P10 i18n mínimo | `src/i18n/index.tsx` | Cobertura ~60 strings apenas |

---
*Documento gerado na missão Brand System 03-PRODUTO. Evidências consolidadas em `../_FATOS-CANONICOS.md`.*
