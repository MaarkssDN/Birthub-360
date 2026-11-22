/**
 * Schemas Zod para extração estruturada de leads
 */
import { z } from 'zod';

export const LeadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  setor: z.string().optional(),
  tamanhoEmpresa: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  revenue: z.string().optional(),
  fonte: z.string().optional(),
  notas: z.string().optional(),
});

export type Lead = z.infer<typeof LeadSchema>;
