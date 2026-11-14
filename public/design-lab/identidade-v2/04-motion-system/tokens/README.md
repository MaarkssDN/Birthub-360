# Tokens de Motion — Birthub 360° V2.0 (RASCUNHO — NÃO HOMOLOGADO)

Arquivos: `motion.css` (CSS vars + níveis + reduzido), `motion.json` (estrutura completa),
`motion.contract.json` (id → valor, 46 ids, para cruzar com o Design System).
Cores: não definidas aqui; use `../../shared/core.css`.

Uso em HTML: `<html data-motion="operational">` (padrão) ou `data-motion="commercial"` em qualquer
contêiner. Para simular reduzido: `data-reduce="true"` (escopo por atributo). `prefers-reduced-motion`
é respeitado automaticamente.

## Orientações futuras para React / Framer Motion (NADA em `src/` foi alterado)
Mapeamento sugerido para `src/lib/motion.ts` (existente). Não aplicar sem decisão do 00/Agente 02.

| Token V2 | Equivalente atual em `src/lib/motion.ts` | Observação |
|---|---|---|
| ease.out `[.16,1,.3,1]` | `EASE_OUT_EXPO` | idêntico |
| ease.premium `[.22,1,.36,1]` | `EASE_PREMIUM` | idêntico |
| ease.standard `[.4,0,.2,1]` | `EASE_IN_OUT_SMOOTH` | idêntico |
| ease.spring `[.34,1.56,.64,1]` | `EASE_SPRING_SOFT` | idêntico |
| ease.in `[.4,0,1,1]` | — | novo (saídas) |
| dur.base.operational 160ms | `MOTION_DURATION.fast` (0.15) | aproximado; V2 propõe 0.16 |
| dur.slow.operational 200ms | — | teto operacional; `MOTION_DURATION.base` (0.25) EXCEDE o teto |
| dur.base.commercial 360ms | `MOTION_DURATION.deliberate` (0.35) | aproximado |
| dur.slow.commercial 600ms / cinematic 1200ms | `gentle` 0.6 / — | `slow` 0.8 não tem par |
| stagger.base.commercial 60ms | `staggerContainer` (verificar valor) | diretriz da casa cita 0.05s |

Divergência a registrar: `MOTION_DURATION.base = 0.25` e `deliberate = 0.35` ultrapassam o teto
operacional proposto (200ms). Decisão do 00.

Sugestão de implementação: exportar `MOTION_LEVELS = { operational, commercial }` espelhando
`motion.json`, ler `useReducedMotion()` e, quando verdadeiro, usar `duration: 0` + variante só de
opacity (fade 120ms); manter `<MotionConfig reducedMotion="user">` na raiz. Landing/Welcome usam
`commercial`; todo o app autenticado usa `operational`.
