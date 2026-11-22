/**
 * Settings Infrastructure Layer — BirthHub 360
 * Clean Architecture Modular Prisma Implementation of ISettingsRepository
 */

import { prisma } from '../../../lib/prisma.js';
import type { ISettingsRepository, OrganizationSettings } from '../domain/SettingsDomain.js';

export class PrismaSettingsRepository implements ISettingsRepository {
  async findByOrganizationId(organizationId: string): Promise<OrganizationSettings | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) return null;

    return {
      organizationId: org.id,
      companyName: org.name,
      cnpj: (org as any).cnpj || undefined,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      defaultLeadSource: 'Outbound',
      aiEngineConfig: {
        preferredProvider: 'litellm',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2048,
      },
      revOpsRules: {
        leadDeduplicationStrategy: 'EXACT_CNPJ',
        autoAssignmentEnabled: true,
        voiceCallRecordingRetentionDays: 90,
      },
      updatedAt: org.updatedAt,
    };
  }

  async saveSettings(settings: OrganizationSettings): Promise<OrganizationSettings> {
    const updated = await prisma.organization.update({
      where: { id: settings.organizationId },
      data: {
        name: settings.companyName,
      },
    });

    return {
      ...settings,
      companyName: updated.name,
      updatedAt: updated.updatedAt,
    };
  }
}
