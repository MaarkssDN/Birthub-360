// @ts-nocheck
import { Float, Sparkles } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import confetti from 'canvas-confetti';
import { useReducedMotion } from 'framer-motion';
import { Activity, Handshake, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { Badge } from '../../../components/ui/Badge.js';
import { BRAND } from '../../../config/brand.js';
import { SoundFX } from '../../../lib/soundEffects.js';

interface RevenueSignalOrbProps {
  conversionRate: number;
  pendingActivities: number;
  closedThisMonth: number;
}

function SignalScene({
  conversionRate,
  pendingActivities,
  closedThisMonth,
  animate,
  isBoosting,
  onClick,
}: RevenueSignalOrbProps & {
  animate: boolean;
  isBoosting: boolean;
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  // Núcleo em Antique Gold, satélites em Deep Iris
  const brand = BRAND.colors.brand;
  const secondary = BRAND.colors.iris;
  const conversion = Math.max(0, Math.min(conversionRate, 100));
  const pendingIntensity = Math.min(Math.max(pendingActivities, 0), 120) / 120;
  const closedIntensity = Math.min(Math.max(closedThisMonth, 0), 30) / 30;
  const reduceMotion = Boolean(useReducedMotion());

  useFrame((_state, delta) => {
    if (!animate || !group.current || reduceMotion) return;
    const speedMult = isBoosting ? 4.5 : 1;
    group.current.rotation.y += delta * (0.09 + pendingIntensity * 0.08) * speedMult;
    group.current.rotation.x = Math.sin(group.current.rotation.y * 0.65) * 0.08;
  });

  return (
    <group ref={group}>
      <Float
        speed={animate && !reduceMotion ? (isBoosting ? 4 : 1.25) : 0}
        rotationIntensity={isBoosting ? 0.35 : 0.12}
        floatIntensity={isBoosting ? 0.45 : 0.18}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F 3D mesh element */}
        <mesh
          scale={(0.76 + conversion / 260) * (isBoosting ? 1.25 : 1)}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={() => {
            if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
          }}
        >
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial
            color={brand}
            emissive={brand}
            emissiveIntensity={isBoosting ? 0.9 : 0.24}
            metalness={0.65}
            roughness={0.18}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0.15, 0]} scale={1 + pendingIntensity * 0.12}>
          <torusGeometry args={[1.42, 0.035, 12, 96]} />
          <meshStandardMaterial
            color={secondary}
            emissive={secondary}
            emissiveIntensity={isBoosting ? 0.8 : 0.35}
          />
        </mesh>

        <mesh rotation={[0.55, 0.4, Math.PI / 3]} scale={0.92 + closedIntensity * 0.16}>
          <torusGeometry args={[1.72, 0.022, 10, 96]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>

        <mesh position={[1.68, 0.18, 0.1]} scale={0.12 + closedIntensity * 0.05}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.5} />
        </mesh>

        <Sparkles
          count={isBoosting ? 60 : 30}
          scale={3.5}
          size={isBoosting ? 5 : 3}
          speed={animate && !reduceMotion ? (isBoosting ? 1.2 : 0.3) : 0}
          opacity={0.75}
          color={BRAND.colors.brandAccent}
        />
      </Float>
    </group>
  );
}

export function RevenueSignalOrb({
  conversionRate,
  pendingActivities,
  closedThisMonth,
}: RevenueSignalOrbProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [isBoosting, setIsBoosting] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => setIsIntersecting(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const shouldAnimate = !reduceMotion && isIntersecting && isTabVisible;

  const handleOrbClick = () => {
    SoundFX.play('success');
    setIsBoosting(true);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#00E5FF', '#38BDF8', '#FFFFFF'],
    });
    setTimeout(() => {
      setIsBoosting(false);
    }, 1200);
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[20rem] overflow-hidden rounded-[1.6rem] border border-line/80 bg-surface-elevated/95 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl"
    >
      {/* Luz especular de topo 2026 */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent pointer-events-none z-20" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_50%_42%,rgba(0,229,255,0.22),transparent_48%)]"
      />

      <div className="absolute inset-x-5 top-5 z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-ink dark:text-brand">
            Signal Core 3D · 2026
          </p>
          <h3 className="mt-1 text-base font-display font-bold text-ink">
            Pressão Comercial ao Vivo
          </h3>
          <p className="mt-1 max-w-[18rem] text-xs leading-relaxed text-ink-2">
            Volume e movimento respondem às métricas reais. Clique no núcleo para impulso.
          </p>
        </div>
        <Badge
          variant={shouldAnimate ? 'success' : 'default'}
          dot={shouldAnimate}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
        >
          {shouldAnimate ? 'ao vivo' : 'estático'}
        </Badge>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: canvas container interativo */}
      <div
        className="h-[15rem] pt-16 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={handleOrbClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          frameloop={shouldAnimate ? 'always' : 'demand'}
          camera={{ position: [0, 0, 5.2], fov: 42 }}
        >
          {/* @ts-ignore R3F intrinsic element */}
          <ambientLight intensity={0.72} />
          {/* @ts-ignore R3F intrinsic element */}
          <pointLight position={[3, 3, 4]} intensity={3.5} color={BRAND.colors.brandAccent} />
          {/* @ts-ignore R3F intrinsic element */}
          <pointLight position={[-3, -2, 2]} intensity={2.0} color={BRAND.colors.iris} />
          <SignalScene
            conversionRate={conversionRate}
            pendingActivities={pendingActivities}
            closedThisMonth={closedThisMonth}
            animate={shouldAnimate}
            isBoosting={isBoosting}
            onClick={handleOrbClick}
          />
        </Canvas>
      </div>

      <div className="relative z-10 grid grid-cols-3 border-t border-line/80 bg-surface/80 backdrop-blur-xl">
        {/* biome-ignore lint/a11y/noStaticElementInteractions: feedback sonoro em hover */}
        <div
          onMouseEnter={() => SoundFX.play('hover')}
          className="group px-3 py-3.5 text-center transition-colors hover:bg-surface-elevated/70 cursor-default"
        >
          <Handshake
            className="mx-auto mb-1 h-4 w-4 text-brand transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <p className="text-sm font-black text-ink [font-variant-numeric:tabular-nums]">
            {conversionRate.toFixed(1)}%
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-2">Conversão</p>
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: feedback sonoro em hover */}
        <div
          onMouseEnter={() => SoundFX.play('hover')}
          className="group border-x border-line/80 px-3 py-3.5 text-center transition-colors hover:bg-surface-elevated/70 cursor-default"
        >
          <Activity
            className="mx-auto mb-1 h-4 w-4 text-warning transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <p className="text-sm font-black text-ink [font-variant-numeric:tabular-nums]">
            {pendingActivities.toLocaleString('pt-BR')}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-2">Pendentes</p>
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: feedback sonoro em hover */}
        <div
          onMouseEnter={() => SoundFX.play('hover')}
          className="group px-3 py-3.5 text-center transition-colors hover:bg-surface-elevated/70 cursor-default"
        >
          <Target
            className="mx-auto mb-1 h-4 w-4 text-success transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <p className="text-sm font-black text-ink [font-variant-numeric:tabular-nums]">
            {closedThisMonth.toLocaleString('pt-BR')}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-2">Fechados</p>
        </div>
      </div>
    </section>
  );
}
