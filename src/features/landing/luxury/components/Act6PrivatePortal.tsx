import { CheckCircle2, Lock } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SoundFX } from '../../../../lib/soundEffects.js';
import { MagneticButton } from './MagneticButton.js';

const TEAM_SIZES = ['1 a 5', '6 a 15', '16 a 50', '50+'] as const;

const inputClass =
  'w-full px-4 py-3 rounded-lg bg-black/50 border border-white/[0.12] text-[#F8F9FF] text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors placeholder:text-white/30';
const labelClass = 'block text-xs font-mono uppercase text-[#9EADC8] mb-1.5 font-semibold';

export function Act6PrivatePortal() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    empresa: '',
    equipe: '6 a 15' as (typeof TEAM_SIZES)[number],
    consent: false,
    website: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.consent) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          whatsapp: form.whatsapp,
          equipe: form.equipe,
          empresa: form.empresa || undefined,
          consent: form.consent,
          website: form.website || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Não foi possível enviar sua solicitação. Tente novamente.');
      }
      SoundFX.play('success');
      setSubmitted(true);
    } catch (err) {
      SoundFX.play('error');
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar sua solicitação. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
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
              <h3 className="text-xl font-bold text-[#F8F9FF]">Solicitação Recebida</h3>
              <p className="text-sm text-[#9EADC8] max-w-md mx-auto">
                Registramos seu interesse na sessão executiva. Nossa equipe entrará em contato pelos
                canais informados para agendar a apresentação.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
              {/* Honeypot anti-spam — invisível para humanos */}
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
              >
                <label htmlFor="portal-website">Website</label>
                <input
                  id="portal-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="portal-name" className={labelClass}>
                  Nome Completo
                </label>
                <input
                  id="portal-name"
                  type="text"
                  required
                  value={form.nome}
                  onFocus={() => SoundFX.play('focus')}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="portal-email" className={labelClass}>
                    E-mail Corporativo
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    required
                    value={form.email}
                    onFocus={() => SoundFX.play('focus')}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="carlos@suaempresa.com.br"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="portal-whatsapp" className={labelClass}>
                    WhatsApp
                  </label>
                  <input
                    id="portal-whatsapp"
                    type="tel"
                    required
                    value={form.whatsapp}
                    onFocus={() => SoundFX.play('focus')}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="portal-company" className={labelClass}>
                  Empresa
                </label>
                <input
                  id="portal-company"
                  type="text"
                  value={form.empresa}
                  onFocus={() => SoundFX.play('focus')}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Ex: Logística Nacional"
                  className={inputClass}
                />
              </div>

              <fieldset className="m-0 border-0 p-0">
                <legend className={labelClass}>Tamanho da Equipe</legend>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setForm({ ...form, equipe: size })}
                      aria-pressed={form.equipe === size}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                        form.equipe === size
                          ? 'bg-[#00D4FF]/15 border-[#00D4FF]/50 text-[#00D4FF]'
                          : 'bg-black/40 border-white/[0.12] text-[#9EADC8] hover:border-[#00D4FF]/40 hover:text-[#F8F9FF]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex items-start gap-3 pt-1">
                <input
                  id="portal-consent"
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#00D4FF]"
                />
                <label htmlFor="portal-consent" className="text-xs text-[#9EADC8] leading-relaxed">
                  Autorizo o contato da equipe Birth Hub 360° sobre esta solicitação de sessão
                  executiva, conforme a LGPD.
                </label>
              </div>

              {error && (
                <p role="alert" className="text-xs text-[#FF2D9B] text-center">
                  {error}
                </p>
              )}

              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  playSound={false}
                  disabled={isSubmitting || !form.consent}
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
