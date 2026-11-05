import { motion, useScroll, useSpring } from 'framer-motion';
import { Check, Cpu, Database, Network, Sparkles, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SculpturalReveal } from './SculpturalReveal.js';

export function Act3Singularity() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<number>(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  // Atualiza o quadrante ativo dinamicamente conforme o progresso de rolagem
  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      if (latest < 0.35) {
        setActiveQuadrant(0);
      } else if (latest < 0.55) {
        setActiveQuadrant(1);
      } else if (latest < 0.75) {
        setActiveQuadrant(2);
      } else {
        setActiveQuadrant(3);
      }
    });
  }, [smoothProgress]);

  const quadrants = [
    {
      step: '01',
      title: 'DADOS',
      subtitle: 'Conexão Universal & Ingestão Limpa',
      color: '#00D4FF',
      gradient: 'from-[#00D4FF]/20 to-transparent',
      borderColor: 'border-[#00D4FF]/40',
      icon: Database,
      tag: 'INGESTÃO UNIFICADA',
      desc: 'Sincronização em tempo real de contatos, empresas, chamadas de voz, trocas no WhatsApp e eventos de mercado sem latência.',
      details: [
        'Isolamento RLS Multi-Tenant no PostgreSQL',
        'Ingestão bidirecional sem duplicação de entidades',
        'Normalização automática de nomes, cargos e domínios',
      ],
    },
    {
      step: '02',
      title: 'INTELIGÊNCIA',
      subtitle: 'Diagnóstico Semântico & Predição',
      color: '#FF2D9B',
      gradient: 'from-[#FF2D9B]/20 to-transparent',
      borderColor: 'border-[#FF2D9B]/40',
      icon: Cpu,
      tag: 'CÉREBRO COGNITIVO',
      desc: 'Algoritmos semânticos analisam o histórico de conversas, sinais de mercado e objeções para mapear a probabilidade real de fechamento.',
      details: [
        'Análise de sentimento e intenção de compra',
        'Scoring preditivo baseado em ICP validado',
        'Detecção de risco de perda e estagnação de negócios',
      ],
    },
    {
      step: '03',
      title: 'DECISÃO',
      subtitle: 'Priorização & Next Best Action',
      color: '#FFC107',
      gradient: 'from-[#FFC107]/20 to-transparent',
      borderColor: 'border-[#FFC107]/40',
      icon: Sparkles,
      tag: 'DIREÇÃO ESTRATÉGICA',
      desc: 'O sistema elimina a dúvida da equipe: indica com precisão matemática qual oportunidade atacar agora, por qual canal e com qual argumento.',
      details: [
        'Motor Next Best Action (NBA) em tempo real',
        'Previsibilidade de pipeline ponderado e metas diárias',
        'Prescrição de cadência ideal por perfil de decisor',
      ],
    },
    {
      step: '04',
      title: 'EXECUÇÃO',
      subtitle: 'Orquestração & Autonomia em Enxame',
      color: '#3B82F6',
      gradient: 'from-[#3B82F6]/20 to-transparent',
      borderColor: 'border-[#3B82F6]/40',
      icon: Zap,
      tag: 'VELOCIDADE DE AÇÃO',
      desc: 'Disparo coordenado de cadências multicanal, geração automática de propostas e suporte ao vivo em chamadas comerciais.',
      details: [
        'Cadências orquestradas (Voz, E-mail, WhatsApp, LinkedIn)',
        'Copiloto em tempo real na tela do closer durante a call',
        'Passagem de bastão automatizada entre SDR e Closer',
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="orbita"
      className="relative py-24 sm:py-32 bg-[#0D0D0D] border-t border-white/[0.06] overflow-hidden"
    >
      {/* Luz ambiente de fundo */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-[#00D4FF]/05 via-[#FF2D9B]/03 to-transparent blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 sm:mb-20">
          <div className="lux-hud-tag text-[#00D4FF] border-[#00D4FF]/30 bg-[#00D4FF]/[0.08]">
            <Network className="w-3.5 h-3.5 text-[#00D4FF]" />A Matriz Contínua 360º
          </div>

          <SculpturalReveal delay={0.1}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.02em] leading-tight text-[#F8F9FF]">
              Quatro movimentos contínuos. <br />
              <span className="lux-headline-hero">Um único ciclo perpétuo de receita.</span>
            </h2>
          </SculpturalReveal>

          <SculpturalReveal delay={0.2}>
            <p className="text-base sm:text-lg text-[#9EADC8] leading-relaxed">
              Nada no Birth Hub 360º existe isolado. Cada dado ingerido refina a inteligência, que
              aprimora a decisão, que acelera a execução — retroalimentando a base continuamente.
            </p>
          </SculpturalReveal>

          {/* Barra de Progresso de Scrollytelling da Matriz */}
          <div className="max-w-md mx-auto pt-6 flex items-center justify-between gap-3 text-xs font-mono">
            <span className="text-[#9EADC8]">Fluxo Orbital:</span>
            <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00D4FF] via-[#FF2D9B] to-[#FFC107]"
                style={{ scaleX: smoothProgress, transformOrigin: '0%' }}
              />
            </div>
            <span className="text-[#00D4FF] font-bold">{quadrants[activeQuadrant]?.title}</span>
          </div>
        </div>

        {/* Grade dos 4 Quadrantes com sincronização ativa */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quadrants.map((item, index) => {
            const Icon = item.icon;
            const isSelected = activeQuadrant === index;
            return (
              <button
                type="button"
                key={item.title}
                onClick={() => setActiveQuadrant(index)}
                className={`text-left cursor-pointer rounded-2xl p-6 sm:p-8 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `bg-[#14141A] ${item.borderColor} shadow-[0_0_35px_rgba(0,212,255,0.18)] scale-[1.03] ring-1 ring-[#00D4FF]/30`
                    : 'bg-[#14141A]/50 border border-white/[0.08] hover:border-white/[0.2] hover:bg-[#14141A]/80'
                }`}
              >
                {/* Linha de acento de cor no topo */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300"
                  style={{
                    backgroundColor: item.color,
                    opacity: isSelected ? 1 : 0.25,
                  }}
                />

                <div className="space-y-6">
                  {/* Topo do Quadrante */}
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-2xl font-black transition-transform duration-300"
                      style={{
                        color: item.color,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {item.step}
                    </span>
                    <span className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white">
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </span>
                  </div>

                  <div>
                    <span
                      className="font-mono text-[10px] tracking-widest uppercase font-bold block mb-1"
                      style={{ color: item.color }}
                    >
                      {item.tag}
                    </span>
                    <h3 className="text-xl font-extrabold text-[#F8F9FF]">{item.title}</h3>
                    <p className="text-xs text-[#9EADC8] mt-1 font-medium">{item.subtitle}</p>
                  </div>

                  <p className="text-sm text-[#9EADC8] leading-relaxed">{item.desc}</p>
                </div>

                {/* Lista de detalhes */}
                <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-2.5">
                  {item.details.map((detail) => (
                    <div key={detail} className="flex items-start gap-2 text-xs text-[#F8F9FF]/80">
                      <Check
                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                        style={{ color: item.color }}
                      />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
