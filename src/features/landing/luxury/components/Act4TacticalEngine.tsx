import { Cpu, Sparkles, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SoundFX } from '../../../../lib/soundEffects.js';
import { MagneticButton } from './MagneticButton.js';
import { SpotlightCard } from './SpotlightCard.js';

export function Act4TacticalEngine() {
  const [activeConsole, setActiveConsole] = useState<'copilot' | 'swarm' | 'pipeline'>('copilot');
  const [callSeconds, setCallSeconds] = useState(252); // 04:12

  // Cronômetro vivo da chamada simulada
  useEffect(() => {
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleConsoleChange = (mode: 'copilot' | 'swarm' | 'pipeline') => {
    SoundFX.play('click');
    setActiveConsole(mode);
  };

  return (
    <section
      id="motor"
      className="relative py-24 sm:py-32 bg-[var(--bg)] border-t border-white/[0.06] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 sm:mb-20">
          <div className="lux-hud-tag text-[var(--pink)] border-[var(--pink)]/30 bg-[var(--pink)]/[0.08]">
            <Cpu className="w-3.5 h-3.5 text-[var(--pink)]" />A Verdade Operacional
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.02em] leading-tight text-[var(--ink)]">
            Não é uma promessa de apresentação. <br />
            <span className="lux-headline-hero">É engenharia de missão crítica em execução.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9EADC8] leading-relaxed">
            Veja a central de comando em tempo real. Cada agente opera com dados isolados por
            tenant, processando telemetria em milissegundos e auxiliando o time de vendas exatamente
            no momento do fechamento.
          </p>
        </div>

        {/* Console de Observabilidade Tática */}
        <div className="rounded-2xl bg-[var(--surface)] border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Top Bar do Console (Estilo Terminal Aeroespacial) */}
          <div className="px-6 py-4 bg-[#101015] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                <span className="w-3 h-3 rounded-full bg-[var(--gold)]/80" />
                <span className="w-3 h-3 rounded-full bg-[#22C55E]/80" />
              </div>
              <span className="text-white/20">|</span>
              <span className="font-mono text-xs text-[var(--ink)] font-semibold flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[var(--orbit-blue)]" />
                CONSOLE EXECUTIVO · BIRTH-HUB-OS v2.0
              </span>
            </div>

            {/* Alternador de Vistas do Console */}
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/[0.06]">
              <MagneticButton
                onClick={() => handleConsoleChange('copilot')}
                playSound={false}
                className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
                  activeConsole === 'copilot'
                    ? 'bg-[var(--orbit-blue)]/15 text-[var(--orbit-blue)] font-bold border border-[var(--orbit-blue)]/30'
                    : 'text-[#9EADC8] hover:text-white'
                }`}
              >
                Copiloto em Chamada
              </MagneticButton>
              <MagneticButton
                onClick={() => handleConsoleChange('swarm')}
                playSound={false}
                className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
                  activeConsole === 'swarm'
                    ? 'bg-[var(--pink)]/15 text-[var(--pink)] font-bold border border-[var(--pink)]/30'
                    : 'text-[#9EADC8] hover:text-white'
                }`}
              >
                Enxame de Agentes IA
              </MagneticButton>
              <MagneticButton
                onClick={() => handleConsoleChange('pipeline')}
                playSound={false}
                className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
                  activeConsole === 'pipeline'
                    ? 'bg-[var(--gold)]/15 text-[var(--gold)] font-bold border border-[var(--gold)]/30'
                    : 'text-[#9EADC8] hover:text-white'
                }`}
              >
                Telemetria de Negócios
              </MagneticButton>
            </div>
          </div>

          {/* Área Principal do Console */}
          <div className="p-6 sm:p-10">
            {activeConsole === 'copilot' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Esquerda: Contexto da Ligação & Decisor */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[var(--orbit-blue)] uppercase tracking-wider font-semibold">
                        Sessão de Voz Ativa #8291
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-[#22C55E]">
                        <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-ping" />
                        {formatCallTime(callSeconds)} ao vivo
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-[var(--ink)]">
                        Diretor de Operações — Logística Global
                      </h4>
                      <p className="text-xs text-[#9EADC8]">
                        Conta Qualificada ICP Tier-1 · Ticket Previsto: R$ 180.000
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#9EADC8]">Probabilidade Preditiva:</span>
                      <span className="text-[var(--gold)] font-bold">84% de Fechamento</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                    <span className="font-mono text-xs text-[var(--pink)] uppercase tracking-wider font-semibold">
                      Objeção Detectada em Tempo Real
                    </span>
                    <p className="text-sm text-[var(--ink)] italic">
                      &quot;Precisamos entender como vocês garantem que os dados dos nossos clientes
                      não vão vazar entre contas.&quot;
                    </p>
                  </div>
                </div>

                {/* Coluna Direita: Recomendação Tática do Copiloto */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-6 rounded-xl bg-[var(--orbit-blue)]/[0.03] border border-[var(--orbit-blue)]/25 space-y-4">
                    <div className="flex items-center gap-2 text-[var(--orbit-blue)]">
                      <Sparkles className="w-5 h-5 text-[var(--orbit-blue)]" />
                      <h4 className="font-bold text-base text-[var(--ink)]">
                        Prescrição do Copiloto (Next Best Action):
                      </h4>
                    </div>

                    <div className="p-4 rounded-lg bg-black/60 border border-[var(--orbit-blue)]/20 text-sm text-[var(--ink)] leading-relaxed space-y-2">
                      <p>
                        <strong>Argumento-Chave:</strong> Destaque o isolamento multi-tenant a nível
                        de banco com RLS (Row Level Security) nativo no PostgreSQL. Nenhum tenant
                        tem acesso aos dados de outro.
                      </p>
                      <p className="text-xs text-[#9EADC8] font-mono">
                        SLA de conformidade LGPD com auditoria contínua e criptografia AES-256 em
                        repouso.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-3 py-1 rounded-md text-xs font-mono bg-white/[0.05] text-[var(--ink)] border border-white/[0.1]">
                        Playbook: Matriz de Objeções §4.2
                      </span>
                      <span className="px-3 py-1 rounded-md text-xs font-mono bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                        Taxa de Sucesso Histórica: 91%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeConsole === 'swarm' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SpotlightCard
                  glowColor="color-mix(in srgb, var(--orbit-blue) 20%, transparent)"
                  className="p-5 bg-black/40 border-[var(--orbit-blue)]/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--orbit-blue)] font-bold">
                      AGENTE 05 · PROSPECÇÃO
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[var(--orbit-blue)] animate-pulse" />
                  </div>
                  <p className="text-xs text-[#9EADC8]">
                    Varredura contínua de sinais de expansão, abertura de filiais e contratações em
                    decisores-alvo.
                  </p>
                  <div className="text-xs font-mono text-[var(--ink)] pt-2 border-t border-white/[0.08]">
                    Status: 1.240 contas analisadas hoje
                  </div>
                </SpotlightCard>

                <SpotlightCard
                  glowColor="color-mix(in srgb, var(--pink) 20%, transparent)"
                  className="p-5 bg-black/40 border-[var(--pink)]/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--pink)] font-bold">
                      AGENTE 07 · COPILOTO IA
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[var(--pink)] animate-pulse" />
                  </div>
                  <p className="text-xs text-[#9EADC8]">
                    Geração de diagnósticos de gargalo de pipeline e recomendações de fechamento
                    para closers.
                  </p>
                  <div className="text-xs font-mono text-[var(--ink)] pt-2 border-t border-white/[0.08]">
                    Status: 42 recomendações ativas
                  </div>
                </SpotlightCard>

                <SpotlightCard
                  glowColor="color-mix(in srgb, var(--gold) 20%, transparent)"
                  className="p-5 bg-black/40 border-[var(--gold)]/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--gold)] font-bold">
                      AGENTE 12 · VOZ &amp; CALLS
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[var(--gold)] animate-pulse" />
                  </div>
                  <p className="text-xs text-[#9EADC8]">
                    Transcrição semântica ultrarrápida com detecção instantânea de sentimento e
                    intenção de compra.
                  </p>
                  <div className="text-xs font-mono text-[var(--ink)] pt-2 border-t border-white/[0.08]">
                    Status: Latência média de transcrição: 140ms
                  </div>
                </SpotlightCard>
              </div>
            )}

            {activeConsole === 'pipeline' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="font-mono text-xs text-[#9EADC8] block">Pipeline Ativo</span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[var(--ink)]">
                      R$ 4.280.000
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="font-mono text-xs text-[#9EADC8] block">
                      Pipeline Ponderado
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[var(--gold)]">
                      R$ 2.940.000
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="font-mono text-xs text-[#9EADC8] block">
                      Negócios em Risco
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[#EF4444]">
                      3 Contas
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="font-mono text-xs text-[#9EADC8] block">Meta Prevista</span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[#22C55E]">
                      114% Atingimento
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#9EADC8]">
                  <span>Telemetria atualizada a cada 10 segundos com sincronização omnicanal.</span>
                  <span className="text-[var(--orbit-blue)]">Zero latência de dados</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
