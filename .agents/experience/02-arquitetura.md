# 02 — Arquitetura dos Especialistas de Experiência

**Data:** 2026-11-18 · **Decisão:** Estratégia C (híbrida) — confirmada em `01-diagnostico.md` §4.
**Regra soberana:** `/AGENTS.md` prevalece. Este documento especializa, não substitui.

## 1. Princípio

Nenhum especialista de experiência é um agente oficial novo. Todos são **perfis de missão** executados dentro do slot do agente proprietário, no mesmo padrão já homologado de `06A` (Extrações Bitrix) e `01A` (RLS/Retenção):

- mesmo slot de concorrência do proprietário;
- mesmo worktree/branch do proprietário (`agente/<nn>-<slug>`);
- prompts de perfil são propostas pendentes de aprovação humana (`.agents/experience/propostas/`);
- propriedade de arquivos permanece a do agente dono — o perfil **estreita o foco**, nunca amplia a propriedade.

## 2. Roster de perfis

### Domínio Agente 02 — Product Experience (4 perfis propostos)

| Perfil | Especialidade | Escopo de missão |
|---|---|---|
| **02-UXR** | UX Research & Usability | Auditar fricções, clareza, carga cognitiva, feedback/affordances, mensagens de estado; planejar testes de usabilidade. **Não inventar pesquisas com usuários** — toda conclusão cita evidência de código/tela ou é marcada como hipótese. |
| **02-CJ** | Customer Journey & Product Flows | Mapear jornadas ponta a ponta (onboarding, CRM, integrações, automações); identificar etapas desnecessárias e fricção operacional; propor fluxos sem alterar regra de negócio. |
| **02-IA** | Information Architecture | Hierarquia de informação, menus, agrupamento, consistência rota↔página, descoberta de funcionalidades, breadcrumbs, organização de dashboards. |
| **02-CRO** | Landing Pages & Conversion Experience | Auditar landing pages, proposta de valor, CTAs, formulários, fluxos de demo/cadastro/contato, consistência comunicação↔comportamento. **Não inventar métricas nem afirmar ganhos de conversão não medidos.** |

### Domínio Agente 03 — Design Engineering (enxame existente 03A–03G)

Mapeamento dos perfis da missão para o enxame já homologado — **nenhum prompt novo necessário**:

| Perfil da missão | Equivalente oficial | Observação |
|---|---|---|
| 03-UI | 03B (arquitetura UI/UX) + direção 03A | Visual design de telas e estados |
| 03-DS | 03C (engenheiro design system) | Tokens, componentes, contratos visuais |
| 03-FE | 03B/03C na camada compartilhada; ajustes em `src/features/*` somente coordenados com o dono do módulo | Fronteira explícita abaixo |
| 03-A11Y | 03E (auditor WCAG 2.2 AA) + `tests/e2e/accessibility.spec.ts` (dono: 08) | Execução e2e de a11y é handoff para 08 |
| 03-MOTION | 03D (engenheiro motion) + `src/lib/motion.ts` | Reduced-motion obrigatório |
| — | 03A (diretor do enxame), 03F (QA visual), 03G (Impeccable anti-slop) | Infraestrutura de orquestração, inspeção renderizada e refinamento já existentes |

## 3. Matriz de propriedade (Fase 4)

### Donos oficiais (inalterados)

| Caminho / tipo de alteração | Dono |
|---|---|
| `src/App.tsx`, navegação principal, `Sidebar`, registro de rotas, shell | **Agente 02** |
| `src/components/layout/**` | Agente 02 (ver `layout/AGENTS.md`) |
| `src/components/ui/**`, `src/styles/**` | Agente 03 (ver AGENTS.md locais) |
| `identidade-visual/**`, `documentacao-aplicacao/**` | Agente 11 (§15) |
| `public/brand/**` e demais ativos de marca em `public/` | Agente 11 (prompt 11; não consta literalmente do §15 — ver P-03) |
| `android/**`, `capacitor.config.ts` | Agente 09 |
| `tests/**` | Agente 08 |
| `.github/workflows/**`, `Dockerfile`, `docker-compose.yml` raiz | Agente 08 |
| `charts/**`, `infrastructure/**` | Agente 10 |
| `prisma/**` | Agente 01 |
| `src/features/<modulo>/**` | dono do módulo conforme `src/features/<modulo>/AGENTS.md` |
| `.agents/prompts/**`, `AGENTS.md` raiz | **decisão humana** |
| `.agents/runs/**` | Agente 00 |
| `.agents/reviews/**` | Agente 24 ou 00 |
| `.agents/handoffs/**` | cada agente cria os próprios |
| `.agents/experience/**` | Agente 00 (este pacote) |

### Escopo por perfil

| Perfil | Pode alterar | Somente leitura / análise | Handoffs obrigatórios |
|---|---|---|---|
| 02-UXR | nada em produto — entrega é relatório de auditoria + propostas | `src/**` inteiro | achado corrigível no escopo do 02 → executa ou registra; fora do escopo → handoff ao dono do arquivo |
| 02-CJ | `src/App.tsx`, `src/components/layout/**`, `src/features/onboarding/**`, `src/features/dashboard/**`, `src/features/settings/**` (escopo do prompt 02) | demais `src/features/*` | mudança em feature de outro domínio → handoff; contrato de dados → 01/18 |
| 02-IA | `src/App.tsx`, navegação, `src/components/layout/**` (moduleRegistry, breadcrumbs, moduleNav) | páginas de features | reorganização de menu que exija nova rota → executa (é dono); metadata de módulo de outro domínio → handoff |
| 02-CRO | `src/features/landing/**` (proposta de propriedade — ver pendências), páginas públicas auth se autorizadas. **Exceção:** `/landing-new`→`LandingInnovative` vive em `src/features/voice-hub/` (Agente 12) — auditoria sim, alteração só via handoff | componentes compartilhados; `src/features/voice-hub/**` | camada visual compartilhada (`ui/`, `styles/`) → 03; ativos de marca → 11; captura de lead → contrato com backend (01/18/06); landing do voice-hub → 12 |
| 03B/03C/03D (enxame) | `src/components/ui/**`, `src/styles/**`, `src/lib/motion.ts`, layouts de `src/pages/**` e features **mediante coordenação com o dono do módulo** | regras de negócio, API, auth | dono da feature afetada |
| 03E | atributos semânticos/a11y em `src/**` sem alterar lógica | lógica de negócio | mudança estrutural → dono do arquivo |
| 03F | nenhum (inspeção) — relatórios e evidências | tudo | achado visual → 03B/03C ou dono do arquivo |
| 03G | refinamento visual assistido por Impeccable em escopo autorizado | Landing/Login (proibido alterar) | — |

### Propriedade proposta (pendente de aprovação humana)

- `src/features/landing/**` → **Agente 02** (perfil 02-D para conversão; 03 apenas via handoff para camada visual). Hoje não existe `AGENTS.md` local — criar um é parte da proposta. **Exceção:** `/landing-new` → `LandingInnovative` permanece do Agente 12 (`src/features/voice-hub/**`) salvo decisão humana em contrário.
- `landing/` (raiz) e `landing-page.html` → mesma proposta; canonizar qual superfície é a oficial antes de qualquer reforma.

## 4. Regras de execução

1. **Slot único:** perfis do mesmo agente nunca rodam em paralelo no mesmo worktree. 02-UXR, 02-CJ, 02-IA e 02-CRO ocupam o slot do Agente 02.
2. **Paralelismo entre agentes:** um perfil do 02 pode rodar em paralelo com um perfil do 03 (ex.: 02-CJ mapeando jornada enquanto 03C consolida tokens) **somente se** as propriedades de arquivo forem disjuntas e o 00 publicar a matriz da onda. Condições de §13 do AGENTS.md aplicam-se integralmente.
3. **Worktree por especialista:** cada execução de perfil usa branch `agente/<nn>-<slug>` a partir da branch de integração da onda, em worktree próprio quando o ambiente suportar.
4. **Perfis de auditoria (UXR, CRO, 03F) são read-only em produto por padrão** — só produzem relatório, achados e propostas. Correções exigem missão de implementação separada ou autorização explícita no briefing.
5. **Handoffs** seguem o formato de §18 do AGENTS.md em `.agents/handoffs/onda-<n>/`, nomeados `<de>-para-<para>-<slug>.md`. Achados de auditoria UX usam IDs do protocolo (`03-protocolo-auditoria-uxui.md`) e referenciam `DEBT-*` quando já catalogados.
6. **Revisão independente:** toda entrega de perfil passa pelo Agente 24 antes de integrar (§40). O autor nunca aprova a própria entrega.
7. **Gate:** `npx tsc --noEmit` + `npm run lint` + testes da área; scripts verificados em `package.json` antes de executar (§29). Regressão visual: `npm run test:visual` existe e `visual.spec.ts` está **ativo** desde `dff5677d8`, mas 11 snapshots divergem (DEBT-0041/#201) e `tests/AGENTS.md` §6 está desatualizado — tratar como verificável com baseline a reconciliar, handoff documental ao Agente 08.

## 5. Protocolo de delegação do Coordenador (00)

```
1. Identificar necessidade de experiência na onda (auditoria, jornada, navegação, visual).
2. Escolher o perfil em 02-arquitetura.md §2.
3. Escrever missão com 04-templates-missao.md: agente, onda, base, branch,
   escopo do perfil, propriedade, fora-de-escopo, critérios verificáveis.
4. Publicar matriz de propriedade se >3 especialistas simultâneos (§13).
5. Agente executa em worktree próprio → gate local → relatório em .agents/runs/.
6. Handoffs para outros donos conforme matriz §3.
7. 00 aciona Agente 24 → parecer APROVADO na revisão exata → integração em levas.
8. Registrar aprendizado reutilizável em .agents/experience/ ou handoff.
```

## 6. Condições de paralelismo — resumo operacional

| Combinação | Paralelo? | Condição |
|---|---|---|
| 02-* entre si | Não | mesmo slot |
| 02-* com 03A–03G | Sim, com cautela | propriedades disjuntas + matriz publicada |
| 03A–03G entre si | Sequencial por padrão | 03A orquestra pipeline; execuções paralelas só com escopo disjunto aprovado pelo 00 |
| Qualquer perfil UX com 01/04/05/06/etc. | Sim | disjunto; handoffs de contrato quando houver dependência |
| Perfis UX durante freeze | Sim | somente correção/auditoria/homologação — proibido feature nova fora das promessas (§23) |
