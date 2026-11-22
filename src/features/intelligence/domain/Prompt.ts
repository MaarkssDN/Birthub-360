/**
 * Tipos de domínio e Porta (Repository) para Prompts de Inteligência Artificial
 * (Estilo B — Porta leve com injeção explícita, sem container de DI)
 */

export interface PromptEntity {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  content: string;
  variables?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePromptData {
  organizationId: string;
  name: string;
  category: string;
  content: string;
  variables?: Record<string, unknown>;
}

export interface UpdatePromptData {
  name?: string;
  category?: string;
  content?: string;
  variables?: Record<string, unknown>;
}

export interface PromptRepository {
  listByOrganization(organizationId: string): Promise<PromptEntity[]>;
  findById(organizationId: string, id: string): Promise<PromptEntity | null>;
  findByCategory(organizationId: string, category: string): Promise<PromptEntity | null>;
  create(data: CreatePromptData): Promise<PromptEntity>;
  update(organizationId: string, id: string, data: UpdatePromptData): Promise<PromptEntity | null>;
  deleteById(organizationId: string, id: string): Promise<boolean>;
}
