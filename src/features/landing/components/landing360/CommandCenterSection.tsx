import { B360CountUp } from '../CinematicFX.js';
import { BH360LogoMark, COMMAND_MODULES } from './data.js';

interface CommandCenterSectionProps {
  onOpenModal: (title: string, desc: string, pillarNum?: string) => void;
}

/** MODO 2: COMMAND CENTER (SANDBOX INTERATIVO) — sidebar + conteúdo central. */
export function CommandCenterSection({ onOpenModal }: CommandCenterSectionProps) {
  return (
    <div className="b360-shell b360-dashboard-layout">
      {/* Sidebar */}
      <aside className="b360-side" aria-label="Módulos da Plataforma">
        <div className="b360-side-brand">
          <BH360LogoMark size={28} />
          <span className="font-bold b360-sidebar-wordmark">
            Birth Hub <strong className="text-pink-500">360°</strong>
          </span>
        </div>
        <small>PRINCIPAL</small>
        <button
          type="button"
          className="b360-active"
          onClick={() =>
            onOpenModal(
              'Command Center',
              'Centro unificado de operações de receita e monitoramento operacional.',
            )
          }
        >
          <span className="b360-dot" /> Command Center
        </button>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'Inteligência Comercial',
              'Copiloto de IA, Next Best Action (NBA), diagnóstico de gargalos e recomendações de deals.',
            )
          }
        >
          ✧ Inteligência
        </button>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'CRM & BI 360°',
              'Pipeline unificado, visualização de negócios por valor, previsão ponderada e telemetria.',
            )
          }
        >
          ▦ CRM & BI
        </button>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'Prospecção B2B',
              'Mapeamento de empresas no Brasil, descoberta de sócios e decisores, qualificação de ICP.',
            )
          }
        >
          ◎ Prospecção
        </button>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'Automações',
              'Gatilhos Multi-CRM, cadências automáticas de follow-up e sincronização de eventos.',
            )
          }
        >
          ⌘ Automações
        </button>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'VoiceHub',
              'Telefonia corporativa em nuvem, discador automático e transcrição com inteligência artificial.',
            )
          }
        >
          ◈ VoiceHub
        </button>
        <small>CONTROLE</small>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'Governança & RLS',
              'Isolamento multi-tenant estrito, controle de papéis (RBAC) e governança de privacidade LGPD.',
            )
          }
        >
          ◉ Governança
        </button>
        <button
          type="button"
          onClick={() =>
            onOpenModal(
              'Central de Integrações',
              'Conectores para Bitrix24, Salesforce, HubSpot, WhatsApp Oficial e webhooks customizados.',
            )
          }
        >
          ⥈ Integrações
        </button>
      </aside>

      {/* Conteúdo Central do Command Center */}
      <div>
        <div className="b360-dash-header">
          <div>
            <div className="b360-eyebrow">SEU CENTRO DE OPERAÇÕES</div>
            <h1>Command Center</h1>
            <p>Agentes inteligentes, operações e indicadores em uma única tela.</p>
          </div>
          <button
            className="b360-aurora b360-small"
            type="button"
            onClick={() =>
              onOpenModal(
                'Nova Missão Comercial',
                'Defina o objetivo operacional: prospecção ativa, auditoria de gargalos ou cadência multicanal.',
              )
            }
          >
            <span className="b360-aurora-inner">+ Nova missão</span>
          </button>
        </div>

        {/* Card do Supervisor On-line */}
        <section className="b360-supervisor">
          <div className="b360-eyebrow">SUPERVISOR ON-LINE</div>
          <h2>O que vamos conquistar hoje?</h2>
          <p>
            Descreva seu objetivo de vendas. Eu coordeno os agentes, analiso o pipeline e trago as
            ações prioritárias.
          </p>
          <button
            className="b360-aurora b360-small"
            type="button"
            onClick={() =>
              onOpenModal(
                'Iniciar Missão Autônoma',
                'O Supervisor ativará os agentes de Enriquecimento, Qualificação e Copiloto para analisar seu pipeline com contexto atualizado.',
              )
            }
          >
            <span className="b360-aurora-inner">Iniciar missão →</span>
          </button>
        </section>

        {/* Métricas Operacionais */}
        <div className="b360-metrics">
          <div className="b360-metric">
            <small>Missões · simulação</small>
            <strong>
              <B360CountUp to={128} />
            </strong>
            <span>● Operação contínua</span>
          </div>
          <div className="b360-metric">
            <small>Agentes · catálogo público</small>
            <strong>
              <B360CountUp to={20} suffix=" +" />
            </strong>
            <span>● Copiloto Supervisor</span>
          </div>
          <div className="b360-metric">
            <small>Oportunidades · simulação</small>
            <strong>
              <B360CountUp to={86} />
            </strong>
            <span>● Cenário ilustrativo</span>
          </div>
        </div>

        {/* Módulos do Sistema */}
        <div className="b360-sectionhead" style={{ margin: '36px 0 20px', textAlign: 'left' }}>
          <div className="b360-eyebrow">EXPLORE A PLATAFORMA</div>
          <h2>Onze módulos integrados</h2>
          <p style={{ margin: 0 }}>
            Clique em qualquer módulo para inspecionar os recursos e capacidades integradas.
          </p>
        </div>

        <div className="b360-modules">
          {COMMAND_MODULES.map((mod) => (
            <button
              key={mod.name}
              type="button"
              className="b360-module"
              onClick={() => onOpenModal(mod.name, mod.modalDesc)}
            >
              <span className="b360-ico">{mod.ico}</span>
              <b>{mod.name}</b>
              <span>{mod.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
