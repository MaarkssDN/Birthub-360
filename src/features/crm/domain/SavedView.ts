/**
 * Tipos de domínio e Porta (Repository) para Saved Views do pipeline CRM
 * (Onda B2b, Commercial AI OS)
 */

export interface SavedViewFilters {
  owner?: string;
  q?: string;
}

export interface SavedViewEntity {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  funnel: string;
  filters: SavedViewFilters;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavedViewData {
  organizationId: string;
  userId: string;
  name: string;
  funnel: string;
  filters: SavedViewFilters;
}

export interface SavedViewRepository {
  listByUser(organizationId: string, userId: string): Promise<SavedViewEntity[]>;
  create(data: CreateSavedViewData): Promise<SavedViewEntity>;
  deleteById(organizationId: string, userId: string, id: string): Promise<number>;
}
