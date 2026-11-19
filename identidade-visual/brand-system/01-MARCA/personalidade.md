# Personalidade da Marca — Birth Hub 360°

**Propósito:** descrever atributos, expressão emocional e estilo de comunicação da marca.
**Estado:** PARCIALMENTE CONFIRMADO — atributos descritos nas fontes oficiais; taxonomia formal de arquétipos é PROPOSTA.
**Data:** 2026-11-19 · **Fontes:** `MANUAL-MESTRE-IDENTIDADE-VISUAL-BIRTH-HUB-360.md`, `docs/BrandConstitution.md`, `DESIGN.md`, `identidade-visual/v2/FONTE-DE-VERDADE.md`.

---

## 1. Atributos comprovados

| Atributo | Como se manifesta | Fonte |
|---|---|---|
| **Precisão** | dados tabulares em IBM Plex Mono; KPIs com R$; forecast calibrado; "Rigor Métrico" | MANUAL-MESTRE, DESIGN.md |
| **Confiança** | dark-first estável; superfícies neutras; acentos neon com função; estados de erro transparentes | DESIGN.md, BrandConstitution |
| **Velocidade** | transições 100–350ms; pageTransitionClean para mobile; próxima ação sempre visível | `src/lib/motion.ts`, jornadas |
| **Autoridade** | tipografia display Sora 800; hierarquia editorial; "Central de Comando" | MANUAL-MESTRE |
| **Inovação contida** | neon como acento, nunca como fundo de texto; íris `#8B7DFF` reservado à IA | FONTE-DE-VERDADE, official-identity.css |
| **Transparência** | causa raiz de erros visível; timestamp de sincronização; IA explica confiança/raciocínio | DESIGN.md cap.5, BrandConstitution §5 |

## 2. Expressão emocional

A marca transmite **controle sob complexidade**: o usuário está diante de um volume massivo de dados e decisões, e a interface responde com ordem — densidade alta, hierarquia clara, zero ruído decorativo gratuito. O neon não decora: sinaliza (marca, energia de conversão, meta, IA).

Metáfora recorrente e oficial: **órbita/360°** — anel cônico `conic-gradient(#FFC107,#FF2D9B,#00D4FF,#FFC107)`, emblema orbital, "visão completa do ciclo". É o elemento gráfico de assinatura.

## 3. Tom de expressão visual

- **Dark como habitat natural:** o produto "nasce" no dark (`#0D0D0D`); light é modo adaptado com rampas AA — não um segundo produto.
- **Profundidade real:** superfícies empilhadas (`#0D0D0D` → `#14141A` → `#1C1C24` → `#252532`), sombras longas, glow como iluminação — não como enfeite.
- **Edição, não template:** composição editorial (kickers, hierarquia de título, descrições neutras) — ver `.bh-card`/`.bh-heading`/`data-accent`.

## 4. Estilo de comunicação

Ver `identidade-verbal.md` e `../03-PRODUTO/ux-writing.md`. Resumo: Profissional · Tecnológica · Direta · Empowering; frases curtas, verbo de ação, sem jargão de marketing, sem antropomorfizar a IA além do necessário.

## 5. O que a personalidade rejeita

- Estética "SaaS genérica" (roxo/azul flat, ilustrações de bonecos) — skill `birthhub-taste` proíbe explicitamente.
- Animação gratuita — motion só com propósito de estado.
- Gradiente em texto fora dos gradientes de assinatura.
- Glassmorphism sem propósito.
- 3 cards iguais como layout padrão.

## 6. Arquétipos — leitura analítica [PROPOSTO]

Combinação provável: **Sábio** (inteligência, dados, forecast) + **Governante** (controle, ordem, comando). Nenhuma fonte declara arquétipos formalmente; registrar como interpretação, não regra.

## 7. Personagem da marca

Os 29 personagens SVG (9 avatares-pilar + 20 agentes) personificam capacidades — sintéticos, não-humanos, cada um com paleta e nome próprio (Orbit, Nexus, Aria, Vanguard, Oracle, Core, Spark, Echo, Sudo + agentes). São a camada "humanizada" controlada da marca: bots que não fingem ser humanos. Ver `../02-IDENTIDADE-VISUAL/ilustracoes.md`.

**Relacionados:** `identidade-da-marca.md`, `posicionamento.md`, `identidade-verbal.md`, `../02-IDENTIDADE-VISUAL/identidade-visual.md`.
