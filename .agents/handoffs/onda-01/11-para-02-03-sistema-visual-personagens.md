De: 11 — Marca e Ativos Institucionais
Para: 02 — Produto e UX & 03 — Design e Acessibilidade
Onda: Onda 01
Status: aberto
Prioridade: alto
Bloqueador-ref: B-06 (Dados fictícios misturados com dados reais — mitigação de cenografia e avatares randômicos no cockpit; histórico: referenciado originalmente como "Erradicação de cenografia visual de IA")
Sprint destino: Sprint Atual (Onda 01)

## Problema
O componente `src/components/ui/ModuleAgentWidget.tsx` utilizava avatares gerados aleatoriamente por serviço externo (DiceBear API), com traços genéricos de robôs que não pertencem à identidade de alta tecnologia e luxo neon da Birth Hub 360°. Além disso, os 9 personagens (Orbit, Nexus, Aria, Vanguard, Oracle, Core, Spark, Echo, Sudo) não possuíam ativos vetoriais locais nem especificações de estado (idle, listening, processing, speaking, success, error), dependendo de um timer de loop fictício.

## Arquivo(s) envolvido(s)
- `public/brand/characters/orbit.svg`
- `public/brand/characters/nexus.svg`
- `public/brand/characters/aria.svg`
- `public/brand/characters/vanguard.svg`
- `public/brand/characters/oracle.svg`
- `public/brand/characters/core.svg`
- `public/brand/characters/spark.svg`
- `public/brand/characters/echo.svg`
- `public/brand/characters/sudo.svg`
- `identidade-visual/birthhub360/tokens/characters.json`
- `identidade-visual/birthhub360/tokens/characters.css`
- `identidade-visual/birthhub360/tokens/characters.ts`
- `identidade-visual/GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`
- `identidade-visual/birthhub360/BirthHub360_Personagens.html`
- Destino de integração: `src/components/ui/ModuleAgentWidget.tsx` ou novo componente oficial em `src/components/intelligence/`

## Evidência
Os 9 avatares vetoriais originais foram criados e salvos localmente em `public/brand/characters/`, acompanhados de tokens de cores, halos, keyframes de microanimações, conformidade WCAG 2.2 AA para temas claro e escuro, e protótipo interativo funcional documentado em `identidade-visual/birthhub360/BirthHub360_Personagens.html`.

## Alteração necessária
1. O Agente 02 (UX) e o Agente 03 (Design) devem atualizar a UI do widget/cockpit de agentes para consumir os novos assets locais (`/brand/characters/*.svg`) em vez de chamar URLs externas do DiceBear (`api.dicebear.com`).
2. Vincular as classes CSS do `characters.css` (`bh-character-avatar[data-state="..."]`) ou variants equivalentes de Framer Motion com suporte a `prefers-reduced-motion`.
3. Aplicar os rótulos de acessibilidade padronizados (`aria-label`) e remover o timer mock de 2s, conectando aos eventos reais do streaming de IA (`/api/agent/swarm/stream`).

## Teste esperado
- Invocação visual dos avatares sem qualquer requisição de rede para domínios de terceiros.
- Comutação das 6 expressões (repouso, escuta, processamento, resposta, sucesso, erro) refletindo estados reais do pipeline de IA.
- Contraste validado em dark mode (`#14141A`) e light mode (`#FFFFFF`) superior a 4.5:1.
- Redução de movimento desativando keyframes contínuos sob `prefers-reduced-motion: reduce`.

## Contexto adicional
Esta entrega é resultado da solicitação do usuário e da governança da Onda 01 autorizada pelo Agente 00 no relatório de auditoria `.agents/runs/00-auditoria-ecossistema-agentes-personagens-20261107.md`. Todos os assets foram criados em conformidade com as restrições de propriedade de arquivo do Agente 11.

### Registro Histórico e Saneamento de Governança
- **Correção de Referência de Bloqueador (Agente 11):** A nomenclatura canônica de **B-06** estabelecida em `AGENTS.md` (Seção 22) é *"Dados fictícios misturados com dados reais"*. O registro original deste handoff utilizava *"Erradicação de cenografia visual de IA"*. A referência foi harmonizada com a governança global, preservando o histórico de auditoria intacto.
