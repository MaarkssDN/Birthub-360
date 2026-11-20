# Posicionamento — Birth Hub 360°

**Propósito:** definir categoria, proposta de valor, diferenciação e percepção desejada.
**Estado:** CONFIRMADO (posicionamento fixado pelo usuário em 2026-11-13) + elementos PROPOSTOS sinalizados.
**Data:** 2026-11-19 · **Fontes:** `identidade-visual/v2/FONTE-DE-VERDADE.md` §2, `PRODUCT.md`, `docs/BrandConstitution.md`, `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv`, `BIRTH_HUB_360_BRAND_PRODUCT_MARKET_PLAYBOOK.html` (03_BRAND_KB).

---

## 1. Categoria

**Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence** (formulação oficial fixada — FONTE-DE-VERDADE §2).

Categoria adjacente declarada em PRODUCT.md: "Sistema Operacional de Revenue Intelligence" — o produto se posiciona **acima** do CRM tradicional: o CRM é um dos módulos, não o produto.

## 2. Proposta de valor

> Em uma frase: **o ciclo de receita completo — do primeiro sinal à forecast — operado por um sistema único onde a IA executa, não apenas sugere.**

Pilares da proposta (evidências em `PRODUCT.md` e catálogo de funcionalidades):

1. **Dados em movimento** — leads, empresas, contatos, atividades e sinais em tempo real, com event-sourcing append-only (`BIRTHUB360_MODELO_DADOS.md`).
2. **IA ativa** — enxame de agentes autônomos com Supervisor anti-conflito, copiloto, RAG e roteador de LLMs (`BIRTHUB360_DECISOES_PRODUTO.md`, jornadas J15–J16).
3. **Velocidade e foco** — mesa de tratamento, cadência multicanal, next-best-action, planos diários.
4. **Resiliência** — 4 estados obrigatórios em toda tela, offline-first mobile, RLS multi-tenant, LGPD by design.

## 3. Diferenciação

| Alternativa do mercado | O que o Birth Hub 360° faz diferente | Evidência |
|---|---|---|
| CRM tradicional (pipeline + cadastro) | Revenue Intelligence: scoring, forecast Monte Carlo, win/loss causal, market intelligence com ICP explicável | `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv`, jornadas J13–J14 |
| Ferramentas de IA pontuais (chatbots, copilotos) | Agentes com papéis, supervisão, HITL, telemetria de custo (Langfuse) e Memória | `BIRTHUB360_DECISOES_PRODUTO.md`, `.agents/skills/llm-*` |
| Sequenciadores de cadência | Cadência multicanal com opt-out, rate limit, orquestração com distribuição inteligente e mesa de tratamento | features `cadence`, `mesa-tratamento`, `sales-orchestration` |
| Telefonia/voip isolada | VoiceHub integrado: ligações, IA de voz, transcrição, handoff para closer | `src/lib/voice-hub/`, jornada J07–J08 |
| Prospecting tools (Apollo etc.) | Market intelligence própria: 7 fontes, CNPJ/OCR/QSA, Lead Approval Deck | `src/features/market-intelligence/` |

## 4. Percepção desejada

- **Para o usuário final (SDR/Closer/Gestor):** "central de comando" — tudo que preciso para vender está em um lugar, com a próxima melhor ação sempre visível.
- **Para a liderança:** previsibilidade — forecast calibrado, health score de deals, win/loss com causa raiz.
- **Emotional job:** confiança na decisão — "dar à inteligência uma forma em que se pode confiar" (BrandConstitution §1).

## 5. Mensagens-chave registradas

- "Sistema Operacional de Revenue Intelligence" (PRODUCT.md).
- "Central de Comando 360° do seu Ciclo de Receita" (MANUAL-MESTRE).
- "Integrando dados, potencializando decisões e acelerando a execução" (BrandConstitution).
- Nomenclatura comercial de capacidades na landing; nomes formais dos pilares no Manual de Produto (README de identidade-visual).

## 6. O que NÃO prometer

- Não se vender como "CRM" — a categoria é Revenue Intelligence / sistema operacional comercial.
- Não prometer "IA mágica": a comunicação de IA é por insight, confiança e raciocínio (BrandConstitution §5).
- Não usar métricas/claims sem fonte — zero mock em produção (PRODUCT.md restrição).

## 7. Pendências

- **[PENDENTE]** Aprovação formal da formulação V2 ("Inteligência Comercial... impulsionado por IA") como tagline oficial — hoje é nome de trabalho fixado pela FONTE-DE-VERDADE.
- **[PENDENTE]** Playbook comercial (`BIRTH_HUB_360_BRAND_PRODUCT_MARKET_PLAYBOOK.html`) contém estratégia de mercado mais ampla — cruzar com esta seção antes de peças externas.

**Relacionados:** `identidade-da-marca.md`, `personalidade.md`, `identidade-verbal.md`, `../03-PRODUTO/identidade-do-produto.md`.
