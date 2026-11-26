import {
  BarChart3,
  Bot,
  Database,
  Layers,
  type LucideIcon,
  Network,
  PhoneCall,
  Settings,
  Share2,
  Smartphone,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import type React from 'react';
import {
  HubComercialViewer,
  MercadoViewer,
  OrquestracaoViewer,
  VisualizerAdminOps,
  VisualizerAutomacao,
  VisualizerEngajamento,
  VisualizerFieldSales,
  VisualizerHubComercial,
  VisualizerIaCopilot,
  VisualizerMercado,
  VisualizerOrquestracao,
  VisualizerPerformance,
  VisualizerPrevisibilidade,
  VisualizerSocialSelling,
} from './viewers/index.js';

export {
  HubComercialViewer,
  MercadoViewer,
  OrquestracaoViewer,
  VisualizerAdminOps,
  VisualizerAutomacao,
  VisualizerEngajamento,
  VisualizerFieldSales,
  VisualizerHubComercial,
  VisualizerIaCopilot,
  VisualizerMercado,
  VisualizerOrquestracao,
  VisualizerPerformance,
  VisualizerPrevisibilidade,
  VisualizerSocialSelling,
};

export type PillarThemeColor = 'cyan' | 'pink' | 'gold' | 'iris';
export type PillarId = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11';
export type PillarAvailability = 'Operacional' | 'Disponível no CRM' | 'Conector API Ativo';

export interface PillarCapability {
  title: string;
  desc: string;
}

export interface PillarBenefit {
  value: string;
  label: string;
  trend?: string;
  context?: string;
}

export interface PillarData {
  id: PillarId;
  num: string;
  badge: string;
  title: string;
  modalTitle: string;
  tagline: string;
  commercialDescription: string;
  detailedDesc: string;
  themeColor: PillarThemeColor;
  icon: LucideIcon;
  route: string;
  ctaText: string;
  availability: PillarAvailability;
  capabilities: PillarCapability[];
  metrics: PillarBenefit[];
  renderVisualizer: (theme?: 'dark' | 'light') => React.ReactNode;
}

// ============================================================================
// 1. COMPONENTES DE VISUALIZAÇÃO CONTEXTUAL (SIMULAÇÃO OPERACIONAL BASEADA EM DADOS)
// ============================================================================

/** 01 — Hub Comercial: extraído para ./viewers/HubComercialViewer.tsx */
/** 02 — Inteligência de Mercado: extraído para ./viewers/MercadoViewer.tsx */
/** 03 — Orquestração de Vendas: extraído para ./viewers/OrquestracaoViewer.tsx */
/** 04 — Performance Comercial: extraído para ./viewers/PerformanceViewer.tsx */
/** 05 — Previsibilidade Comercial: extraído para ./viewers/PrevisibilidadeViewer.tsx */
/** 06 — Inteligência Artificial: extraído para ./viewers/IaCopilotViewer.tsx */
/** 07 — Automação e Conectividade: extraído para ./viewers/AutomacaoViewer.tsx */
/** 08 — Engajamento Comercial: extraído para ./viewers/EngajamentoViewer.tsx */

// ============================================================================
// 2. REGISTRO TIPADO DOS PILARES COMERCIAIS (PILLAR_REGISTRY)
// ============================================================================

/** 09 — Admin & Operations: extraído para ./viewers/AdminOpsViewer.tsx */
/** 10 — Mobile & Field Sales: extraído para ./viewers/FieldSalesViewer.tsx */
/** 11 — Social Selling: extraído para ./viewers/SocialSellingViewer.tsx */

export const PILLARS_EDITORIAL_DATA: Record<string, PillarData> = {
  '01': {
    id: '01',
    num: '01',
    badge: 'PIPELINE 360° & CONTAS UNIFICADAS',
    title: 'Hub Comercial',
    modalTitle: '01. Hub Comercial',
    tagline: 'Centralize contas, pipeline e oportunidades em uma visão 360° de cada negociação.',
    commercialDescription:
      'Elimine a fragmentação entre planilhas e sistemas isolados. O Hub Comercial consolida o histórico completo de negociações, decisores envolvidos, estágios de evolução e valores ponderados em uma esteira única e transparente.',
    detailedDesc:
      'Elimine a fragmentação entre planilhas e sistemas isolados. O Hub Comercial consolida o histórico completo de negociações, decisores envolvidos, estágios de evolução e valores ponderados em uma esteira única e transparente.',
    themeColor: 'cyan',
    icon: Layers,
    route: '/app/crm',
    ctaText: 'Acessar Pipeline no CRM',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'Kanban & Grid Multidimensional',
        desc: 'Visualização dinâmica de deals por valor, probabilidade de fechamento e urgência de ação.',
      },
      {
        title: 'Visão 360° de Contas & Decisores',
        desc: 'Mapeamento de organogramas, múltiplos contatos e histórico de interações por empresa.',
      },
      {
        title: 'Timeline Auditável de Negociação',
        desc: 'Registro cronológico inviolável de atividades, notas, propostas enviadas e status de aceite.',
      },
      {
        title: 'Governança & RLS Multi-Tenant',
        desc: 'Isolamento estrito de dados por organização e controle granular de papéis operacionais (RBAC).',
      },
    ],
    metrics: [
      {
        value: '+42%',
        label: 'Velocidade de Negociação',
        trend: 'Ciclo médio reduzido',
        context: 'Simulação',
      },
      {
        value: 'Zero',
        label: 'Deals Esquecidos',
        trend: 'Rastreabilidade total',
        context: 'Simulação',
      },
      {
        value: '< 3 cliques',
        label: 'Auditoria de Contas',
        trend: 'Navegação instantânea',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerHubComercial theme={theme} />,
  },

  '02': {
    id: '02',
    num: '02',
    badge: 'PROSPECÇÃO B2B & SINAIS DE COMPRA',
    title: 'Inteligência de Mercado',
    modalTitle: '02. Inteligência de Mercado',
    tagline:
      'Enriqueça dados B2B, identifique sinais de compra e qualifique decisores com precisão.',
    commercialDescription:
      'Mapeie e qualifique o mercado endereçável (TAM) com precisão cirúrgica. Identifique empresas ativas no Brasil por CNAE, receita presumida, quadro societário (QSA) e descubra o contato corporativo direto de quem realmente decide.',
    detailedDesc:
      'Mapeie e qualifique o mercado endereçável (TAM) com precisão cirúrgica. Identifique empresas ativas no Brasil por CNAE, receita presumida, quadro societário (QSA) e descubra o contato corporativo direto de quem realmente decide.',
    themeColor: 'pink',
    icon: Database,
    route: '/app/market-intelligence',
    ctaText: 'Explorar Inteligência de Mercado',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Consulta em Massa de Empresas B2B',
        desc: 'Acesso instantâneo a dados cadastrais, porte, regime tributário e saúde financeira de CNPJs.',
      },
      {
        title: 'Mapa de Sócios & Decisores (QSA)',
        desc: 'Identificação de diretores, sócios-administradores e canais diretos de contato corporativo.',
      },
      {
        title: 'Score Preditivo de ICP',
        desc: 'Algoritmo que classifica a aderência de cada empresa ao Perfil de Cliente Ideal da sua operação.',
      },
      {
        title: 'Conformidade Rigorosa com LGPD',
        desc: 'Tratamento de dados com rastreabilidade, base legal declarada e privacidade por design.',
      },
    ],
    metrics: [
      {
        value: '3x mais',
        label: 'Precisão na Qualificação',
        trend: 'Filtro por ICP',
        context: 'Simulação',
      },
      {
        value: '-70%',
        label: 'Tempo de Pesquisa Cadastral',
        trend: 'Automação CNPJ',
        context: 'Simulação',
      },
      {
        value: '100%',
        label: 'Conformidade LGPD',
        trend: 'Base legal auditada',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerMercado theme={theme} />,
  },

  '03': {
    id: '03',
    num: '03',
    badge: 'CADÊNCIA MULTICANAL & NEXT BEST ACTION',
    title: 'Orquestração de Vendas',
    modalTitle: '03. Orquestração de Vendas',
    tagline: 'Coordene cadências multicanal, passagem de bastão e a próxima ação de vendas.',
    commercialDescription:
      'Acabe com o improviso nas abordagens. A plataforma orquestra sequências combinadas de e-mail, telefone, WhatsApp e redes profissionais, indicando ao vendedor o passo mais efetivo a cada momento da jornada.',
    detailedDesc:
      'Acabe com o improviso nas abordagens. A plataforma orquestra sequências combinadas de e-mail, telefone, WhatsApp e redes profissionais, indicando ao vendedor o passo mais efetivo a cada momento da jornada.',
    themeColor: 'gold',
    icon: Workflow,
    route: '/app/cadence',
    ctaText: 'Ver Cadências de Vendas',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Cadências Omnichannel Automatizadas',
        desc: 'Sequenciamento inteligente de toques por múltiplos canais com intervalos calculados.',
      },
      {
        title: 'Next Best Action (NBA) Preditivo',
        desc: 'Sugestão dinâmica da melhor abordagem baseada na resposta e estágio do lead.',
      },
      {
        title: 'Passagem de Bastão SDR → Closer',
        desc: 'Transição estruturada com checklist obrigatório de qualificação e agendamento automático.',
      },
      {
        title: 'Fila Diária Priorizada (Daily Plan)',
        desc: 'Rotina diária organizada por impacto financeiro e risco de esfriamento do contato.',
      },
    ],
    metrics: [
      {
        value: '+65%',
        label: 'Disciplina de Follow-ups',
        trend: 'Régua automatizada',
        context: 'Simulação',
      },
      {
        value: '4 dias',
        label: 'Ciclo de Qualificação',
        trend: 'Transição ágil',
        context: 'Simulação',
      },
      { value: '100%', label: 'Leads no SLA', trend: 'Sem gargalos ocultos', context: 'Simulação' },
    ],
    renderVisualizer: (theme) => <VisualizerOrquestracao theme={theme} />,
  },

  '04': {
    id: '04',
    num: '04',
    badge: 'TELEMETRIA DO FUNIL & VELOCIDADE',
    title: 'Performance Comercial',
    modalTitle: '04. Performance Comercial',
    tagline: 'Acompanhe conversão, velocidade do funil, metas e produtividade da equipe.',
    commercialDescription:
      'Transforme intuição em indicadores matemáticos. Analise a taxa real de passagem entre estágios, meça os dias de permanência em cada fase e acompanhe metas individuais e coletivas em painéis de alta resolução.',
    detailedDesc:
      'Transforme intuição em indicadores matemáticos. Analise a taxa real de passagem entre estágios, meça os dias de permanência em cada fase e acompanhe metas individuais e coletivas em painéis de alta resolução.',
    themeColor: 'iris',
    icon: BarChart3,
    route: '/app/analytics',
    ctaText: 'Abrir Painel de Analytics',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Métricas de Conversão por Etapa',
        desc: 'Taxas percentuais de conversão detalhadas por origem, vendedor e segmento de mercado.',
      },
      {
        title: 'Velocidade do Ciclo de Venda (Velocity)',
        desc: 'Tempo médio de permanência por estágio com alertas automáticos de deals estagnados.',
      },
      {
        title: 'Gestão Dinâmica de Metas Operacionais',
        desc: 'Acompanhamento de atingimento de metas com projeção de fechamento baseada nos dados atualizados.',
      },
      {
        title: 'Relatórios de Produtividade do Time',
        desc: 'Volume de ligações, reuniões agendadas e propostas emitidas por integrante.',
      },
    ],
    metrics: [
      {
        value: '+28%',
        label: 'Eficiência de Conversão',
        trend: 'Eliminação de atritos',
        context: 'Simulação',
      },
      {
        value: '18 dias',
        label: 'Ciclo Médio de Vendas',
        trend: 'Visibilidade total',
        context: 'Simulação',
      },
      {
        value: 'Contínua',
        label: 'Apuração de Metas',
        trend: 'Telemetria contínua',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerPerformance theme={theme} />,
  },

  '05': {
    id: '05',
    num: '05',
    badge: 'PIPELINE PONDERADO & MODELAGEM ESTATÍSTICA',
    title: 'Previsibilidade Comercial',
    modalTitle: '05. Previsibilidade Comercial',
    tagline: 'Modele probabilidades, pipeline ponderado e cenários baseados no histórico real.',
    commercialDescription:
      'Projeções financeiras confiáveis para tomadas de decisão da diretoria. O motor estatístico do Birth Hub 360 calcula o forecast ponderando taxas históricas de ganho/perda, maturidade do lead e sinais de engajamento.',
    detailedDesc:
      'Projeções financeiras confiáveis para tomadas de decisão da diretoria. O motor estatístico do Birth Hub 360 calcula o forecast ponderando taxas históricas de ganho/perda, maturidade do lead e sinais de engajamento.',
    themeColor: 'cyan',
    icon: TrendingUp,
    route: '/app/forecast',
    ctaText: 'Ver Previsão de Receita',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Pipeline Ponderado por Probabilidade',
        desc: 'Ponderação estatística por histórico real de conversão em vez de palpites comerciais.',
      },
      {
        title: 'Cenários de Fechamento (Conservador/Provável/Otimista)',
        desc: 'Modelagem de 3 faixas de faturamento para alinhamento orçamentário seguro.',
      },
      {
        title: 'Detecção Precoce de Deal Slippage',
        desc: 'Identificação imediata de negociações que estão postergando a data de fechamento.',
      },
      {
        title: 'Auditoria Retroativa de Win/Loss',
        desc: 'Calibração contínua dos fatores probabilísticos com base nos motivos reais de perda.',
      },
    ],
    metrics: [
      {
        value: '94%',
        label: 'Confiabilidade Estatística',
        trend: 'Modelo calibrado',
        context: 'Simulação',
      },
      {
        value: '45 dias',
        label: 'Antecipação de Desvios',
        trend: 'Correção de rota',
        context: 'Simulação',
      },
      {
        value: '3 Faixas',
        label: 'Cenários Modelados',
        trend: 'Orçamento seguro',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerPrevisibilidade theme={theme} />,
  },

  '06': {
    id: '06',
    num: '06',
    badge: 'COPILOTO DE IA CONTEXTUAL & DIAGNÓSTICO',
    title: 'Inteligência Artificial',
    modalTitle: '06. Inteligência Artificial',
    tagline: 'Um copiloto conectado aos dados da empresa e ao contexto das negociações.',
    commercialDescription:
      'Uma IA comercial nativa que compreende o contexto único da sua organização. O Copiloto analisa conversas, detecta entraves ocultos, recomenda respostas para objeções difíceis e apoia a preparação para reuniões decisivas.',
    detailedDesc:
      'Uma IA comercial nativa que compreende o contexto único da sua organização. O Copiloto analisa conversas, detecta entraves ocultos, recomenda respostas para objeções difíceis e apoia a preparação para reuniões decisivas.',
    themeColor: 'pink',
    icon: Bot,
    route: '/app/intelligence',
    ctaText: 'Acessar Hub de Inteligência',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Diagnóstico Contextual de Deals',
        desc: 'Avaliação do risco de perda e sugestão de argumentos táticos corretivos.',
      },
      {
        title: 'Matriz Inteligente de Objeções',
        desc: 'Banco vivo de respostas para objeções de preço, concorrência e autoridade decisória.',
      },
      {
        title: 'Simulação & Roleplay de Negociação',
        desc: 'Treinamento contínuo de vendedores com IA simulando perfis reais de compradores.',
      },
      {
        title: 'Resumos Automáticos de Interações',
        desc: 'Síntese imediata dos pontos críticos acordados em chamadas e reuniões gravadas.',
      },
    ],
    metrics: [
      {
        value: '2h / dia',
        label: 'Otimização Operacional',
        trend: 'Menos burocracia',
        context: 'Simulação',
      },
      {
        value: '+35%',
        label: 'Superação de Objeções',
        trend: 'Argumentos táticos',
        context: 'Simulação',
      },
      {
        value: '-50%',
        label: 'Rampa de Novos Vendedores',
        trend: 'Treinamento contínuo',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerIaCopilot theme={theme} />,
  },

  '07': {
    id: '07',
    num: '07',
    badge: 'ECOSSISTEMA DE APIS & CONECTIVIDADE MULTI-CRM',
    title: 'Automação & Conectividade Multi-CRM',
    modalTitle: '07. Automação & Conectividade Multi-CRM',
    tagline: 'Sincronize CRMs, acione gatilhos e integre ferramentas por APIs e webhooks.',
    commercialDescription:
      'Operação comercial sem silos. Conecte o Birth Hub 360 aos conectores em produção (Bitrix24, WhatsApp Official API, VoiceHub e Webhooks/REST APIs) por APIs abertas, com HubSpot, Salesforce e Pipedrive em homologação.',
    detailedDesc:
      'Operação comercial sem silos. Conecte o Birth Hub 360 aos conectores em produção (Bitrix24, WhatsApp Official API, VoiceHub e Webhooks/REST APIs) por APIs abertas, com HubSpot, Salesforce e Pipedrive em homologação.',
    themeColor: 'gold',
    icon: Network,
    route: '/app/automations',
    ctaText: 'Ver Central de Automações',
    availability: 'Conector API Ativo',
    capabilities: [
      {
        title: 'Sincronização Bidirecional por API/Webhook',
        desc: 'Espelhamento de leads, empresas, contatos e etapas nos conectores em produção; HubSpot, Salesforce e Pipedrive seguem em homologação.',
      },
      {
        title: 'Webhooks Customizados com Retry Exponencial',
        desc: 'Garantia de integridade e reenvio automático em caso de instabilidade de terceiros.',
      },
      {
        title: 'Gatilhos Automáticos Multi-Sistema',
        desc: 'Disparo de ações imediatas mediante eventos de mudança de status ou aceite de proposta.',
      },
      {
        title: 'Observabilidade & Logs Técnicos Auditáveis',
        desc: 'Painel completo de telemetria de requisições, latência e status de conectores.',
      },
    ],
    metrics: [
      {
        value: '99.98%',
        label: 'Sucesso de Sincronização',
        trend: 'Fila idempotente',
        context: 'Simulação',
      },
      { value: 'Zero', label: 'Perda de Eventos', trend: 'Retry automático', context: 'Simulação' },
      {
        value: '< 120ms',
        label: 'Latência do Event Bus',
        trend: 'Entrega imediata',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerAutomacao theme={theme} />,
  },

  '08': {
    id: '08',
    num: '08',
    badge: 'TELEFONIA EM NUVEM & VOZ COM IA',
    title: 'Engajamento Comercial',
    modalTitle: '08. Engajamento Comercial',
    tagline: 'Reúna telefonia, interações e histórico de contatos em uma comunicação integrada.',
    commercialDescription:
      'Comunicação direta da tela do CRM sem dispositivos externos. Realize chamadas em nuvem via VoiceHub, obtenha transcrição automática com extração de sentimentos e unifique mensagens oficiais do WhatsApp em uma timeline única.',
    detailedDesc:
      'Comunicação direta da tela do CRM sem dispositivos externos. Realize chamadas em nuvem via VoiceHub, obtenha transcrição automática com extração de sentimentos e unifique mensagens oficiais do WhatsApp em uma timeline única.',
    themeColor: 'iris',
    icon: PhoneCall,
    route: '/app/voice-hub',
    ctaText: 'Conhecer o VoiceHub',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Discador em Nuvem WebRTC (VoiceHub)',
        desc: 'Ligação com 1 clique direto da plataforma ou aplicativo móvel com discagem inteligente.',
      },
      {
        title: 'Gravação & Transcrição Automática com IA',
        desc: 'Conversão imediata de áudio em texto com identificação de interlocutores e sentimento.',
      },
      {
        title: 'WhatsApp Business API Oficial Integrada',
        desc: 'Troca de mensagens centralizada e atrelada diretamente ao cadastro do lead ou negócio.',
      },
      {
        title: 'Timeline Unificada Omnichannel',
        desc: 'Visão histórica consolidada de todas as chamadas, mensagens e e-mails trocados.',
      },
    ],
    metrics: [
      {
        value: '+50%',
        label: 'Produtividade de Ligações',
        trend: 'Discador com 1 clique',
        context: 'Simulação',
      },
      {
        value: '100%',
        label: 'Auditoria de Interações',
        trend: 'Gravações vinculadas',
        context: 'Simulação',
      },
      {
        value: 'Instantâneo',
        label: 'Resumo com IA',
        trend: 'Transcrição ponta a ponta',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerEngajamento theme={theme} />,
  },

  '09': {
    id: '09',
    num: '09',
    badge: 'GOVERNANÇA & FUNDAÇÃO OPERACIONAL',
    title: 'Admin & Operations',
    modalTitle: '09. Admin & Operations',
    tagline:
      'Camada de administração da plataforma: settings, equipe, acesso por módulo e telemetria.',
    commercialDescription:
      'A fundação operacional que sustenta todos os módulos comerciais: configurações globais, gestão de equipe e papéis, controle de acesso granular por módulo, feature flags e observabilidade de consumo. Não é um módulo comercial — é o que torna a operação auditável e escalável.',
    detailedDesc:
      'A fundação operacional que sustenta todos os módulos comerciais: configurações globais, gestão de equipe e papéis (RBAC), controle de acesso granular por módulo, feature flags com rollout controlado, catálogo de módulos por organização e relatórios de bug, consumo de IA e notificações.',
    themeColor: 'cyan',
    icon: Settings,
    route: '/app/settings',
    ctaText: 'Abrir Administração',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'Settings Globais & Feature Flags',
        desc: 'Configurações da organização com rollout controlado de funcionalidades por tenant.',
      },
      {
        title: 'Equipe, Papéis & Module Access',
        desc: 'Gestão de usuários com RBAC e concessão granular de acesso aos 11 módulos.',
      },
      {
        title: 'Telemetria de Consumo & IA',
        desc: 'Monitoramento de uso da plataforma, consumo de tokens de IA e relatórios de bug integrados.',
      },
      {
        title: 'Resiliência & Failover',
        desc: 'Painéis de resiliência operacional e failover para continuidade da receita.',
      },
    ],
    metrics: [
      {
        value: '11 módulos',
        label: 'Catálogo por organização',
        trend: 'Concessão granular',
        context: 'Simulação',
      },
      {
        value: 'RBAC',
        label: 'Controle de papéis',
        trend: 'Mínimo privilégio',
        context: 'Simulação',
      },
      {
        value: '100%',
        label: 'Auditoria de acessos',
        trend: 'Logs imutáveis',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerAdminOps theme={theme} />,
  },

  '10': {
    id: '10',
    num: '10',
    badge: 'FORÇA DE CAMPO & APP ANDROID',
    title: 'Mobile & Field Sales',
    modalTitle: '10. Mobile & Field Sales',
    tagline:
      'Vendas em campo com gravação de reuniões, sincronização offline e IA edge no app Android.',
    commercialDescription:
      'O vendedor não para quando sai do escritório. O FieldMeetingRecorder registra reuniões externas com áudio e IA edge, sincroniza offline e devolve os insights ao pipeline — tudo pelo app Android dedicado construído com Capacitor.',
    detailedDesc:
      'O vendedor não para quando sai do escritório. O FieldMeetingRecorder registra reuniões externas com gravação de áudio, transcrição por IA edge e sincronização offline; o app Android via Capacitor mantém a mesma plataforma na palma da mão, com os mesmos dados e governança do desktop.',
    themeColor: 'pink',
    icon: Smartphone,
    route: '/app',
    ctaText: 'Conhecer o App de Campo',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'FieldMeetingRecorder',
        desc: 'Gravação de reuniões externas com transcrição automática e extração de próximos passos.',
      },
      {
        title: 'Sincronização Offline-first',
        desc: 'Registros capturados em campo sincronizam com o CRM quando a conexão retorna.',
      },
      {
        title: 'IA Edge no Dispositivo',
        desc: 'Processamento local de áudio e texto para reduzir latência e custo de API.',
      },
      {
        title: 'App Android via Capacitor',
        desc: 'Aplicativo nativo com a mesma experiência da plataforma web, incluindo Voice Hub dedicado.',
      },
    ],
    metrics: [
      {
        value: '100%',
        label: 'Reuniões registradas',
        trend: 'Sem retrabalho de anotações',
        context: 'Simulação',
      },
      {
        value: 'Offline',
        label: 'Operação sem sinal',
        trend: 'Fila de sincronização',
        context: 'Simulação',
      },
      {
        value: 'Edge AI',
        label: 'Processamento local',
        trend: 'Menor latência',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerFieldSales theme={theme} />,
  },

  '11': {
    id: '11',
    num: '11',
    badge: 'VENDA SOCIAL & COPY ASSISTIDO',
    title: 'Social Selling',
    modalTitle: '11. Social Selling',
    tagline:
      'Abordagens personalizadas por canal com copywriting assistido por IA e persistência de interações.',
    commercialDescription:
      'Venda onde o decisor está: LinkedIn, WhatsApp e e-mail. O módulo gera abordagens personalizadas por conta e decisor, com copywriting assistido por IA e persistência de cada interação — concedido por módulo à organização.',
    detailedDesc:
      'Venda onde o decisor está: LinkedIn, WhatsApp e e-mail. O SocialSellingHub combina geração de abordagens personalizadas por conta e decisor, copywriting assistido por IA (shadow copy), abordagem estruturada por canal e persistência de interações para alimentar o pipeline com contexto real.',
    themeColor: 'gold',
    icon: Share2,
    route: '/social-selling',
    ctaText: 'Abrir Social Selling',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'ApproachGeneratorCard',
        desc: 'Geração de abordagens personalizadas por canal usando contexto da conta e do decisor.',
      },
      {
        title: 'Shadow Copywriting por IA',
        desc: 'Rascunhos de mensagens em tom consultivo prontos para revisão e aprovação humana.',
      },
      {
        title: 'Abordagem Estruturada por Canal',
        desc: 'Sequências adaptadas a LinkedIn, WhatsApp e e-mail com cadência própria.',
      },
      {
        title: 'Persistência de Interações',
        desc: 'Cada toque registrado na linha do tempo 360° da conta, alimentando o Hub Comercial.',
      },
    ],
    metrics: [
      {
        value: '3+ canais',
        label: 'Abordagem multicanal',
        trend: 'LinkedIn · WhatsApp · E-mail',
        context: 'Simulação',
      },
      {
        value: 'IA',
        label: 'Copy assistido',
        trend: 'Aprovação humana',
        context: 'Simulação',
      },
      {
        value: '360°',
        label: 'Contexto unificado',
        trend: 'Interações persistidas',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerSocialSelling theme={theme} />,
  },
};
