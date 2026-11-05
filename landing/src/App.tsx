import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Database,
  FileCheck2,
  Headphones,
  LineChart,
  Lock,
  Mic,
  Moon,
  Play,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Target,
  Workflow,
  Zap,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { BRAND, LOGIN_URL } from './brand.js';

/* -------------------------------------------------------------------------- */
/* Motion tokens & Easing                                                     */
/* -------------------------------------------------------------------------- */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

function staggerContainer(staggerChildren = 0.08, delayChildren = 0) {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren, delayChildren },
    },
  };
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
};

/* -------------------------------------------------------------------------- */
/* Micro-interações táteis                                                    */
/* -------------------------------------------------------------------------- */

function useMagnetic(strength = 0.25) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.clientX - centerX) * strength;
      const y = (e.clientY - centerY) * strength;
      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, reduceMotion]);

  return { ref, position, disabled: reduceMotion };
}

function RevealLine({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <span>{children}</span>;

  return (
    <span className="inline-block overflow-hidden align-top">
      <motion.span
        className="inline-block"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 0.65, delay, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function CountUp({
  to,
  suffix = '',
  prefix = '',
  duration = 1.4,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setValue(to);
      return;
    }
    let start = 0;
    const startTimestamp = performance.now();
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const ease = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(ease * to);
      setValue(current);
      if (progress < 1) {
        start = requestAnimationFrame(step);
      }
    };
    start = requestAnimationFrame(step);
    return () => cancelAnimationFrame(start);
  }, [to, duration, reduceMotion]);

  return (
    <span className="tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Elementos Visuais Compartilhados                                           */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

const primaryCta =
  'group relative inline-flex items-center justify-center gap-2 rounded-full bg-brand-active px-6 py-3.5 font-sans text-sm font-semibold text-on-brand shadow-md transition-all duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

const secondaryCta =
  'group inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-3 font-sans text-sm font-medium text-ink transition-all duration-200 hover:border-brand/40 hover:bg-surface-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/* -------------------------------------------------------------------------- */
/* Mock Cockpit: OrbitHub                                                     */
/* -------------------------------------------------------------------------- */

const COCKPIT_NODES = [
  {
    id: 'crm',
    title: 'CRM Nativo',
    metric: 'Pipeline Ativo',
    detail: 'R$ 1,4M em negociações ativas com sinal de compra quente',
    color: '#1677FF',
    Icon: Database,
  },
  {
    id: 'ai',
    title: 'Agentes Autônomos',
    metric: '5 Agentes em Operação',
    detail: 'Triagem e qualificação contínua em modo supervisionado',
    color: '#7C3AED',
    Icon: Brain,
  },
  {
    id: 'forecast',
    title: 'Forecast Preditivo',
    metric: '84% de Acurácia',
    detail: 'Previsibilidade por comportamento real do lead, não chute',
    color: '#D4AF37',
    Icon: LineChart,
  },
  {
    id: 'pipeline',
    title: 'Orquestração',
    metric: 'Próxima Melhor Ação',
    detail: '18 contas priorizadas com gatilho de retomada hoje',
    color: '#0891B2',
    Icon: Workflow,
  },
] as const;

function OrbitHub() {
  const [activeNode, setActiveNode] = useState<string>('crm');
  const reduceMotion = useReducedMotion();
  const selected = COCKPIT_NODES.find((n) => n.id === activeNode) ?? COCKPIT_NODES[0];

  return (
    <div className="relative mx-auto w-full max-w-lg select-none">
      <div className="relative rounded-2xl border border-line bg-surface/90 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-xs text-ink-2">TELEMETRIA AO VIVO · OPERAÇÃO 24X7</span>
          </div>
          <span className="font-mono text-xs font-semibold text-brand">360° ENGINE</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {COCKPIT_NODES.map((node) => {
            const isActive = node.id === activeNode;
            const Icon = node.Icon;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveNode(node.id)}
                className={`group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive
                    ? 'border-brand/70 bg-surface-2 shadow-sm'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2/60'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line"
                    style={{
                      backgroundColor: `${node.color}15`,
                      color: node.color,
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isActive ? node.color : 'transparent' }}
                  />
                </div>
                <span className="mt-3 font-sans text-xs font-semibold text-ink">{node.title}</span>
                <span className="font-mono text-[11px] text-ink-2">{node.metric}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface-2/60 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-2">
              Nó Ativo · {selected.title}
            </span>
            <span className="font-mono text-[11px] font-semibold text-emerald-400">
              ● Supervisão Ativa
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-ink">{selected.detail}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: '84%' }}
                transition={{ duration: reduceMotion ? 0 : 0.8, ease: EASE_OUT_EXPO }}
              />
            </div>
            <span className="font-mono text-[10px] text-ink-2">Alta Confiança</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TopBar & Header                                                            */
/* -------------------------------------------------------------------------- */

function TopBar() {
  return (
    <div className="border-b border-line bg-surface-2/40 px-4 py-1.5 text-center font-mono text-[11px] text-ink-2 backdrop-blur-sm sm:px-6">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <strong className="text-ink">Central de Comando Ativa:</strong> 5 agentes de IA operando com governança auditável e supervisão humana contínua.
      </span>
    </div>
  );
}

function Header({
  theme,
  onToggleTheme,
}: {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-bg/85 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface font-mono text-sm font-bold text-brand shadow-sm">
            B
          </span>
          <span className="font-sans text-base font-bold tracking-tight text-ink">
            Birth Hub <span className="text-brand">360º</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          <a
            href="#diagnostico"
            className="font-sans text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            O Diagnóstico
          </a>
          <a
            href="#pilares"
            className="font-sans text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Os 6 Pilares
          </a>
          <a
            href="#agentes"
            className="font-sans text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Agentes de IA
          </a>
          <a
            href="#governanca"
            className="font-sans text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Governança & RLS
          </a>
          <a
            href="#dojo"
            className="font-sans text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Dojo de Vendas
          </a>
          <a
            href="#faq"
            className="font-sans text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <a
            href={LOGIN_URL}
            className="hidden font-sans text-sm font-medium text-ink transition-colors hover:text-brand sm:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Entrar
          </a>
          <a href="#agendamento" className={primaryCta}>
            <span>Agendar Demonstração</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero Section                                                               */
/* -------------------------------------------------------------------------- */

function Hero() {
  const magnetic = useMagnetic(0.2);

  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <motion.div
          className="flex flex-col items-start lg:col-span-6"
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.08)}
        >
          <motion.div variants={staggerItem}>
            <SectionLabel>Centro de Comando Comercial B2B</SectionLabel>
          </motion.div>
          <motion.h1
            id="hero-title"
            variants={staggerItem}
            className="mt-4 font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            <RevealLine delay={0.15}>
              Dados que <span className="text-brand-ink dark:text-brand">Conectam.</span>
            </RevealLine>
            <RevealLine delay={0.3}>
              Inteligência que <span className="text-brand-ink dark:text-brand">Decide.</span>
            </RevealLine>
            <RevealLine delay={0.45}>
              <span className="text-ink">Resultados que Acontecem.</span>
            </RevealLine>
          </motion.h1>

          <motion.div
            variants={staggerItem}
            className="mt-6 max-w-xl space-y-3 text-base leading-relaxed"
          >
            <p className="font-medium text-ink">
              Elimine a fragmentação entre CRM, planilhas e IA solta.
            </p>
            <p className="font-mono text-sm text-ink-2">
              O Birth Hub 360º unifica prospecção ativa, funil de vendas e 5 agentes autônomos sobre o mesmo dado — com recomendações precisas e execução sob supervisão humana auditável.
            </p>
          </motion.div>

          <motion.ul variants={staggerItem} className="mt-5 space-y-2 text-xs font-mono text-ink-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>Contexto Único:</strong> A IA lê o histórico real da conta antes de agir.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>Supervisão Humana:</strong> Nenhuma mensagem externa sai sem aprovação prévia.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>Forecast Real:</strong> Projeção baseada em sinais de avanço, não em chute.</span>
            </li>
          </motion.ul>

          <motion.div variants={staggerItem} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.a
              href="#agendamento"
              ref={magnetic.ref}
              animate={magnetic.disabled ? {} : { x: magnetic.position.x, y: magnetic.position.y }}
              className={primaryCta}
            >
              Agendar Demonstração Guiada
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </motion.a>
            <motion.a
              href="#diagnostico"
              className={secondaryCta}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <Play className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              Entender a Arquitetura
            </motion.a>
          </motion.div>
          <motion.p variants={staggerItem} className="mt-3 font-mono text-[11px] text-ink-2">
            ⚡ Onboarding em menos de 14 dias · Sem necessidade de substituir seu CRM legador imediatamente.
          </motion.p>
        </motion.div>

        <motion.div
          className="lg:col-span-6"
          initial="hidden"
          animate="show"
          variants={scaleIn}
        >
          <OrbitHub />
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Faixa de Telemetria e Métricas                                             */
/* -------------------------------------------------------------------------- */

function StatsStrip() {
  return (
    <section className="border-y border-line bg-surface/60 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          <div className="flex flex-col">
            <span className="font-display text-3xl font-bold text-ink sm:text-4xl">
              <CountUp to={20} suffix="+" />
            </span>
            <span className="mt-1 font-sans text-xs text-ink-2">Conectores nativos (WhatsApp, Bitrix, Google)</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl font-bold text-ink sm:text-4xl">
              <CountUp to={100} suffix="%" />
            </span>
            <span className="mt-1 font-sans text-xs text-ink-2">Decisões de IA com trilha de auditoria</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl font-bold text-brand sm:text-4xl">
              <CountUp to={360} suffix="º" />
            </span>
            <span className="mt-1 font-sans text-xs text-ink-2">Visibilidade ponta a ponta da receita</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl font-bold text-ink sm:text-4xl">
              <CountUp to={100} suffix="%" />
            </span>
            <span className="mt-1 font-sans text-xs text-ink-2">Isolamento multi-tenant via RLS</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: O Diagnóstico da Dor                                                */
/* -------------------------------------------------------------------------- */

const PAINS_DATA = [
  {
    icon: Search,
    title: 'O Abismo da Prospecção Manual',
    clientQuote: '“Meu SDR gasta metade do dia caçando contato no LinkedIn e colando em planilha antes de mandar uma mensagem.”',
    impact: 'Custo por oportunidade gerada nas alturas e leads frios antes mesmo do primeiro contato.',
    solution: 'Módulo de inteligência com enriquecimento automático de decisores direto no pipeline.',
  },
  {
    icon: Database,
    title: 'O CRM “Cemitério de Dados”',
    clientQuote: '“Ninguém atualiza o CRM. As conversas importantes ficam no WhatsApp de cada vendedor e eu não confio nos relatórios.”',
    impact: 'Previsão de vendas vira achismo, negociações são esquecidas e o patrimônio da empresa se perde.',
    solution: 'Atualização rápida com comando de voz e agente que monitora o envelhecimento (aging) de cada proposta.',
  },
  {
    icon: Bot,
    title: 'A “IA de Brinquedo” Sem Contexto',
    clientQuote: '“A gente assinou ferramentas de IA, mas elas geram texto genérico que não conhece nosso cliente e parece spam.”',
    impact: 'Decisores corporativos ignoram abordagens pasteurizadas e a marca é desgastada.',
    solution: 'RAG acoplado ao playbook e histórico da organização. IA com papéis comerciais e limites rigorosos.',
  },
] as const;

function PainSection() {
  return (
    <section id="diagnostico" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionLabel>O Diagnóstico da Realidade</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Sua equipe não vende menos por falta de esforço. Ela está soterrada pela fragmentação.
          </h2>
          <p className="mt-3 text-base text-ink-2">
            Contratar mais vendedores ou acumular ferramentas isoladas só aumenta o caos operacional.
            Veja as dores reais que resolvemos na raiz:
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PAINS_DATA.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:border-brand/40 hover:bg-surface-2"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-sans text-base font-semibold text-ink">{p.title}</h3>
                  <blockquote className="mt-3 rounded-lg border-l-2 border-brand/60 bg-surface-2/40 p-3 font-mono text-xs italic text-ink">
                    {p.clientQuote}
                  </blockquote>
                  <p className="mt-3 text-xs text-rose-400 font-mono">
                    <strong>Impacto financeiro:</strong> {p.impact}
                  </p>
                </div>
                <div className="mt-6 border-t border-line pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">
                    A Resposta Birth Hub:
                  </span>
                  <p className="mt-1 text-xs text-ink-2">{p.solution}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: Os 6 Pilares                                                        */
/* -------------------------------------------------------------------------- */

const PILLARS_DATA = [
  {
    num: '01',
    title: 'CRM Nativo & Pipeline Visual',
    desc: 'Kanban fluido com histórico unificado de interações, propostas e tarefas sem silos.',
    Icon: Database,
  },
  {
    num: '02',
    title: 'Esquadrão de 5 Agentes de IA',
    desc: 'Modelos com papéis comerciais definidos (SDR, BDR, Closer, CRM e Ops) operando sobre o pipeline.',
    Icon: Brain,
  },
  {
    num: '03',
    title: 'Orquestração & Next Best Action',
    desc: 'O sistema prioriza dinamicamente as contas e ações com maior probabilidade de conversão hoje.',
    Icon: Workflow,
  },
  {
    num: '04',
    title: 'Previsibilidade & Forecast',
    desc: 'Previsão fundamentada no engajamento e sinais comportamentais reais, não em intuição.',
    Icon: LineChart,
  },
  {
    num: '05',
    title: 'Motor com Dry-Run & Idempotência',
    desc: 'Automações testadas antes de tocarem clientes reais. Sem mensagens duplicadas ou acidentais.',
    Icon: Zap,
  },
  {
    num: '06',
    title: 'Auditoria Completa & RLS',
    desc: 'Isolamento estrito multi-tenant no PostgreSQL e registro de cada decisão com evidência verificável.',
    Icon: ShieldCheck,
  },
] as const;

function Pillars() {
  return (
    <section id="pilares" className="border-t border-line bg-surface/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>Arquitetura da Solução</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Uma plataforma. Seis pilares operacionais integrados.
          </h2>
          <p className="mt-3 text-base text-ink-2">
            Elimine a fragmentação entre ferramentas. Tudo o que sua equipe precisa para gerar,
            conduzir e fechar oportunidades vive sob a mesma governança técnica.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS_DATA.map((p) => {
            const Icon = p.Icon;
            return (
              <div
                key={p.num}
                className="group relative flex flex-col justify-between rounded-xl border border-line bg-surface p-6 transition-all duration-200 hover:border-brand/40 hover:bg-surface-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-brand">{p.num}</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2 group-hover:text-brand">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-4 font-sans text-base font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: Os 5 Agentes de IA com Papel & Limites                              */
/* -------------------------------------------------------------------------- */

const AGENTS_ROLES = [
  {
    role: 'Agente SDR',
    tag: 'Triagem & Pré-qualificação',
    mission: 'Enriquece dados corporativos, valida tomadores de decisão e calcula score de ICP antes do primeiro toque.',
    boundary: 'Não agenda reuniões sem conferir horários vagos na agenda oficial.',
    color: '#3B82F6',
  },
  {
    role: 'Agente BDR',
    tag: 'Hipótese de Dor & Abordagem',
    mission: 'Cruza notícias, vagas abertas e dados do setor para formular o gancho comercial ideal.',
    boundary: 'Mensagens pré-redigidas aguardam confirmação humana no Modo Supervisionado.',
    color: '#8B5CF6',
  },
  {
    role: 'Agente Closer',
    tag: 'Resgate de Propostas & Objeções',
    mission: 'Detecta propostas sem interação há 5+ dias e prepara o argumento exato com base na matriz de objeções.',
    boundary: 'A concessão de descontos e o fechamento continuam sendo decisão do executivo.',
    color: '#EC4899',
  },
  {
    role: 'Agente CRM',
    tag: 'Higiene de Funil & Governança',
    mission: 'Varre o pipeline 24x7 caçando negócios sem próxima tarefa ou contatos incompletos.',
    boundary: 'Notifica os responsáveis; nunca deleta ou arquiva leads de forma silenciosa.',
    color: '#F59E0B',
  },
  {
    role: 'Agente Ops',
    tag: 'Gargalos & Inteligência de Receita',
    mission: 'Compara a velocidade média das etapas do funil com a meta mensal e alerta a diretoria com antecedência.',
    boundary: 'Gera relatórios executivos para a gestão sem alterar contratos ou regras sem aprovação.',
    color: '#10B981',
  },
] as const;

function AgentsSection() {
  return (
    <section id="agentes" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionLabel>Autonomia com Supervisão</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            IA não é um chatbot anexado. É um esquadrão com papéis comerciais e limites claros.
          </h2>
          <p className="mt-3 text-base text-ink-2">
            Cada agente foi desenvolvido com propósito específico. Eles não improvisam: operam dentro
            das regras do seu playbook com trilha de auditoria completa.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS_ROLES.map((agent, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-line bg-surface p-6 transition-all duration-200 hover:border-brand/40 hover:bg-surface-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                  >
                    {agent.role}
                  </span>
                  <span className="font-mono text-[11px] text-ink-2">{agent.tag}</span>
                </div>
                <h4 className="mt-4 font-sans text-sm font-semibold text-ink">Missão Operacional:</h4>
                <p className="mt-1 text-xs text-ink-2 leading-relaxed">{agent.mission}</p>
              </div>

              <div className="mt-5 rounded-lg border border-line/60 bg-surface-2/60 p-3">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Limite Operacional Rígido:
                </span>
                <p className="mt-1 font-mono text-[11px] text-ink-2">{agent.boundary}</p>
              </div>
            </div>
          ))}

          {/* Card explicativo sobre a política de autonomia */}
          <div className="flex flex-col justify-between rounded-xl border border-brand/40 bg-gradient-to-br from-surface-2 to-surface p-6">
            <div>
              <span className="font-mono text-xs font-semibold text-brand">TRAVA DE SEGURANÇA</span>
              <h3 className="mt-3 font-sans text-base font-semibold text-ink">
                Modo Supervisionado vs. Modo Full
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">
                Sua empresa começa no modo supervisionado: nenhuma interação externa acontece sem o clique
                de aprovação do seu time. Você decide quando liberar autonomia para tarefas rotineiras.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono text-xs text-brand">
              <Check className="h-4 w-4" />
              <span>Você sempre no controle.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: Governança, RLS & Segurança                                         */
/* -------------------------------------------------------------------------- */

function GovernanceSection() {
  return (
    <section id="governanca" className="border-t border-line bg-surface/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Segurança Corporativa</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Seus dados comerciais nunca treinam modelos públicos.
          </h2>
          <p className="mt-3 text-base text-ink-2">
            Desenvolvido para operações com exigência rígida de privacidade, conformidade e governança de dados.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-sans text-base font-semibold text-ink">Isolamento Multi-tenant (RLS)</h3>
            <p className="mt-2 text-sm text-ink-2">
              Row-Level Security implementado no banco de dados. Os dados de cada cliente residem em ambientes estritamente isolados.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-sans text-base font-semibold text-ink">Ledger de Auditoria</h3>
            <p className="mt-2 text-sm text-ink-2">
              Cada sugestão ou ação automatizada registra o agente executor, o nível de risco, o grau de confiança e a evidência concreta.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-sans text-base font-semibold text-ink">Conformidade LGPD Nativa</h3>
            <p className="mt-2 text-sm text-ink-2">
              Módulo exclusivo de privacidade com inventário de tratamento de dados e suporte a direitos do titular sem atritos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: Dojo de Vendas (Roleplay com Voz)                                    */
/* -------------------------------------------------------------------------- */

function DojoSection() {
  return (
    <section id="dojo" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <SectionLabel>Capacitação Contínua</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Treine sua equipe em objeções difíceis antes de colocá-los na frente de um cliente real.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2">
              Com o <strong>Dojo de Vendas com IA</strong>, seus SDRs e Closers simulam negociações por voz com personas exigentes, aprendendo a contornar objeções de preço, concorrente e timing com base no seu playbook.
            </p>

            <div className="mt-6 space-y-3 font-mono text-xs text-ink-2">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-brand" />
                <span>Simulação realista por comando de voz com personas configuráveis.</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand" />
                <span>Score instantâneo de escuta ativa, contorno de objeções e clareza.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand" />
                <span>Zero queima de leads: os erros ficam na sala de treino.</span>
              </div>
            </div>

            <div className="mt-8">
              <a href="#agendamento" className={secondaryCta}>
                <Headphones className="h-4 w-4 text-brand" />
                <span>Ver Demonstração do Simulador de Voz</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-mono text-xs text-ink">ROLEPLAY ATIVO · PERSONA: DIRETOR DE COMPRAS</span>
                </div>
                <span className="font-mono text-xs text-brand">DOJO AUDIO 360</span>
              </div>

              <div className="mt-5 space-y-4 font-mono text-xs">
                <div className="rounded-lg bg-surface-2/80 p-3">
                  <span className="text-amber-400 font-semibold">Cliente Simulado:</span>
                  <p className="mt-1 text-ink-2">
                    “Entendi a proposta, mas já renovamos com nosso fornecedor atual e o orçamento está congelado. Por que deveríamos olhar para vocês agora?”
                  </p>
                </div>
                <div className="rounded-lg border border-brand/30 bg-brand/5 p-3">
                  <span className="text-brand font-semibold">Recomendação do Playbook:</span>
                  <p className="mt-1 text-ink">
                    “Valide o contrato atual e isole o custo oculto de estagnação do pipeline antes de tentar negociar valor.”
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-lg border border-line bg-surface-2 p-3 text-[11px] font-mono text-ink-2">
                <span>Score de Aderência: <strong>92/100</strong></span>
                <span className="text-emerald-400">✓ Objeção contornada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: Valor por Papel                                                     */
/* -------------------------------------------------------------------------- */

const ROLES_VALUE = [
  {
    role: 'Diretor(a) Comercial',
    benefit: 'Forecast em que você confia',
    desc: 'Visibilidade ponta a ponta para apresentar resultados concretos à diretoria sem surpresas no fim do mês.',
  },
  {
    role: 'Gerente Comercial',
    benefit: 'Fim da auditoria manual',
    desc: 'Alertas automáticos sobre negociações paradas e ranking de performance baseado em dados reais de conversão.',
  },
  {
    role: 'SDR & BDR',
    benefit: 'Menos pesquisa, mais reuniões',
    desc: 'Dados enriquecidos de decisores e hipótese de dor prontos antes de discar ou enviar a primeira mensagem.',
  },
  {
    role: 'Closer / Executivo',
    benefit: 'Negociações resgatadas',
    desc: 'Sugestões de reativação para propostas mornas e contra-argumentos estruturados para objeções de preço.',
  },
] as const;

function RolesValueSection() {
  return (
    <section className="border-t border-line bg-surface/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>Impacto por Perfil</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Projetado para destravar cada nível da sua operação comercial.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES_VALUE.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-line bg-surface p-5">
              <span className="font-mono text-xs font-semibold text-brand">{item.role}</span>
              <h3 className="mt-2 font-sans text-base font-semibold text-ink">{item.benefit}</h3>
              <p className="mt-2 text-xs text-ink-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ Estratégico                                                            */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: 'Já temos um CRM tradicional (Bitrix24, Salesforce, HubSpot). Precisamos trocar tudo?',
    a: 'Não. O Birth Hub 360º pode operar como seu CRM primário ou como a camada de inteligência e orquestração conectada ao seu ecossistema atual. Você preserva seus registros existentes e ganha enriquecimento automático, agentes autônomos e previsibilidade.',
  },
  {
    q: 'A IA toma decisões autônomas ou envia mensagens sem supervisão?',
    a: 'Não. A plataforma opera no Modo Supervisionado como padrão. Cada comunicação externa ou ação de impacto exige autorização explícita do operador humano. Nenhuma mensagem sai às cegas.',
  },
  {
    q: 'Qual o tempo médio de implementação?',
    a: 'A maior parte das equipes começa a operar em menos de 14 dias com playbooks pré-configurados, integração de canais e suporte técnico dedicado de onboarding.',
  },
  {
    q: 'Meus dados comerciais confidenciais serão usados para treinar modelos públicos?',
    a: 'Terminantemente não. Garantimos isolamento estrito via Row-Level Security (RLS) no PostgreSQL e criptografia ponta a ponta. Seus dados são exclusivamente seus.',
  },
  {
    q: 'Como funciona a demonstração guiada?',
    a: 'Em uma chamada de 25 minutos com um especialista em arquitetura comercial, analisamos os gargalos do seu processo e demonstramos os agentes operando em um ambiente real configurado para a sua realidade.',
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="border-b border-line py-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left font-sans text-base font-semibold text-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        aria-expanded={open}
        aria-controls={`faq-${id}`}
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-2 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={`faq-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-sm leading-relaxed text-ink-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Faq() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionLabel>Dúvidas Frequentes</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Tudo o que você precisa saber para tomar sua decisão.
          </h2>
        </div>
        <div className="mt-10">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Seção: Formulário de Conversão (Lead Capture)                              */
/* -------------------------------------------------------------------------- */

function LeadCaptureSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    cargo: '',
    equipe: '6 a 15',
    consent: true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simula validação e envio seguro
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section id="agendamento" className="border-t border-line bg-surface/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Informações da Sessão */}
          <div className="lg:col-span-5">
            <SectionLabel>Demonstração Prática</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Veja sua operação comercial operando com visão 360º.
            </h2>
            <p className="mt-4 text-base text-ink-2 leading-relaxed">
              Em 25 minutos, mostraremos na prática como conectar sua prospecção ao pipeline e colocar agentes de IA para acelerar seu time com total governança.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">
                  ✓
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Sessão Técnica e Objetiva</h4>
                  <p className="text-xs text-ink-2">Sem slides genéricos: demonstração focada na sua rotina de vendas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">
                  ✓
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Diagnóstico Inicial de Gargalos</h4>
                  <p className="text-xs text-ink-2">Identificamos onde seu funil está perdendo velocidade e receita.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">
                  ✓
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Privacidade Absoluta (LGPD)</h4>
                  <p className="text-xs text-ink-2">Seus dados não são compartilhados nem utilizados para fins de terceiros.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card do Formulário ou Tela de Sucesso */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-surface p-8 shadow-2xl">
              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Solicitação confirmada com sucesso!
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-ink-2 leading-relaxed">
                    Enviamos os detalhes da sessão para <strong>{formData.email}</strong>. Um de nossos especialistas em arquitetura comercial entrará em contato via WhatsApp em até 15 minutos para confirmar o horário ideal.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={secondaryCta}
                    >
                      <Calendar className="h-4 w-4 text-brand" />
                      <span>Adicionar à Agenda</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="font-mono text-xs text-ink-2 hover:text-ink underline"
                    >
                      Editar dados enviados
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-sans text-lg font-bold text-ink">
                      Reserve sua Demonstração Técnica
                    </h3>
                    <p className="text-xs text-ink-2">
                      Preencha os dados abaixo para receber o link seguro de acesso:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="nome" className="block font-mono text-xs text-ink-2 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        id="nome"
                        required
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Mariana Albuquerque"
                        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block font-mono text-xs text-ink-2 mb-1">
                        E-mail Corporativo *
                      </label>
                      <input
                        id="email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu.nome@empresa.com.br"
                        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="whatsapp" className="block font-mono text-xs text-ink-2 mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input
                        id="whatsapp"
                        required
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label htmlFor="cargo" className="block font-mono text-xs text-ink-2 mb-1">
                        Seu Cargo Atual *
                      </label>
                      <select
                        id="cargo"
                        required
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      >
                        <option value="">Selecione seu cargo</option>
                        <option value="diretor">Diretor(a) Comercial / VP / C-Level</option>
                        <option value="gerente">Gerente / Coordenador(a) de Vendas</option>
                        <option value="revops">RevOps / Operações Comerciais</option>
                        <option value="sdr">SDR / BDR / Pré-vendas</option>
                        <option value="closer">Closer / Executivo(a) de Contas</option>
                        <option value="ti">TI / Governança / Segurança</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs text-ink-2 mb-1">
                      Tamanho do Time Comercial
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {['1 a 5', '6 a 15', '16 a 50', '50+ vendedores'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFormData({ ...formData, equipe: size })}
                          className={`rounded-lg border px-3 py-2 font-mono text-xs text-center transition-colors ${
                            formData.equipe === size
                              ? 'border-brand bg-brand/10 font-bold text-brand'
                              : 'border-line bg-surface-2 text-ink-2 hover:border-line-strong'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 text-xs font-mono text-ink-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                        className="mt-0.5 rounded border-line text-brand focus:ring-brand"
                        required
                      />
                      <span>Concordo com o tratamento dos dados estritamente para agendamento da demonstração conforme a LGPD.</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-brand-active py-3.5 font-sans text-sm font-semibold text-on-brand shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                    >
                      {loading ? 'Preparando Sessão...' : 'RESERVAR MINHA SESSÃO TÉCNICA →'}
                    </button>
                    <p className="mt-2 text-center font-mono text-[11px] text-ink-2">
                      🔒 Zero spam · Cancelamento ou reagendamento fácil com 1 clique.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA                                                                  */
/* -------------------------------------------------------------------------- */

function FinalCta() {
  const magnetic = useMagnetic(0.2);

  return (
    <section className="border-t border-line bg-surface/50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <SectionLabel>Dê o Próximo Passo</SectionLabel>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Pare de pilotar sua operação no escuro.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-2">
          Transforme dados fragmentados em uma central de comando onde a inteligência recomenda
          e a execução acontece com governança auditável.
        </p>
        <div className="mt-8 flex justify-center">
          <motion.a
            href="#agendamento"
            ref={magnetic.ref}
            animate={magnetic.disabled ? {} : { x: magnetic.position.x, y: magnetic.position.y }}
            className={primaryCta}
          >
            <span>Solicitar Demonstração Operacional Agora</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-line bg-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface font-mono text-xs font-bold text-brand shadow-sm">
              B
            </span>
            <span className="font-sans text-sm font-semibold text-ink">
              {BRAND.name}
            </span>
          </div>
          <div className="font-mono text-xs text-ink-2 text-center sm:text-right space-y-1">
            <p>{BRAND.credit}</p>
            <p className="text-[10px] text-ink-2/70">
              Isolamento Multi-tenant via RLS · Ledger de Auditoria · Conformidade LGPD
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Componente Principal: App                                                  */
/* -------------------------------------------------------------------------- */

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('birthhub_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('birthhub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen bg-bg text-ink font-sans transition-colors duration-300">
      <TopBar />
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main id="main-content">
        <Hero />
        <StatsStrip />
        <PainSection />
        <Pillars />
        <AgentsSection />
        <GovernanceSection />
        <DojoSection />
        <RolesValueSection />
        <Faq />
        <LeadCaptureSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

export default App;
