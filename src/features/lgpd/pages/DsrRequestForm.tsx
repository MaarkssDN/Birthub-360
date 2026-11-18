import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  DSR_RIGHT_TYPE_LABELS,
  DSR_RIGHT_TYPES,
  type DsrRightType,
  dsrApi,
  dsrErrorMessage,
} from './dsr.api.js';
import { DsrAlert } from './dsrShared.js';

const dsrRequestFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  rightType: z.enum(DSR_RIGHT_TYPES, { message: 'Selecione o tipo de solicitação.' }),
  preferredChannel: z.enum(['email', 'whatsapp']).optional(),
  details: z.string().trim().max(2000, 'Descreva em até 2000 caracteres.').optional(),
});

type DsrRequestFormValues = z.infer<typeof dsrRequestFormSchema>;

/**
 * Formulário público de solicitação de direitos (LGPD art. 18) — ponto de
 * entrada para o titular que ainda não recebeu nenhum e-mail do Birth Hub
 * 360. Renderizado na página `/privacy` (seção "Exercer seus direitos").
 *
 * Resposta do servidor é SEMPRE 202 genérica (anti-enumeração): o sucesso aqui
 * significa "recebido", nunca "seu e-mail existe" — a copy reforça isso.
 */
export function DsrRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DsrRequestFormValues>({
    resolver: zodResolver(dsrRequestFormSchema),
    defaultValues: { preferredChannel: 'email' },
  });

  const onSubmit = async (values: DsrRequestFormValues) => {
    setSubmitError(null);
    try {
      await dsrApi.submitRequest({
        email: values.email,
        rightType: values.rightType as DsrRightType,
        preferredChannel: values.preferredChannel || undefined,
        details: values.details?.trim() ? values.details.trim() : undefined,
      });
      setSubmitted(true);
      reset();
    } catch (err: unknown) {
      setSubmitError(
        dsrErrorMessage(
          err,
          'Não foi possível enviar sua solicitação agora. Tente novamente em instantes ou fale com o DPO.',
        ),
      );
    }
  };

  if (submitted) {
    return (
      <DsrAlert tone="success">
        <strong>Solicitação recebida.</strong> Se o e-mail informado estiver cadastrado, você
        receberá em instantes uma mensagem com o link de confirmação. Nada é alterado nos seus
        dados sem essa confirmação. Verifique também a pasta de spam. O prazo de resposta é de até
        15 dias (LGPD, art. 19).
      </DsrAlert>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400';
  const labelClass = 'block text-sm font-semibold text-ink mb-1.5';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {submitError && <DsrAlert tone="error">{submitError}</DsrAlert>}

      <div>
        <label htmlFor="dsr-email" className={labelClass}>
          E-mail cadastrado
        </label>
        <input
          id="dsr-email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          className={inputClass}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'dsr-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="dsr-email-error" className={errorClass} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="dsr-right-type" className={labelClass}>
          O que você deseja?
        </label>
        <select
          id="dsr-right-type"
          className={inputClass}
          aria-invalid={!!errors.rightType}
          aria-describedby={errors.rightType ? 'dsr-right-type-error' : undefined}
          {...register('rightType')}
        >
          <option value="">Selecione…</option>
          {DSR_RIGHT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DSR_RIGHT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.rightType && (
          <p id="dsr-right-type-error" className={errorClass} role="alert">
            {errors.rightType.message}
          </p>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>Canal preferencial de contato (opcional)</legend>
        <div className="flex gap-4 text-sm text-ink-2">
          <label className="inline-flex items-center gap-2">
            <input type="radio" value="email" {...register('preferredChannel')} /> E-mail
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" value="whatsapp" {...register('preferredChannel')} /> WhatsApp
          </label>
        </div>
        <p className="mt-1 text-xs text-ink-2/70">
          A confirmação de identidade é sempre feita pelo e-mail cadastrado — este campo é apenas
          informativo.
        </p>
      </fieldset>

      <div>
        <label htmlFor="dsr-details" className={labelClass}>
          Detalhes (opcional)
        </label>
        <textarea
          id="dsr-details"
          rows={3}
          maxLength={2000}
          placeholder="Ex.: qual dado precisa ser corrigido, ou em quais operações seus dados foram compartilhados."
          className={`${inputClass} resize-none`}
          aria-invalid={!!errors.details}
          aria-describedby={errors.details ? 'dsr-details-error' : 'dsr-details-hint'}
          {...register('details')}
        />
        {errors.details ? (
          <p id="dsr-details-error" className={errorClass} role="alert">
            {errors.details.message}
          </p>
        ) : (
          <p id="dsr-details-hint" className="mt-1 text-xs text-ink-2/70">
            Não inclua senhas nem dados de terceiros.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
      >
        {isSubmitting ? 'Enviando…' : 'Enviar solicitação'}
      </button>

      <p className="text-xs text-ink-2/70 leading-relaxed">
        Ao enviar, você declara que o e-mail informado é seu. O prazo de resposta é de até 15 dias
        (LGPD, art. 19). Se preferir, você também pode tratar diretamente com o DPO pelo e-mail da
        Política de Privacidade.
      </p>
    </form>
  );
}
