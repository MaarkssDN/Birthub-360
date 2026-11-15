import {
  Bot,
  CheckSquare,
  Cpu,
  Database,
  FileCode,
  Gauge,
  GraduationCap,
  Layers,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  Workflow,
} from 'lucide-react';

export type IntelligenceTab =
  | 'telemetry'
  | 'ai_suite'
  | 'swarm'
  | 'ecosystem'
  | 'methodologies'
  | 'ai_config'
  | 'superagent'
  | 'scripts'
  | 'automations'
  | 'actions'
  | 'generator'
  | 'tools'
  | 'rag'
  | 'quality'
  | 'copiloto'
  | 'commercial_cell';

export type ToolCategory = 'all' | 'agents' | 'tactical' | 'governance' | 'infra';
export type ViewMode = 'grid' | 'matrix';

export interface ToolCategoryConfig {
  id: ToolCategory;
  label: string;
  icon: typeof Bot;
  description: string;
  badgeLabel: string;
}

export const CATEGORIES: ToolCategoryConfig[] = [
  {
    id: 'all',
    label: 'Todas as Capacidades',
    icon: Layers,
    description: 'Visão unificada de todas as ferramentas e agentes de IA da plataforma.',
    badgeLabel: 'Ecossistema 360°',
  },
  {
    id: 'agents',
    label: 'Células & Enxames',
    icon: Bot,
    description: 'Agentes autônomos e copilotos coordenados para acelerar a receita.',
    badgeLabel: 'Agentes Autônomos',
  },
  {
    id: 'tactical',
    label: 'Operação Tática & Outreach',
    icon: Wand2,
    description: 'Geração de abordagens de prospecção, scripts B2B e quebra de objeções.',
    badgeLabel: 'Geração Tática',
  },
  {
    id: 'governance',
    label: 'Governança & Decisão',
    icon: ShieldCheck,
    description: 'Aprovação humana executiva, telemetria Groq e harness de qualidade.',
    badgeLabel: 'Human-in-the-Loop',
  },
  {
    id: 'infra',
    label: 'Infraestrutura & Modelos',
    icon: Cpu,
    description: 'Console dos 20 motores de IA, base RAG corporativa e parâmetros.',
    badgeLabel: 'Motores & Dados',
  },
];

export interface ToolDefinition {
  id: IntelligenceTab;
  label: string;
  category: 'agents' | 'tactical' | 'governance' | 'infra';
  icon: typeof Bot;
  badge: string;
  badgeColor?: 'brand' | 'iris' | 'gold' | 'ok' | 'pink';
  description: string;
  techMeta: string;
  keywords: string[];
  isFlagship?: boolean;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // 1. Células & Enxames
  {
    id: 'commercial_cell',
    label: 'Célula Comercial de Agentes',
    category: 'agents',
    icon: Users,
    badge: 'Flagship Tríade',
    badgeColor: 'brand',
    description: 'Workspace executivo dos 12 agentes comerciais da Tríade e Swarm (BDR, C...',
    techMeta: '12 Agentes · Next Best Action · Tríade',
    keywords: ['célula', 'tríade', 'bdr', 'closer', 'sdr', 'nba', 'agentes', 'autônomo'],
    isFlagship: true,
  },
  {
    id: 'copiloto',
    label: 'Copiloto Comercial IA',
    category: 'agents',
    icon: Sparkles,
    badge: 'Voz & Reuniões',
    badgeColor: 'iris',
    description: 'Análise em tempo real de chamadas, transcrição de reuniões e coaching c...',
    techMeta: 'Reuniões · Deal Health · Coaching',
    keywords: ['copiloto', 'reunião', 'call', 'ligação', 'transcrição', 'coaching', 'deal health'],
  },
  {
    id: 'swarm',
    label: 'Enxame Autônomo',
    category: 'agents',
    icon: Bot,
    badge: 'Multi-Agente',
    badgeColor: 'gold',
    description: 'Dispara missões comerciais coordenadas entre SDR, Closer e CRM em lote,...',
    techMeta: 'Execução Concorrente · Swarm',
    keywords: ['enxame', 'swarm', 'missão', 'lote', 'multi-agente', 'paralelo'],
  },
  {
    id: 'ecosystem',
    label: 'Ecossistema Universal (21+ Plataformas & Office)',
    category: 'agents',
    icon: Layers,
    badge: '29 Tools Universais',
    badgeColor: 'ok',
    description: 'Conectores ao vivo (Outlook/Gmail/IMAP, Trello, Monday, Bitrix, HubSpot...',
    techMeta: '21+ Plataformas · Office .xlsx · Playbooks',
    keywords: ['ecossistema', 'trello', 'monday', 'outlook', 'excel', 'word', 'playbooks'],
  },
  {
    id: 'superagent',
    label: 'Criador de Copiloto & Agentes',
    category: 'agents',
    icon: Sparkles,
    badge: 'Provisionamento',
    badgeColor: 'pink',
    description: 'Modelagem e provisionamento de novos agentes comerciais: configure pers...',
    techMeta: 'Blueprints JSON · Prompt Engineering',
    keywords: ['criador', 'superagente', 'provisionamento', 'prompt', 'blueprint', 'custom agent'],
  },

  // 2. Operação Tática & Outreach
  {
    id: 'tools',
    label: 'Outreach Intelligence',
    category: 'tactical',
    icon: Search,
    badge: 'Prospecção Ativa',
    badgeColor: 'brand',
    description: 'Geração cirúrgica e imediata de scripts para cold call, mensagens de Wh...',
    techMeta: 'Multicanal · Scripts · Battlecards',
    keywords: ['outreach', 'cold call', 'whatsapp', 'email', 'battlecard', 'lead', 'prospecção'],
  },
  {
    id: 'methodologies',
    label: 'Metodologias de Vendas B2B',
    category: 'tactical',
    icon: GraduationCap,
    badge: 'Frameworks B2B',
    badgeColor: 'gold',
    description: 'Estruturação tática de roteiros comerciais nos frameworks clássicos: SP...',
    techMeta: 'SPIN · MEDDPICC · Challenger',
    keywords: ['metodologias', 'spin', 'snap', 'aida', 'meddpicc', 'challenger', 'frameworks'],
  },
  {
    id: 'generator',
    label: 'Gerador B2B & ICP',
    category: 'tactical',
    icon: Wand2,
    badge: 'Dores & Objeções',
    badgeColor: 'iris',
    description: 'Simulador de perguntas de qualificação, levantamento de dores e matriz...',
    techMeta: 'ICP · Matriz de Objeções',
    keywords: ['gerador', 'b2b', 'icp', 'dores', 'objeções', 'qualificação'],
  },
  {
    id: 'scripts',
    label: 'Gerador de Scripts & Integrações',
    category: 'tactical',
    icon: FileCode,
    badge: 'Engenharia',
    badgeColor: 'brand',
    description: 'Geração de scripts em Node.js, Python e Shell para tarefas operacionais...',
    techMeta: 'Node.js · Python · Scraping ETL',
    keywords: ['scripts', 'código', 'etl', 'scraping', 'integração', 'automação'],
  },

  // 3. Governança & Decisão
  {
    id: 'actions',
    label: 'Central de Decisões & Aprovações',
    category: 'governance',
    icon: CheckSquare,
    badge: 'Human-in-the-Loop',
    badgeColor: 'ok',
    description: 'Fila executiva de aprovação humana: revise e autorize ações de alto imp...',
    techMeta: 'Aprovação Executiva · Score de Risco',
    keywords: ['decisões', 'ações', 'aprovação', 'human-in-the-loop', 'risco', 'auditoria'],
  },
  {
    id: 'quality',
    label: 'Qualidade & Harness do Enxame',
    category: 'governance',
    icon: ShieldCheck,
    badge: 'Auditoria & Evals',
    badgeColor: 'iris',
    description: 'Harness contínuo de avaliação: métricas de latência, taxa de override h...',
    techMeta: 'Golden Dataset · Evals · Guardrails',
    keywords: ['qualidade', 'evals', 'golden dataset', 'latência', 'override', 'pii'],
  },
  {
    id: 'telemetry',
    label: 'Telemetria Groq Cloud',
    category: 'governance',
    icon: Gauge,
    badge: 'Groq LPU',
    badgeColor: 'brand',
    description: 'Métricas de inferência em tempo real: TTFT (Time to First Token), consu...',
    techMeta: 'TTFT Real · Consumo LPU · Custos',
    keywords: ['telemetria', 'groq', 'ttft', 'tokens', 'lpu', 'latência', 'custo'],
  },

  // 4. Infraestrutura & Modelos
  {
    id: 'ai_suite',
    label: 'Suíte dos 20 Motores de IA',
    category: 'infra',
    icon: Cpu,
    badge: '20 Motores',
    badgeColor: 'brand',
    description: 'Console de execução e orquestração dos 20 motores de IA (Ollama local e...',
    techMeta: 'Ollama & Cloud · 20 Modelos',
    keywords: ['suíte', 'motores', 'ollama', 'modelos', 'ia', 'cloud', 'inferência'],
  },
  {
    id: 'rag',
    label: 'Base de Conhecimento RAG',
    category: 'infra',
    icon: Database,
    badge: 'Busca Vetorial',
    badgeColor: 'iris',
    description: 'Base corporativa de documentos vetorizados que os copilotos consultam p...',
    techMeta: 'Embeddings · Busca Semântica Híbrida',
    keywords: ['rag', 'base', 'conhecimento', 'embeddings', 'vetores', 'documentos', 'playbook'],
  },
  {
    id: 'ai_config',
    label: 'Central de Motores & Temperatura',
    category: 'infra',
    icon: Settings,
    badge: 'Roteamento',
    badgeColor: 'gold',
    description: 'Roteamento refinado de modelos e ajuste fino de temperatura para cada p...',
    techMeta: 'Roteamento · Parâmetros · Modelos',
    keywords: ['config', 'motores', 'temperatura', 'modelos', 'parâmetros', 'configuração'],
  },
  {
    id: 'automations',
    label: 'Guia de Automações & Conectores',
    category: 'infra',
    icon: Workflow,
    badge: 'Workflows n8n',
    badgeColor: 'brand',
    description: 'Guias operacionais e blueprints de workflows no n8n e webhooks para con...',
    techMeta: 'n8n · Webhooks · Gatilhos',
    keywords: ['automações', 'n8n', 'workflow', 'webhooks', 'gatilhos', 'conectores'],
  },
];

export const CATEGORY_SHORT_LABELS: Record<ToolDefinition['category'], string> = {
  agents: 'Células & Enxames',
  tactical: 'Operação Tática',
  governance: 'Governança & Decisão',
  infra: 'Infraestrutura',
};
