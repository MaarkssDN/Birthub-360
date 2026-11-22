/**
 * Validação de saída estruturada com Zod
 * Valida respostas de IA contra schemas e implementa retry automático
 */
import { z } from 'zod';

export interface ValidationOptions {
  maxRetries?: number;
  fallbackToPartial?: boolean;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  partialData?: Partial<T>;
  attempts: number;
}

export async function validateStructuredOutput<T>(
  response: string,
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {},
): Promise<ValidationResult<T>> {
  const { maxRetries = 3, fallbackToPartial = false } = options;
  let attempts = 0;
  let lastError: string | undefined;

  for (let i = 0; i < maxRetries; i++) {
    attempts++;

    try {
      // Tentar parsear JSON da resposta
      let parsed: unknown;
      try {
        parsed = JSON.parse(response);
      } catch (parseError) {
        lastError = `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
        continue;
      }

      // Validar contra schema Zod
      const result = schema.safeParse(parsed);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          attempts,
        };
      }

      lastError = `Zod validation error: ${result.error.issues.map((e: any) => e.message).join(', ')}`;

      // Se fallbackToPartial, tentar extrair dados parciais
      if (fallbackToPartial && i === maxRetries - 1) {
        const partialData = extractPartialData(parsed, schema);
        return {
          success: false,
          error: lastError,
          partialData,
          attempts,
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    success: false,
    error: lastError || 'Validation failed after max retries',
    attempts,
  };
}

function extractPartialData<T>(parsed: unknown, schema: z.ZodSchema<T>): Partial<T> {
  // Implementação simplificada: extrair campos que validam individualmente
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }

  const partial: Partial<T> = {};
  const parsedObj = parsed as Record<string, unknown>;

  // Se o schema for um object schema, tentar validar cada campo individualmente
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    for (const [key, fieldSchema] of Object.entries(shape)) {
      if (key in parsedObj) {
        try {
          const fieldResult = (fieldSchema as z.ZodSchema).safeParse(parsedObj[key]);
          if (fieldResult.success) {
            (partial as Record<string, unknown>)[key] = fieldResult.data;
          }
        } catch {
          // Ignorar erros em campos individuais
        }
      }
    }
  }

  return partial;
}

// Funções auxiliares para schemas específicos
export async function validateLead(response: string, options?: ValidationOptions) {
  const { LeadSchema } = await import('../schemas/lead.schema.js');
  return validateStructuredOutput(response, LeadSchema, options);
}

export async function validateCompany(response: string, options?: ValidationOptions) {
  const { CompanySchema } = await import('../schemas/company.schema.js');
  return validateStructuredOutput(response, CompanySchema, options);
}

export async function validateEnrichment(response: string, options?: ValidationOptions) {
  const { EnrichmentSchema } = await import('../schemas/enrichment.schema.js');
  return validateStructuredOutput(response, EnrichmentSchema, options);
}
