import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getFirstInvalidLeadField,
  type LeadFieldErrors,
  type LeadFormField,
  mapLeadServerFieldErrors,
  normalizeBrazilianWhatsapp,
  validateLeadForm,
} from '@/features/landing/services/leadFormValidation';
import {
  getLeadSubmitErrorMessage,
  isAbortError,
  isLeadSubmitError,
  LEAD_CONSENT_PURPOSE,
  LEAD_CONSENT_TEXT_VERSION,
  LEAD_TEAM_SIZES,
  type LeadTeamSize,
  submitLead,
} from '@/features/landing/services/submitLead';
import { type HeroVariant, trackLeadFormSubmitted } from '@/lib/analytics/conversionTelemetry';
import { SoundFX } from '@/lib/soundEffects';

interface LeadCaptureFormProps {
  abVariant: HeroVariant;
}

export function LeadCaptureForm({ abVariant }: LeadCaptureFormProps) {
  // --- FORMULÁRIO OBJETIVO DE CAPTURA DE LEAD ---
  const [leadForm, setLeadForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    equipe: '6 a 15' as LeadTeamSize,
    consent: false,
    website: '',
  });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadFieldErrors, setLeadFieldErrors] = useState<LeadFieldErrors>({});
  const [leadSubmitError, setLeadSubmitError] = useState<string | null>(null);
  const leadNomeRef = useRef<HTMLInputElement>(null);
  const leadEmailRef = useRef<HTMLInputElement>(null);
  const leadWhatsappRef = useRef<HTMLInputElement>(null);
  const leadConsentRef = useRef<HTMLInputElement>(null);
  const leadEquipeGroupRef = useRef<HTMLDivElement>(null);
  const leadEquipeFocusRafRef = useRef<number | null>(null);
  const leadAbortRef = useRef<AbortController | null>(null);

  const leadFieldRefs: Partial<Record<LeadFormField, React.RefObject<HTMLInputElement | null>>> = {
    nome: leadNomeRef,
    email: leadEmailRef,
    whatsapp: leadWhatsappRef,
    consent: leadConsentRef,
  };

  const cancelEquipeFocusRaf = () => {
    if (leadEquipeFocusRafRef.current != null) {
      cancelAnimationFrame(leadEquipeFocusRafRef.current);
      leadEquipeFocusRafRef.current = null;
    }
  };

  const focusLeadField = (field: LeadFormField) => {
    cancelEquipeFocusRaf();
    if (field === 'equipe') {
      const selectedIndex = LEAD_TEAM_SIZES.indexOf(leadForm.equipe);
      const selected =
        (selectedIndex >= 0
          ? document.getElementById(`lead-equipe-option-${selectedIndex}`)
          : null) ??
        leadEquipeGroupRef.current?.querySelector<HTMLElement>(
          '[role="radio"][aria-checked="true"]',
        );
      (selected ?? leadEquipeGroupRef.current)?.focus();
      return;
    }
    leadFieldRefs[field]?.current?.focus();
  };

  useEffect(() => {
    return () => {
      cancelEquipeFocusRaf();
      leadAbortRef.current?.abort();
    };
  }, []);

  const handleEquipeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    current: LeadTeamSize,
  ) => {
    const currentIndex = LEAD_TEAM_SIZES.indexOf(current);
    const lastIndex = LEAD_TEAM_SIZES.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    } else {
      return;
    }

    event.preventDefault();
    const next = LEAD_TEAM_SIZES[nextIndex];
    setLeadForm({ ...leadForm, equipe: next });
    cancelEquipeFocusRaf();
    leadEquipeFocusRafRef.current = requestAnimationFrame(() => {
      leadEquipeFocusRafRef.current = null;
      document.getElementById(`lead-equipe-option-${nextIndex}`)?.focus();
    });
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadLoading) return;

    const fieldErrors = validateLeadForm(leadForm);
    setLeadFieldErrors(fieldErrors);
    setLeadSubmitError(null);

    const firstInvalid = getFirstInvalidLeadField(fieldErrors);
    if (firstInvalid) {
      focusLeadField(firstInvalid);
      return;
    }

    setLeadLoading(true);
    SoundFX.play('click');

    leadAbortRef.current?.abort();
    const controller = new AbortController();
    leadAbortRef.current = controller;

    try {
      const whatsapp = normalizeBrazilianWhatsapp(leadForm.whatsapp);
      await submitLead(
        {
          nome: leadForm.nome.trim(),
          email: leadForm.email.trim(),
          ...(whatsapp ? { whatsapp } : {}),
          equipe: leadForm.equipe,
          consent: true,
          consentTextVersion: LEAD_CONSENT_TEXT_VERSION,
          purpose: LEAD_CONSENT_PURPOSE,
          website: leadForm.website,
        },
        { signal: controller.signal },
      );
      setLeadSubmitted(true);
      trackLeadFormSubmitted(abVariant, {
        teamSize: leadForm.equipe,
        source: 'landing_form_objective',
      });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      if (isLeadSubmitError(error) && error.fields) {
        const mapped = mapLeadServerFieldErrors(error.fields);
        setLeadFieldErrors(mapped.fieldErrors);
        setLeadSubmitError(mapped.formMessage ?? getLeadSubmitErrorMessage(error));
        const firstInvalid = getFirstInvalidLeadField(mapped.fieldErrors);
        if (firstInvalid) {
          focusLeadField(firstInvalid);
        }
      } else {
        setLeadSubmitError(getLeadSubmitErrorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLeadLoading(false);
      }
    }
  };
  const firstInvalidLeadField = getFirstInvalidLeadField(leadFieldErrors);

  return (
    <>
      {/* ================================================================= */}
      {/* SEÇÃO 4: FORMULÁRIO OBJETIVO DE CONVERSÃO (DEMONSTRAÇÃO PRÁTICA)  */}
      {/* ================================================================= */}
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
                      Análise direta de casos reais aplicada ao seu modelo de negócio.
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
                      Cálculo detalhado de receita recuperável nos primeiros 90 dias.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    ✓
                  </span>
                  <div>
                    <strong className="text-xs font-bold text-slate-200 block">
                      Atendimento dedicado da equipe comercial
                    </strong>
                    <span className="text-xs text-slate-400">
                      Entraremos em contato para alinhar o melhor horário da sua agenda.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-200 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-[#00D4FF]" />
                <span>4 vagas remanescentes para o ciclo assistido desta semana.</span>
              </div>
            </div>

            {/* Bloco do Formulário ou Sucesso */}
            <div>
              {leadSubmitted ? (
                <div className="text-center py-8 space-y-4 rounded-2xl bg-slate-900/80 dark:bg-[#071322]/90 p-6 border border-emerald-500/30">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-cyan-400">Solicitação recebida</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Recebemos seus dados. Nossa equipe vai entrar em contato.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} noValidate className="space-y-3.5">
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
                      ref={leadNomeRef}
                      type="text"
                      required
                      autoComplete="name"
                      value={leadForm.nome}
                      onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                      placeholder="Ex: Mariana Albuquerque"
                      aria-invalid={Boolean(leadFieldErrors.nome)}
                      aria-describedby={leadFieldErrors.nome ? 'lead-nome-error' : undefined}
                      className="b360-form-input"
                    />
                    {leadFieldErrors.nome ? (
                      <p
                        id="lead-nome-error"
                        className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                      >
                        {leadFieldErrors.nome}
                      </p>
                    ) : null}
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
                      ref={leadEmailRef}
                      type="email"
                      required
                      autoComplete="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="voce@suaempresa.com.br"
                      aria-invalid={Boolean(leadFieldErrors.email)}
                      aria-describedby={leadFieldErrors.email ? 'lead-email-error' : undefined}
                      className="b360-form-input"
                    />
                    {leadFieldErrors.email ? (
                      <p
                        id="lead-email-error"
                        className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                      >
                        {leadFieldErrors.email}
                      </p>
                    ) : null}
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
                      ref={leadWhatsappRef}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={leadForm.whatsapp}
                      onChange={(e) => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      aria-invalid={Boolean(leadFieldErrors.whatsapp)}
                      aria-describedby={
                        leadFieldErrors.whatsapp ? 'lead-whatsapp-error' : undefined
                      }
                      className="b360-form-input"
                    />
                    {leadFieldErrors.whatsapp ? (
                      <p
                        id="lead-whatsapp-error"
                        className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                      >
                        {leadFieldErrors.whatsapp}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div
                      id="lead-equipe-label"
                      className="block text-xs font-mono text-slate-300 mb-1.5"
                    >
                      Tamanho da Equipe Comercial
                    </div>
                    <div
                      ref={leadEquipeGroupRef}
                      className="b360-team-chips"
                      role="radiogroup"
                      aria-labelledby="lead-equipe-label"
                      aria-invalid={Boolean(leadFieldErrors.equipe)}
                      aria-describedby={leadFieldErrors.equipe ? 'lead-equipe-error' : undefined}
                    >
                      {LEAD_TEAM_SIZES.map((sz, index) => {
                        const selected = leadForm.equipe === sz;
                        return (
                          <button
                            key={sz}
                            id={`lead-equipe-option-${index}`}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => setLeadForm({ ...leadForm, equipe: sz })}
                            onKeyDown={(event) => handleEquipeKeyDown(event, sz)}
                            className={`b360-chip-btn ${selected ? 'active' : ''}`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                    {leadFieldErrors.equipe ? (
                      <p
                        id="lead-equipe-error"
                        className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                      >
                        {leadFieldErrors.equipe}
                      </p>
                    ) : null}
                  </div>

                  <div className="pt-1">
                    <label
                      htmlFor="lead-consent"
                      className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      <input
                        id="lead-consent"
                        ref={leadConsentRef}
                        type="checkbox"
                        checked={leadForm.consent}
                        onChange={(e) => setLeadForm({ ...leadForm, consent: e.target.checked })}
                        required
                        aria-required="true"
                        aria-invalid={Boolean(leadFieldErrors.consent)}
                        aria-describedby={
                          leadFieldErrors.consent ? 'lead-consent-error' : undefined
                        }
                        className="mt-0.5 rounded border-slate-700 text-[#00D4FF] focus:ring-[#00D4FF]"
                      />
                      {/* TEXTO LEGAL PROVISÓRIO — aguarda OK do Marcelo. A retenção
                                operacional (90 dias sem avanço, ou 30 dias após a demo) e o
                                armazenamento do IP apenas como hash vêm do contrato do Agente 01
                                (PR #216) e ainda não são texto legal final. */}
                      <span>
                        Concordo com o tratamento do meu nome, e-mail e, se informado, WhatsApp,
                        exclusivamente para contato sobre a demonstração do BirthHub 360°. O IP é
                        guardado apenas como hash. Sem avanço, os dados ficam retidos por 90 dias;
                        após a demonstração, por 30 dias. Veja a{' '}
                        <Link
                          to="/privacy"
                          className="underline decoration-slate-500 underline-offset-2 hover:text-[#00D4FF] transition-colors"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Política de Privacidade
                        </Link>
                        .
                      </span>
                    </label>
                    {leadFieldErrors.consent ? (
                      <p
                        id="lead-consent-error"
                        className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                      >
                        {leadFieldErrors.consent}
                      </p>
                    ) : null}
                  </div>

                  <div id="lead-form-alert" role="alert" aria-live="assertive" aria-atomic="true">
                    {leadSubmitError ? (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/40 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="font-medium font-sans">
                          {leadSubmitError} Você pode tentar novamente sem perder os dados
                          preenchidos.
                        </p>
                      </div>
                    ) : firstInvalidLeadField && leadFieldErrors[firstInvalidLeadField] ? (
                      <p className="sr-only">{leadFieldErrors[firstInvalidLeadField]}</p>
                    ) : null}
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
                  >
                    <input
                      id="lead-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={leadForm.website}
                      onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={leadLoading}
                      aria-busy={leadLoading}
                      className="b360-submit-cta"
                    >
                      {leadLoading ? 'Enviando...' : 'GARANTIR MINHA DEMONSTRAÇÃO GRATUITA →'}
                    </button>
                    <p className="mt-2 text-center text-[10px] font-mono text-slate-400">
                      🔒 Zero spam · Contato só sobre a demonstração · Dados protegidos
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
