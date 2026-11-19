# Parecer do Agente 24 — Revisão Independente da Auditoria UX-01…UX-11 (Onda WB-1)

- **Objeto auditado:** `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` + 8 handoffs em `.agents/handoffs/onda-WB1/`.
- **Autor da entrega:** Agente 02A — UX Research & Usability.
- **Missão:** `.agents/runs/00-missao-02a-auditoria-ux-01-11-20261118.md`.
- **Base declarada pelo executor:** `agente/03-estabilizacao-tokens-v2 @ a729ed80e` + WIP de outras frentes ignorado.
- **Base exigida pela missão:** `main`, branch `agente/02a-auditoria-ux-01-11`, worktree dedicado.
- **Data da revisão:** 2026-11-18.

## Arquivos auditados (hash da revisão exata)

| Arquivo | SHA-1 `git hash-object` |
|---|---|
| `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` | `9f06d79d37a311309e4499587ccee2602aaf1674` |
| `.agents/handoffs/onda-WB1/00-para-24-revisao-auditoria-ux.md` | `b94ba072767a184089ec2496f1dca40fbb2f0d33` |
| `.agents/handoffs/onda-WB1/02a-para-04-criacao-manual-lead-oportunidade.md` | `b4e7e9b38ffca76886b7752fdbb5ceb564d225cc` |
| `.agents/handoffs/onda-WB1/02a-para-04-funil-negocio-stages-hardcoded.md` | `da0777fbc980cd1cbc3f57b740f0f269f9986a75` |
| `.agents/handoffs/onda-WB1/02a-para-04-deadlink-lead-invalido.md` | `e13eca6cec03f3330e293ba846460e8559513ec6` |
| `.agents/handoffs/onda-WB1/02a-para-17-playbooks-botao-roteiros-morto.md` | `b2378e29105b2ef5fab2d995013abaaaa912948d` |
| `.agents/handoffs/onda-WB1/02a-para-17-selfdrivingcrm-orfao.md` | `7f2f51d0de8045a8d77260c07848a3df5611e427` |
| `.agents/handoffs/onda-WB1/02a-para-05-outbound-spa-codigo-morto.md` | `b50860a60f0b2762bd8297ca898e68744139f33a` |
| `.agents/handoffs/onda-WB1/02a-para-00-codigo-morto-auth-promptstudio-triagem.md` | `2ad117629790b73a7fed85b4bcb762e0af6fe12f` |

Qualquer alteração posterior nesses hashes invalida este parecer.

## Veredito

# REPROVADO

A entrega é transparente e a maior parte das evidências `arquivo:linha` é real, mas **não pode ser aceita como cumprimento da missão WB-1** porque a execução ocorreu fora da base/branch/worktree exigidas e essa divergência altera materialmente ao menos um status. Há também erros factuais de consumidor em UX-05/UX-06 e imprecisões de dono/dependência que precisam de correção antes de o plano ser usado para missões de implementação.

## Escopo exato desta revisão

Aprovação ou reprovação cobre **somente** o relatório de auditoria e os handoffs listados acima, como artefatos documentais de diagnóstico. Esta revisão **não** aprova correções de produto, não autoriza implementação dos handoffs e não valida o WIP de produto presente no working tree (`src/styles/globals.css`, `docker-compose*`, `AGENTS.md`, etc.), que pertence a outras frentes.

## Achados da revisão

### A-01 — Base/branch incorreta altera o status de UX-01 — BLOQUEADOR

A missão exige `Base: main`, `Branch: agente/02a-auditoria-ux-01-11` e worktree dedicado. O executor declara ter trabalhado em `agente/03-estabilizacao-tokens-v2 @ a729ed80e`, com artefatos `.agents/**` uncommitted.

Verificação independente:

- `git branch --show-current` → `agente/03-estabilizacao-tokens-v2`.
- `git status --short` → relatório e handoffs aparecem como `??` dentro de um working tree com muitos WIP/M/D de outras frentes.
- `git diff --name-only main...HEAD` nos caminhos auditados retorna, entre os arquivos de evidência, **somente** `src/components/ui/CommandPalette.tsx`.
- `git diff main...HEAD -- src/components/ui/CommandPalette.tsx` mostra que, na branch auditada, as ações `qa-opportunity` e `ctx-crm-create` foram removidas; **na `main` elas ainda existem**.

Consequência: na base exigida (`main`), UX-01 permanece **CONFIRMADO** — a palette ainda navega para `open-create` sem consumidor no `CrmBoard`. O status **PARCIAL** do relatório é válido apenas para a branch `agente/03-estabilizacao-tokens-v2`, não para a `main` pedida pela missão.

**Correção exigida:** reexecutar/revalidar a amostra no worktree/branch corretos sobre `main`, ou obter do Agente 00 uma emenda formal de escopo que declare a nova base e revalidar todos os status contra ela. Depois, o 00 decide o destino dos artefatos `.agents/**` (cherry-pick/commit).

### A-02 — UX-06: evidência "zero imports" é falsa; testes consomem o serviço — ALTO

O relatório afirma que `selfDrivingCrmService`/contrato "não têm nenhum consumidor — zero imports fora de `src/features/cadence/**`". Isso é falso fora de `src/**`:

- `tests/unit/cadence/selfDrivingCrm.service.test.ts:3` importa `selfDrivingCrmService` e usa `clear()` em `:21`.
- `tests/integration/onda03ComprehensiveFlow.integration.test.ts:3,25` importa e usa `selfDrivingCrmService`.
- `src/features/cadence/services/selfDrivingCrm.service.ts:489` faz `clear()` resetar `optOutRepo` para `new InMemoryOptOutRepository()`.

O status **REFUTADO** para o risco fail-open original é defensável porque o default do construtor é `prismaOptOutRepository` (`:36`) e não há consumidor de produção encontrado. Porém o residual "código órfão" está subestimado: o serviço é consumido por testes e o handoff `02a-para-17-selfdrivingcrm-orfao.md` não menciona `tests/**` nem o Agente 08. Remover serviço/contrato/barrel quebrará testes; manter também exige decisão sobre os testes.

**Correção exigida:** corrigir a evidência para "sem consumidor de produção; consumido por testes" e incluir no handoff a decisão/testes afetados e a coordenação com o Agente 08 quando houver remoção.

### A-03 — UX-05: "nenhum import externo" ignora consumidores em `tests/**` — ALTO

O relatório afirma que os auth components legados e a SPA outbound não têm imports fora da própria pasta. Em `src/**` isso é majoritariamente verdade para uso de produção, mas a afirmação não qualifica testes e os handoffs de remoção ficam incompletos:

- Auth: `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx:19` importa `NewLoginScreen` e renderiza o componente. Remover os auth components exige remover/atualizar esse teste.
- Outbound: `tests/unit/features/prospecting/outbound/tenantScope.test.ts:19-24`, `tests/unit/features/prospecting/services/leadSearch.service.test.ts:9` e `tests/unit/features/prospecting/outbound/labels.a11y.test.tsx:4-6` importam módulos de `src/features/prospecting/outbound/**`.

Os handoffs `02a-para-05-outbound-spa-codigo-morto.md` e `02a-para-00-codigo-morto-auth-promptstudio-triagem.md` não mencionam esses consumidores nem o Agente 08. O teste esperado (`tsc`/`build`/grep) também não cobre `vitest`.

**Correção exigida:** qualificar a evidência como "sem consumidor de produção" e mapear/remover ou preservar os testes afetados, com coordenação do Agente 08.

### A-04 — Donos e dependências precisam de correção — MÉDIO

1. **CommandPalette pertence ao Agente 03**, não ao 02: `src/components/ui/AGENTS.md` declara o Agente 03 como dono de `src/components/ui/**`. O relatório/plano atribui a paleta/fluxo ao 02 e o handoff UX-01 não deixa explícito que re-adicionar "Nova oportunidade" exige o 03. A coordenação 04+02+03 é mencionada, mas o plano §3 item 1 omite o 03 como dono do arquivo.
2. **`CrmBoard.tsx` não tem AGENTS.md local** em `src/components/` raiz (só `layout/` e `ui/` têm). A atribuição ao 04 é plausível pelo domínio CRM, mas o próprio histórico registra dúvida: `backlog-5/03-para-04-analytics-contraste-temas.md` diz "se confirmado que pertence ao 04". UX-01 reconhece compartilhamento; UX-10 envia handoff só ao 04 sem registrar a mesma ambiguidade.
3. **Gamification e sales-orchestration não têm AGENTS.md local.** O relatório infere 02 para gamification por handoff histórico `00-para-02-gamification-forecast-rbac`, mas esse handoff tratava de rotas/App.tsx/backend e está marcado RESOLVIDO; o prompt do 02 não inclui `src/features/gamification/**` no escopo principal. Para UX-03/UX-04, a decisão de dono deveria ser explicitamente escalada/registrada, não assumida.
4. **UX-10 — endpoint existe.** A ressalva "possível dependência de endpoint de pipelines por tenant inexistente" está resolvida no código: `src/features/crm360/routes/crm360.routes.ts:23` define `GET /pipelines` e `src/bootstrap/routes.ts:111` monta `crm360Routes` em `/api/crm`, logo `/api/crm/pipelines` existe e é tenant-scoped via `Crm360Controller.getPipelines` (`organizationId` em `:88`). O handoff deveria afirmar isso em vez de deixá-lo como possibilidade.

**Correção exigida:** corrigir donos nos handoffs/plano ou abrir handoff ao 00 para decisão formal quando a propriedade não estiver em AGENTS.md local; atualizar UX-10 com a evidência do endpoint existente.

### A-05 — Formato de achado do protocolo está incompleto — BAIXO

O relatório cumpre o objetivo operacional da missão (status + evidência + severidade + plano + handoffs), mas não adota integralmente o schema de achado do protocolo para os achados novos UX-N1…N3 e para cada re-verificação. Faltam campos como `Dimensão`, `Rota`, `Componente`, `Descrição`, `Impacto`, `Status` canônico e `Relacionado` por achado; a tabela resume parte deles e o plano separa correção/teste. Os handoffs estão no formato §18 e são rastreáveis, mas o relatório-fonte deveria deixar claro que está re-verificando IDs canônicos `UX-NN`/`DEBT-*` sem recriar schema completo.

**Correção exigida:** ou completar os campos obrigatórios para achados novos/alterados, ou declarar explicitamente que a tabela é um delta de re-verificação dos IDs canônicos e remeter ao schema fonte.

## Amostragem de evidências — resultado

Verifiquei diretamente no código os pontos centrais, especialmente as mudanças de status:

| Achado | Verificação independente | Resultado |
|---|---|---|
| UX-01 | Na branch auditada, `CommandPalette.tsx:307-309,324-325` confirma remoção do intent morto; `CrmBoard.tsx` não tem criação manual; `POST /api/leads` existe (`lead.routes.ts:48`) e `leadsDB.create` (`db.ts:127`). Na `main`, porém, as ações mortas ainda existem → status deveria ser CONFIRMADO. | **PARCIAL só na branch errada; CONFIRMADO na base exigida** |
| UX-02 | `PlaybooksHub.tsx:219-224` tem dois botões sem `onClick`; `/app/roteiros` existe via `AppLayout.tsx:484` e `tabMeta.ts:187`. | CONFIRMADO sustentado |
| UX-03 | `GamificationView.tsx:47-48` faz apenas `console.warn`; `:210-214` renderiza empty state genérico com `rankingData` default `:28-31`. | CONFIRMADO sustentado |
| UX-04 | `WarRoomArenaView.tsx` agora declara heurística/modo treino em `:116-118`, `:229`, `:265`, `:273-274`, `:497`, `:532`, `:648-649`; score é local/keywords `:120-193`. Critério original ("se sugere IA") não se aplica. | REFUTADO sustentado |
| UX-05 | Auth/outbound mortos em produção confirmados; `PromptStudio.tsx` não existe e resta comentário em `tabMeta.ts:71`. Porém "zero imports" ignora `tests/**` (ver A-03). | PARCIAL com ressalva factual |
| UX-06 | Default do construtor é `prismaOptOutRepository` (`selfDrivingCrm.service.ts:36`); `InMemory` aparece em `clear()` `:489`. Mas há consumidores em `tests/**` (ver A-02). | REFUTADO para o risco original; residual mal caracterizado |
| UX-07 | `SinglePageDashboard.tsx:82` usa `?? 0`; `:174-181` renderiza `R$ 0`; backend retorna `null` sem pipeline (`AnalyticsUseCases.ts:173`, `analytics.service.ts:185`). | CONFIRMADO sustentado; P2 razoável |
| UX-08 | `PillarSettingsPlaceholder.tsx:68-70` confirma 3 abas placeholder; `:341-343`, `:386-403`, `:263-274`, `:405-425` mitigam honestidade. | PARCIAL sustentado |
| UX-09 | `Settings.tsx:205,200-235` é somente leitura; `authClient.changePassword/updateUser` existem (`ChangePasswordGate.tsx:36,49`, `auth-client.ts`). | CONFIRMADO sustentado; P2 razoável |
| UX-10 | `CrmBoard.tsx:62-75` tem colunas de pilotos; `:81-89` só traduz rótulo; `:513-519` agrupa por `lead.status`; schema tem `CrmPipeline/Stage` (`schema.prisma:1536-1578`) e `Lead.pipelineStageId` (`:677-678`). Endpoint `/api/crm/pipelines` existe. | CONFIRMADO sustentado; dependência deve ser corrigida |
| UX-11 | `LeadDetailDrawer.tsx:184-186` captura qualquer erro, toast genérico e `onClose()`. | CONFIRMADO sustentado; P3 razoável |

## Severidades re-avaliadas

- **UX-07 P3→P2:** justificado — `null` e `0` real são indistinguíveis e o contrato documenta "—".
- **UX-09 P3→P2:** justificável — autoatendimento de senha/nome é fluxo básico de conta, mas permanece P2 (não bloqueia operação central).
- **UX-02/UX-03/UX-10 P2 e UX-11 P3:** coerentes com o protocolo.
- **UX-01 P1:** na `main` deveria permanecer CONFIRMADO/P1; na branch auditada, PARCIAL/P1 é internamente coerente.

## Handoffs

Os 7 handoffs de correção + 1 handoff de revisão estão no formato mínimo do AGENTS.md §18 e endereçam os itens corretos em alto nível. Porém:

- `02a-para-17-selfdrivingcrm-orfao.md` precisa incluir testes/Agente 08 e corrigir "zero imports".
- `02a-para-05-outbound-spa-codigo-morto.md` e `02a-para-00-codigo-morto-auth-promptstudio-triagem.md` precisam incluir testes/Agente 08.
- `02a-para-04-criacao-manual-lead-oportunidade.md` e o plano devem tratar `CommandPalette.tsx` como arquivo do Agente 03.
- `02a-para-04-funil-negocio-stages-hardcoded.md` deve registrar que `/api/crm/pipelines` existe e que `CrmBoard.tsx` pode exigir coordenação com 02/03 conforme decisão do 00.

## Comandos/verificações executados

- Leitura integral dos artefatos: missão, protocolo, relatório, achados fonte, 8 handoffs.
- `git status --short`, `git branch --show-current`, `git rev-parse --short HEAD`, `git log`, `git merge-base`.
- `git diff --name-only main...HEAD` e `git diff main...HEAD -- src/components/ui/CommandPalette.tsx`.
- `git hash-object` nos 9 artefatos auditados.
- `grep`/`read` nas evidências de todos os achados UX-01…UX-11 e nos AGENTS.md locais de `crm`, `dashboard`, `settings`, `cadence`, `prospecting`; confirmação de ausência de `AGENTS.md` em `gamification` e `sales-orchestration`.
- `grep` por consumidores de `selfDrivingCrm`, auth components e outbound em `src/**` e `tests/**`.

## Condições para nova submissão

1. Revalidar os 11 status contra `main` em worktree/branch corretos, ou registrar emenda formal do 00 alterando a base.
2. Corrigir as evidências de consumidores em UX-05 e UX-06 incluindo `tests/**`.
3. Corrigir donos/dependências: CommandPalette→03, ambiguidade de `CrmBoard`, dono de gamification/sales-orchestration sem AGENTS.md, endpoint `/api/crm/pipelines` existente.
4. Ajustar handoffs para incluir impacto em testes/Agente 08 quando houver remoção de código testado.
5. Opcional, mas recomendado: declarar no relatório que ele é um delta de re-verificação dos IDs canônicos, ou completar o schema de achado para achados novos.

---
*Auditor: Agente 24 · Data: 2026-11-18 · Revisão independente da entrega 02A/Onda WB-1.*
