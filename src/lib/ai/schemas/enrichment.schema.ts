/**
 * Schemas Zod para extração estruturada de enriquecimento de dados
 */
import { z } from 'zod';

export const EnrichmentSchema = z.object({
  leadId: z.string().optional(),
  empresaId: z.string().optional(),
  fonte: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  dados: z.object({
    website: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    revenue: z.string().optional(),
    funcionarios: z.string().optional(),
    setor: z.string().optional(),
    tecnologia: z.array(z.string()).optional(),
    localizacao: z
      .object({
        cidade: z.string().optional(),
        estado: z.string().optional(),
        pais: z.string().optional(),
      })
      .optional(),
    descricao: z.string().optional(),
    fundacao: z.string().optional(),
  }),
  metadados: z
    .object({
      dataEnriquecimento: z.string().optional(),
      confiabilidade: z.enum(['alta', 'media', 'baixa']).optional(),
      fonteDados: z.array(z.string()).optional(),
    })
    .optional(),
});

export type Enrichment = z.infer<typeof EnrichmentSchema>;
