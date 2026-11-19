/**
 * src/features/intelligence/agents/supervisor/prompts.ts
 * Catálogo canônico de agentes especialistas e geradores de prompts do Supervisor.
 * (Handoff 00-para-13 / DIV-AGENTE-13-002 / TAREFA-SANEAMENTO-009)
 */

import {
  type SemanticAgentMatch,
  SUB_SWARMS,
  type SubSwarmDomain,
  type SwarmAgentKey,
} from '../subSwarms.config.js';
import {
  SWARM_CATALOG_TOTAL_AGENTS,
  SWARM_IDENTITY,
  SWARM_OUTPUT_CONTRACT,
  SWARM_UNTRUSTED_CONTENT_GUARD,
} from '../swarm.constants.js';

export const AGENT_INFO: Record<
  SwarmAgentKey,
  { label: string; description: string; chooseWhen: string }
> = {
  sdr: {
    label: 'SDR Autônomo',
    description:
      'Qualifica um lead no CRM (fit com o ICP, enriquecimento profundo, leitura de e-mails Outlook/M365/Gmail/IMAP para identificar oportunidades, agendamento de reuniões Meet/Teams/Zoom/Calendly, geração de scripts/prompts e battlecards de objeção) e atualiza o status de qualificação.',
    chooseWhen:
      'A missão pede para qualificar/analisar um lead específico que já existe no CRM ou localizar por nome da empresa.',
  },
  bdr: {
    label: 'BDR (Outbound)',
    description:
      'Realiza descoberta B2B de novas empresas (Apollo, Google Places, BrasilAPI), promove e enriquece empresas e decisores no CRM, varre caixas de e-mail (Outlook, Gmail, IMAP) atrás de sinais de compra, gera scripts/prompts comerciais e prepara cadências multicanal (WhatsApp, LinkedIn, E-mail, Telegram).',
    chooseWhen:
      'A missão é sobre prospecção fria, identificação de contas no CRM, priorização por aderência ao ICP ou sugestão de abertura de contato.',
  },
  closer: {
    label: 'Closer Autônomo',
    description:
      'Conduz estratégia de negociação para oportunidades qualificadas: gera propostas comerciais, documentos Word/Google Docs, planilhas Excel/Sheets e apresentações PowerPoint/Slides, sintetiza atas de reuniões (Meet/Teams/Zoom), analisa objeções/battlecards e prontidão contratual. Jamais fecha negócios autonomamente.',
    chooseWhen:
      'A missão envolve oportunidade qualificada, proposta enviada, reunião comercial, piloto, negociação, objeção, decisão ou prontidão contratual. Não use para primeiro contato frio.',
  },
  crm: {
    label: 'Gestor de CRM',
    description:
      'Diagnostica pipeline, forecast ponderado, cross-sell e risco de churn; sincroniza dados com CRMs/ERPs externos (Bitrix24, HubSpot, Pipedrive, RD Station, Monday.com, Omie) e gera relatórios em Excel/Google Sheets.',
    chooseWhen:
      'A missão é sobre uma negociação/deal que já está em andamento (não um lead novo) — risco de estagnação, tempo sem interação, pipeline parado ou reenriquecimento.',
  },
  ops: {
    label: 'Agente de Operações',
    description:
      'Executa e propõe ações operacionais multi-plataforma: cria cards/tarefas e notas no Trello, Monday.com, Bitrix24, ClickUp, Asana, Notion e CRM; gera arquivos Word, Excel (.xlsx), PowerPoint e Google Docs/Sheets/Slides; envia mensagens em WhatsApp, Telegram, Teams, Slack e SMS; e dispara notificações em Pop-up na tela, Push no Celular, Relógio (Smartwatch) e SMS.',
    chooseWhen:
      'A missão pede uma AÇÃO CONCRETA a ser executada agora (agendar, notificar, criar tarefa) — não escolha só para produzir mais uma análise ou opinião.',
  },
};

export interface SupervisorPromptParams {
  mission: string;
  leadId?: string;
  completed: SwarmAgentKey[];
  results: Partial<Record<SwarmAgentKey, string>>;
  activeSubSwarm: SubSwarmDomain;
  catalogMatches: SemanticAgentMatch[];
}

export function buildSupervisorSystemPrompt(params: SupervisorPromptParams): string {
  const { mission, leadId, completed, results, activeSubSwarm, catalogMatches } = params;

  const completedList =
    completed.length > 0
      ? completed.map((agent) => AGENT_INFO[agent].label).join(', ')
      : 'nenhum ainda';

  const resultsSummary =
    (Object.entries(results) as [SwarmAgentKey, string][])
      .map(([agent, content]) => `- ${AGENT_INFO[agent].label}: ${content.slice(0, 400)}`)
      .join('\n') || 'Nenhum resultado produzido até agora.';

  const agentKeys = Object.keys(AGENT_INFO) as SwarmAgentKey[];
  const subSwarmConfig = SUB_SWARMS[activeSubSwarm];
  const subSwarmContextLine = `Sub-Swarm detectado para esta missão: ${subSwarmConfig.label} — Especialistas prioritários: ${subSwarmConfig.primaryAgents.join(', ')}.`;

  const leadContextLine = leadId
    ? `Lead ID disponível para esta missão: ${leadId} (o especialista 'sdr' pode usá-lo).`
    : `Nenhum Lead ID foi informado para esta missão — NÃO escolha 'sdr' enquanto isso não mudar, pois ele depende de um lead real do CRM e sempre falharia sem um ID.`;

  const catalogSpecialistsBlock =
    catalogMatches.length > 0
      ? `\n<especialistas_catalogo_amplo_379>\nEspecialistas recomendados do catálogo de ${SWARM_CATALOG_TOTAL_AGENTS} agentes para esta missão:\n${catalogMatches
          .map(
            (m) =>
              `- '${m.code}' (${m.name} - Domínio: ${m.domain}): ${m.description} [Score: ${m.similarityScore}]`,
          )
          .join('\n')}\n</especialistas_catalogo_amplo_379>`
      : '';

  return `${SWARM_IDENTITY} Você é o Supervisor: coordena ${agentKeys.length} especialistas e decide, a cada rodada, qual deve atuar a seguir (ou se a missão está concluída).

<sub_swarm_ativo>
${subSwarmContextLine}
</sub_swarm_ativo>

<especialistas_disponiveis>
${(
  Object.entries(AGENT_INFO) as [
    SwarmAgentKey,
    { label: string; description: string; chooseWhen: string },
  ][]
)
  .map(
    ([key, info]) =>
      `- '${key}' (${info.label}): ${info.description}\n  Escolha quando: ${info.chooseWhen}`,
  )
  .join('\n')}
</especialistas_disponiveis>
${catalogSpecialistsBlock}

<contexto_missao>
Missão original do usuário:
"""${mission}"""

${leadContextLine}

Especialistas já acionados nesta missão: ${completedList}.
Resultados produzidos até agora:
${resultsSummary}
</contexto_missao>

<diretrizes_roteamento>
1. Escolha o especialista cujo critério "Escolha quando" bate com a missão — se mais de um parecer plausível, prefira o mais específico.
2. Não repita um especialista que já respondeu de forma satisfatória, a não ser que haja uma lacuna clara que só ele resolve.
3. Se a missão já foi suficientemente atendida, escolha 'finish'.
4. A instrução para o especialista deve ser objetiva, em português, citar o dado concreto da missão que ele precisa usar, e nunca ser genérica. Se a ação for 'finish', deixe a instrução vazia.
</diretrizes_roteamento>

<processo_pensamento>
Antes de usar a ferramenta de decisão estruturada de roteamento, faça uma breve ponderação (se aplicável internamente) analisando: O que o usuário pediu? Qual dado essencial faltou ser analisado? Existe ID do Lead?
</processo_pensamento>

${SWARM_UNTRUSTED_CONTENT_GUARD}`;
}

export function buildSynthesisSystemPrompt(): string {
  return `${SWARM_IDENTITY} Você é o Supervisor de Operações (RevOps) encerrando a missão. Com base na missão do usuário e nos resultados retornados pelo seu esquadrão de especialistas de elite, escreva uma Síntese Executiva brutalmente honesta e visualmente deslumbrante.

<diretrizes_comportamento>
1. Nunca comece com "Aqui está o resumo...". Vá direto ao ponto.
2. Use uma barra de progresso visual simulada com emojis para o Score de Qualidade ou Probabilidade (Ex: [████████░░] 80%).
3. Use Markdown (###, **Negrito**, *Itálico*, > Blockquotes) para criar uma hierarquia clara.
</diretrizes_comportamento>

<processo_pensamento>
Antes de estruturar a resposta, reflita via tag <thought>:
1. Qual o maior bloqueador revelado pelos especialistas?
2. Qual o Score de Viabilidade mais realista, agregando a visão do SDR/BDR/Closer?
3. Qual a ação imediata que fará o negócio avançar agora?
</processo_pensamento>

<estrutura_output_final>
### 🚁 Visão Panorâmica
[O que descobrimos de fato? Resuma o cenário em 1 ou 2 frases curtas de alto impacto. Qual a temperatura geral do negócio?]
**Score de Viabilidade:** [████████░░] 80%

---

### 🚨 Gargalos e Riscos (Red Flags)
- [Alerte para o principal risco estrutural ou ausência crítica, ex: "Falta validação do CFO"]
- [Qualquer outro bloqueador imediato]

---

### 🎯 Diretriz Estratégica (Ação Imediata)
> **[Qual o ÚNICO próximo passo matador que a equipe deve executar AGORA?]**
[Indique de quem é a bola: BDR, Closer, ou Marketing, e o que exatamente deve ser feito para destravar a oportunidade]
</estrutura_output_final>

${SWARM_OUTPUT_CONTRACT}

${SWARM_UNTRUSTED_CONTENT_GUARD}`;
}
