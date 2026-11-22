// @ts-nocheck
import { Float, MeshDistortMaterial, Sparkles, Sphere } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { BRAND } from '../../config/brand.js';
import { SoundFX } from '../../lib/soundEffects.js';

function OrbCore({
  animate,
  isBoosting,
  onClick,
}: {
  animate: boolean;
  isBoosting: boolean;
  onClick: () => void;
}) {
  const materialRef = useRef<ComponentRef<typeof MeshDistortMaterial>>(null);
  const reduceMotion = Boolean(useReducedMotion());

  const color = BRAND.colors.brand;
  const emissive = BRAND.colors.brandAccent;

  return (
    <Float
      speed={animate && !reduceMotion ? (isBoosting ? 5 : 2) : 0}
      rotationIntensity={animate && !reduceMotion ? (isBoosting ? 2.5 : 1.5) : 0}
      floatIntensity={animate && !reduceMotion ? (isBoosting ? 3 : 2) : 0}
    >
      <Sphere
        args={[1, 64, 64]}
        scale={isBoosting ? 1.35 : 1.2}
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
        <MeshDistortMaterial
          ref={materialRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={isBoosting ? 2 : 1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.85}
          roughness={0.15}
          distort={animate && !reduceMotion ? (isBoosting ? 0.55 : 0.3) : 0}
          speed={animate && !reduceMotion ? (isBoosting ? 6 : 3) : 0}
        />
      </Sphere>
      <Sparkles
        count={isBoosting ? 80 : 50}
        scale={3.2}
        size={isBoosting ? 6 : 4}
        speed={animate && !reduceMotion ? (isBoosting ? 1.2 : 0.4) : 0}
        opacity={0.85}
        color={BRAND.colors.iris}
      />
    </Float>
  );
}

export function BrandOrb({
  size = 150,
  interactive = true,
  className,
}: {
  size?: number;
  interactive?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [isBoosting, setIsBoosting] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
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

  const handleInteract = () => {
    if (!interactive) return;
    SoundFX.play('success');
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
    }, 1200);
  };

  return (
    <button
      type="button"
      ref={containerRef}
      style={{ width: size, height: size }}
      className={`relative select-none appearance-none border-0 bg-transparent p-0 ${className || ''}`}
      onClick={handleInteract}
      disabled={!interactive}
      title={interactive ? 'Clique para interagir com o Brand Orb 3D' : undefined}
      aria-label={interactive ? 'Interagir com o Brand Orb' : 'Brand Orb'}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        frameloop={shouldAnimate ? 'always' : 'demand'}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} />
        <pointLight position={[-4, -2, 2]} intensity={1.2} color={BRAND.colors.iris} />
        <OrbCore animate={shouldAnimate} isBoosting={isBoosting} onClick={handleInteract} />
      </Canvas>
    </button>
  );
}
