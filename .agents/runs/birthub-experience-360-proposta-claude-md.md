# PROPOSTA DE DIFF — `.claude/CLAUDE.md` (arquivo protegido; NÃO APLICADA)
Autor: Agente 00 · Data: 2026-11-19 · Decisão humana de origem: ratificação do DL v2.0 como autoridade visual (DS-001).
Status: AGUARDA APROVAÇÃO EXPLÍCITA DO ORQUESTRADOR HUMANO. Nada foi editado em `.claude/CLAUDE.md`.

## Evidência de obsolescência (VERIFICADO NO CÓDIGO)
- `src/styles/globals.css`: `--brand:#00d4ff`, `--on-brand:#041c32`, `--iris:#8b5cf6`, `--orbit-blue:#00d4ff`; dark `--bg:#0d0d0d`; light `--bg:#f0efe9`. Nenhum `#D4AF37`.
- `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` v2.0 é a autoridade ratificada. Fontes: Sora (display) + Inter — compatível com §1 do CLAUDE.md; só a PALETA e as regras de gradiente divergem.

## Alterações propostas
1. **§1, bullet "Marca única, paleta…"** (linhas ~21-33): substituir "Strategic Command Center / Antique Gold / Deep Iris / Deep Navy / Blossom White" por: "Paleta neon do Design Language v2.0 — Azul Neon `#00D4FF`, Rosa Neon `#FF2D9B`, Dourado Neon `#FFC107` sobre `#0d0d0d` (dark) e `#f0efe9` (light); fonte da verdade: `src/styles/globals.css` + `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`". Remover a frase "Ouro é uma cor CLARA… 2.10:1". Manter a regra de par de contraste `bg-brand` ⇒ `text-on-brand` (`#041c32`).
2. **§2 item 1:** trocar "Neutros ancorados em Obsidian/Snow White" por "neutros do DL v2.0"; **item 2** (`identidade-visual/`): manter a ressalva de que NÃO está sincronizada.
3. **§4 regra 3 (gradiente):** substituir por: "Gradiente em título só nos casos previstos no DL v2.0 §2 (`Gradiente de Títulos` e `Gradiente de Ação (CTA)`), nunca em corpo de texto, nunca como fundo de superfície com texto, nunca decorativo arbitrário. Fora desses casos, gradiente continua proibido. O gradiente 'órbita 5 cores' deixa de ser referência (verificar se `.bg-gradient-orbit5` ainda existe antes de citar)."
4. **§7 item 5 (contraste):** reescrever sem Antique Gold; manter "branco sobre marca sólida nunca" e `text-on-brand`.
5. **§1/§13:** remover referência à paleta ouro/íris/vermelho/rosa de 09/2026 e ao item "identidade ANTERIOR (Obsidian/Snow White)".

## Risco acompanhante a decidir junto (A11Y-001, P1 — ver relatório)
A "Regra Mandatória" do DL (títulos h1–h6 sempre neon) usa, no **tema claro**, cores com contraste insuficiente sobre `#f0efe9` (valores calculados do spec): azul `#0284C7` 3,55:1; rosa `#E6007A` 3,92:1; dourado `#D97706` 2,77:1 (falha até texto grande 3:1). Texto de títulos h4–h6 exige 4,5:1. Dark mode passa (≥5,65:1). Recomenda-se que a proposta do CLAUDE.md inclua: "no tema claro, títulos usam variantes escurecidas que atinjam AA (a definir por 03/Agente 11)". Decisão de design reservada ao humano.
