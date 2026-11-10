# Constituição da Marca — Birth Hub 360º

Diretrizes institucionais, identidade visual, paleta, tipografia e princípios de
experiência da **Birth Hub 360º**.

> Este arquivo é o resumo em texto. A fonte de verdade operacional é
> **`identidade-visual/birthhub360/`** (logos vetoriais mestre, tokens em
> `tokens/birthhub360.{css,json,ts}` e as telas `BirthHub360_*.html`) e
> **`src/config/brand.ts`** (a mesma identidade em código).
> Em caso de divergência, valem aqueles.
>
> Substituiu a constituição da marca anterior (laranja `#FF5618`, Montserrat /
> Space Grotesk), aposentada em 09/2026.

---

## 1. Essência da Marca

- **Propósito:** dar à inteligência uma forma em que se pode confiar.
- **Posicionamento:** ecossistema inteligente e unificado que atua como central de
  comando 360º para negócios — conectando dados, IA, automações e processos, e
  transformando o que está disperso em direção clara.
- **Tagline:** _"Sua central de comando inteligente: integrando dados,
  potencializando decisões e acelerando a execução."_
- **Ideia central:** Dados → Decisões → Execução (conectar · potencializar · acelerar).
- **Valores:** Innovation · Data Intelligence · Efficiency · Scalability.
- **ICP:** qualquer empresa com área comercial que queira automatizar ponta a ponta.
- **Persona:** papéis mapeados da área comercial — SDR, closer, gestão.

---

## 2. Paleta Oficial de Cores

| Nome da Cor | Hex / Código | Token oficial | Significado / Uso Principal |
| :--- | :--- | :--- | :--- |
| **Azul Neon** | `#00D4FF` | `--palette-neon-blue` / `--color-neon-blue` | Tecnologia, confiança, inovação. Usado na cor padrão de títulos, bordas ativas e cards de destaque comercial. |
| **Rosa Neon** | `#FF2D9B` | `--palette-neon-pink` / `--color-neon-pink` | Energia, criatividade, atitude. Usado em destaques, tags, inteligência de mercado e gradientes de botões. |
| **Dourado Neon** | `#FFC107` | `--palette-neon-gold` / `--color-neon-gold` | Sofisticação, prosperidade, previsibilidade e métricas. |
| **Preto Neon (Fundo)** | `#0D0D0D` | `--palette-neon-black` / `--color-neon-black` | Fundo principal da página (Dark Mode), gerando alto contraste com as cores neon. |
| **Branco Neon** | `#F8F9FF` | `--palette-neon-white` | Branco institucional do wordmark e de arte sobre fundos escuros. **Não** é a cor de texto corrido — ver "Azul Leitura" abaixo. |
| **Azul Leitura (texto)** | `#70D6FF` | `--ink` / `--color-neon-text` *(em `src/styles/globals.css`)* | Cor de texto corrido **efetiva** no app hoje (corpo, subtítulos, leitura sobre fundo escuro). Divergência pendente: o token canônico `--color-text-primary` em `identidade-visual/birthhub360/tokens/birthhub360.css` ainda vale `#F8F9FF` — reconciliação rastreada no handoff `11-para-03-*`. |
| **Fundo de Cards** | `#14141A` | `--palette-neon-card` / `--color-neon-card` / `--color-surface` | Superfícies e cartões de conteúdo. |
| **Bordas Glow** | `rgba(0, 212, 255, 0.22)` | `--palette-border` / `--color-neon-border` / `--color-border` | Bordas com efeito neon sutil. |

### Variações e Gradientes Principais

- **Gradiente de Títulos:** `--grad-brand` = `linear-gradient(135deg, #00D4FF 0%, #FF2D9B 50%, #FFC107 100%)`
- **Gradiente de Ação / Botões (CTA):** `--grad-cta` = `linear-gradient(135deg, #FF2D9B 0%, #00D4FF 100%)`
- **Tons Light complementares:** Rosa claro (`#D91B7C`), Azul claro (`#0284C7`) e Dourado/Âmbar (`#D97706`) — usados no tema claro para manter contraste sobre superfícies brancas.

> **Regra Mandatória do Design:** Há uma regra estrita no projeto onde todos os títulos (`h1` ao `h6`) devem usar as cores neon (`#00D4FF`, `#FF2D9B` ou `#FFC107`) ou gradientes, **nunca branco ou preto**.

---

## 3. Tipografia

Tipografia oficial exclusiva (self-hosted em `public/fonts/`, com suporte
offline no Android via Capacitor):

- **Display / Títulos, Heros e Ações:** **Sora**
  - Variável `100–800`; token `--font-display` / `--font-brand-display`.
- **Interface / Corpo, menus, formulários e tabelas:** **Inter**
  - Variável `400–800`, com toque arredondado (`--font-features-rounded`);
    token `--font-interface` / `--font-brand-sans`.
- **Monoespaçada / Dados, código, KPIs e badges técnicos:** **IBM Plex Mono**
  - Pesos `400`, `500`, `600`, `700`; token `--font-data` / `--font-brand-mono`.
  - **Uso:** Badges técnicos, contadores, tags numéricas e pilares do sistema.

> Nota de divergência conhecida: `src/styles/official-identity.css` ainda
> declara pilhas `--font-brand-sans`/`--font-brand-display` com "Plus Jakarta
> Sans"/"Outfit"/"Nunito" (carregadas via Google Fonts em `globals.css`),
> enquanto os tokens canônicos e os `@font-face` self-hosted são
> Sora/Inter/IBM Plex Mono. Alinhamento em código é responsabilidade do
> Agente 03 — ver handoff `.agents/handoffs/` (onda-saneamento-20261110).

---

## 4. Logotipo e Grafismos

O emblema concentra a tese da marca em um traço: um **B** de leitura geométrica
como núcleo, cercado por um **anel dourado** e por uma **órbita cromática 360º**.

| Elemento     | Significado                              |
| ------------ | ---------------------------------------- |
| B geométrico | Núcleo proprietário e memorável.         |
| Anel dourado | Precisão, valor e confiança.             |
| Órbita 360º  | Conexão, movimento e continuidade.       |
| Azul + roxo  | Tecnologia, inteligência e profundidade. |

Arquivos-mestre em `identidade-visual/birthhub360/logos/` (símbolo, ícone reduzido
e assinatura horizontal). Área de proteção: `X` = 1/4 do raio externo, livre em
todo o perímetro. Mínimos: 32 px ícone/favicon, 96 px símbolo completo.

**Não faça:** distorcer proporções · girar o símbolo · trocar as cores do anel ·
adicionar sombras externas aleatórias · inserir texto dentro da órbita · usar
sobre fundos sem contraste.

---

## 5. Voz da Marca

Profissional · Tecnológica · Direta · Empowering.

A voz acompanha o produto: reduz complexidade, revela contexto e orienta a próxima
ação — sem exagero promocional, sempre orientada a inteligência, decisão e execução.

---

## 6. Diretrizes para Agentes de IA e Desenvolvedores

- Estética: modular e estruturada, clean data minimalist, sofisticada e premium,
  moderna e high-tech. Nada é decorativo.
- Use **tokens**, não hex cru (`bg-brand`, `text-ink`, `border-line`). Hex só onde
  não existe CSS — three.js, canvas, PDF, e-mail — e mesmo aí vindo de
  `BRAND.colors`.
- Para a paleta neon, use as utilitários do `@theme` do Tailwind v4:
  `neon-blue` (`#00D4FF`), `neon-pink` (`#FF2D9B`), `neon-gold` (`#FFC107`),
  `neon-black` (`#0D0D0D`), `neon-card` (`#14141A`), `neon-border`
  (`rgba(0,212,255,0.22)`) e os tons light `light-pink`/`light-blue`/
  `light-gold`. Os equivalentes canônicos vivem em
  `identidade-visual/birthhub360/tokens/` (`--palette-neon-*`,
  `--color-text-primary`, `--color-surface`, `--color-border`) e em
  `src/config/brand.ts` (`BRAND.colors`).
- Imagens devem parecer capturadas de dentro do próprio sistema: composições
  limpas, fundos escuros, luz pontual dourada, órbitas azul/roxo. Nada de banco de
  imagens genérico.
- Antes de criar token, variante ou padrão visual novo, leia
  `.claude/CLAUDE.md` e a skill `design-system`.
