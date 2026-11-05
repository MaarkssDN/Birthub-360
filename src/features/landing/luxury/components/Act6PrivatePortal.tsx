import { CheckCircle2, Lock } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SoundFX } from '../../../../lib/soundEffects.js';
import { MagneticButton } from './MagneticButton.js';

export function Act6PrivatePortal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    SoundFX.play('confirm');
    setIsSubmitting(true);

    // Simulação de registro seguro de interesse corporativo
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      SoundFX.play('success');
    }, 600);
  };

  return (
    <section
      id="acesso"
      className="relative py-24 sm:py-32 bg-[#0D0D0D] border-t border-white/[0.06] overflow-hidden"
    >
      {/* Luz dourada e azul no fechamento da página */}
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-t from-[#FFC107]/10 via-[#00D4FF]/08 to-transparent blur-3xl opacity-70" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 sm:p-14 rounded-3xl bg-[#14141A] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
          {/* Top Border Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC107] via-[#FF2D9B] to-[#00D4FF]" />

          <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
            <div className="lux-hud-tag text-[#FFC107] border-[#FFC107]/30 bg-[#FFC107]/[0.08]">
              <Lock className="w-3.5 h-3.5 text-[#FFC107]" />
              Sessão Executiva Reservada
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] leading-tight text-[#F8F9FF]">
              Transforme a sua área comercial em uma{' '}
              <span className="lux-headline-hero">central de comando.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#9EADC8] leading-relaxed">
              Agende uma apresentação técnica privativa com o coordenador da plataforma e veja o
              sistema operando sobre a estrutura real da sua organização.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-black/40 border border-[#22C55E]/30 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto text-[#22C55E]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8F9FF]">Acesso Solicitado com Sucesso</h3>
              <p className="text-sm text-[#9EADC8] max-w-md mx-auto">
                Nossa equipe de engenharia e coordenação comercial entrará em contato em até 4 horas
                úteis para agendar a sua sessão reservada.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label
                  htmlFor="portal-name"
                  className="block text-xs font-mono uppercase text-[#9EADC8] mb-1.5 font-semibold"
                >
                  Nome Completo
                </label>
                <input
                  id="portal-name"
                  type="text"
                  required
                  value={name}
                  onFocus={() => SoundFX.play('focus')}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/[0.12] text-[#F8F9FF] text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors placeholder:text-white/30"
                />
              </div>

              <div>
                <label
                  htmlFor="portal-email"
                  className="block text-xs font-mono uppercase text-[#9EADC8] mb-1.5 font-semibold"
                >
                  E-mail Corporativo
                </label>
                <input
                  id="portal-email"
                  type="email"
                  required
                  value={email}
                  onFocus={() => SoundFX.play('focus')}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@suaempresa.com.br"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/[0.12] text-[#F8F9FF] text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors placeholder:text-white/30"
                />
              </div>

              <div>
                <label
                  htmlFor="portal-company"
                  className="block text-xs font-mono uppercase text-[#9EADC8] mb-1.5 font-semibold"
                >
                  Empresa &amp; Número de Vendedores
                </label>
                <input
                  id="portal-company"
                  type="text"
                  required
                  value={company}
                  onFocus={() => SoundFX.play('focus')}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: Logística Nacional (15 SDRs / Closers)"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/[0.12] text-[#F8F9FF] text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors placeholder:text-white/30"
                />
              </div>

              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  playSound={false}
                  className="w-full lux-btn-primary !py-3.5 !text-sm !font-bold"
                >
                  {isSubmitting ? 'Processando Solicitação...' : 'Confirmar Solicitação de Acesso'}
                </MagneticButton>
              </div>

              <div className="pt-4 text-center">
                <Link
                  to="/login"
                  onClick={() => SoundFX.play('navigate')}
                  className="text-xs text-[#9EADC8] hover:text-[#00D4FF] transition-colors font-medium"
                >
                  Já possui credenciais de acesso corporativo?{' '}
                  <strong className="text-[#F8F9FF] underline">Entrar no Console</strong>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
