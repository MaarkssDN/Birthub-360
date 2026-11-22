/**
 * Tipos para o componente de Diagnóstico SDR
 * Módulo: Commercial Intelligence (Agente 04)
 */

export interface DailyTask {
  id: string;
  timeBlock: string;
  title: string;
  description: string;
  tool: string;
  targetCount?: string;
  completed: boolean;
}

export interface CallAnalysisResult {
  score: number;
  talkListenRatio: string;
  qualificationTime: string;
  lockedNextStep: boolean;
  strengths: string[];
  improvements: string[];
}

export type ChannelTag = '[WhatsApp]' | '[Ligação]' | '[E-mail]' | '[LinkedIn]';

export type ActiveTab =
  | 'daily'
  | 'julho'
  | 'agosto'
  | 'comparativo'
  | 'emcadencia'
  | 'diagnostico'
  | 'iacoach'
  | 'pauta1to1';

export type SegmentKey = 'transportadora' | 'agro' | 'embarcador' | 'terceirizacao';
