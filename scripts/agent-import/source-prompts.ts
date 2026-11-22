import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface SourcePrompt {
  name: string;
  jobRole?: string;
  category?: string;
  description?: string;
  systemPrompt: string;
  suggestedTools?: string[];
  recommendedModel?: string;
  temperature?: number;
  [key: string]: any;
}

const catalogPath = join(__dirname, 'data', 'prompts.catalog.json');
const rawData = readFileSync(catalogPath, 'utf-8');

/**
 * Catálogo dos 29 agentes curados com prompt especializado do Birth Hub 360°.
 * Mantém 100% de compatibilidade com build-normalized-catalog.ts e testes de integração.
 */
export const sourcePrompts: SourcePrompt[] = JSON.parse(rawData);

export function getPromptByName(name: string): SourcePrompt | undefined {
  return sourcePrompts.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

export default sourcePrompts;
