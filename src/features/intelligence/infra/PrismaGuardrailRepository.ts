import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import type {
  CreateGuardrailEventData,
  GuardrailEventEntity,
  GuardrailRepository,
} from '../domain/Guardrail.js';

export class PrismaGuardrailRepository implements GuardrailRepository {
  async recordEvent(data: CreateGuardrailEventData): Promise<GuardrailEventEntity | null> {
    try {
      const row = await prisma.aIGuardrailEvent.create({
        data: {
          type: data.type,
          source: data.source,
          organizationId: data.organizationId,
        },
      });
      return {
        id: row.id,
        type: row.type,
        source: row.source,
        organizationId: row.organizationId,
        createdAt: row.createdAt,
      };
    } catch (err: any) {
      logger.warn(
        { err, type: data.type, source: data.source, organizationId: data.organizationId },
        'Falha ao registrar AIGuardrailEvent no banco (telemetria best-effort).',
      );
      return null;
    }
  }
}

export const prismaGuardrailRepository = new PrismaGuardrailRepository();
