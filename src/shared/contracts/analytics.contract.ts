/**
 * Fonte única de verdade para o contrato de `OverviewMetrics` — o resumo agregado de KPIs do CRM
 * (empresas, contatos, leads, atividades, funil, pipeline) usado tanto pela API de Analytics
 * (`/api/analytics/overview`, `/api/analytics/dashboard`) quanto pelo relatório semanal em PDF.
 */
export interface OverviewMetrics {
  totalCompanies: number;
  totalContacts: number;
  /** Leads em aberto (fora dos status de fechamento: ganho, perdido, desqualificado, piloto cancelado). */
  totalLeads: number;
  totalActivities: number;
  pendingActivities: number;
  overdueActivities: number;
  closedThisMonth: number;
  lostThisMonth: number;
  conversionRate: number;
  /** Média do score dos leads em aberto, ou `null` se nenhum lead tem score preenchido. */
  averageScore: number | null;
  /**
   * Soma de `Lead.amount` dos leads em aberto (fora de ganho/perdido/desqualificado/piloto
   * cancelado) que têm valor preenchido. `null` quando nenhum lead em aberto tem `amount` preenchido.
   */
  pipelineValue: number | null;
  /**
   * Soma de `Lead.amount` dos negócios fechados como GANHOS (`Negocios_Ganhos`) no mês corrente.
   * `null` quando não há negócios ganhos com valor no mês.
   */
  wonRevenueThisMonth?: number | null;
  /**
   * Ticket médio dos negócios fechados como GANHOS no mês corrente (`wonRevenueThisMonth / closedThisMonth`).
   * `null` quando não há fechamentos no mês.
   */
  averageTicketThisMonth?: number | null;
  /**
   * Volume financeiro total histórico de negócios ganhos na organização.
   */
  totalWonRevenueEver?: number | null;
}
