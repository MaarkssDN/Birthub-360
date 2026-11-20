# Identidade Verbal — Birth Hub 360°

**Propósito:** definir naming, tom de voz, terminologia e princípios de escrita.
**Estado:** PARCIALMENTE CONFIRMADO — voz e princípios documentados; glossário completo de termos é PROPOSTO.
**Data:** 2026-11-19 · **Fontes:** `docs/BrandConstitution.md` §5, `PRODUCT.md`, `DESIGN.md`, `BIRTHUB360_JORNADAS_OPERACIONAIS.md`, `src/i18n/index.tsx`, `MANUAL-DE-IDENTIDADE-DO-PRODUTO.html`.

---

## 1. Tom de voz oficial

Três adjetivos fixados em `docs/BrandConstitution.md` §5:

- **Profissional** — linguagem de quem opera uma empresa, não de quem vende software.
- **Tecnológica** — precisa, mas sem jargão gratuito; termos técnicos quando necessários são explicados pelo contexto.
- **Direta** — frases curtas, verbo primeiro, sem rodeios promocionais.
- **Empowering** — a interface e a comunicação colocam o usuário no controle ("potencializando decisões").

Complemento do Manual de Produto/BrandConstitution: a comunicação **reduz complexidade, revela contexto e orienta a próxima ação**.

## 2. Naming

| Elemento | Forma correta | Proibido |
|---|---|---|
| Produto/marca | `Birth Hub 360°` (trabalho; grafia final PENDENTE) | "BirthHub", "Birthub360", "360 Hub", "Birth CRM" |
| Módulos | nomes formais dos pilares (Manual de Produto) — ex.: Revenue Intelligence, Orquestração, Copiloto IA | nomes comerciais soltos da landing como se fossem módulos |
| Personagens | nomes próprios (Orbit, Nexus, Aria…) | tratá-los como "agentes de IA" genéricos na copy de marca |
| Números/métricas | formato brasileiro `R$ 1.482.000` em IBM Plex Mono | separadores ambíguos |

## 3. Terminologia de produto (glossário inicial — CONFIRMADO nas fontes)

| Termo | Significado |
|---|---|
| Hub Central | ponto de entrada do produto (fora da numeração de módulos) |
| Pilar | um dos 8 módulos principais P01–P08 |
| Workspace | área modular de trabalho dentro do app |
| Mesa de Tratamento | fila de leads que exigem ação humana |
| Lead Approval Deck | apresentação de aprovação de lead qualificado |
| Cadência | sequência multicanal de engajamento (com opt-out) |
| War Room | ambiente de fechamento/negociação assistida |
| Copiloto IA / Elite Agent | assistentes de IA do produto |
| Supervisor | agente que evita conflitos entre agentes autônomos |
| Health score | indicador de saúde de deal/oportunidade |
| Stale state | dados exibidos com timestamp da última sincronização |

**[PROPOSTO]** Este glossário deve crescer com um arquivo `glossario.md` mantido pelo Agente 11 a cada homologação de módulo novo.

## 4. Princípios de escrita (microcopy)

Derivados de DESIGN.md cap.5, jornadas e i18n existente:

1. **Empty state** explica: o que é, por que está vazio, o que fazer — sempre com CTA.
2. **Error state** dá a causa amigável + ação de retentativa — nunca "Algo deu errado" sozinho.
3. **Loading** informa progresso real (skeleton no formato do conteúdo).
4. **Stale** informa quando os dados foram sincronizados pela última vez.
5. **IA** comunica insight, confiança e raciocínio — nunca "sparkles", "magic", "AI-powered" como enfeite.
6. **Ações destrutivas** nomeiam a consequência ("Excluir lead" + confirmação com escopo).
7. **Permissões** explicam o bloqueio e o caminho de desbloqueio ("peça acesso ao gestor").
8. **Segunda pessoa** ("você") no onboarding e tutoriais — padrão já usado em `setup.*`/`firstSteps.*`.

## 5. i18n — estado real

- `src/i18n/index.tsx`: ~60 strings, pt-BR/en-US, cobrindo `setup.*`, `firstSteps.*`, `common.*`.
- **Não existe sistema i18n completo** — a maioria das strings de produto está hardcoded em pt-BR nos componentes. QUALQUER texto novo visível ao usuário deve, idealmente, passar por i18n ou seguir o padrão hardcoded pt-BR consistente — decisão de migração i18n é pendente (registrar em backlog).

## 6. Proibições de escrita

- Superlativos sem prova ("o melhor", "revolucionário").
- Jargão de startup ("game changer", "next-gen", "unleash").
- Clichês de IA ("magic", "sparkles", "supercharged").
- Promessas de resultado não verificáveis.
- Tom de "robô" ao falar da IA — ela é agente de trabalho com nome/personagem, não mascote fofo.

## 7. Exemplos (evidências)

- Onboarding `setup.*`: "Bem-vindo ao Birth Hub 360°", confirmação de módulos, erros de carga/save — tom direto, segunda pessoa.
- J15 alerta proativo: "Atenção: seu interlocutor saiu da empresa..." — factual, orientado à ação.
- J16 bloqueio do Supervisor: explicação do conflito entre agentes — transparência como padrão.

**Relacionados:** `identidade-da-marca.md`, `personalidade.md`, `../03-PRODUTO/ux-writing.md` (versão aplicada às telas), `../08-GUIAS-DE-IMPLEMENTACAO/marketing.md`.
