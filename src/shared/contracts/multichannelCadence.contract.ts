/**
 * Contrato canônico para o subsistema de Cadência Multicanal Adaptativa com Opt-Out Unificado.
 * Onda 03 — Evolução 10
 */

export type CadenceChannel = 'email' | 'whatsapp' | 'voice';

export type CadenceStepAction =
  | 'send_email'
  | 'send_whatsapp'
  | 'initiate_voice_call'
  | 'wait_delay';

export interface CadenceStep {
  stepNumber: number;
  channel: CadenceChannel;
  action: CadenceStepAction;
  delayHoursAfterPrevious: number;
  templateId?: string;
  condition?: 'no_reply' | 'email_opened' | 'call_unanswered' | 'always';
}

export interface MultichannelCadenceEnrollment {
  enrollmentId: string;
  organizationId: string;
  cadenceId: string;
  leadId: string;
  contactEmail: string;
  contactPhone: string;
  currentStep: number;
  status: 'active' | 'completed' | 'paused' | 'opted_out' | 'failed';
  enrolledAt: string;
  lastActionAt?: string;
}

export interface StepDispatchResult {
  stepNumber: number;
  channel: CadenceChannel;
  executedAt: string;
  success: boolean;
  suppressedByOptOut: boolean;
  suppressionReason?: string;
  messageId?: string;
  callId?: string;
}

export interface IMultichannelCadencePort {
  enrollLead(params: {
    organizationId: string;
    cadenceId: string;
    leadId: string;
    contactEmail: string;
    contactPhone: string;
  }): Promise<MultichannelCadenceEnrollment>;
  executeNextStep(enrollmentId: string, organizationId: string): Promise<StepDispatchResult>;
  registerOptOutAndHalt(params: {
    organizationId: string;
    leadId: string;
    channelSource: CadenceChannel;
    reason: string;
  }): Promise<{ halted: boolean; channelsSuppressed: CadenceChannel[] }>;
}

/**
 * Porta de persistência durável para matrículas de cadência multicanal.
 *
 * Substitui o acesso direto ao `sharedCadenceEnrollmentsStore` (Map em memória por processo —
 * volátil em restart/deploy e divergente entre réplicas). A implementação de produção é
 * `PrismaMultichannelCadenceEnrollmentStore` (`src/shared/infra/`), sobre a tabela
 * `MultichannelCadenceEnrollment`. Todo método recebe `organizationId` explicitamente e toda
 * implementação DEVE filtrar por ele — isolamento por tenant nunca é opcional.
 *
 * O store é quem gera o `enrollmentId` (`enr-<uuid>`), mesmo formato já exposto aos consumidores.
 */
export interface IMultichannelCadenceEnrollmentStore {
  enroll(params: {
    organizationId: string;
    cadenceId: string;
    leadId: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<MultichannelCadenceEnrollment>;
  get(
    organizationId: string,
    enrollmentId: string,
  ): Promise<MultichannelCadenceEnrollment | undefined>;
  findByLead(
    organizationId: string,
    leadId: string,
  ): Promise<MultichannelCadenceEnrollment | undefined>;
  /**
   * Atualiza campos mutáveis de UMA matrícula, sempre com filtro duplo
   * `(organizationId, enrollmentId)` — nunca por `enrollmentId` sozinho.
   */
  update(
    organizationId: string,
    enrollmentId: string,
    patch: Partial<
      Pick<MultichannelCadenceEnrollment, 'currentStep' | 'status' | 'lastActionAt'>
    >,
  ): Promise<MultichannelCadenceEnrollment | undefined>;
  /**
   * Atualiza em lote TODAS as matrículas de um lead dentro do tenant — usado por
   * `registerOptOutAndHalt` para marcar `opted_out` em todas as cadências ativas do titular.
   * Retorna as matrículas atualizadas.
   */
  updateByLead(
    organizationId: string,
    leadId: string,
    patch: Partial<
      Pick<MultichannelCadenceEnrollment, 'currentStep' | 'status' | 'lastActionAt'>
    >,
  ): Promise<MultichannelCadenceEnrollment[]>;
}

