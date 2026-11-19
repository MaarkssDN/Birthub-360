import { type FormEvent, useEffect, useRef, useState } from 'react';
import { BRAND, LOGIN_URL } from './brand.js';

/* -------------------------------------------------------------------------- */
/* Tema                                                                       */
/* -------------------------------------------------------------------------- */

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('birthhub_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('birthhub_theme', theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}

/* -------------------------------------------------------------------------- */
/* Sequência do Centro de Comando                                            */
/* -------------------------------------------------------------------------- */

const SEQUENCE_STEPS = [
  '1/3 · Sincronizando dados 360°',
  '2/3 · Analisando oportunidade #1042',
  '3/3 · Recomendação IA ativa',
  'Contexto → decisão → ação',
] as const;

function useCommandSequence() {
  const [status, setStatus] = useState<string>(SEQUENCE_STEPS[3]);
  const timers = useRef<number[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    document.body.classList.remove('playing');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStatus('Sequência completa · sem movimento');
      return;
    }
    void document.body.offsetWidth;
    document.body.classList.add('playing');
    setStatus(SEQUENCE_STEPS[0]);
    timers.current = [
      window.setTimeout(() => setStatus(SEQUENCE_STEPS[1]), 520),
      window.setTimeout(() => setStatus(SEQUENCE_STEPS[2]), 1020),
      window.setTimeout(() => {
        setStatus(SEQUENCE_STEPS[3]);
        document.body.classList.remove('playing');
      }, 1650),
    ];
  };

  useEffect(() => {
    play();
    const onHide = () => {
      if (document.hidden) {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        document.body.classList.remove('playing');
        setStatus(SEQUENCE_STEPS[3]);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      timers.current.forEach(clearTimeout);
      document.removeEventListener('visibilitychange', onHide);
      document.body.classList.remove('playing');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, replay: play };
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({ theme, onToggleTheme }: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const isDark = theme === 'dark';
  return (
    <header>
      <a className="brand" href="#content" aria-label="Birth Hub 360° — início">
        <img src="/brand/birthhub360-simbolo.svg" alt="" width="36" height="36" />
        <span>
          Birth Hub <b>360°</b>
        </span>
      </a>
      <nav aria-label="Principal">
        <a className="nav-link" href="#demo">
          Demonstração
        </a>
        <a className="nav-link" href="#modules">
          Módulos
        </a>
        <a className="nav-link" href={LOGIN_URL}>
          Entrar
        </a>
        <button
          className="theme"
          type="button"
          aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          aria-pressed={isDark}
          onClick={onToggleTheme}
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Orbit() {
  return (
    <div className="orbit" aria-hidden="true">
      <svg viewBox="-220 -220 440 440">
        <defs>
          <linearGradient id="rg" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#00D4FF" />
            <stop offset="0.34" stopColor="#8B7DFF" />
            <stop offset="0.68" stopColor="#FF2D9B" />
            <stop offset="1" stopColor="#FFC107" />
          </linearGradient>
        </defs>
        <g className="o-spin">
          <g className="o-ticks">
            <circle r="212" fill="none" stroke="var(--tick)" strokeWidth="9" strokeDasharray="1 8.25" />
            <circle r="212" fill="none" stroke="var(--tick)" strokeWidth="18" strokeDasharray="1.4 109.6" />
          </g>
        </g>
        <circle className="o-inner" r="162" />
        <circle className="o-arc" r="188" pathLength="1" transform="rotate(-205)" />
        <g className="o-dotg">
          <circle className="o-dot" r="6.5" cx="-170.4" cy="-79.4" />
          <circle className="o-node-cyan" r="4.5" cx="-64.3" cy="-176.7" />
          <circle className="o-node-gold" r="4.5" cx="162.8" cy="-94.0" />
        </g>
        <text className="o-lbl" x="0" y="-134" textAnchor="middle">
          360°
        </text>
      </svg>
    </div>
  );
}

function CommandPlate({ status, onReplay }: { status: string; onReplay: () => void }) {
  return (
    <figure className="plate" aria-label="Demonstração ilustrativa do centro de comando">
      <div className="p-bar">
        <img src="/brand/birthhub360-icone.svg" width="26" height="26" alt="" />
        <div className="p-bar-titles">
          <strong>Centro de comando</strong>
          <span className="p-module-tag">HUB COMERCIAL</span>
        </div>
        <span className="sim">Simulação</span>
      </div>
      <div className="p-main">
        <div className="p-pipeline">
          <div className="product-context">
            <span>Pipeline comercial · Fluxo ativo</span>
            <span>Etapa 03/05 · Visão 360°</span>
          </div>
          <ol className="track" aria-label="Etapas do pipeline">
            <li>Prospecção</li>
            <li>Qualificação</li>
            <li aria-current="step">Proposta</li>
            <li>Negociação</li>
            <li>Fechamento</li>
          </ol>
        </div>
        <div className="opp-card">
          <div className="opp">
            <div className="opp-head">
              <span className="data-label">OPORTUNIDADE ILUSTRATIVA</span>
              <span className="stage-pill">ETAPA ATUAL · PROPOSTA</span>
            </div>
            <h2>Oportunidade #1042</h2>
            <p>Contexto unificado · CRM, IA e cadência sincronizados na operação</p>
          </div>
          <div className="chips">
            <span>Reunião técnica realizada</span>
            <span>Proposta enviada</span>
            <span className="pending">Retorno pendente</span>
          </div>
        </div>
        <div className="ia">
          <div className="ia-head">
            <h3>
              Copiloto IA <span>Próxima ação</span>
            </h3>
            <span className="ia-flow">Inteligência</span>
          </div>
          <p>Retomar contato com o CFO e propor reunião executiva de implantação.</p>
          <small>Recomendação ilustrativa · decisão do vendedor</small>
        </div>
        <div className="demo-controls">
          <button className="replay" type="button" onClick={onReplay}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reproduzir sequência
          </button>
          <span className="scene-status" role="status">
            {status}
          </span>
        </div>
      </div>
      <figcaption>
        <span>Interface ilustrativa · dados simulados</span>
        <span>11 módulos integrados</span>
      </figcaption>
    </figure>
  );
}

function Hero() {
  const { status, replay } = useCommandSequence();

  return (
    <section className="hero" aria-labelledby="headline">
      <div className="hero-copy">
        <h1 id="headline">
          <span className="row r1">
            <span className="w">Dados</span>
            <span className="tag">que conectam.</span>
          </span>
          <span className="row r2">
            <span className="w">Inteligência</span>
            <span className="tag">que decide.</span>
          </span>
          <span className="row r3">
            <span className="w">Execução</span>
            <span className="tag">que acontece.</span>
          </span>
        </h1>
        <p className="lead">
          <strong>Birth Hub 360°</strong> é o sistema operacional de{' '}
          <span className="hl-role">Revenue Intelligence</span>: CRM, IA e cadência de vendas integrados
          em uma única visão executiva.
        </p>
        <div className="acts">
          <a className="primary" href="#demo">
            Agendar demonstração
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </a>
          <a className="secondary" href="#modules">
            Conhecer os 11 módulos
          </a>
        </div>
        <p className="demo-note" id="demo-note" tabIndex={-1}>
          Sessão guiada de 30 minutos · sem compromisso · resposta em até 1 dia útil.
        </p>
      </div>
      <div className="stagewrap">
        <Orbit />
        <div className="orbit-bridge" aria-hidden="true">
          <span className="orbit-caption">VISÃO INTEGRADA · 360°</span>
          <span className="orbit-pillars">DADOS · IA · EXECUÇÃO</span>
        </div>
        <CommandPlate status={status} onReplay={replay} />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Princípios                                                                 */
/* -------------------------------------------------------------------------- */

function Principles() {
  return (
    <section className="principles" aria-label="Os três movimentos do produto">
      <article className="principle p-cyan">
        <span className="principle-mark" aria-hidden="true" />
        <h2>Dados que conectam</h2>
        <p>
          Informações de CRM, operação e relacionamento entram em uma visão única, sem depender de
          planilhas ou contexto fragmentado.
        </p>
      </article>
      <article className="principle p-iris">
        <span className="principle-mark" aria-hidden="true" />
        <h2>Inteligência que decide</h2>
        <p>
          O Copiloto IA transforma sinais do pipeline em próxima ação clara, mantendo a decisão final
          com o vendedor.
        </p>
      </article>
      <article className="principle p-gold">
        <span className="principle-mark" aria-hidden="true" />
        <h2>Execução que acontece</h2>
        <p>
          A cadência comercial organiza etapas, responsáveis e retornos para que a operação avance
          com previsibilidade.
        </p>
      </article>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Números                                                                     */
/* -------------------------------------------------------------------------- */

function StatsBand() {
  return (
    <section className="stats-band" aria-label="Números da plataforma">
      <div className="stats">
        <div className="stat">
          <b className="c">20+</b>
          <span>Conectores nativos</span>
        </div>
        <div className="stat">
          <b className="p">100%</b>
          <span>Ações de IA auditadas</span>
        </div>
        <div className="stat">
          <b className="g">360°</b>
          <span>Visibilidade de receita</span>
        </div>
        <div className="stat">
          <b className="i">RLS</b>
          <span>Multi-tenancy no banco</span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Dor                                                                         */
/* -------------------------------------------------------------------------- */

function PainSection() {
  return (
    <section className="dor-sec" aria-labelledby="dor-title">
      <div className="dor-h" id="dor-title">
        Sua operação está espalhada em órbitas separadas.
      </div>
      <p className="dor-sub">
        CRM num lugar, planilha noutro, IA solta por cima. Cada decisão sai sem o contexto que decide
        se ela vai funcionar.
      </p>
      <div className="dor-grid">
        <div className="dor-col bad">
          <div className="dor-tag">✕ Hoje · sem o Hub</div>
          <ul>
            <li>3 ferramentas que não conversam entre si</li>
            <li>Forecast em planilha, sempre atrasado</li>
            <li>IA genérica sem contexto da sua operação</li>
            <li>Decisões de pipeline no escuro</li>
            <li>Follow-ups esquecidos matam oportunidades</li>
          </ul>
        </div>
        <div className="dor-col good">
          <div className="dor-tag">✓ Com o Birth Hub 360°</div>
          <ul>
            <li>Um único dado: CRM nativo + 20+ conectores</li>
            <li>Forecast ponderado em tempo real</li>
            <li>RAG acoplado ao playbook e ao histórico</li>
            <li>Cada ação auditável, cada agente supervisionado</li>
            <li>Alertas quentes antes da oportunidade esfriar</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Agentes                                                                     */
/* -------------------------------------------------------------------------- */

const AGENTS = [
  { ini: 'SC', name: 'Scout', role: 'Prospecção ativa', grad: 'linear-gradient(135deg,#00D4FF,#8B7DFF)' },
  { ini: 'EN', name: 'Enrich', role: 'Enriquecimento', grad: 'linear-gradient(135deg,#FF2D9B,#FFC107)' },
  { ini: 'PR', name: 'Prior', role: 'Priorização', grad: 'linear-gradient(135deg,#8B7DFF,#00D4FF)' },
  { ini: 'FC', name: 'Forecast', role: 'Previsão', grad: 'linear-gradient(135deg,#FFC107,#FF2D9B)' },
  { ini: 'CO', name: 'Coach', role: 'Dojo & roleplay', grad: 'linear-gradient(135deg,#00D4FF,#FF2D9B)' },
] as const;

function AgentsSection() {
  return (
    <section className="agents-sec" aria-labelledby="agents-title">
      <div className="agents-h" id="agents-title">
        Agentes que trabalham enquanto você fecha.
      </div>
      <p className="agents-sub">
        Escopo, limites e trilha de auditoria em cada um. Nada executa sem registro — e o que exige
        aprovação, exige humano.
      </p>
      <div className="agents-grid">
        {AGENTS.map((a) => (
          <div className="agent" key={a.ini}>
            <div className="av" style={{ background: a.grad }}>
              {a.ini}
            </div>
            <b>{a.name}</b>
            <span>{a.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Governança                                                                  */
/* -------------------------------------------------------------------------- */

function GovernanceSection() {
  return (
    <section className="gov-sec" aria-labelledby="gov-title">
      <div className="gov-h" id="gov-title">
        IA que se explica.
      </div>
      <p className="gov-sub">
        Cada recomendação carrega sua fonte, seu raciocínio e seu responsável. Governança não é
        camada — é arquitetura.
      </p>
      <div className="gov-grid">
        <div className="gov-card">
          <div className="ic" style={{ color: 'var(--cyan)' }}>
            AU
          </div>
          <h3 className="c">Trilha de auditoria</h3>
          <p>
            Toda ação de agente — leitura, sugestão ou escrita — registrada com contexto, timestamp
            e operador humano quando aplicável.
          </p>
        </div>
        <div className="gov-card">
          <div className="ic" style={{ color: 'var(--pink)' }}>
            RL
          </div>
          <h3 className="p">RLS multi-tenant</h3>
          <p>
            Isolamento por tenant no PostgreSQL em cada query. Não existe caminho de código que
            contorne a segurança.
          </p>
        </div>
        <div className="gov-card">
          <div className="ic" style={{ color: 'var(--gold)' }}>
            LG
          </div>
          <h3 className="g">LGPD nativa</h3>
          <p>
            Consentimento, retenção e portabilidade como primitivos do modelo de dados, não camada
            posterior.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Dojo                                                                       */
/* -------------------------------------------------------------------------- */

function DojoSection() {
  return (
    <section className="dojo-sec" aria-labelledby="dojo-title">
      <div className="dojo-grid">
        <div>
          <div className="dojo-h" id="dojo-title">
            O Dojo treina o time. A IA treina o vendedor.
          </div>
          <p className="dojo-sub">
            Roleplay com feedback contextual, matriz de objeções viva e playbook acoplado ao RAG — o
            closer melhora a cada sessão.
          </p>
          <div className="dojo-list">
            <div className="dojo-item">
              <span className="n">01</span>
              <div>
                <b>Cenários reais do seu funil</b>
                <p>Roleplays gerados a partir das objeções e deals reais da operação.</p>
              </div>
            </div>
            <div className="dojo-item">
              <span className="n">02</span>
              <div>
                <b>Feedback imediato</b>
                <p>Análise de tom, argumentação e timing com sugestões acionáveis.</p>
              </div>
            </div>
            <div className="dojo-item">
              <span className="n">03</span>
              <div>
                <b>Progresso mensurável</b>
                <p>Scores por competência, evolução por vendedor e gargalos do time.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="dojo-visual">
          <span className="dojo-score">
            78
            <small>/100 · clareza</small>
          </span>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)' }}>
            Sessão de roleplay · Objeção: &quot;está caro&quot;
          </p>
          <div className="dojo-bar">
            <i />
          </div>
          <div className="dojo-bar">
            <i style={{ width: '64%' }} />
          </div>
          <div className="dojo-bar">
            <i style={{ width: '91%' }} />
          </div>
          <p className="dojo-note">SCORE SIMULADO · DEMONSTRAÇÃO</p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Valor por papel                                                             */
/* -------------------------------------------------------------------------- */

const ROLES = [
  {
    who: 'SDR / BDR',
    h: 'Encha o topo com precisão',
    p: 'Listas qualificadas, enriquecimento automático e cadência que executa sozinha.',
    items: ['Prospecção ativa com contas similares', 'Enriquecimento de decisores em 1 clique', 'Follow-ups automáticos com timing ideal'],
  },
  {
    who: 'Closer',
    h: 'Feche com contexto total',
    p: 'Cada oportunidade chega com histórico, objeções mapeadas e próxima ação sugerida.',
    items: ['Visão 360º de cada conta', 'Copiloto sugere a próxima jogada', 'Roleplay treina as objeções difíceis'],
  },
  {
    who: 'Gestão / Founder',
    h: 'Comande a receita',
    p: 'Forecast ponderado, pipeline health e alertas quentes — sem planilha paralela.',
    items: ['Forecast commit/best-case em tempo real', 'Risco detectado antes de virar perda', 'Trilha de auditoria de cada decisão'],
  },
] as const;

function RolesSection() {
  return (
    <section className="roles-sec" aria-labelledby="roles-title">
      <div className="roles-h" id="roles-title">
        Um valor para cada papel da operação.
      </div>
      <div className="roles-grid">
        {ROLES.map((r) => (
          <div className="role-card" key={r.who}>
            <div className="who">{r.who}</div>
            <h3>{r.h}</h3>
            <p>{r.p}</p>
            <ul>
              {r.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Módulos                                                                     */
/* -------------------------------------------------------------------------- */

const MODULES_PILLARS = [
  'Hub Comercial',
  'Inteligência de Mercado',
  'Orquestração de Vendas',
  'Performance Comercial',
  'Previsibilidade Comercial',
  'Inteligência Artificial',
  'Automação & Conectividade',
  'Engajamento Comercial',
] as const;

const MODULES_COMPLEMENTARY = ['Admin & Operations', 'Mobile & Field Sales', 'Social Selling'] as const;

function ModulesSection() {
  return (
    <details className="modules" id="modules" open>
      <summary>
        <span className="summary-main">
          <strong>Um sistema. Onze módulos.</strong>
          <small>8 pilares operacionais + 3 complementares</small>
        </span>
        <span className="summary-toggle" aria-hidden="true">
          Ver arquitetura
        </span>
      </summary>
      <div className="module-groups">
        <section className="group" aria-labelledby="pillars-title">
          <h3 id="pillars-title">Pilares operacionais</h3>
          <ul className="p-rail">
            {MODULES_PILLARS.map((m) => (
              <li key={m}>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="group group-alt" aria-labelledby="complementary-title">
          <h3 id="complementary-title">Complementares</h3>
          <ul className="p-rail">
            {MODULES_COMPLEMENTARY.map((m) => (
              <li key={m}>
                <span>{m}</span>
              </li>
            ))}
          </ul>
          <p className="module-note">
            Arquitetura modular: cada módulo pode ser ativado conforme a maturidade da sua operação.
          </p>
        </section>
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Narrativa                                                                   */
/* -------------------------------------------------------------------------- */

function StorySection() {
  return (
    <section className="story-sec" aria-labelledby="story-title">
      <div className="story-h" id="story-title">
        O dia em que <span className="c1">a operação</span> parou de depender de{' '}
        <span className="c2">memória</span>.
      </div>
      <p className="story-sub">
        Todo comercial já viveu essa manhã. A diferença é o que acontece quando a plataforma está no
        comando — não no susto, no sistema.
      </p>
      <div className="story-grid">
        <div className="story-col bad">
          <div className="story-tag">✕ Sem o Hub · a manhã real</div>
          <div className="beat">
            <span className="tm">07:42</span>
            <p>
              Ana abre o CRM — e mais três abas: planilha de forecast, chat de IA genérica, e-mail de
              cobrança.
            </p>
          </div>
          <div className="beat">
            <span className="tm">08:15</span>
            <p>Um follow-up esquecido há 9 dias. A oportunidade esfriou e ninguém viu.</p>
          </div>
          <div className="beat">
            <span className="tm">09:30</span>
            <p>O forecast do trimestre é um chute compartilhado em grupo de WhatsApp.</p>
          </div>
          <div className="beat">
            <span className="tm">11:00</span>
            <p>Prospecção manual: 40 minutos montando lista que já existia no CRM.</p>
          </div>
          <div className="beat">
            <span className="tm">18:30</span>
            <p>Fim do dia: 3 ferramentas, 0 visão 360º, e a receita ainda é um mistério.</p>
          </div>
        </div>
        <div className="story-col good">
          <div className="story-tag">✓ Com o Birth Hub · a mesma manhã</div>
          <div className="beat">
            <span className="tm">07:42</span>
            <p>
              Ana abre <b>uma tela</b>: pipeline ponderado, forecast commit e 3 alertas quentes do
              Scout.
            </p>
          </div>
          <div className="beat">
            <span className="tm">08:15</span>
            <p>
              O agente <b>Prior</b> já marcou a oportunidade esquecida — e disparou o follow-up na
              cadência.
            </p>
          </div>
          <div className="beat">
            <span className="tm">09:30</span>
            <p>
              Forecast recalculado às 6h: commit do trimestre <b>+R$ 180 mil</b> ponderado, com
              fonte.
            </p>
          </div>
          <div className="beat">
            <span className="tm">11:00</span>
            <p>
              Enquanto Ana fecha, o <b>Scout</b> enriqueceu 11 decisores em contas-alvo do ICP.
            </p>
          </div>
          <div className="beat">
            <span className="tm">18:30</span>
            <p>
              Fim do dia: receita visível, agente trabalhando, e a manhã seguinte já planejada.
            </p>
          </div>
        </div>
        <div className="story-arrow" aria-hidden="true">
          →
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Feed ao vivo                                                                */
/* -------------------------------------------------------------------------- */

const FEED_LINES = [
  { t: '09:41', who: 'SCOUT', cls: 'sc', text: 'Identificou 14 decisores em 6 contas-alvo do ICP' },
  { t: '09:43', who: 'ENRICH', cls: 'en', text: 'Enriqueceu 11 contatos: cargo, e-mail verificado, LinkedIn' },
  { t: '09:47', who: 'PRIOR', cls: 'pr', text: '3 oportunidades marcadas como quentes · score 92/100' },
  { t: '09:52', who: 'FORECAST', cls: 'fc', text: 'Commit do trimestre recalculado: +R$ 180 mil ponderado' },
  { t: '10:05', who: 'COACH', cls: 'co', text: 'Dojo sugeriu 2 roleplays para o closer da conta Alpha' },
  { t: '10:12', who: 'SCOUT', cls: 'sc', text: 'Nova lista de 30 contas similares gerada a partir de wins recentes' },
  { t: '10:18', who: 'ENRICH', cls: 'en', text: '8 e-mails entregues pela cadência multicanal' },
  { t: '10:24', who: 'FORECAST', cls: 'fc', text: 'Risco detectado: 2 propostas sem follow-up há 9 dias' },
] as const;

function FeedSection() {
  return (
    <section className="feed-sec" aria-label="Feed de agentes ao vivo">
      <div className="feed">
        <div className="feed-bar">
          <span className="live" />
          <span
            style={{
              font: "600 10px/1 'IBM Plex Mono',monospace",
              color: 'var(--muted)',
              letterSpacing: '.15em',
            }}
          >
            FEED DE AGENTES · AGORA
          </span>
          <span className="sim" style={{ marginLeft: 'auto' }}>
            auditável
          </span>
        </div>
        <div className="feed-body">
          {FEED_LINES.map((l) => (
            <div className="feed-line" key={l.t + l.who}>
              <span className="t">{l.t}</span>
              <span className={`who ${l.cls}`}>{l.who}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: 'Já temos um CRM tradicional. Precisamos trocar tudo?',
    a: 'Não. O Birth Hub 360º opera como CRM primário ou como camada de inteligência conectada ao seu ecossistema. Você preserva seus registros e ganha enriquecimento, agentes e previsibilidade.',
  },
  {
    q: 'Como a IA decide o que executar sozinha?',
    a: 'Cada agente opera dentro de um envelope de autonomia configurável: sugere, prepara ou executa conforme o risco. Ações sensíveis sempre passam por aprovação humana registrada.',
  },
  {
    q: 'Nossos dados ficam isolados dos outros clientes?',
    a: 'Sim. Row-Level Security no PostgreSQL garante isolamento por tenant em cada query — não é filtro de aplicação, é garantia de banco.',
  },
  {
    q: 'Quanto tempo leva para entrar em produção?',
    a: 'Conectores nativos cobrem os principais CRMs e fontes. O onboarding inclui migração assistida, playbook configurado e treinamento do time no Dojo.',
  },
  {
    q: 'Como funciona a demonstração guiada?',
    a: 'Em uma sessão de 30 minutos com um especialista em arquitetura comercial, analisamos os gargalos do seu processo e mostramos os agentes operando em um ambiente real configurado para a sua realidade.',
  },
] as const;

function FaqSection() {
  return (
    <section className="faq-sec" aria-labelledby="faq-title">
      <h2 id="faq-title">Perguntas frequentes.</h2>
      <p className="sub">O que times comerciais perguntam antes de ver a plataforma em operação.</p>
      {FAQ_ITEMS.map((f, i) => (
        <details key={f.q} open={i === 0}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Demo / captura                                                              */
/* -------------------------------------------------------------------------- */

function DemoSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', empresa: '', whatsapp: '' });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="demo-sec" aria-labelledby="demo-title" id="demo">
      <h2 id="demo-title">Veja o 360° da sua operação.</h2>
      <p className="sub">
        Sessão guiada de 30 minutos com dados da sua operação ou cenário realista. Sem compromisso.
      </p>
      {submitted ? (
        <div className="demo-form" role="status">
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--lead)' }}>
            <strong style={{ color: 'var(--cyan)' }}>Recebido.</strong> Nossa equipe entra em contato
            em até 1 dia útil para confirmar o melhor horário da demonstração.
          </p>
        </div>
      ) : (
        <form className="demo-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="demo-nome">Nome</label>
            <input
              id="demo-nome"
              required
              placeholder="Seu nome"
              autoComplete="name"
              value={form.nome}
              onChange={set('nome')}
            />
          </div>
          <div className="field">
            <label htmlFor="demo-email">E-mail corporativo</label>
            <input
              id="demo-email"
              type="email"
              required
              placeholder="voce@empresa.com"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div className="field">
            <label htmlFor="demo-empresa">Empresa</label>
            <input
              id="demo-empresa"
              required
              placeholder="Nome da empresa"
              autoComplete="organization"
              value={form.empresa}
              onChange={set('empresa')}
            />
          </div>
          <div className="field">
            <label htmlFor="demo-whatsapp">WhatsApp (opcional)</label>
            <input
              id="demo-whatsapp"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              value={form.whatsapp}
              onChange={set('whatsapp')}
            />
          </div>
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Solicitar Demonstração Operacional'}
          </button>
        </form>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Closing + footer                                                            */
/* -------------------------------------------------------------------------- */

function Closing() {
  return (
    <section className="closing" aria-labelledby="closing-title">
      <div>
        <h2 id="closing-title">Veja o centro de comando em operação.</h2>
        <p>
          Dados que conectam, inteligência que decide, execução que acontece — em uma única
          plataforma com governança auditável.
        </p>
      </div>
      <div className="acts">
        <a className="primary" href="#demo">
          Agendar demonstração
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </a>
        <a className="secondary" href={LOGIN_URL}>
          Entrar na plataforma
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <a className="brand" href="#content">
          <img src="/brand/birthhub360-simbolo.svg" alt="" width="28" height="28" />
          <span>
            Birth Hub <b>360°</b>
          </span>
        </a>
        <p>{BRAND.credit}</p>
        <p className="site-footer-meta">
          Isolamento multi-tenant via RLS · Ledger de auditoria · Conformidade LGPD
        </p>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* App                                                                         */
/* -------------------------------------------------------------------------- */

export function App() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <a className="skip" href="#content">
        Pular para o conteúdo
      </a>
      <Header theme={theme} onToggleTheme={toggle} />
      <main id="content">
        <Hero />
        <Principles />
        <StatsBand />
        <PainSection />
        <AgentsSection />
        <GovernanceSection />
        <DojoSection />
        <RolesSection />
        <ModulesSection />
        <StorySection />
        <FeedSection />
        <FaqSection />
        <DemoSection />
        <Closing />
      </main>
      <Footer />
    </>
  );
}

export default App;
