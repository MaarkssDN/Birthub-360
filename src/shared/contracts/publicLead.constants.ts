/**
 * Contrato canônico da captura pública de lead da landing 360°
 * (POST /api/public/demo-leads).
 * O texto e a versão abaixo são a fonte da verdade do consentimento LGPD desta finalidade.
 * O cliente envia `consentTextVersion` e `purpose`; o servidor grava o texto integral canônico
 * + a versão + o timestamp (relógio do servidor), e ignora qualquer texto enviado pelo cliente.
 *
 * Este texto NÃO é texto legal final — aguarda OK do Marcelo para publicação como política.
 */
export const LANDING_DEMO_CONSENT_VERSION = 'landing-demo-v1';

/** Finalidades aceitas no payload público (lista fechada). */
export const LANDING_DEMO_CONSENT_PURPOSES = ['agendamento_demonstracao'] as const;

export type LandingDemoConsentPurpose = (typeof LANDING_DEMO_CONSENT_PURPOSES)[number];

export const LANDING_DEMO_CONSENT_PURPOSE: LandingDemoConsentPurpose = 'agendamento_demonstracao';

/**
 * A cadeia ConsentAuditRecord exige purpose em CAIXA_ALTA_COM_UNDERSCORE
 * (`CONSENT_PURPOSE_PATTERN`). O valor da API pública permanece em minúsculas
 * (contrato com o Agente 02); só a âncora na cadeia usa este mapeamento.
 */
export const LANDING_DEMO_CONSENT_CHAIN_PURPOSE: Record<LandingDemoConsentPurpose, string> = {
  agendamento_demonstracao: 'AGENDAMENTO_DEMONSTRACAO',
};

export const LANDING_DEMO_CONSENT_TEXT =
  'Concordo com o tratamento dos dados estritamente para agendamento da demonstração conforme a LGPD.';

/** Valor gravado em Lead.source e usado na idempotência por e-mail + origem. */
export const LANDING_LEAD_SOURCE = 'landing_360';

export const LANDING_LEAD_EQUIPE_VALUES = ['1 a 5', '6 a 15', '16 a 50', '50+'] as const;

export type LandingLeadEquipe = (typeof LANDING_LEAD_EQUIPE_VALUES)[number];
