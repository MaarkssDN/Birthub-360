import { LeadStatus } from '@prisma/client';

/**
 * TAREFA-SANEAMENTO-018 (BT360-DT-0024): as listas `LEAD_STAGES`/`DEAL_STAGES` (e o tipo
 * `DefaultStage`) moravam dentro de `PrismaCrm360Repository.ts`, um hotspot estrutural que o
 * gate `check:hotspots` já limitava a 1210 linhas. Extraídas para cá sem nenhuma mudança de
 * conteúdo — são dados de provisionamento do funil padrão, não lógica do repositório.
 */
export type DefaultStage = {
  name: string;
  code: string;
  color: string;
  probability: number;
  leadStatus: LeadStatus;
  isWon?: boolean;
  isLost?: boolean;
};

export const LEAD_STAGES: DefaultStage[] = [
  {
    name: 'Lead Recebido',
    code: 'lead-recebido',
    color: '#3b82f6',
    probability: 5,
    leadStatus: LeadStatus.Lead_Recebido,
  },
  {
    name: 'Cadência Iniciada',
    code: 'cadencia-iniciada',
    color: '#6366f1',
    probability: 10,
    leadStatus: LeadStatus.Cadencia_Iniciada,
  },
  {
    name: 'Qualificação (SDR)',
    code: 'qualificacao-sdr',
    color: '#8b5cf6',
    probability: 25,
    leadStatus: LeadStatus.Qualificacao_SDR,
  },
  {
    name: 'Reunião Agendada',
    code: 'reuniao-agendada',
    color: '#06b6d4',
    probability: 45,
    leadStatus: LeadStatus.Reuniao_Agendada,
  },
  {
    name: 'Convertido em Oportunidade',
    code: 'convertido',
    color: '#10b981',
    probability: 60,
    leadStatus: LeadStatus.Convertido_em_Oportunidade,
  },
  {
    name: 'Lead Desqualificado',
    code: 'desqualificado',
    color: '#ef4444',
    probability: 0,
    leadStatus: LeadStatus.Lead_Desqualificado,
    isLost: true,
  },
];

export const DEAL_STAGES: DefaultStage[] = [
  {
    name: 'Nova Oportunidade',
    code: 'nova-oportunidade',
    color: '#3b82f6',
    probability: 15,
    leadStatus: LeadStatus.Nova_Oportunidade,
  },
  {
    name: 'Proposta Enviada',
    code: 'proposta-enviada',
    color: '#8b5cf6',
    probability: 45,
    leadStatus: LeadStatus.Proposta_Enviada,
  },
  {
    name: 'Call/Visita Agendada',
    code: 'call-visita',
    color: '#06b6d4',
    probability: 60,
    leadStatus: LeadStatus.Call_Visita_Agendada,
  },
  {
    name: 'Piloto VTECH',
    code: 'piloto-vtech',
    color: '#f59e0b',
    probability: 70,
    leadStatus: LeadStatus.Piloto_VTECH,
  },
  {
    name: 'Piloto Birthub 360 Profile',
    code: 'piloto-profile',
    color: '#f97316',
    probability: 75,
    leadStatus: LeadStatus.Piloto_Birthub360_Profile,
  },
  {
    name: 'Piloto Birthub 360 Profile - Concluído',
    code: 'piloto-profile-concluido',
    color: '#84cc16',
    probability: 85,
    leadStatus: LeadStatus.Piloto_Birthub360_Profile_Concluido,
  },
  {
    name: 'Piloto Birthub 360 Profile - Cancelado',
    code: 'piloto-profile-cancelado',
    color: '#f43f5e',
    probability: 0,
    leadStatus: LeadStatus.Piloto_Birthub360_Profile_Cancelado,
    isLost: true,
  },
  {
    name: 'Piloto Logística',
    code: 'piloto-logistica',
    color: '#eab308',
    probability: 75,
    leadStatus: LeadStatus.Piloto_Logistica,
  },
  {
    name: 'Piloto Logístico - Concluído',
    code: 'piloto-logistico-concluido',
    color: '#22c55e',
    probability: 90,
    leadStatus: LeadStatus.Piloto_Logistico_Concluido,
  },
  {
    name: 'Piloto Logístico - Cancelado',
    code: 'piloto-logistico-cancelado',
    color: '#ef4444',
    probability: 0,
    leadStatus: LeadStatus.Piloto_Logistico_Cancelado,
    isLost: true,
  },
  {
    name: 'Negócios Ganhos',
    code: 'ganho',
    color: '#10b981',
    probability: 100,
    leadStatus: LeadStatus.Negocios_Ganhos,
    isWon: true,
  },
  {
    name: 'Negócios Perdidos',
    code: 'perdido',
    color: '#dc2626',
    probability: 0,
    leadStatus: LeadStatus.Negocios_Perdidos,
    isLost: true,
  },
];
