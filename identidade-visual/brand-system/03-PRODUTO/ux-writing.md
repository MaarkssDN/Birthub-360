# 03 — UX Writing

**Propósito:** documentar o tom de voz, as regras de microcopy e os padrões de estados textuais (empty/error/loading/stale) do produto, com exemplos reais do código.

**Escopo:** copy de interface do produto autenticado (`/app/*`, `/setup`, `/social-selling`, design-lab) e superfícies públicas diretamente ligadas ao produto (login/landing seguem identidade própria — fora do escopo de microcopy operacional). Não cobre documentos institucionais.

**Estado da informação:** CONFIRMADO onde citado; recomendações novas marcadas [PROPOSTO]. Data de referência: 2026-11-19.

**Fontes:** `docs/BrandConstitution.md` §5, `PRODUCT.md`, `src/i18n/index.tsx`, `src/components/ui/` (EmptyState, ErrorBoundary, Skeleton, ConfirmDialog, Toaster), `DESIGN.md` cap.5, `src/App.tsx`/`AppLayout.tsx` (comentários de decisão de copy), `BIRTHUB360_JORNADAS_OPERACIONAIS.md`, `_FATOS-CANONICOS.md` §14,§16.

**Documentos relacionados:** `identidade-do-produto.md`, `principios-de-ux.md`, `jornadas-do-usuario.md`.

---

## 1. Tom de voz (canônico)

**Evidência — `docs/BrandConstitution.md` §5:**

> "Profissional · Tecnológica · Direta · Empowering. A voz acompanha o produto: reduz complexidade, revela contexto e orienta a próxima ação — sem exagero promocional, sempre orientada a inteligência, decisão e execução."

Interpretação operacional (síntese verificável, não citação):

| Dimensão | Significa | Anti-padrão |
|---|---|---|
| **Profissional** | Vocabulário de negócio (pipeline, funil, deal, forecast, handoff); sem gíria, sem exclamações em excesso | "Bora fechar esse deal! 🔥" |
| **Tecnológica** | Precisão: nomes reais de módulos/rotas, unidades, timestamps; erro técnico explicado em linguagem de usuário | "Algo deu errado :(" sem causa |
| **Direta** | Frases curtas; verbo primeiro; uma ação por mensagem; sem enrolação | "Talvez você possa considerar a possibilidade de…" |
| **Empowering** | Orienta a próxima ação concreta; mostra o que o dado significa e o que fazer | Informação sem caminho de ação |

## 2. Como a IA é comunicada

**Evidência — `_FATOS-CANONICOS.md` §2 (BrandConstitution §5):** IA é comunicada por **insight, confiança e raciocínio** — nunca por "sparkles", "AI-powered" genérico ou antropomorfismo decorativo.

Padrões observados nas jornadas (especificação, `BIRTHUB360_JORNADAS_OPERACIONAIS.md`):

- Score **explicável**: "Score Explicável de ICP (88/100)" com justificativas listadas (J03) — o número vem acompanhado do porquê.
- Alerta com recomendação acionável: "Atenção: Seu interlocutor saiu da empresa. Recomenda-se acionar o Diretor Financeiro imediatamente via telefone" (J15).
- Bloqueio com justificativa: "Ação Suspensa: Esta empresa pertence ao Grupo Econômico X… A conta foi anexada ao deal principal" (J16).
- Previsão com incerteza explícita: "R$ 1.390.000 com intervalo de confiança de 90% entre R$ 1.310.000 e R$ 1.480.000" (J14) — IA que declara seu grau de confiança.
- Ação de IA sempre revisável: rascunho de resposta "lê a resposta sugerida, faz um pequeno ajuste e clica em Enviar" (J07); propostas passam por `pending-actions`/aprovação (J10).

**Regra derivada [síntese]:** toda saída de IA deve responder três perguntas na copy: *o que o sistema observou*, *o que concluiu*, *o que recomenda/o que você decide*.

## 3. Regras de microcopy

Base: princípios P1–P10 de `principios-de-ux.md` + evidências de i18n e componentes.

1. **[CONFIRMADO] Idioma padrão pt-BR.** `src/i18n/index.tsx` tem paridade pt-BR/en-US apenas para `common.*`, `setup.*`, `firstSteps.*` (~60 strings); todo o restante da UI é pt-BR hardcoded (`_FATOS-CANONICOS.md` §14). Copy nova fora desses namespaces deve ser pt-BR direto; criar chave i18n somente com paridade real.
2. **[CONFIRMADO] Ação primeiro, contexto depois.** Botões nomeiam a ação ("Confirmar configuração", "Marcar como concluído", "Tentar novamente" — `i18n/index.tsx`); descrições explicam o efeito ("A configuração só é gravada quando você confirmar abaixo; depois, poderá alterá-la na aba de Administração.").
3. **[CONFIRMADO] Interpolações nomeadas, não concatenação.** Padrão `{{count}}`, `{{completed}} de {{total}}` (`firstSteps.progress`).
4. **[PROPOSTO] Erros dizem causa + saída.** Norma P3 (`principios-de-ux.md`): Error = causa + retry. Nunca "Erro 500"/"Algo deu errado" sem o que fazer. Exemplos canônicos de tom: `'common.retry': 'Tentar novamente'`, `'common.tryAgain': 'Tentar salvar novamente'`, `'setup.loadErrorTitle': 'Não foi possível carregar os módulos'` — títulos em frase nominal, ação no corpo/botão.
5. **[PROPOSTO] Empty State convida, não culpa.** Norma: EmptyState + CTA. O usuário nunca é responsável pela ausência de dado ("Nenhum lead ainda" + "Comece prospectando" — padrão a formalizar; hoje `EmptyState` existe como componente, copy varia por tela — NÃO auditada exaustivamente).
6. **[PROPOSTO] Stale é honesto sobre o tempo.** Norma P3: timestamp de sync visível. Copy deve indicar *quando* o dado foi atualizado ("Sincronizado há 12 min"), nunca sugerir tempo real falso.
7. **[PROPOSTO] Loading descreve o que está carregando quando >1s.** Skeleton já é o padrão visual; copy auxiliar deve nomear o recurso ("Carregando módulos da organização…" — `setup.loadingModules` é o exemplo canônico).
8. **[PROPOSTO] Terminologia de produto fixa:** usar os nomes reais dos módulos (Hub Comercial, Mesa de Tratamento, Lead Approval Deck) e da jornada (deal/oportunidade, handoff, cadência, forecast). Não traduzir para sinônimos genéricos ("oportunidade" vs "negócio" vs "deal" — escolher um por contexto; o catálogo usa "deal"/"oportunidade" intercalados — **padronização pendente** [PROPOSTO]).
9. **[PROPOSTO] Sem exclamação em estado de erro ou bloqueio.** Exclamação só em celebração genuína (War Room de deal WON — J11).
10. **[CONFIRMADO] Números e moeda com formato brasileiro.** Jornadas citam "R$ 18.500/mês", "R$ 1.500.000"; KPIs monetários usam IBM Plex Mono (`_FATOS-CANONICOS.md` §5). Formatar `pt-BR` (milhar ".", decimal ",").

## 4. i18n — estado real

**Evidência — `src/i18n/index.tsx` (~60 strings, pt-BR + en-US):**

Namespaces e exemplos reais:

```
common.back / continue / dismiss / open / retry / saveAndOpenDashboard /
        saving / tryAgain
setup.welcomeTitle      → "Bem-vindo(a) ao Birth Hub 360"
setup.welcomeSubtitle   → "Configure os módulos que sua organização vai utilizar."
setup.loadingModules    → "Carregando módulos da organização..."
setup.loadErrorTitle    → "Não foi possível carregar os módulos"
setup.confirmTitle      → "Confirmar configuração"
setup.confirmDescription→ "Você selecionou {{count}} módulo(s). A configuração só é
                           gravada quando você confirmar abaixo; depois, poderá
                           alterá-la na aba de Administração."
setup.requiredModule    → "Módulo Base Obrigatório"
setup.saveErrorTitle    → "Configuração não foi salva"
firstSteps.title        → "Primeiros passos"
firstSteps.progress     → "{{completed}} de {{total}} concluídos"
firstSteps.step.*       → pares title/description por papel
                          (workspace, crm, settings, forecast, team,
                           moduleAccess, prospect, activities, mesa, dashboard, reports)
```

**Observações verificáveis:**

- Strings de `firstSteps` são **contextuais por papel** — ex.: `'firstSteps.step.mesa.title': 'Abra a mesa de tratamento'` vs `'firstSteps.step.dashboard.title': 'Acompanhe o dashboard'` — o checklist se adapta ao perfil (coerente com `WorkspaceHome` por JobRole).
- Copy de erro de setup já segue a regra causa+ação: `'setup.saveErrorTitle': 'Configuração não foi salva'` + `'common.tryAgain': 'Tentar salvar novamente'`.
- **Lacuna:** ~60 strings cobrem onboarding/setup/checklist/comuns; todo o resto da UI (rotas, erros de API, empty states de módulos) é pt-BR hardcoded — **não há glossário i18n de produto**.

## 5. Padrões de estados (síntese por tipo)

Norma: `DESIGN.md` cap.5 + `PRODUCT.md` imperativo 4 + `<OperationalStateContainer>`; componentes `Skeleton`, `EmptyState`, `ErrorBoundary`, `Toaster`, `ConfirmDialog`, `OfflineBanner`, `SyncIndicator` (`src/components/ui/`, `src/components/layout/`).

| Estado | O que a copy deve fazer | Evidência/exemplo |
|---|---|---|
| **Loading** | Nomear o que carrega; skeleton para estrutura; nunca spinner mudo em tela inteira | `setup.loadingModules`; `PageFallback` no Suspense global |
| **Empty** | Distinguir "nunca houve dado" de "filtro zerou resultado"; sempre com CTA de próximo passo; nunca mock | `EmptyState` component; regra "Zero Mock" (`PRODUCT.md`) |
| **Error** | Causa em linguagem de usuário + ação de retry/contato; nunca código cru de API para o usuário | `setup.loadErrorTitle`; `common.retry`; `ErrorBoundary` global em `/app/*` (`App.tsx:176`) |
| **Stale** | Exibir timestamp de última sync; indicar que ação pode estar desatualizada | `SyncIndicator`, `OfflineBanner` (shell); norma timestamp (P3) |
| **Offline** | Informar modo offline + o que funciona/está pendente de sync | `OfflineBanner`, `SyncIndicator`; J18 |
| **Blocked/Gated** | Explicar *por que* sem expor dados; sugerir quem libera | `RequireRole`/`RequireModuleAccess` existem; copy das telas de bloqueio NÃO auditada |
| **Confirm-destructive** | `ConfirmDialog` para ações irreversíveis (ex.: "Transferir Carteira em Lote" J20, revogação de acesso) | `ConfirmDialog` em ui; jornadas J02/J20 exigem confirmação |

## 6. Proibições e anti-padrões

**Canônicos:**

- **"sparkles" / "AI-powered" genérico** — proibido pela voz da marca (`_FATOS-CANONICOS.md` §2; BrandConstitution §5). IA se comunica por insight/confiança/raciocínio.
- **Exagero promocional** — BrandConstitution §5.
- **Mock/fake data** — "Proibido inventar dados" (`PRODUCT.md`).
- ** antropomorfismo decorativo** — bots/personagens existem como sistema (29 SVGs), mas a voz do produto é de sistema operacional, não de robô companheiro [interpretação: personas/agentes aparecem como *entidades do sistema* com justificativas, não como mascotes conversacionais].

**Derivados de débitos reais (`.agents/runs/audit-2026-11-18/ux-completude.md`):**

- Erro de API apresentado como empty state — proibido pela norma P3.
- Score heurístico apresentado como "avaliação" — copy deve refletir a natureza real do número (explicável, não oracular).
- KPI `null` renderizado como "R$ 0" — copy/número não pode afirmar zero quando o dado é ausência.
- Botão morto (Playbooks) — todo CTA precisa de destino real.
- Copy de settings que não persiste — não prometer o que o sistema não grava.

**[PROPOSTO] Glossário de produto** — padronizar: deal/oportunidade, handoff, cadência, forecast, pipeline ponderado, mesa de tratamento, dossiê Account 360, Lead Approval Deck. Hoje os documentos misturam "deal" e "oportunidade"; recomenda-se glossário oficial em `08-GUIAS-DE-IMPLEMENTACAO/` ou `09-PLANO-DE-EVOLUCAO/`.

## 7. Exemplos canônicos de microcopy (verbatim do código)

| Contexto | String real | Fonte |
|---|---|---|
| Boas-vindas setup | "Bem-vindo(a) ao Birth Hub 360" | `i18n/index.tsx` |
| Subtítulo setup | "Configure os módulos que sua organização vai utilizar." | `i18n/index.tsx` |
| Loading | "Carregando módulos da organização..." | `i18n/index.tsx` |
| Erro de carga | "Não foi possível carregar os módulos" | `i18n/index.tsx` |
| Erro de save | "Configuração não foi salva" + "Tentar salvar novamente" | `i18n/index.tsx` |
| Confirmação | "Confirmar configuração" / "Você selecionou {{count}} módulo(s)…" | `i18n/index.tsx` |
| Checklist | "Primeiros passos" / "{{completed}} de {{total}} concluídos" | `i18n/index.tsx` |
| Passo CRM | "Abra o pipeline comercial" — "Revise o funil, os negócios ativos e o próximo passo de cada oportunidade." | `i18n/index.tsx` |
| Passo mesa | "Abra a mesa de tratamento" — "Trabalhe a fila de leads e priorize o próximo atendimento comercial." | `i18n/index.tsx` |
| CTA genérico | "Salvar e ir para o Dashboard" | `i18n/index.tsx` |
| Alerta IA (spec) | "Atenção: Seu interlocutor saiu da empresa. Recomenda-se acionar o Diretor Financeiro imediatamente via telefone" | J15 |
| Bloqueio Supervisor (spec) | "Ação Suspensa: Esta empresa pertence ao Grupo Econômico X…" | J16 |

## 8. Lacunas

- **NÃO auditado:** copy real das telas de erro/empty/stale por módulo (hardcoded pt-BR, fora do i18n) — exige varredura por feature; registrar como tarefa para `06-EXPERIENCIA/` ou auditoria de UX.
- **NÃO VERIFICADO:** existência de glossário/estilo de escrita formal além de BrandConstitution §5.
- **Pendência:** padronização deal/oportunidade e demais termos de produto.

---
*Documento gerado na missão Brand System 03-PRODUTO. Evidências consolidadas em `../_FATOS-CANONICOS.md`.*
