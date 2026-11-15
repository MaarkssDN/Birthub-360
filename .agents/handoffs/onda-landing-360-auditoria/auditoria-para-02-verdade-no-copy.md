- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: em-andamento
- Prioridade: alto

## Problema

A landing exibe como "RESULTADOS REAIS COMPROVADOS" métricas e depoimentos
que aparentam ser fabricados:

- "+42% taxa de conversão", "3.8x ROI", "R$ 180M+ volume transacionado",
  "99.98% disponibilidade" — sem fonte citada.
- 3 depoimentos com nomes/empresas provavelmente fictícios ("NeoLog B2B",
  "Vanguarda Tech", "Marcelo Faccini — VP de Tecnologia").
- Hero promete "aumente a conversão do pipeline em até 3.8x com IA".
- Claims de certificação: "SOC-2 TYPE II READY", "ISO 27001", "AES-256-GCM",
  "latência inferior a 50ms", "Setup em 5 minutos", "Resposta em 15 min".

Além disso há contradição interna: o pilar 07 e o card de plataforma prometem
"sincronização bidirecional em tempo real" com Salesforce/HubSpot/Pipedrive,
mas a própria grade de integrações os marca como "Em Homologação"/"Planejado".

E o KPI "24 + Supervisor agentes" diverge do copy "20+ agentes" usado no
resto da página e na tela de login.

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx` — métricas (~L1873-1896),
  depoimentos (~L1899-1946), selos (~L1949-1966), cards de plataforma
  (~L1557-1616), pilar 07/11 (~L186-230), KPI de agentes (~L1247-1252),
  hero copy (~L1124-1142), badges do login (~L2791-2804, ~L3304-3338)
- `src/features/landing/components/RoiSimulatorModal.tsx` — "34% comprovada" (item 6, ver bugs-funcionais)

## Alteração necessária

**Decisão de negócio tomada (2026-11-11, responsável humano):** fallback
aprovado = **rotular como ilustrativo**. Ou seja:

- Métricas, depoimentos e claims sem fonte real devem ser rotulados
  consistentemente como "cenário ilustrativo" / "dados de demonstração"
  (padrão que a página já usa em outros blocos), em vez de exigir dados
  reais ou remoção.
- Permanecem pendentes de confirmação pontual (não bloqueiam): quais
  certificações são fato ("READY" ≠ certificado) e o número oficial de
  agentes (20+ vs 24) — padronizar o que for verificável.

Checklist de execução:

1. Aplicar rótulo de ilustração em: métricas (+42%, 3.8x, R$ 180M+, 99.98%),
   depoimentos (marcar como "exemplo ilustrativo" ou substituir por cases
   reais se existirem), selos de certificação ("READY" → texto preciso).
2. Alinhar claims de conectores com os status reais: sync "em tempo real"
   só pode citar conectores "Em Produção" (Bitrix24, WhatsApp, VoiceHub,
   Webhooks) até HubSpot/Salesforce/Pipedrive saírem de homologação.
3. Padronizar o número de agentes em toda a página (hero, KPIs, login,
   Command Center) conforme o número oficial confirmado.
4. Claims de performance ("3.8x", "15 min", "5 min setup", "50ms") devem
   carregar o mesmo rótulo de ilustração ou ser suavizados.

## Teste esperado

- Toda afirmação quantitativa na página tem fonte real ou rótulo de ilustração.
- Nenhuma contradição entre claim e status de integração.
- Número de agentes consistente em hero, KPIs, login e Command Center.

## Contexto adicional

- Risco: propaganda enganosa / CDC art. 37 + dano de credibilidade com
  comprador enterprise que verifica referências.
- Enquanto a decisão não chega, prioridade é não piorar: não adicionar novos
  claims numéricos.

## Resolução parcial (Agente 02 — 2026-11-12, commit `510bce4bd`)

Feito:
- Métricas rebaixadas para "projeções" (taxa de conversão, ROI/payback, disponibilidade → "Meta de SLA").
- Legendas "Métricas ilustrativas" e "Histórias ilustrativas de uso" adicionadas.
- Selo "100% Conforme LGPD" → "Conformidade LGPD por design".
- Headline "em até 3.8x" → "projeções de até 3.8x".
- Escassez fabricada removida ("Apenas 4 vagas nesta semana" → Implantação Assistida neutra).
- Promessa "em até 15 minutos" removida do fluxo de lead.

Pendente (decisão comercial/dono): alegações de certificação (ISO 27001 Ready mantido como "Ready"), número de agentes "20+" (consistente em todo o copy, mas sem lastro público), depoimentos nominados (mantidos sob rótulo ilustrativo).

## Resolução — continuação (Agente 02 — 2026-11-14, branch `agente/02-onda2-produto`)

Complemento à resolução parcial de `510bce4bd`, endereçando os itens que
ainda tinham texto enganoso ou desalinhado do status real:

Feito nesta rodada:
- Conectividade Multi-CRM alinhada ao status real de integração: claims de
  "tempo real" com Bitrix24, Salesforce, HubSpot e Pipedrive foram corrigidos
  para Bitrix24 em tempo real e HubSpot/Salesforce/Pipedrive declarados
  "em homologação" (pillar `ADAPTIVE_PILLARS` num 07 e seção "Dados e
  conectividade Multi-CRM" em `src/features/landing/pages/Landing360.tsx`).
- Selo "100% Conforme com a LGPD" → "Conformidade LGPD por design".
- Claim "Atendimento rápido em até 15 minutos" → "Contato comercial direto e
  ágil" (removida promessa de SLA não verificável; descrição de WhatsApp
  mantida).
- "latência de consulta inferior a 50ms" → "consultas indexadas de baixa
  latência" (número de performance suavizado).
- Selos de certificação: "ISO 27001" → "ISO 27001 READY" e "LGPD COMPLIANT"
  → "LGPD POR DESIGN", alinhando ao padrão já existente "SOC-2 TYPE II READY"
  e não afirmando certificação concluída.
- `src/features/landing/components/RoiSimulatorModal.tsx`: comentário
  "Recuperação comprovada" → "Premissa de simulação"; "+15 horas semanais"
  → "Estimativa de +15 horas semanais"; adicionado disclaimer "Projeções
  baseadas em premissas de simulação — não constituem garantia de
  resultados."; "Setup em 5 minutos" → "Onboarding assistido".

Mantido (pendente de decisão comercial/dono, já registrado na resolução
parcial): número de agentes "20+" consistente no copy mas sem lastro
público; depoimentos nominados sob o rótulo "Histórias ilustrativas de uso";
headline "projeções de até 3.8x" já rotulada como projeção.

Gates: `npx tsc --noEmit` limpo; `npx biome check` nos arquivos tocados sem
erros novos (warnings pré-existentes não relacionados permanecem).
