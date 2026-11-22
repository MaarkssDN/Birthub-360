/**
 * Schemas Zod para extração estruturada de empresas
 */
import { z } from 'zod';

export const CompanySchema = z.object({
  razaoSocial: z.string().min(2, 'Razão social deve ter pelo menos 2 caracteres'),
  cnpj: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  setor: z.string().optional(),
  subsector: z.string().optional(),
  tamanho: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  revenue: z.string().optional(),
  endereco: z
    .object({
      rua: z.string().optional(),
      numero: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      cep: z.string().optional(),
      pais: z.string().optional(),
    })
    .optional(),
  fundacao: z.string().optional(),
  descricao: z.string().optional(),
  tecnologias: z.array(z.string()).optional(),
});

export type Company = z.infer<typeof CompanySchema>;
