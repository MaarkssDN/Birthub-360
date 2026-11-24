import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/v2/Button";
import { Badge } from "@/components/ui/v2/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Landing360V2 — Agente 36 (Léo), Onda ONDA-DESIGN-PREMIUM-2026-11-24.
 *
 * Landing premium do Birth Hub 360°: navy foundation, acento gold,
 * tipografia Sora/Inter, hierarquia por respiro (não por efeitos).
 * Sem estética genérica de SaaS de IA — sem gradientes roxos, sem glassmorphism
 * decorativo, sem claims inventados.
 *
 * Adoção: renderizar no lugar de <Landing360 /> quando
 * isDesignV2Enabled(design.newLanding) — wiring da rota é handoff do
 * Agente 31 (App.tsx é propriedade dele).
 */

const PILLARS = [
  {
    icon: Briefcase,
    title: "CRM & Receita",
    description:
      "Funil, previsibilidade e metas comerciais em um único fluxo — do primeiro contato ao fechamento.",
  },
  {
    icon: Workflow,
    title: "Automações",
    description:
      "Cadências e workflows que trabalham enquanto sua equipe foca no que exige julgamento humano.",
  },
  {
    icon: Phone,
    title: "Voz & Omnichannel",
    description:
      "Discador, transcrição e inbox unificado para cada conversa — telefone, WhatsApp e e-mail.",
  },
  {
    icon: Sparkles,
    title: "IA Comercial",
    description:
      "Copiloto contextual com guardrails: sugestão fundamentada, nunca resposta inventada.",
  },
  {
    icon: BarChart3,
    title: "Inteligência",
    description:
      "Dashboards e cohort analytics que respondem por que a receita aconteceu — não só quanto.",
  },
  {
    icon: ShieldCheck,
    title: "Governança",
    description:
      "Multi-tenancy, LGPD e trilha de auditoria como fundação — não como configuração opcional.",
  },
] as const;

const PROOF_POINTS = [
  { icon: Users, label: "Equipes comerciais" },
  { icon: MessageSquare, label: "Omnichannel nativo" },
  { icon: Workflow, label: "Automações com governança" },
] as const;

export function Landing360V2() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 font-body text-white antialiased">
      {/* ===================== NAV ===================== */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-lg bg-gold-500 text-navy-900"
          >
            <span className="font-display text-sm font-bold">B</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Birth Hub 360°
          </span>
        </div>
        <nav aria-label="Navegação principal" className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
            className="text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Entrar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/login")}
          >
            Começar agora
          </Button>
        </nav>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
        <Reveal>
          <Badge variant="default" className="mb-6">
            Plataforma comercial completa
          </Badge>
        </Reveal>
        <Reveal>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Sua operação comercial,
            <span className="text-gold-400"> inteira em um só lugar.</span>
          </h1>
        </Reveal>
        <Reveal>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            CRM, prospecção, voz, IA e automações integrados — com
            multi-tenancy e LGPD nativos. Feito para equipes que precisam de
            previsibilidade, não de mais uma ferramenta.
          </p>
        </Reveal>
        <Reveal>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate("/login")}
              className="group"
            >
              Explorar a plataforma
              <ArrowRight
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/login")}
              className="border-white/15 bg-transparent text-white hover:bg-white/5"
            >
              Falar com vendas
            </Button>
          </div>
        </Reveal>

        {/* Proof points */}
        <Reveal>
          <ul className="mt-16 flex flex-wrap gap-x-8 gap-y-3">
            {PROOF_POINTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-slate-400"
              >
                <Icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ===================== PILLARS ===================== */}
      <section
        aria-labelledby="pillars-heading"
        className="border-t border-white/5 bg-navy-800/60"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-gold-400">
              Pilares
            </p>
            <h2
              id="pillars-heading"
              className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Um ecossistema, não um amontoado de ferramentas.
            </h2>
          </Reveal>

          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title}>
                <li
                  className={cn(
                    "group h-full rounded-xl border border-white/10 bg-navy-800 p-6",
                    "transition-colors duration-200 hover:border-gold-500/40"
                  )}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-gold-500/25 bg-gold-500/10 text-gold-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {description}
                  </p>
                  <span className="sr-only">Item {i + 1} de {PILLARS.length}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="rounded-2xl border border-gold-500/20 bg-gradient-to-br from-navy-800 to-navy-900 px-8 py-14 text-center sm:px-16">
            <h2 className="mx-auto max-w-xl font-display text-3xl font-bold tracking-tight text-white">
              Pronto para dar previsibilidade à sua receita?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-300">
              Comece com o Hub Central e ative os módulos que sua operação
              precisa — sem instalar nada.
            </p>
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate("/login")}
              className="mt-8"
            >
              Criar minha conta
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white0 sm:flex-row">
          <span>© {new Date().getFullYear()} Birth Hub 360°</span>
          <nav aria-label="Rodapé" className="flex gap-6">
            <a href="/privacy" className="hover:text-slate-300">
              Privacidade
            </a>
            <a href="/terms" className="hover:text-slate-300">
              Termos de uso
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
