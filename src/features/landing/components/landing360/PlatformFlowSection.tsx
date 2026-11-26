import { ArrowRight, Building2, Bot, Database, GitBranch, LineChart, Sparkles, Target, Workflow } from 'lucide-react';

/** Arquitetura da Plataforma — sistema operacional comercial. */
export function PlatformSection() {
  return (
    <section className="b360-section" id="plataforma">
      <div className="b360-sectionhead">
        <div className="b360-eyebrow">SISTEMA OPERACIONAL COMERCIAL</div>
        <h2>Um centro de comando para a sua receita.</h2>
        <p>Dados, diagnóstico e execução integrados na mesma experiência.</p>
      </div>

      <div className="b360-platform-grid">
        <article className="b360-platform-card">
          <div className="b360-platform-icon bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
            <Database className="w-6 h-6" />
          </div>
          <h3>Dados e conectividade Multi-CRM</h3>
          <p>
            Conexões via APIs abertas e webhooks mantêm os conectores em produção (Bitrix24,
            WhatsApp Official API, VoiceHub e Webhooks/REST) sincronizados sem duplicação;
            HubSpot, Salesforce e Pipedrive seguem em homologação.
          </p>
          <div className="b360-platform-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <span>Persistência RLS Multi-Tenant</span>
          </div>
          <div className="b360-card-action">
            <span>Inspecionar capacidades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </article>

        <article className="b360-platform-card">
          <div className="b360-platform-icon bg-[#FF2D9B]/10 text-[#FF2D9B] border border-[#FF2D9B]/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3>Diagnóstico e inteligência</h3>
          <p>
            Analise a saúde das contas, identifique riscos de estagnação e receba recomendações
            preditivas fundamentadas no histórico real de negociações para destravar o fechamento.
          </p>
          <div className="b360-platform-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D9B] animate-pulse" />
            <span>Copiloto Contextual & NBA</span>
          </div>
          <div className="b360-card-action">
            <span>Inspecionar capacidades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </article>

        <article className="b360-platform-card">
          <div className="b360-platform-icon bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/30">
            <Workflow className="w-6 h-6" />
          </div>
          <h3>Execução e orquestração</h3>
          <p>
            Coordene a rotina de SDRs, Closers e liderança com cadências multicanal, regras rígidas
            de SLA e supervisão autônoma para garantir passagens de bastão sem fricção.
          </p>
          <div className="b360-platform-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC107] animate-pulse" />
            <span>Passagem de Bastão com SLA</span>
          </div>
          <div className="b360-card-action">
            <span>Inspecionar capacidades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </article>
      </div>
    </section>
  );
}

/** Fluxo — jornada completa da prospecção ao fechamento. */
export function FlowSection() {
  return (
    <section className="b360-section" id="fluxo">
      <div className="b360-sectionhead">
        <div className="b360-eyebrow">JORNADA COMPLETA</div>
        <h2>Da prospecção ao fechamento.</h2>
        <p>Um fluxo contínuo, com contexto preservado em cada passagem de bastão.</p>
      </div>

      <div className="b360-flow-connected">
        <div className="b360-flow-card">
          <div className="b360-flow-num-badge">01</div>
          <div className="b360-flow-icon">
            <Building2 className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <h3>Entrada e captura</h3>
          <p>
            Leads e contas chegam por CRMs, campanhas de marketing e prospecção ativa com
            enriquecimento automático.
          </p>
          <div className="b360-flow-kpi">Inbound & Outbound</div>
        </div>

        <div className="b360-flow-connector" aria-hidden="true">
          <div className="b360-flow-line" />
          <ArrowRight className="w-4 h-4 b360-flow-arrow" />
        </div>

        <div className="b360-flow-card">
          <div className="b360-flow-num-badge">02</div>
          <div className="b360-flow-icon">
            <Target className="w-5 h-5 text-[#FF2D9B]" />
          </div>
          <h3>Enriquecimento B2B</h3>
          <p>
            Dados de empresas, decisores e CNAE apoiam a validação imediata do ICP e priorização
            inteligente de contas.
          </p>
          <div className="b360-flow-kpi">Match ICP & QSA</div>
        </div>

        <div className="b360-flow-connector" aria-hidden="true">
          <div className="b360-flow-line" />
          <ArrowRight className="w-4 h-4 b360-flow-arrow" />
        </div>

        <div className="b360-flow-card">
          <div className="b360-flow-num-badge">03</div>
          <div className="b360-flow-icon">
            <GitBranch className="w-5 h-5 text-[#FFC107]" />
          </div>
          <h3>Cadência e SLA</h3>
          <p>
            Distribuição automática e contato ágil entre SDR e Closer seguindo regras operacionais
            rígidas de SLA.
          </p>
          <div className="b360-flow-kpi">Toques Multicanal</div>
        </div>

        <div className="b360-flow-connector" aria-hidden="true">
          <div className="b360-flow-line" />
          <ArrowRight className="w-4 h-4 b360-flow-arrow" />
        </div>

        <div className="b360-flow-card">
          <div className="b360-flow-num-badge">04</div>
          <div className="b360-flow-icon">
            <Bot className="w-5 h-5 text-[#8B7DFF]" />
          </div>
          <h3>Apoio com IA</h3>
          <p>
            Histórico contextual, matriz de objeções e copiloto orientam as abordagens e reuniões
            de negociação.
          </p>
          <div className="b360-flow-kpi">NBA contextual</div>
        </div>

        <div className="b360-flow-connector" aria-hidden="true">
          <div className="b360-flow-line" />
          <ArrowRight className="w-4 h-4 b360-flow-arrow" />
        </div>

        <div className="b360-flow-card">
          <div className="b360-flow-num-badge">05</div>
          <div className="b360-flow-icon">
            <LineChart className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <h3>Fechamento e dados</h3>
          <p>
            O aprendizado dos negócios ganhos e perdidos realimenta os modelos estatísticos de
            previsão de receita.
          </p>
          <div className="b360-flow-kpi">Forecast Ponderado</div>
        </div>
      </div>
    </section>
  );
}
