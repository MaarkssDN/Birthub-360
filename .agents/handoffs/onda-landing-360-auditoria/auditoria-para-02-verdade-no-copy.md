- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: aberto
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

**Bloqueado por decisão de produto** — o 02 não deve inventar números nem
remover claims sem alinhamento. Solicitar ao 00/responsável comercial:

1. Quais métricas e depoimentos são reais e têm autorização de uso?
   - Reais → manter com fonte/rastreabilidade.
   - Ilustrativos → rotular consistentemente como "cenário ilustrativo"
     (a página já usa esse padrão em outros blocos).
2. Qual o número oficial de agentes (20+? 24?) — padronizar em toda a página.
3. Quais certificações são fato ("READY" ≠ certificado) e quais claims de
   performance (50ms, 15min, 5min) são verificáveis.
4. Alinhar claims de conectores com os status reais: sync "em tempo real"
   só pode citar conectores "Em Produção" (Bitrix24, WhatsApp, VoiceHub,
   Webhooks) até HubSpot/Salesforce/Pipedrive saírem de homologação.

## Teste esperado

- Toda afirmação quantitativa na página tem fonte real ou rótulo de ilustração.
- Nenhuma contradição entre claim e status de integração.
- Número de agentes consistente em hero, KPIs, login e Command Center.

## Contexto adicional

- Risco: propaganda enganosa / CDC art. 37 + dano de credibilidade com
  comprador enterprise que verifica referências.
- Enquanto a decisão não chega, prioridade é não piorar: não adicionar novos
  claims numéricos.
