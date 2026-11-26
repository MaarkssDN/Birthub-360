import {
  BarChart3,
  Bot,
  Compass,
  Database,
  Headphones,
  LineChart,
  Lock,
  Network,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Target,
  Zap,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────────────────── */
export const PILLARS = [
  {
    id: '01',
    title: 'Hub Comercial',
    desc: 'Pipeline kanban, gestão de negócios, propostas e cadastro unificado.',
    icon: Compass,
    color: 'brand' as const,
    kpi: 'Pipeline 360°',
  },
  {
    id: '02',
    title: 'Inteligência de Mercado',
    desc: 'Prospecção multi-fonte: CNPJ, Apollo, Hunter, LinkedIn, GitHub.',
    icon: Target,
    color: 'accent' as const,
    kpi: 'Prospecção multi-fonte',
  },
  {
    id: '03',
    title: 'Orquestração de Vendas',
    desc: 'Cadências com opt-out, rate limit e assinatura de documentos.',
    icon: Network,
    color: 'gold' as const,
    kpi: 'Cadências inteligentes',
  },
  {
    id: '04',
    title: 'Performance Comercial',
    desc: 'Analytics, coortes, win/loss, gamificação e coaching.',
    icon: BarChart3,
    color: 'brand' as const,
    kpi: 'Analytics & coaching',
  },
  {
    id: '05',
    title: 'Previsibilidade Comercial',
    desc: 'Forecast preditivo com calibração e pipeline scoring.',
    icon: LineChart,
    color: 'iris' as const,
    kpi: 'Forecast preditivo',
  },
  {
    id: '06',
    title: 'Inteligência Artificial',
    desc: 'Enxame de 20+ agentes IA com orquestração autônoma.',
    icon: Bot,
    color: 'iris' as const,
    kpi: '20+ agentes IA',
  },
  {
    id: '07',
    title: 'Automação & Conectividade',
    desc: 'Motor de regras, dry-run, versionamento e scanners.',
    icon: Zap,
    color: 'gold' as const,
    kpi: 'Motor de regras',
  },
  {
    id: '08',
    title: 'Engajamento Comercial',
    desc: 'Voice Hub, studio de áudio e supervisão ao vivo.',
    icon: Headphones,
    color: 'accent' as const,
    kpi: 'Voice Hub',
  },
  {
    id: '09',
    title: 'Admin & Operations',
    desc: 'Settings, equipe, papéis, acesso e audit trail.',
    icon: Settings,
    color: 'brand' as const,
    kpi: 'Governança',
  },
  {
    id: '10',
    title: 'Mobile & Field Sales',
    desc: 'Vendas em campo, offline sync via Capacitor.',
    icon: Smartphone,
    color: 'gold' as const,
    kpi: 'Vendas em campo',
  },
  {
    id: '11',
    title: 'Social Selling',
    desc: 'Abordagens personalizadas e copywriting por IA.',
    icon: Share2,
    color: 'accent' as const,
    kpi: 'Selling social',
  },
] as const;
export const METRICS = [
  { value: 20, suffix: '+', label: 'Agentes IA', detail: 'Catálogo público de agentes' },
  { value: 360, suffix: '°', label: 'Visão do Cliente', detail: 'Prospecção ao fechamento' },
  { value: 11, suffix: '', label: 'Módulos', detail: 'Integrados à plataforma' },
  { value: 1, suffix: '', label: 'Camada de governança', detail: 'RBAC, LGPD e auditoria' },
] as const;
export const FLOW = [
  { title: 'Conecte dados', desc: 'Bitrix24, CRMs e fontes B2B em minutos.' },
  { title: 'IA prioriza', desc: 'Leads qualificados e riscos identificados.' },
  { title: 'Equipe executa', desc: 'Playbooks e cadências automatizadas.' },
  { title: 'Receita cresce', desc: 'Forecast inteligente e métricas ao vivo.' },
] as const;
export const INTEGRATIONS = [
  'Bitrix24',
  'HubSpot',
  'Salesforce',
  'Pipedrive',
  'RD Station',
  'WhatsApp',
  'LinkedIn',
  'Google Workspace',
  'Slack',
  'Omie',
];
export const SECURITY = [
  { icon: ShieldCheck, title: 'Multi-tenancy RLS', desc: 'Isolamento por organização.' },
  { icon: Lock, title: 'LGPD Nativa', desc: 'Minimização e exclusão.' },
  { icon: Shield, title: 'Auditoria', desc: 'Logs e trilha de decisões.' },
  { icon: Database, title: 'Backup', desc: 'Recuperação e replicação.' },
] as const;
export type PColor = (typeof PILLARS)[number]['color'];
export const CM: Record<PColor, string> = {
  brand: 'lp-card-icon--brand',
  accent: 'lp-card-icon--accent',
  gold: 'lp-card-icon--gold',
  iris: 'lp-card-icon--iris',
};
export const fanAngles = [-10, 7, -5, 9, -8, 6, -11, 4, -7, 10, -6];
