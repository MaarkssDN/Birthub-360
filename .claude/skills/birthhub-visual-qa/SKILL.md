---
name: birthhub-visual-qa
description: Validação visual, screenshots, regressão, estados e consistência entre desktop/mobile/light/dark.
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

# Birth Hub 360° Visual QA

Trate a interface renderizada no navegador como fonte de verdade.

Fluxo:
1. executar aplicação;
2. capturar superfície;
3. testar desktop/mobile;
4. testar light/dark quando aplicável;
5. verificar overflow, clipping, alinhamento e densidade;
6. comparar com Design Language;
7. corrigir defeitos objetivos;
8. validar novamente.

Verifique console errors, loading, empty, error, disabled, hover, focus, modal, dropdown e tabelas.
