export interface LeadTimelineEvent {
  id: string;
  tenantId: string;
  leadId: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'NOTE' | 'STAGE_CHANGE' | 'MEETING';
  summary: string;
  createdAt: Date;
}

export interface TimelineCursorQuery {
  tenantId: string;
  leadId: string;
  limit?: number;
  cursor?: string | null;
}

export interface PaginatedTimelineResult {
  items: LeadTimelineEvent[];
  nextCursor: string | null;
  hasMore: boolean;
  pageSize: number;
}

export interface TimelineRepositoryPort {
  findManyByCursor(params: {
    tenantId: string;
    leadId: string;
    take: number;
    cursorId?: string;
  }): Promise<LeadTimelineEvent[]>;
}

export const DEFAULT_TIMELINE_PAGE_LIMIT = 20;
export const MAX_TIMELINE_PAGE_LIMIT = 100;

export class LeadTimelineService {
  constructor(private readonly repo: TimelineRepositoryPort) {}

  async getLeadTimelinePage(query: TimelineCursorQuery): Promise<PaginatedTimelineResult> {
    if (!query.tenantId?.trim()) {
      throw new Error('tenantId é obrigatório para consultar a timeline do lead.');
    }
    if (!query.leadId?.trim()) {
      throw new Error('leadId é obrigatório para consultar a timeline do lead.');
    }

    const rawLimit = query.limit ?? DEFAULT_TIMELINE_PAGE_LIMIT;
    const pageSize = Math.min(Math.max(1, Math.trunc(rawLimit)), MAX_TIMELINE_PAGE_LIMIT);

    // Busca pageSize + 1 itens para saber se há próxima página sem precisar de COUNT(*) extra.
    const rows = await this.repo.findManyByCursor({
      tenantId: query.tenantId,
      leadId: query.leadId,
      take: pageSize + 1,
      cursorId: query.cursor ? query.cursor : undefined,
    });

    const hasMore = rows.length > pageSize;
    const items = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
      pageSize,
    };
  }
}
