export interface DailyCohortRollupRow {
  tenantId: string;
  cohortMonth: string; // YYYY-MM
  activeCustomers: number;
  retainedCustomers: number;
  mrrCents: number;
  churnedCents: number;
}

export interface DailyCohortAggregationStorePort {
  readPreAggregatedRollups(tenantId: string, monthsWindow: number): Promise<DailyCohortRollupRow[]>;
}

export class DailyAggregatedCohortService {
  constructor(private readonly store: DailyCohortAggregationStorePort) {}

  async getCommercialCohortReport(tenantId: string, monthsWindow: number = 12): Promise<{
    rows: (DailyCohortRollupRow & { retentionRatePct: number })[];
    usedPreAggregatedTable: true;
  }> {
    if (!tenantId?.trim()) {
      throw new Error('tenantId é obrigatório para leitura de coorte comercial.');
    }
    const rollups = await this.store.readPreAggregatedRollups(
      tenantId.trim(),
      Math.min(Math.max(1, monthsWindow), 36),
    );
    const rows = rollups.map((row) => ({
      ...row,
      retentionRatePct:
        row.activeCustomers > 0
          ? Number(((row.retainedCustomers / row.activeCustomers) * 100).toFixed(2))
          : 0,
    }));
    return {
      rows,
      usedPreAggregatedTable: true,
    };
  }
}
