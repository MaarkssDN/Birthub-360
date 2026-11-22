export type PersonaDifficulty = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

export interface RoleplayPersona {
  id: string;
  name: string;
  title: string;
  companyType: string;
  difficulty: PersonaDifficulty;
  scenario: string;
  coreObjections: string[];
  personalityTraits: string[];
}

export interface RoleplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface SpinSellingScores {
  situation: number;
  problem: number;
  implication: number;
  needPayoff: number;
}

export interface RoleplayFeedback {
  overallScore: number;
  spinSellingScores: SpinSellingScores;
  objectionHandlingScore: number;
  strengths: string[];
  improvementAreas: string[];
  summary: string;
}

export interface RoleplaySession {
  id: string;
  organizationId: string;
  userId: string;
  personaId: string;
  status: 'ACTIVE' | 'COMPLETED';
  messages: RoleplayMessage[];
  feedback?: RoleplayFeedback;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleplayRepository {
  listPersonas(): Promise<RoleplayPersona[]>;
  getPersonaById(id: string): Promise<RoleplayPersona | null>;
  createSession(data: {
    organizationId: string;
    userId: string;
    personaId: string;
  }): Promise<RoleplaySession>;
  getSession(organizationId: string, sessionId: string): Promise<RoleplaySession | null>;
  addMessage(organizationId: string, sessionId: string, message: RoleplayMessage): Promise<void>;
  completeSession(
    organizationId: string,
    sessionId: string,
    feedback: RoleplayFeedback,
  ): Promise<void>;
  listSessionsByUser(organizationId: string, userId: string): Promise<RoleplaySession[]>;
}
