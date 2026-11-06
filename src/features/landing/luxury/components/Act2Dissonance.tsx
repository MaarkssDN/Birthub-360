import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Cpu,
  Database,
  EyeOff,
  Layers,
  Unlink,
} from 'lucide-react';
import { SpotlightCard } from './SpotlightCard.js';

const INTEGRATION_ECOSYSTEM = [
  { name: 'Bitrix24', src: '/landing/assets/bitrix24.svg' },
  { name: 'Salesforce', src: '/landing/assets/salesforce.svg' },
  { name: 'HubSpot', src: '/landing/assets/hubspot.svg' },
  { name: 'Pipedrive', src: '/landing/assets/pipedrive.svg' },
  { name: 'WhatsApp', src: '/landing/assets/whatsapp.svg' },
  { name: 'Google', src: '/landing/assets/google.svg' },
  { name: 'Microsoft', src: '/landing/assets/microsoft.svg' },
  { name: 'Webhooks', src: '/landing/assets/webhooks.svg' },
] as const;

export function Act2Dissonance() {
  return (
    <section
      id="tese"
      className="relative py-24 sm:py-32 bg-[#0D0D0D] border-t border-white/[0.06] overflow-hidden"
    >
      {/* Sutil gradiente de alerta/fundo */}
      <div className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EF4444]/[0.03] blur-3xl rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 sm:mb-20">
          <div className="lux-hud-tag text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/[0.08]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />A Anatomia da Fuga de Receita
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.02em] leading-tight text-[#F8F9FF]">
            A ilusão das <span className="text-[#EF4444]">ferramentas isoladas</span> está custando
            o seu crescimento.
          </h2>

          <p className="text-base sm:text-lg text-[#9EADC8] leading-relaxed">
            A maioria das empresas opera com um quebra-cabeça de 10 a 15 softwares desconexos. O
            resultado não é inteligência: é atrito operacional, perda de contexto e receita
            invisível que escapa pelo funil.
          </p>
        </div>

        {/* Matriz de Dissonância: Caos Atual vs. Central de Comando */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Card: O Modelo Tradicional Fragmentado com Spotlight Vermelho */}
          <SpotlightCard
            glowColor="rgba(239, 68, 68, 0.18)"
            className="p-8 sm:p-10 border-[#EF4444]/25 bg-[#14141A]/70 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-8">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444]">
                    <Ban className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#F8F9FF]">O Ecossistema Retalhado</h3>
                    <span className="font-mono text-xs text-[#EF4444]">
                      CRMs Legados & Plugins Avulsos
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-[#EF4444]/15 text-[#EF4444]">
                  ALTO RISCO
                </span>
              </div>

              <ul className="space-y-5 text-sm text-[#9EADC8]">
                <li className="flex items-start gap-3">
                  <Unlink className="w-4 h-4 text-[#EF4444] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Silos cegos de informação:</strong> O CRM não
                    conversa com a cadência, que ignora o canal de voz, que não alimenta o
                    financeiro.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Database className="w-4 h-4 text-[#EF4444] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Deterioração contínua de dados:</strong> 70%
                    dos contatos ficam desatualizados ou incompletos por falta de enriquecimento em
                    tempo real.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Cpu className="w-4 h-4 text-[#EF4444] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">IA cosmética e sem contexto:</strong> Bots
                    genéricos de mercado que inventam dados (alucinação) por não estarem ancorados
                    no histórico corporativo real.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <EyeOff className="w-4 h-4 text-[#EF4444] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Gestão reativa e tardia:</strong> O diretor
                    só descobre que a meta não será batida no final do mês, quando nada mais pode
                    ser corrigido.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#9EADC8]">
              <span>Custo Invisível</span>
              <span className="text-[#EF4444] font-bold">~28% de Perda de Eficiência</span>
            </div>
          </SpotlightCard>

          {/* Card: A Central de Comando Birth Hub 360 com Spotlight Ciano */}
          <SpotlightCard
            glowColor="rgba(0, 212, 255, 0.28)"
            className="p-8 sm:p-10 border-[#00D4FF]/35 bg-[#14141A] shadow-[0_0_40px_rgba(0,212,255,0.12)] flex flex-col justify-between"
          >
            <div>
              {/* Brilho sutil no topo do card */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] via-[#FF2D9B] to-[#FFC107]" />

              <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-8">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                    <Layers className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#F8F9FF]">Birth Hub 360º</h3>
                    <span className="font-mono text-xs text-[#00D4FF]">
                      Central de Comando Unificada
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-[#00D4FF]/15 text-[#00D4FF]">
                  SOBERANO
                </span>
              </div>

              <ul className="space-y-5 text-sm text-[#9EADC8]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4FF] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Fluxo contínuo 360º:</strong> Da prospecção
                    outbound à mesa de fechamento, cada interação alimenta o mesmo cérebro
                    operacional.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FF2D9B] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Enriquecimento contínuo autônomo:</strong>{' '}
                    Sinais de compra e inteligência de decisores sincronizados a cada segundo com
                    isolamento RLS.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC107] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Copiloto IA proprietário:</strong> Respostas
                    ancoradas estritamente no seu playbook, dados históricos e matriz de objeções
                    validada.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-1" />
                  <span>
                    <strong className="text-[#F8F9FF]">Previsibilidade matemática:</strong>{' '}
                    Modelagem estatística de probabilidade que antecipa gargalos e alerta a próxima
                    melhor ação (NBA).
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#9EADC8]">
              <span>Ganho Operacional</span>
              <span className="text-[#00D4FF] font-bold">+42% Velocidade no Pipeline</span>
            </div>
          </SpotlightCard>
        </div>

        {/* Ticker de Conectividade Soberana Multi-CRM */}
        <div className="mt-16 pt-12 border-t border-white/[0.08]">
          <div className="text-center space-y-2 mb-8">
            <span className="font-mono text-xs uppercase tracking-widest text-[#9EADC8]">
              Interoperabilidade Universal sem Rompimento de Legado
            </span>
            <p className="text-sm font-semibold text-[#F8F9FF]">
              Conecta-se e sincroniza nativamente com o seu ecossistema atual
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
            {INTEGRATION_ECOSYSTEM.map((item) => (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all group"
              >
                <img
                  src={item.src}
                  alt={item.name}
                  className="h-6 w-6 object-contain opacity-70 group-hover:opacity-100 transition-opacity filter brightness-110"
                />
                <span className="mt-2 text-[11px] font-mono text-[#9EADC8] group-hover:text-[#F8F9FF] transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
