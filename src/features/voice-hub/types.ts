export type AgentTemplate = 'sales' | 'support' | 'custom';

export interface AgentConfig {
  name: string;
  template: AgentTemplate;
  description: string;
  language: string;
  tone: string[];
  speed: number;
  systemInstruction: string;
  analysisPrompt: string;
  questions: string[];
}

export interface Question {
  id?: string;
  text: string;
  expectedAnswerType?: string;
  [key: string]: unknown;
}
