import { Award, Database, Lock, ShieldCheck, Zap } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard.js';

export function Act5SovereigntyMetrics() {
  const metrics = [
    {
      value: '+42%',
      label: 'Velocidade de Avanço no Pipeline',
      description: 'Redução média do ciclo de vendas através de prescrições em tempo real do Copiloto Comercial.',
      color: '#00D4FF',
      glow: 'rgba(0, 212, 255, 0.22)',
    },
    {
      value: '< 12ms',
      label: 'Latência de Telemetria Operacional',
      description: 'Processamento imediato de eventos e inteligência de decisores sem atrasos perceptíveis.',
      color: '#FFC107',
      glow: 'rgba(255, 193, 7, 0.2)',
    },
    {
      value: '100%',
      label: 'Isolamento Multi-Tenant (RLS)',
      description: 'Segurança absoluta de banco de dados onde cada organização tem seus dados estritamente segregados.',
      color: '#22C55E',
      glow: 'rgba(34, 197, 94, 0.2)',
    },
    {
      value: '360º',
      label: 'Visibilidade Unificada de Ponta a Ponta',
      description: 'Zero pontos cegos entre captação outbound, cadências, chamadas telefônicas e fechamento contratual.',
      color: '#FF2D9B',
      glow: 'rgba(255, 45, 155, 0.2)',
    },
  ];

  return (
    <section id="metricas" className="relative py-24 sm:py-32 bg-[#0D0D0D] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 sm:mb-20">
          <div className="lux-hud-tag text-[#FFC107] border-[#FFC107]/30 bg-[#FFC107]/[0.08]">
            <Award className="w-3.5 h-3.5 text-[#FFC107]" />
            O Índice de Soberania
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.02em] leading-tight text-[#F8F9FF]">
            Métricas comprovadas. <br />
            <span className="lux-headline-hero">Autoridade corporativa em números.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9EADC8] leading-relaxed">
            Desenvolvido para operações que não podem aceitar falhas, perda de dados ou promessas vazias.
            Cada indicador reflete a capacidade real do sistema em escala.
          </p>
        </div>

        {/* Grade de Métricas Monumentais com Efeito Spotlight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((item) => (
            <SpotlightCard
              key={item.label}
              glowColor={item.glow}
              className="p-8 flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: item.color }}
              />

              <div className="space-y-4">
                <span
                  className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black block tracking-tight"
                  style={{ color: item.color }}
                >
                  {item.value}
                </span>

                <h3 className="text-base font-bold text-[#F8F9FF] leading-snug">
                  {item.label}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#9EADC8] mt-6 pt-4 border-t border-white/[0.08] leading-relaxed">
                {item.description}
              </p>
            </SpotlightCard>
          ))}
        </div>

        {/* Selos de Conformidade Enterprise */}
        <div className="mt-16 pt-12 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#00D4FF]" />
            <span className="text-xs font-bold text-[#F8F9FF]">Criptografia Ponta a Ponta</span>
            <span className="text-[11px] font-mono text-[#9EADC8]">AES-256 &amp; TLS 1.3</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Lock className="w-6 h-6 text-[#FFC107]" />
            <span className="text-xs font-bold text-[#F8F9FF]">Conformidade LGPD Nativa</span>
            <span className="text-[11px] font-mono text-[#9EADC8]">Anonimização &amp; Retenção</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Database className="w-6 h-6 text-[#22C55E]" />
            <span className="text-xs font-bold text-[#F8F9FF]">PostgreSQL com RLS</span>
            <span className="text-[11px] font-mono text-[#9EADC8]">Segregação de Dados</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Zap className="w-6 h-6 text-[#FF2D9B]" />
            <span className="text-xs font-bold text-[#F8F9FF]">Infraestrutura de Baixa Latência</span>
            <span className="text-[11px] font-mono text-[#9EADC8]">Edge Network Global</span>
          </div>
        </div>
      </div>
    </section>
  );
}
