# Movimento Reduzido — `prefers-reduced-motion`

**Birth Hub 360° — Brand System · 05-MOTION**

- **Propósito:** documentar como o produto honra `prefers-reduced-motion` (WCAG 2.3.3 / 2.2 AA) e as regras para novos componentes.
- **Escopo:** `src/App.tsx`, `src/lib/motion.ts`, `src/styles/globals.css`, `src/styles/official-identity.css`, `src/components/layout/*`, `src/components/ui/*`, `src/features/voice-hub/components/design-system/`.
- **Estado da informação:** CONFIRMADO em 2026-11-19.
- **Fontes:** arquivos citados inline.
- **Relacionados:** `principios-de-motion.md`, `06-EXPERIENCIA/acessibilidade.md`.

---

## 1. Camadas de proteção (defesa em profundidade)

O produto implementa **três camadas independentes** — qualquer uma basta para neutralizar a maioria dos efeitos:

### Camada 1 — `MotionConfig` global (Framer Motion)

`src/App.tsx:67-70`:

```tsx
// reducedMotion="user" faz o framer-motion respeitar prefers-reduced-motion do SO/navegador
<MotionConfig reducedMotion="user">
```

Efeito: o Framer Motion desativa automaticamente transform/layout animations em componentes `motion.*` quando o usuário prefere menos movimento (mantém `opacity`).

### Camada 2 — `useReducedMotion()` por componente/hook

Hook do Framer Motion usado em **30+ arquivos**, incluindo:

- `src/lib/motion.ts` — `useTilt` (209), `useMagnetic` (242), `useCursorSpotlight` (312), `useGlobalCursorDepth` (350): retornam `style: undefined` / `{x:0,y:0}` e **não registram listeners** de ponteiro.
- `src/components/layout/PageTransition.tsx:13-16` — retorna `<div>` simples, sem `motion.div`.
- `src/components/layout/hooks/useSidebarState.ts:80`, `bento/BentoCard.tsx:42`, `BrandOrb.tsx`, `CyberInput.tsx:35`, `EmptyState.tsx:15`, `HolographicCard.tsx:30`, `icons/AnimatedIcon.tsx:35`, `icons/Isometric3DIcons.tsx` (4×), `Magnetic.tsx`, `Gamified3DOrb.tsx`, etc.
- `src/features/landing/pages/Landing360.tsx` e `LandingInnovative.tsx` também checam `useReducedMotion` diretamente.
- Segundo mini DS: `src/features/voice-hub/components/design-system/` tem `useReducedMotion` próprio.

### Camada 3 — Media queries CSS

| Local | Regra |
|---|---|
| `src/styles/globals.css:1582-1597` | `@media (prefers-reduced-motion: reduce)` global com `animation-duration: 0.01ms !important`, `animation-iteration-count: 1 !important`, `transition-duration: 0.01ms !important`, `scroll-behavior: auto !important` em `*, *::before, *::after` — comentário cita WCAG 2.3.3 |
| `src/styles/globals.css:1661-1665` | `.bh-orbit-ring { animation: none }` |
| `src/styles/official-identity.css:212-219` | `.bh-platform-card, .bh-official-control { transition:none; animation:none; transform:none }` |
| `src/components/layout/Sidebar.css:254` | media query própria do shell |

## 2. Efeitos neutralizados

| Efeito | Mecanismo |
|---|---|
| Transições/entradas de página | `PageTransition` → div simples; `MotionConfig` → opacity-only |
| Tilt/magnetic/spotlight/parallax | hooks retornam neutro + sem listeners |
| Loops ambientes (`pulseGlow`, `float`, `spin-slow`, `border-beam`) | media query CSS zera duration/iteração |
| Scroll suave | `scroll-behavior: auto !important` |
| Toasts/toast-in | keyframe `toast-in` neutralizado pela regra global |
| Som (`SoundFX`) | **NÃO condicionado a reduced-motion** — sons são feedback, não motion; verificar se há preferência de som separada (**NÃO VERIFICADO**) |

## 3. Alternativas não animadas (padrão observado)

- Em reduced-motion, entradas viram **aparição instantânea** (opacity-only via `MotionConfig`, ou nenhuma via early-return em `PageTransition`).
- Componentes com `useReducedMotion` geralmente mantêm o estado final estático (ex.: `BrandOrb` renderiza em repouso).
- Conteúdo nunca fica invisível: variants `hidden` dependem de `animate` disparar; com motion desligado o Framer Motion ainda aplica `animate` (só sem tween decorativo).

## 4. Regras para novos componentes

1. **Obrigatório:** usar `motion.*` dentro do `MotionConfig` existente (não criar outro `MotionConfig` sem `reducedMotion="user"`).
2. **Obrigatório:** se o componente registrar listeners de cursor/scroll ou usar springs decorativos, chamar `useReducedMotion()` e/ou `useIsTouchDevice()` de `src/lib/motion.ts` e retornar neutro — padrão de `useTilt`/`useMagnetic`/`useCursorSpotlight`.
3. **Obrigatório:** loops infinitos (`repeat: Infinity`) devem ter equivalente estático ou serem desligados em reduced-motion.
4. **Proibido:** `!important` em CSS de componente para burlar a regra global; a regra global já cobre keyframes.
5. **Touch ≠ reduced-motion:** `useIsTouchDevice()` desativa efeitos de cursor por performance (60/120 FPS, zero GPU heat — comentário `motion.ts:187-191`), independente de acessibilidade. Novos efeitos de cursor devem checar **ambos**.
6. **Som:** se um novo componente adicionar som, avaliar `prefers-reduced-motion` não se aplica — buscar canal de preferência de áudio próprio (**NÃO VERIFICADO** se existe).

## 5. Lacunas conhecidas

- `useMagnetic`, `useCursorSpotlight`, `useGlobalCursorDepth` estão implementados com proteção completa mas **sem consumidores** — a proteção existe, a adoção não.
- Animações inline ad hoc fora de `motion.ts` (ex.: `Landing360` ~3200 linhas, sub-app `prospecting/outbound`) podem ter efeitos próprios — cada um deve ser auditado individualmente; a regra global CSS mitiga a maioria.
- Não há teste automatizado de reduced-motion encontrado (**NÃO VERIFICADO** — não buscado exaustivamente).
