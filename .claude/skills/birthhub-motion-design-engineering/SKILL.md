---
name: birthhub-motion-design-engineering
description: Motion, microinterações, easing, duração, feedback e reduced motion.
---

REGRAS DO BIRTH HUB 360°:
- docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md é a autoridade visual máxima.
- Preserve a identidade existente quando o pedido for refinamento.
- Não invente dados, funcionalidades ou estados.
- Não faça refatorações não relacionadas.
- Não introduza efeitos apenas por tendência.
- Considere desktop, mobile, light mode e dark mode quando aplicável.
- Considere acessibilidade e reduced motion.
- Valide a interface renderizada, não apenas o código.

# Birth Hub 360° Motion Design Engineering

Motion deve comunicar estado, causalidade ou hierarquia.

Para cada animação defina propriedade, duração, easing, gatilho e estados inicial/final.
Evite bounce excessivo, animação contínua sem função e efeitos decorativos.
Respeite prefers-reduced-motion.
Priorize transform e opacity quando apropriado.
