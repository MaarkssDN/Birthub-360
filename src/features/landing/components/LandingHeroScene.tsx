import { Suspense, lazy } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { gridItemEntrance, staggerGridContainer, useIsTouchDevice } from '@/lib/motion.js';

const BirthHubOrbit360 = lazy(() =>
  import('@/components/brand/BirthHubOrbit360').then((mod) => ({ default: mod.BirthHubOrbit360 })),
);

export function LandingHeroScene() {
  const reduceMotion = Boolean(useReducedMotion());
  const isTouch = useIsTouchDevice();

  return (
    <motion.div
      variants={reduceMotion ? undefined : staggerGridContainer(0.06, 0.08)}
      initial={reduceMotion ? undefined : 'hidden'}
      animate={reduceMotion ? undefined : 'show'}
      className="relative flex h-full flex-col justify-between p-6 sm:p-8 bg-[#0D0D0D]/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl motion-gpu"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00D4FF]/12 via-transparent to-transparent" />

      <motion.div
        variants={reduceMotion ? undefined : gridItemEntrance}
        className="space-y-4 max-w-xl"
      >
        <div className="lux-hud-tag lux-hud-tag-cyan">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
          Birth Hub 360° · Central de Comando
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
          <span className="block text-[#F8F9FF]">Dados que Conectam.</span>
          <span className="block text-[#F8F9FF]">Inteligência que Decide.</span>
          <span className="lux-headline-hero">Execução que Acontece.</span>
        </h1>
        <p className="text-sm sm:text-base text-[#9EADC8] leading-relaxed">
          O ecossistema soberano da sua operação de receita: orquestração preditiva de leads,
          diagnósticos em tempo real e enxame de automações sob controle contínuo.
        </p>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : gridItemEntrance}
        className="my-auto flex items-center justify-center py-6"
      >
        <Suspense
          fallback={
            <div className="h-56 w-56 rounded-full bg-[#14141A] border border-[#00D4FF]/20 animate-pulse flex items-center justify-center">
              <span className="font-serif italic text-2xl text-[#FFC107]">B</span>
            </div>
          }
        >
          <BirthHubOrbit360 size={280} interactive={!isTouch} />
        </Suspense>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : gridItemEntrance}
        className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs text-[#9EADC8]"
      >
        <div>
          <span className="block font-mono font-bold text-[#F8F9FF] text-base sm:text-lg numeric-tabular-cell">
            50+
          </span>
          Integrações B2B
        </div>
        <div>
          <span className="block font-mono font-bold text-[#FFC107] text-base sm:text-lg numeric-tabular-cell">
            100%
          </span>
          Isolamento RLS Multi-Tenant
        </div>
        <div>
          <span className="block font-mono font-bold text-[#00D4FF] text-base sm:text-lg numeric-tabular-cell">
            &lt; 12ms
          </span>
          Latência de Telemetria
        </div>
      </motion.div>
    </motion.div>
  );
}
export default LandingHeroScene;
