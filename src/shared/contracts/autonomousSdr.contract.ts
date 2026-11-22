/**
 * Contrato canônico para o subsistema de SDR Autônomo com Discagem e Agendamento.
 * Onda 03 — Evolução 09
 */

export type SdrCallDisposition =
  | 'meeting_scheduled'
  | 'callback_requested'
  | 'not_interested'
  | 'wrong_number'
  | 'voicemail'
  | 'call_failed_hours_restriction';

export type LeadQualificationStatus = 'qualified' | 'disqualified' | 'nurture';

export interface SdrCallInput {
  organizationId: string;
  leadId: string;
  leadName: string;
  companyName: string;
  phoneNumber: string;
  timezone?: string;
  sellerId: string;
  sellerEmail: string;
  sellerCalendarId?: string;
  callGoal?: string;
  referenceTimestamp?: Date | string;
}

export interface ScheduledMeetingProposal {
  meetingId: string;
  organizationId: string;
  leadId: string;
  sellerId: string;
  title: string;
  startTime: string;
  endTime: string;
  googleCalendarEventId?: string;
  googleMeetLink?: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled';
  /**
   * true quando o agendamento é simulado localmente (sem integração real com
   * Google Calendar/Meet). Consumidores NÃO devem apresentar como reunião real.
   */
  simulated?: boolean;
}

export interface SdrCallExecutionResult {
  callId: string;
  organizationId: string;
  leadId: string;
  executedAt: string;
  durationSeconds: number;
  disposition: SdrCallDisposition;
  qualification: LeadQualificationStatus;
  qualificationNotes: string;
  meetingScheduled?: ScheduledMeetingProposal;
  transcriptSnippet?: string;
  wasWithinAllowedHours: boolean;
  /**
   * true quando o resultado da chamada é simulado (sem discagem/STT real).
   * durationSeconds, qualificationNotes e transcriptSnippet são fabricados.
   */
  simulated?: boolean;
}

export interface IAutonomousSdrPort {
  initiateOutboundCall(input: SdrCallInput): Promise<SdrCallExecutionResult>;
  scheduleCalendarMeeting(params: {
    organizationId: string;
    leadId: string;
    sellerId: string;
    sellerEmail: string;
    preferredSlotIso: string;
    title: string;
  }): Promise<ScheduledMeetingProposal>;
}
