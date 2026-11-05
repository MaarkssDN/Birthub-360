// @ts-nocheck
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { BRAND } from '../../config/brand.js';

interface Orbit360Props {
  size?: number | string;
  className?: string;
  interactive?: boolean;
  priority?: boolean;
}

/**
 * Shaders para o anel cromático 360° contínuo oficial
 * (Ciano #00D4FF -> Rosa #FF2D9B -> Ouro #FFC107 -> Azul #3B82F6 -> Íris #8B7DFF)
 */
const ChromaticRingShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorCyan: { value: new THREE.Color(0x00d4ff) },
    uColorPink: { value: new THREE.Color(0xff2d9b) },
    uColorGold: { value: new THREE.Color(0xffc107) },
    uColorIris: { value: new THREE.Color(0x8b7dff) },
    uColorBlue: { value: new THREE.Color(0x3b82f6) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorCyan;
    uniform vec3 uColorPink;
    uniform vec3 uColorGold;
    uniform vec3 uColorIris;
    uniform vec3 uColorBlue;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Cálculo do ângulo em torno do eixo central (0 a 2*PI)
      float angle = atan(vPosition.y, vPosition.x);
      float normAngle = fract((angle / 6.28318530718) + (uTime * 0.04));

      vec3 col = uColorCyan;
      if (normAngle < 0.2) {
        col = mix(uColorCyan, uColorPink, normAngle / 0.2);
      } else if (normAngle < 0.4) {
        col = mix(uColorPink, uColorGold, (normAngle - 0.2) / 0.2);
      } else if (normAngle < 0.6) {
        col = mix(uColorGold, uColorBlue, (normAngle - 0.4) / 0.2);
      } else if (normAngle < 0.8) {
        col = mix(uColorBlue, uColorIris, (normAngle - 0.6) / 0.2);
      } else {
        col = mix(uColorIris, uColorCyan, (normAngle - 0.8) / 0.2);
      }

      // Fresnel rim glow suave para conferir volume ao anel
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      float fresnel = 0.5 + 0.5 * pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

      gl_FragColor = vec4(col * fresnel * 1.35, 0.95);
    }
  `,
};

function OrbitScene({
  interactive,
  reduceMotion,
}: {
  interactive: boolean;
  reduceMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerGoldRef = useRef<THREE.Mesh>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);
  const coronaRef = useRef<THREE.Points>(null);

  // Alvo inercial do mouse
  const mouseTarget = useRef({ x: 0, y: 0 });

  // Criação dos pontos da coroa exterior (telemetria de alta precisão)
  const coronaPoints = useMemo(() => {
    const count = 72;
    const positions = new Float32Array(count * 3);
    const radius = 2.45;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 0;
    }
    return positions;
  }, []);

  // 4 nós táticos: Dados, Inteligência, Decisão, Execução
  const nodes = useMemo(
    () => [
      { color: '#00D4FF', offset: 0, name: 'Dados' },
      { color: '#FF2D9B', offset: Math.PI * 0.5, name: 'Inteligência' },
      { color: '#FFC107', offset: Math.PI, name: 'Decisão' },
      { color: '#3B82F6', offset: Math.PI * 1.5, name: 'Execução' },
    ],
    [],
  );

  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, _delta) => {
    if (!reduceMotion) {
      const time = state.clock.getElapsedTime();

      // Atualiza uniform de tempo do shader cromático
      if (shaderMatRef.current) {
        shaderMatRef.current.uniforms.uTime.value = time;
      }

      // Rotação suave contínua dos anéis
      if (ringRef.current) {
        ringRef.current.rotation.z = time * 0.12;
      }
      if (innerGoldRef.current) {
        innerGoldRef.current.rotation.z = -time * 0.08;
      }
      if (coronaRef.current) {
        coronaRef.current.rotation.z = time * 0.02;
      }

      // Rotação dos 4 nós da órbita
      nodeRefs.current.forEach((nodeMesh, idx) => {
        if (nodeMesh) {
          const config = nodes[idx];
          if (!config) return;
          const orbitAngle = time * 0.28 + config.offset;
          const r = 1.95;
          nodeMesh.position.x = Math.cos(orbitAngle) * r;
          nodeMesh.position.y = Math.sin(orbitAngle) * r;
          nodeMesh.position.z = Math.sin(time * 1.5 + idx) * 0.08;
        }
      });
    }

    // Amortecimento inercial em resposta ao mouse
    if (groupRef.current && interactive) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mouseTarget.current.y * 0.22,
        0.06,
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouseTarget.current.x * 0.25,
        0.06,
      );
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerMove={(e) => {
        if (!interactive) return;
        mouseTarget.current = {
          x: (e.pointer.x) * 1.2,
          y: (-e.pointer.y) * 1.2,
        };
      }}
    >
      {/* 1. Iluminação Cáustica Tridimensional */}
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 4]} intensity={2.2} color="#F8F9FF" />
      <pointLight position={[-3, -2, 2]} intensity={1.2} color="#00D4FF" />
      <pointLight position={[0, -3, 3]} intensity={1.5} color="#FFC107" />

      {/* 2. Coroa de Telemetria Exterior (Tick marks) */}
      <points ref={coronaRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[coronaPoints, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#FFC107"
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>

      {/* 3. A Grande Órbita Cromática 360° */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.95, 0.075, 32, 128]} />
        <shaderMaterial
          ref={shaderMatRef}
          args={[ChromaticRingShader]}
          transparent
        />
      </mesh>

      {/* 4. Nós de Dados em Trânsito (4 Pilares) */}
      {nodes.map((node, i) => (
        <mesh
          key={node.name}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.08, 24, 24]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      ))}

      {/* 5. Anel Dourado de Precisão (Alta Relojoaria) */}
      <mesh ref={innerGoldRef} position={[0, 0, 0.02]}>
        <torusGeometry args={[1.42, 0.032, 32, 96]} />
        <meshStandardMaterial
          color="#FFC107"
          emissive="#D4AF37"
          emissiveIntensity={0.35}
          metalness={0.96}
          roughness={0.14}
        />
      </mesh>

      {/* 6. Barra Equatorial Luminosa */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[2.7, 0.024, 0.02]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={1.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 7. Núcleo Monolítico de Obsidian */}
      <mesh position={[0, 0, -0.05]}>
        <cylinderGeometry args={[1.32, 1.32, 0.08, 64]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial
          color="#0D0D0D"
          roughness={0.25}
          metalness={0.88}
        />
      </mesh>

      {/* 8. Bisel Refletivo do Núcleo */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[1.28, 1.32, 64]} />
        <meshStandardMaterial
          color="#FFC107"
          emissive="#FFC107"
          emissiveIntensity={0.2}
          metalness={0.9}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Componente Mestre BirthHubOrbit360
 * Integra WebGL otimizado para 120 FPS, sensor de viewport,
 * detecção de tab em background e fallback vetorial puro.
 */
export function BirthHubOrbit360({
  size = 380,
  className = '',
  interactive = true,
}: Orbit360Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [hasWebGlError, setHasWebGlError] = useState(false);

  // Observador de Visibilidade do Elemento (economiza GPU ao rolar para fora)
  useEffect(() => {
    const node = containerRef.current;
    if (!node || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsIntersecting(entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Observador de Aba Ativa
  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const shouldRender3D = isIntersecting && isTabVisible && !hasWebGlError;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Emblema Orbital Birth Hub 360"
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
    >
      {shouldRender3D ? (
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 42 }}
          dpr={[1, 2]} // Clampa a 2x máximo para preservar 60/120 FPS em telas Retina
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          onError={() => setHasWebGlError(true)}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <OrbitScene
              interactive={interactive}
              reduceMotion={reduceMotion}
            />
          </Suspense>
        </Canvas>
      ) : (
        /* Fallback vetorial soberano de altíssima fidelidade */
        <img
          src={BRAND.logos.symbol}
          alt="Birth Hub 360 Emblem"
          className="h-full w-full object-contain filter drop-shadow-[0_0_24px_rgba(0,212,255,0.35)]"
        />
      )}

      {/* Glifo B Geométrico central em sobreposição de vidro estático para nitidez de 4K */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="font-serif italic font-bold text-snow select-none"
          style={{
            fontSize: typeof size === 'number' ? `${size * 0.22}px` : '4.5rem',
            color: '#F8F9FF',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.45)',
          }}
        >
          B
        </span>
      </div>
    </div>
  );
}
export default BirthHubOrbit360;
