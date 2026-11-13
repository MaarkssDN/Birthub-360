import { BrainCircuit, Building2, LineChart, Phone, Target, Workflow } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card.js';
import { Input } from '../../../components/ui/Input.js';

/**
 * Formulários da aba "Ferramentas & Regras" de cada pilar de settings.
 * Extraído de `PillarSettingsPlaceholder.tsx` (handoff hotspot >1000 linhas,
 * Onda F1) sem alterar markup, textos ou handlers — os setters continuam
 * sendo os `useState` do componente pai, que é quem persiste via API.
 */
export interface PillarToolsFormsProps {
  pillarName: string;
  // Hub Comercial
  hubStagnationDays: number;
  setHubStagnationDays: Dispatch<SetStateAction<number>>;
  hubRequireLossReason: boolean;
  setHubRequireLossReason: Dispatch<SetStateAction<boolean>>;
  hubDedupCnpj: boolean;
  setHubDedupCnpj: Dispatch<SetStateAction<boolean>>;
  // Inteligência de Mercado
  marketMinRevenue: string;
  setMarketMinRevenue: Dispatch<SetStateAction<string>>;
  marketAutoEnrich: boolean;
  setMarketAutoEnrich: Dispatch<SetStateAction<boolean>>;
  marketSignalAlerts: boolean;
  setMarketSignalAlerts: Dispatch<SetStateAction<boolean>>;
  // Orquestração de Vendas
  salesSpeedToLead: number;
  setSalesSpeedToLead: Dispatch<SetStateAction<number>>;
  salesRequireBant: boolean;
  setSalesRequireBant: Dispatch<SetStateAction<boolean>>;
  salesDailyTouchesLimit: number;
  setSalesDailyTouchesLimit: Dispatch<SetStateAction<number>>;
  // Performance Comercial
  perfBenchmarkRate: number;
  setPerfBenchmarkRate: Dispatch<SetStateAction<number>>;
  perfRepScoreActive: boolean;
  setPerfRepScoreActive: Dispatch<SetStateAction<boolean>>;
  perfAnomalyAlerts: boolean;
  setPerfAnomalyAlerts: Dispatch<SetStateAction<boolean>>;
  // Previsibilidade Comercial
  predModelType: 'historico' | 'manual';
  setPredModelType: Dispatch<SetStateAction<'historico' | 'manual'>>;
  predFreezeDay: number;
  setPredFreezeDay: Dispatch<SetStateAction<number>>;
  predConfidenceFactor: number;
  setPredConfidenceFactor: Dispatch<SetStateAction<number>>;
  // Inteligência Artificial
  aiModel: string;
  setAiModel: Dispatch<SetStateAction<string>>;
  aiTemperature: number;
  setAiTemperature: Dispatch<SetStateAction<number>>;
  aiPiiMasking: boolean;
  setAiPiiMasking: Dispatch<SetStateAction<boolean>>;
  // Automação & Conectividade
  autoBiDirectional: boolean;
  setAutoBiDirectional: Dispatch<SetStateAction<boolean>>;
  autoSyncInterval: number;
  setAutoSyncInterval: Dispatch<SetStateAction<number>>;
  autoRetryCount: number;
  setAutoRetryCount: Dispatch<SetStateAction<number>>;
  // Engajamento Comercial
  engClickToCall: boolean;
  setEngClickToCall: Dispatch<SetStateAction<boolean>>;
  engRecordCalls: boolean;
  setEngRecordCalls: Dispatch<SetStateAction<boolean>>;
  engWorkingHoursOnly: boolean;
  setEngWorkingHoursOnly: Dispatch<SetStateAction<boolean>>;
}

export function PillarToolsForms(props: PillarToolsFormsProps) {
  const { pillarName } = props;
  switch (pillarName) {
    case 'Hub Comercial':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--nav-c-blue)]" />
                <CardTitle>Regras de Governança do Pipeline (CRM)</CardTitle>
              </div>
              <CardDescription>
                Controles de integridade cadastral e regras de movimentação no Kanban comercial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Tempo Limite de Estagnação de Oportunidades</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Alerta visual quando um negócio passa mais tempo que o permitido na mesma etapa.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.hubStagnationDays}
                    onChange={(e) => props.setHubStagnationDays(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">dias</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Exigir Motivo Padronizado ao Perder Negócio</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Obrigatório catalogar concorrente e motivo de perda para alimentar o módulo
                    Win/Loss.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.hubRequireLossReason}
                    onChange={(e) => props.setHubRequireLossReason(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-blue)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Deduplicação Automática por CNPJ e Domínio</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Impede a criação de contas duplicadas e vincula novos leads a contas existentes.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.hubDedupCnpj}
                    onChange={(e) => props.setHubDedupCnpj(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-blue)]" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Inteligência de Mercado':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--nav-c-teal)]" />
                <CardTitle>Critérios e Enriquecimento de ICP</CardTitle>
              </div>
              <CardDescription>
                Parâmetros de qualificação de contas e provedores de inteligência de mercado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Faturamento Mínimo Estimado para ICP</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Empresas abaixo desse piso são marcadas como SMB / Fora de Perfil.
                  </p>
                </div>
                <Input
                  type="text"
                  value={props.marketMinRevenue}
                  onChange={(e) => props.setMarketMinRevenue(e.target.value)}
                  className="w-40 text-sm font-semibold"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Enriquecimento Automático em Cascata</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Consulta Receita Federal, decisores no LinkedIn e contatos telefônicos
                    verificados.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.marketAutoEnrich}
                    onChange={(e) => props.setMarketAutoEnrich(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-teal)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Radar de Sinais & Alertas de Contratação</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Notifica SDRs quando empresas-alvo abrem vagas em cargos comerciais
                    estratégicos.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.marketSignalAlerts}
                    onChange={(e) => props.setMarketSignalAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-teal)]" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Orquestração de Vendas':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-[var(--nav-c-green)]" />
                <CardTitle>SLAs de Execução & Cadência de Vendas</CardTitle>
              </div>
              <CardDescription>
                Políticas operacionais de atendimento, passagem de bastão e limites de toque diário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">SLA de Speed-to-Lead Inbound</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Tempo limite para o primeiro contato telefônico após entrada do lead.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.salesSpeedToLead}
                    onChange={(e) => props.setSalesSpeedToLead(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">minutos</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Checklist Obrigatório BANT / MEDDICC</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Bloqueia envio da reunião para Closer sem notas de Orçamento, Autoridade e Prazo
                    preenchidas.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.salesRequireBant}
                    onChange={(e) => props.setSalesRequireBant(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-green)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Capacidade Máxima Diária por SDR</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Evita sobrecarga e distribui automaticamente novos leads para vendedores
                    disponíveis.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.salesDailyTouchesLimit}
                    onChange={(e) => props.setSalesDailyTouchesLimit(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">toques/dia</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Performance Comercial':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-[var(--nav-c-gold)]" />
                <CardTitle>Métricas de Eficiência & Benchmarks de Funil</CardTitle>
              </div>
              <CardDescription>
                Calibração das metas de conversão por etapa e pesos do Rep Score.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Benchmark de Conversão Mínima de Funil</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Taxa esperada de MQL → Fechamento para sinalizar equipes no verde.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.perfBenchmarkRate}
                    onChange={(e) => props.setPerfBenchmarkRate(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">
                    Ranking e Pontuação de Vendedores (Rep Score)
                  </p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Calcula o score de 0 a 100 baseado em velocidade de atendimento, conversão e
                    disciplina de CRM.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.perfRepScoreActive}
                    onChange={(e) => props.setPerfRepScoreActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-gold)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Notificações de Quedas Bruscas no Funil</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Dispara aviso à liderança quando a taxa de conversão semanal cair mais de 15%.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.perfAnomalyAlerts}
                    onChange={(e) => props.setPerfAnomalyAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-gold)]" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Previsibilidade Comercial':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-[var(--nav-c-teal)]" />
                <CardTitle>Modelo Preditivo & Travas de Forecast</CardTitle>
              </div>
              <CardDescription>
                Parâmetros de cálculo de probabilidade e data de congelamento de projeções mensais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Método de Cálculo do Pipeline Ponderado</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Escolha entre Win Rate histórico dos últimos 90 dias ou valores manuais por
                    etapa.
                  </p>
                </div>
                <select
                  value={props.predModelType}
                  onChange={(e) => props.setPredModelType(e.target.value as 'historico' | 'manual')}
                  className="p-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-medium"
                >
                  <option value="historico">Win Rate Histórico (IA)</option>
                  <option value="manual">Taxa Fixa Manual</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Dia de Congelamento do Commit Mensal</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Data limite em que os closers travam a previsão irrevogável para a diretoria.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--ink-2)]">Todo dia</span>
                  <Input
                    type="number"
                    value={props.predFreezeDay}
                    onChange={(e) => props.setPredFreezeDay(Number(e.target.value))}
                    className="w-16 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">do mês</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Fator de Confiança do Best Case</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Corte de probabilidade mínima para um negócio ser somado no cenário otimista.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.predConfidenceFactor}
                    onChange={(e) => props.setPredConfidenceFactor(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Inteligência Artificial':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[var(--nav-c-iris)]" />
                <CardTitle>Motor Cognitivo & Guardrails de Segurança</CardTitle>
              </div>
              <CardDescription>
                Seleção do modelo de linguagem, temperatura de raciocínio e conformidade LGPD.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Modelo de IA Ativo para Vendas</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Provedor utilizado no Copiloto, Roleplay e Resumo de Chamadas.
                  </p>
                </div>
                <select
                  value={props.aiModel}
                  onChange={(e) => props.setAiModel(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-semibold"
                >
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Recomendado)</option>
                  <option value="GPT-4o">GPT-4o Omnichannel</option>
                  <option value="DeepSeek R1">DeepSeek R1 Comercial</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">
                    Temperatura de Inferência ({props.aiTemperature})
                  </p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Valores baixos produzem respostas mais estruturadas e factuais.
                  </p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={props.aiTemperature}
                  onChange={(e) => props.setAiTemperature(Number(e.target.value))}
                  className="w-32 accent-[var(--nav-c-iris)]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Sanitização e Mascaramento de PII (LGPD)</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Remove CPFs, dados bancários e senhas dos prompts antes do envio para a LLM.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.aiPiiMasking}
                    onChange={(e) => props.setAiPiiMasking(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-iris)]" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Automação & Conectividade':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-[var(--nav-c-gold)]" />
                <CardTitle>Sincronização de Dados & Webhooks</CardTitle>
              </div>
              <CardDescription>
                Parâmetros de polling, taxas de retry e conectores de ERP/CRM externos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Sincronização Bidirecional com Bitrix24</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Mantém campos de leads, contatos e negócios atualizados em tempo real.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.autoBiDirectional}
                    onChange={(e) => props.setAutoBiDirectional(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-gold)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Intervalo de Sincronização em Segundo Plano</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Frequência com que os workers buscam alterações nos sistemas integrados.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.autoSyncInterval}
                    onChange={(e) => props.setAutoSyncInterval(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">minutos</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Tentativas de Reenvio em Falha de Webhook</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Política de backoff exponencial para garantir entrega mesmo em instabilidades de
                    rede.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.autoRetryCount}
                    onChange={(e) => props.setAutoRetryCount(Number(e.target.value))}
                    className="w-20 text-center text-sm font-semibold"
                  />
                  <span className="text-xs text-[var(--ink-2)] font-medium">tentativas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'Engajamento Comercial':
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[var(--nav-c-red)]" />
                <CardTitle>Telefonia PABX & Disparo de WhatsApp</CardTitle>
              </div>
              <CardDescription>
                Canais de comunicação, discador automático e regras de janela de contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Click-to-Call Integrado (3CX / Voice Hub)</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Disca diretamente com 1 clique a partir de qualquer lead ou contato no CRM.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.engClickToCall}
                    onChange={(e) => props.setEngClickToCall(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-red)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Gravação & Transcrição Automática por IA</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Salva o áudio e gera ata da conversa com extração de próximos passos.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.engRecordCalls}
                    onChange={(e) => props.setEngRecordCalls(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-red)]" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                <div>
                  <p className="font-medium text-sm">Trava de Horário Comercial (Anti-Spam)</p>
                  <p className="text-xs text-[var(--ink-3)]">
                    Bloqueia tentativas automáticas fora do horário das 08:00 às 18:00 e feriados.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.engWorkingHoursOnly}
                    onChange={(e) => props.setEngWorkingHoursOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--nav-c-red)]" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros Gerais do Pilar ({pillarName})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--ink-2)]">
              Módulo configurado de acordo com as diretrizes do Birth Hub 360.
            </p>
          </CardContent>
        </Card>
      );
  }
}
