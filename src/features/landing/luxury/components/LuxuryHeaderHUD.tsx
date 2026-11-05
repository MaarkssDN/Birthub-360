import { Shield, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BirthHubLogo } from '../../../../components/brand/BirthHubLogo.js';
import { SoundFX } from '../../../../lib/soundEffects.js';
import { MagneticButton } from './MagneticButton.js';

interface LuxuryHeaderHUDProps {
  onOpenPrivateAccess?: () => void;
}

export function LuxuryHeaderHUD({ onOpenPrivateAccess }: LuxuryHeaderHUDProps) {
  const [scrolled, setScrolled] = useState(false);
  const [latency, setLatency] = useState(11.4);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Micro-flutuação de latência para telemetria viva
  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = (Math.random() * 1.8 - 0.9).toFixed(1);
      setLatency(Number((11.4 + Number(jitter)).toFixed(1)));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-[#0D0D0D]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Marca Institucional */}
          <Link
            to="/"
            onClick={() => SoundFX.play('navigate')}
            className="flex items-center gap-3.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] rounded-lg"
          >
            <BirthHubLogo variant="symbol" className="h-[34px] w-[34px]" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#F8F9FF] group-hover:text-[#00D4FF] transition-colors">
                BIRTH HUB <span className="text-[#FFC107]">360º</span>
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#9EADC8] uppercase -mt-0.5">
                Central de Comando
              </span>
            </div>
          </Link>

          {/* Telemetria Central (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="font-mono text-xs text-[#9EADC8]">
                CORE: <span className="text-[#F8F9FF] font-semibold">ONLINE</span>
              </span>
            </div>
            <span className="text-white/20 text-xs">|</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="font-mono text-xs text-[#9EADC8]">
                RLS: <span className="text-[#00D4FF] font-semibold">100% ISOLADO</span>
              </span>
            </div>
            <span className="text-white/20 text-xs">|</span>
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#FFC107]" />
              <span className="font-mono text-xs text-[#9EADC8]">
                LATÊNCIA: <span className="text-[#FFC107] font-semibold font-mono">{latency}ms</span>
              </span>
            </div>
          </div>

          {/* Navegação & CTA Privado */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden md:flex items-center gap-6 font-medium text-xs tracking-wider uppercase text-[#9EADC8]">
              <a
                href="#tese"
                onPointerDown={() => SoundFX.play('focus')}
                className="hover:text-[#00D4FF] transition-colors focus:outline-none focus-visible:text-[#00D4FF]"
              >
                A Tese
              </a>
              <a
                href="#orbita"
                onPointerDown={() => SoundFX.play('focus')}
                className="hover:text-[#FFC107] transition-colors focus:outline-none focus-visible:text-[#FFC107]"
              >
                Órbita 360º
              </a>
              <a
                href="#motor"
                onPointerDown={() => SoundFX.play('focus')}
                className="hover:text-[#FF2D9B] transition-colors focus:outline-none focus-visible:text-[#FF2D9B]"
              >
                Enxame IA
              </a>
              <a
                href="#metricas"
                onPointerDown={() => SoundFX.play('focus')}
                className="hover:text-[#F8F9FF] transition-colors focus:outline-none focus-visible:text-[#F8F9FF]"
              >
                Métricas
              </a>
            </nav>

            <MagneticButton
              onClick={() => {
                SoundFX.play('confirm');
                onOpenPrivateAccess?.();
              }}
              className="lux-btn-primary !py-2.5 !px-5 !text-xs tracking-wider uppercase !font-bold"
            >
              Acesso Reservado
            </MagneticButton>
          </div>
        </div>
      </div>
    </header>
  );
}
