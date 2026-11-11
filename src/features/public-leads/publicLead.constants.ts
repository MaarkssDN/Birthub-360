/**
 * Contrato canônico da captura pública de lead da landing 360° (POST /api/public/leads).
 * O texto e a versão abaixo são a fonte da verdade do consentimento LGPD desta finalidade.
 * O cliente deve enviar `consentTextVersion` igual a LANDING_DEMO_CONSENT_VERSION; o servidor
 * grava o texto integral + a versão + o timestamp, e ignora qualquer texto enviado pelo cliente.
 */
export const LANDING_DEMO_CONSENT_VERSION = 'landing-demo-v1';

export const LANDING_DEMO_CONSENT_PURPOSE = 'agendamento_demonstracao';

export const LANDING_DEMO_CONSENT_TEXT =
  'Concordo com o tratamento dos dados estritamente para agendamento da demonstração conforme a LGPD.';

/** Valor gravado em Lead.source e usado na idempotência por e-mail + origem. */
export const LANDING_LEAD_SOURCE = 'landing_360';

export const LANDING_LEAD_EQUIPE_VALUES = ['1 a 5', '6 a 15', '16 a 50', '50+'] as const;

export type LandingLeadEquipe = (typeof LANDING_LEAD_EQUIPE_VALUES)[number];
