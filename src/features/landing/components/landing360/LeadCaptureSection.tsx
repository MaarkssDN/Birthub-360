import { CheckCircle2, Clock, Lock } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import {
  type HeroVariant,
  trackLeadFormSubmitted,
} from '@/lib/analytics/conversionTelemetry';
import { SoundFX } from '@/lib/soundEffects';
import {
  LANDING_DEMO_CONSENT_PURPOSE,
  LANDING_DEMO_CONSENT_TEXT,
  LANDING_DEMO_CONSENT_VERSION,
} from '@/shared/contracts/publicLead.constants';

interface LeadCaptureSectionProps {
  abVariant: HeroVariant;
}

/** Formulário objetivo de conversão — demonstração prática (LGPD: consentimento nunca pré-marcado). */
export function LeadCaptureSection({ abVariant }: LeadCaptureSectionProps) {
  // --- FORMULÁRIO OBJETIVO DE CAPTURA DE LEAD ---
  // LGPD (validação Agente 21, 2026-11-13): consentimento NUNCA pré-marcado;
  // o texto exibido é o canônico gravado pelo servidor (publicLead.constants).
  const [leadForm, setLeadForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    equipe: '6 a 15',
    consent: false,
    website: '',
  });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState('');

  // Validação mínima de WhatsApp BR: DDI opcional + DDD + número (10–13 dígitos no total).
  const isValidWhatsapp = (raw: string): boolean => {
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  };

  const leadSubmitErrorMessage = (code?: string): string => {
    if (code === 'invalid_payload') {
      return 'Verifique os dados informados e tente novamente.';
    }
    if (code === 'rate_limited') {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    }
    if (code === 'unavailable') {
      return 'Canal de contato temporariamente indisponível. Tente novamente mais tarde.';
    }
    return 'Não foi possível enviar sua solicitação agora. Tente novamente em instantes.';
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');
    // LGPD: consentimento nunca pré-marcado — o envio exige a caixa marcada.
    if (!leadForm.consent) {
      setLeadError('É necessário concordar com o tratamento de dados (LGPD) para continuar.');
      return;
    }
    // WhatsApp é opcional (decisão LGPD confirmada): só valida formato se preenchido.
    if (leadForm.whatsapp.trim() !== '' && !isValidWhatsapp(leadForm.whatsapp)) {
      setLeadError('Informe um WhatsApp válido com DDD (ex: (11) 99999-9999).');
      return;
    }
    setLeadLoading(true);
    SoundFX.play('click');
    try {
      // Contrato real: POST /api/public/demo-leads (Agente 01, PR #216).
      // O servidor valida consent === true, consentTextVersion e purpose,
      // e ancora a prova em ConsentAuditRecord com IP hasheado e timestamp do servidor.
      // Qualquer falha é exibida de forma observável — nunca sucesso falso.
      const res = await fetch('/api/public/demo-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: leadForm.nome,
          email: leadForm.email,
          whatsapp: leadForm.whatsapp.trim() === '' ? undefined : leadForm.whatsapp,
          equipe: leadForm.equipe,
          consent: true,
          consentTextVersion: LANDING_DEMO_CONSENT_VERSION,
          purpose: LANDING_DEMO_CONSENT_PURPOSE,
          website: leadForm.website || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        success?: boolean;
        error?: string;
      } | null;
      if (!res.ok || data?.ok === false || data?.success === false) {
        setLeadError(leadSubmitErrorMessage(data?.error));
        return;
      }
      setLeadSubmitted(true);
      trackLeadFormSubmitted(abVariant, {
        teamSize: leadForm.equipe,
        source: 'landing_form_objective',
      });
    } catch {
      setLeadError('Falha de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <section className="b360-lead-capture-wrapper" id="demonstracao">
      <div className="b360-lead-card">
        <div className="b360-lead-grid">
          {/* Bloco de Benefícios da Sessão */}
          <div>
            <div className="b360-eyebrow">SESSÃO PRÁTICA EXCLUSIVA</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Veja sua operação comercial operando em 360°.
            </h2>
            <p className="text-sm text-slate-300 dark:text-slate-400 leading-relaxed mb-6">
              Em 25 minutos, nosso arquiteto de receita mostrará como identificar gargalos no seu
              funil, recuperar propostas e implantar copilotos de IA com total controle.
            </p>

            <div className="space-y-3.5 mb-6">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[#00D4FF] text-xs font-bold">
                  ✓
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-200 block">
                    Demonstração sem slides genéricos
                  </strong>
                  <span className="text-xs text-slate-400">
                    Análise direta de cenários aplicados ao seu modelo de negócio.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-[#FF2D9B] text-xs font-bold">
                  ✓
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-200 block">
                    Simulação de ROI e Previsibilidade
                  </strong>
                  <span className="text-xs text-slate-400">
                    Estimativa ilustrativa de receita recuperável em um horizonte de 90 dias.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  ✓
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-200 block">
                    Retorno por canal informado
                  </strong>
                  <span className="text-xs text-slate-400">
                    Nossa equipe contata você para alinhar o melhor horário da agenda.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-200 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-[#00D4FF]" />
              <span>Sessão assistida por um especialista de operações comerciais.</span>
            </div>
          </div>

          {/* Bloco do Formulário ou Sucesso */}
          <div>
            {leadSubmitted ? (
              <div className="text-center py-8 space-y-4 rounded-2xl bg-slate-900/80 dark:bg-[#071322]/90 p-6 border border-emerald-500/30">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-cyan-400">
                  Solicitação Recebida! · Sessão Solicitada com Sucesso
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Recebemos sua solicitação para <strong>{leadForm.email}</strong>. Nossa equipe
                  entrará em contato pelo e-mail informado
                  {leadForm.whatsapp.trim() !== '' ? ' ou WhatsApp' : ''} para agendar a
                  demonstração.
                </p>
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLeadSubmitted(false)}
                    className="text-[11px] font-mono text-slate-400 hover:text-slate-200 underline"
                  >
                    Editar dados enviados
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                {/* Honeypot anti-spam: invisível para humanos, bots preenchem. */}
                <input
                  type="text"
                  name="website"
                  value={leadForm.website ?? ''}
                  onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <div className="mb-2">
                  <h3 className="text-base font-bold text-cyan-400">
                    Reserve sua Demonstração Técnica
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preencha os dados essenciais para receber o acesso seguro:
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="lead-nome"
                    className="block text-xs font-mono text-slate-300 mb-1"
                  >
                    Nome Completo *
                  </label>
                  <input
                    id="lead-nome"
                    type="text"
                    required
                    value={leadForm.nome}
                    onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                    placeholder="Ex: Mariana Albuquerque"
                    className="b360-form-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-email"
                    className="block text-xs font-mono text-slate-300 mb-1"
                  >
                    E-mail Corporativo *
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="voce@suaempresa.com.br"
                    className="b360-form-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-whatsapp"
                    className="block text-xs font-mono text-slate-300 mb-1"
                  >
                    WhatsApp Comercial com DDD (opcional)
                  </label>
                  <input
                    id="lead-whatsapp"
                    type="tel"
                    value={leadForm.whatsapp}
                    onChange={(e) => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="b360-form-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Tamanho da Equipe Comercial
                  </label>
                  <div className="b360-team-chips">
                    {['1 a 5', '6 a 15', '16 a 50', '50+'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setLeadForm({ ...leadForm, equipe: sz })}
                        className={`b360-chip-btn ${leadForm.equipe === sz ? 'active' : ''}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leadForm.consent}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, consent: e.target.checked })
                      }
                      required
                      className="mt-0.5 rounded border-slate-700 text-[#00D4FF] focus:ring-[#00D4FF]"
                    />
                    <span>{LANDING_DEMO_CONSENT_TEXT}</span>
                  </label>
                </div>

                {leadError && (
                  <p role="alert" className="text-[11px] font-mono text-red-400 text-center">
                    {leadError}
                  </p>
                )}

                <div className="pt-2">
                  <button type="submit" disabled={leadLoading} className="b360-submit-cta">
                    {leadLoading ? 'Enviando Solicitação...' : 'SOLICITAR DEMONSTRAÇÃO GRATUITA →'}
                  </button>
                  <p className="mt-2 text-center text-[10px] font-mono text-slate-400">
                    <Lock className="inline w-3 h-3 mr-1" aria-hidden="true" />
                    Cancelamento a qualquer momento · Dados protegidos
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
