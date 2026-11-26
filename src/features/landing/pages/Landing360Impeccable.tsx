import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  Sun,
} from 'lucide-react';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import type React from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BirthHubLogo } from '@/components/brand/BirthHubLogo';
import { isAuthorizedLoginEmail } from '@/config/access-policy';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  type HeroVariant,
  trackHeroCtaPrimaryClick,
  trackHeroVariantImpression,
} from '@/lib/analytics/conversionTelemetry';
import { authClient } from '@/lib/auth-client';
import { SoundFX } from '@/lib/soundEffects';
import { PillarDetailModal } from '../components/PillarDetailModal.js';
import { RoiSimulatorModal } from '../components/RoiSimulatorModal.js';
import {
  CM,
  fanAngles,
  FLOW,
  INTEGRATIONS,
  METRICS,
  PILLARS,
  SECURITY,
} from './landing360Impeccable.data.js';
import './Landing360Impeccable.css';

const LuxuryLandingPage = lazy(() =>
  import('../luxury/LuxuryLandingPage.js').then((m) => ({ default: m.LuxuryLandingPage })),
);

/* ─── CountUp ──────────────────────────────────────────────────────────── */
function CountUp({
  to,
  suffix = '',
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const spring = useSpring(0, { stiffness: 40, damping: 20 });
  const [d, setD] = useState('0');
  useEffect(() => {
    if (inView) spring.set(to);
  }, [inView, spring, to]);
  useMotionValueEvent(spring, 'change', (v) => setD(v.toFixed(decimals)));
  return (
    <span ref={ref}>
      {d}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export function Landing360({ initialScreen = 'intro' }: { initialScreen?: 'intro' | 'login' }) {
  const [screen, setScreen] = useState<'intro' | 'login'>(initialScreen);
  const [pillarId, setPillarId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ title: string; desc: string } | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'email' | 'sso'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [rem, setRem] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const { currentUser, isPending } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const [sp] = useSearchParams();
  const reduce = Boolean(useReducedMotion());
  const abV: HeroVariant = 'A';
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: '-100px' });
  const cmdRef = useRef<HTMLDivElement>(null);
  const cmdInView = useInView(cmdRef, { once: true, margin: '-80px' });

  // Effects
  useEffect(() => {
    if (currentUser && !isPending) void nav('/app', { replace: true });
  }, [currentUser, isPending, nav]);
  useEffect(() => {
    if (loc.pathname === '/login') setScreen('login');
    else if (loc.pathname === '/' || loc.pathname === '/welcome') {
      if (initialScreen !== 'login') setScreen('intro');
    }
  }, [loc.pathname, initialScreen]);
  useEffect(() => {
    const e = sp.get('error');
    if (e === 'sso_failed' || e === 'oauth_failed') setErr('Falha na autenticação via SSO.');
    else if (e === 'unauthorized') setErr('Acesso não autorizado.');
    else if (e) setErr(decodeURIComponent(e));
  }, [sp]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme !== 'dark');
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.title = 'Birth Hub 360° · Revenue Command Center';
  }, []);
  useEffect(() => {
    const fn = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => {
    if (screen === 'intro') trackHeroVariantImpression(abV);
  }, [screen, abV]);

  // Handlers
  const goLogin = () => {
    SoundFX.play('click');
    trackHeroCtaPrimaryClick(abV, 'cta');
    setScreen('login');
    if (loc.pathname !== '/login') void nav('/login', { replace: true });
  };
  const goHome = () => {
    SoundFX.play('click');
    setScreen('intro');
    if (loc.pathname === '/login') void nav('/', { replace: true });
  };
  const openPillar = (id: string, t: string, d: string) => {
    SoundFX.play('click');
    setPillarId(id);
    setModal({ title: t, desc: d });
  };
  const closeModal = () => {
    SoundFX.play('click');
    setPillarId(null);
    setModal(null);
  };
  const openSim = () => {
    SoundFX.play('click');
    setSimOpen(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');
    setBusy(true);
    try {
      if (authMode === 'forgot') {
        await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
        setOk('Link enviado! Verifique seu e-mail.');
        setBusy(false);
        return;
      }
      if (authMode === 'signup') {
        if (!isAuthorizedLoginEmail(email)) {
          setErr('E-mail não autorizado.');
          setBusy(false);
          return;
        }
        const r = await authClient.signUp.email({ email, password: pw, name, callbackURL: '/app' });
        if (r.error) {
          setErr(r.error.message || 'Erro ao criar conta.');
          setBusy(false);
          return;
        }
        setOk('Conta criada! Verifique seu e-mail.');
        setBusy(false);
        return;
      }
      if (!isAuthorizedLoginEmail(email)) {
        setErr('E-mail não autorizado.');
        setBusy(false);
        return;
      }
      const r = await authClient.signIn.email({
        email,
        password: pw,
        rememberMe: rem,
        callbackURL: '/app',
      });
      if (r.error) {
        setErr(r.error.message || 'Credenciais inválidas.');
        setBusy(false);
        return;
      }
    } catch {
      setErr('Erro de conexão.');
    }
    setBusy(false);
  };
  const handleSso = async () => {
    setBusy(true);
    setErr('');
    try {
      await authClient.signIn.social({
        provider: 'microsoft',
        callbackURL: '/app',
        errorCallbackURL: `/login?error=sso_failed`,
      });
    } catch {
      setErr('Erro ao iniciar SSO.');
    }
    setBusy(false);
  };

  if (isPending)
    return (
      <div className="lp lp-loader">
        <Loader2 className="w-8 h-8 lp-spinner" style={{ color: 'var(--brand)' }} />
      </div>
    );

  /* ═══ LOGIN SCREEN ═══════════════════════════════════════════════════════ */
  if (screen === 'login')
    return (
      <main className="lp">
        <div className="lp-login">
          <button className="lp-btn lp-btn-i lp-login-back" onClick={goHome} aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <motion.div
            className="lp-login-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="lp-login-logo">
              <BirthHubLogo className="w-9 h-9" /> Birth Hub 360°
            </div>
            <div className="lp-login-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={authMethod === 'email'}
                className="lp-login-tab"
                onClick={() => setAuthMethod('email')}
              >
                E-mail
              </button>
              <button
                role="tab"
                aria-selected={authMethod === 'sso'}
                className="lp-login-tab"
                onClick={() => setAuthMethod('sso')}
              >
                SSO
              </button>
            </div>
            {err && (
              <div className="lp-err">
                <AlertCircle className="w-4 h-4" />
                {err}
              </div>
            )}
            {ok && (
              <div className="lp-ok">
                <CheckCircle2 className="w-4 h-4" />
                {ok}
              </div>
            )}
            {authMethod === 'email' ? (
              <form onSubmit={handleAuth}>
                {authMode === 'signup' && (
                  <div className="lp-fld">
                    <label>Nome</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                )}
                <div className="lp-fld">
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErr('');
                    }}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                {authMode !== 'forgot' && (
                  <div className="lp-fld">
                    <label>Senha</label>
                    <div className="lp-fld-pw">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="lp-fld-pw-tog"
                        onClick={() => setShowPw(!showPw)}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {authMode === 'signin' && (
                  <div className="lp-rem">
                    <label className="lp-rem-chk">
                      <input
                        type="checkbox"
                        checked={rem}
                        onChange={(e) => setRem(e.target.checked)}
                      />
                      Lembrar
                    </label>
                    <button
                      type="button"
                      className="lp-forgot"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErr('');
                        setOk('');
                      }}
                    >
                      Esqueci a senha
                    </button>
                  </div>
                )}
                <button type="submit" className="lp-btn lp-btn-p lp-login-sub" disabled={busy}>
                  {busy && <Loader2 className="w-4 h-4 lp-spinner" />}
                  {authMode === 'signin'
                    ? 'Entrar'
                    : authMode === 'signup'
                      ? 'Criar conta'
                      : 'Enviar link'}
                </button>
                <div className="lp-login-ft">
                  {authMode === 'signin' && (
                    <>
                      Não tem conta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setErr('');
                          setOk('');
                        }}
                      >
                        Criar
                      </button>
                    </>
                  )}
                  {authMode === 'signup' && (
                    <>
                      Já tem conta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setErr('');
                          setOk('');
                        }}
                      >
                        Entrar
                      </button>
                    </>
                  )}
                  {authMode === 'forgot' && (
                    <>
                      Lembrou?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setErr('');
                          setOk('');
                        }}
                      >
                        Voltar
                      </button>
                    </>
                  )}
                </div>
              </form>
            ) : (
              <div>
                <div className="lp-fld">
                  <label>Domínio corporativo</label>
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErr('');
                    }}
                    placeholder="empresa.com.br"
                  />
                </div>
                <button
                  className="lp-btn lp-btn-p lp-login-sub"
                  onClick={handleSso}
                  disabled={busy}
                >
                  {busy && <Loader2 className="w-4 h-4 lp-spinner" />}Conectar via SSO
                </button>
                <div className="lp-login-ft">
                  Prefere e-mail?{' '}
                  <button type="button" onClick={() => setAuthMethod('email')}>
                    Usar e-mail
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    );

  /* ═══ INTRO SCREEN ═══════════════════════════════════════════════════════ */
  return (
    <main className="lp">
      {/* Scroll progress bar */}
      <motion.div className="lp-progress">
        <motion.div className="lp-progress-bar" style={{ scaleX: smoothProgress }} />
      </motion.div>

      {/* Header */}
      <header className="lp-hdr">
        <div className="lp-c lp-hdr-inner">
          <a href="/" className="lp-logo">
            <BirthHubLogo className="w-9 h-9" /> Birth Hub 360°
          </a>
          <nav className="lp-nav">
            <a href="#modules">Módulos</a>
            <a href="#how">Como funciona</a>
            <a href="#security">Segurança</a>
          </nav>
          <div className="lp-hdr-acts">
            <button className="lp-btn lp-btn-i" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="lp-btn lp-btn-g lp-btn-sm" onClick={goLogin}>
              Entrar
            </button>
            <button className="lp-btn lp-btn-p lp-btn-sm" onClick={goLogin}>
              Começar
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-ambient">
          <div className="lp-hero-orb lp-hero-orb-a" />
          <div className="lp-hero-orb lp-hero-orb-b" />
        </div>
        <div className="lp-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="lp-hero-line">
              <motion.span
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Revenue Command Center
              </motion.span>
            </span>
          </motion.h1>
          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            A plataforma definitiva de CRM B2B para escalar receita com inteligência artificial,
            automações e visão 360°.
          </motion.p>
          <motion.div
            className="lp-hero-acts"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button className="lp-btn lp-btn-p" onClick={goLogin}>
              Acessar plataforma
            </button>
            <button className="lp-btn lp-btn-g" onClick={openSim}>
              Simular ROI
            </button>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="lp-metrics">
        <div className="lp-c">
          <div className="lp-metrics-grid">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="lp-metric-val">
                  <CountUp to={m.value} suffix={m.suffix} decimals={0} />
                </div>
                <div className="lp-metric-lbl">{m.label}</div>
                <div className="lp-metric-det">{m.detail}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules - Fan to Grid */}
      <section id="modules" className="lp-sec">
        <div className="lp-c">
          <motion.div
            className="lp-sec-hdr"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>11 Módulos Integrados</h2>
            <p>
              Da prospecção ao fechamento, cada módulo foi projetado para trabalhar em harmonia.
            </p>
          </motion.div>
          <div ref={cardsRef} className="lp-cards-grid">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.article
                  key={p.id}
                  className="lp-card"
                  onClick={() => openPillar(p.id, p.title, p.desc)}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          rotate: fanAngles[i],
                          x: fanAngles[i] * 3,
                          y: 40,
                          scale: 0.92,
                        }
                  }
                  animate={
                    cardsInView
                      ? reduce
                        ? { opacity: 1 }
                        : { opacity: 1, rotate: 0, x: 0, y: 0, scale: 1 }
                      : {}
                  }
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                >
                  <div className={`lp-card-icon ${CM[p.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <div className="lp-card-kpi">{p.kpi}</div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Command Center - Perspective Reveal */}
      <section className="lp-sec lp-cmd">
        <div className="lp-c">
          <motion.div
            className="lp-sec-hdr"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Command Center</h2>
            <p>Visão unificada de pipeline, forecast, agentes IA e métricas operacionais.</p>
          </motion.div>
          <motion.div
            ref={cmdRef}
            className="lp-cmd-panel"
            initial={{ opacity: 0, rotateX: 35, y: 60 }}
            animate={cmdInView ? { opacity: 1, rotateX: 0, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lp-cmd-inner">
              <div className="lp-cmd-widget">
                <h3>Pipeline ao Vivo</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
                  Negócios em andamento com scoring automático e previsão de fechamento.
                </p>
              </div>
              <div className="lp-cmd-widget">
                <h3>Agentes IA</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
                  Enxame de 20+ agentes para tarefas de prospecção, análise e follow-up.
                </p>
              </div>
              <div className="lp-cmd-widget">
                <h3>Forecast Preditivo</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
                  Projeção de receita com calibração contínua contra realizado.
                </p>
              </div>
              <div className="lp-cmd-widget">
                <h3>Métricas de Time</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
                  Performance individual e coletiva com gamificação e coaching.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-sec">
        <div className="lp-c">
          <motion.div
            className="lp-sec-hdr"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Como funciona</h2>
            <p>Da conexão de dados à previsibilidade de receita em quatro passos.</p>
          </motion.div>
          <div className="lp-flow">
            {FLOW.map((s, i) => (
              <motion.div
                key={s.title}
                className="lp-flow-step"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="lp-sec">
        <div className="lp-c">
          <motion.div
            className="lp-sec-hdr"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Integrações Nativas</h2>
            <p>Conecte seu stack de vendas sem código.</p>
          </motion.div>
          <div className="lp-chips">
            {INTEGRATIONS.map((int, i) => (
              <motion.span
                key={int}
                className="lp-chip"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                {int}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="lp-sec">
        <div className="lp-c">
          <motion.div
            className="lp-sec-hdr"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Segurança Enterprise</h2>
            <p>Arquitetura multi-tenant com LGPD nativa e auditoria contínua.</p>
          </motion.div>
          <div className="lp-sec-grid">
            {SECURITY.map((s, i) => {
              const Ic = s.icon;
              return (
                <motion.div
                  key={s.title}
                  className="lp-sec-item"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="lp-sec-ico">
                    <Ic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-c">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Pronto para escalar sua receita?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Conheça a plataforma que une IA, automação e visão 360° do cliente.
          </motion.p>
          <motion.div
            className="lp-cta-acts"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button className="lp-btn lp-btn-p" onClick={goLogin}>
              Começar agora
            </button>
            <button className="lp-btn lp-btn-g" onClick={openSim}>
              Calcular ROI
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-ft">
        <div className="lp-c">
          <div className="lp-ft-grid">
            <div>
              <div className="lp-ft-brand">
                <BirthHubLogo className="w-7 h-7" /> Birth Hub 360°
              </div>
              <p className="lp-ft-desc">
                Revenue Command Center para times B2B que querem escalar com inteligência.
              </p>
            </div>
            <div>
              <h4>Produto</h4>
              <ul className="lp-ft-links">
                <li>
                  <a href="#modules">Módulos</a>
                </li>
                <li>
                  <a href="#how">Como funciona</a>
                </li>
                <li>
                  <button onClick={openSim}>Simulador ROI</button>
                </li>
              </ul>
            </div>
            <div>
              <h4>Empresa</h4>
              <ul className="lp-ft-links">
                <li>
                  <a href="/about">Sobre</a>
                </li>
                <li>
                  <a href="/careers">Carreiras</a>
                </li>
                <li>
                  <a href="/contact">Contato</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul className="lp-ft-links">
                <li>
                  <a href="/privacy">Privacidade</a>
                </li>
                <li>
                  <a href="/terms">Termos</a>
                </li>
                <li>
                  <a href="/security">Segurança</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="lp-ft-bot">
            <span>© 2024 Birth Hub. Todos os direitos reservados.</span>
            <span>Feito com excelência no Brasil.</span>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <button
        className={`lp-scroll-top${showTop ? ' lp-scroll-top--vis' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Modals */}
      <PillarDetailModal
        isOpen={Boolean(modal)}
        pillarId={pillarId}
        genericModal={modal}
        onClose={closeModal}
        onProceedToLogin={goLogin}
        onOpenRoiSimulator={openSim}
        theme={theme}
      />
      <RoiSimulatorModal
        isOpen={simOpen}
        variant={abV}
        onClose={() => setSimOpen(false)}
        onProceedToLogin={goLogin}
      />
    </main>
  );
}

export default Landing360;
