# Onda: Auditoria Landing360 — Índice de Handoffs

Origem: análise ad-hoc do código da landing page (`src/features/landing/pages/Landing360.tsx`,
`src/features/landing/components/**`, rotas `/`, `/welcome`, `/login`) realizada em 2026-11-10.
`npx tsc --noEmit` passa limpo — todos os achados são de produto, dados, UX e código morto,
não de erro de compilação.

## Itens auditados → handoff responsável

| # | Achado | Handoff |
|---|--------|---------|
| 1 | Formulário de lead falso — nenhum dado é enviado; tela de sucesso mente | `auditoria-para-02-form-lead-fake.md` + `02-para-01-endpoint-captura-lead.md` |
| 2 | CTA "Abrir Google Agenda" aponta para calendar.google.com genérico | `auditoria-para-02-form-lead-fake.md` |
| 3 | Provas sociais e métricas fabricadas sob "RESULTADOS REAIS COMPROVADOS" | `auditoria-para-02-verdade-no-copy.md` |
| 4 | Claims de sync em tempo real com CRMs que estão "Em Homologação" | `auditoria-para-02-verdade-no-copy.md` |
| 5 | Escassez falsa hardcoded ("4 vagas nesta semana") | `auditoria-para-02-verdade-no-copy.md` |
| 6 | `RoiSimulatorModal` não recebe `variant` (telemetria A/B corrompida) + "34% comprovada" inventada | `auditoria-para-02-bugs-funcionais.md` |
| 7 | Dock de experimento A/B duplicado no footer | `auditoria-para-02-bugs-funcionais.md` |
| 8 | Variante C aceita via URL/sessionStorage mas sem UI e cai no copy da A | `auditoria-para-02-bugs-funcionais.md` |
| 9 | State `email` compartilhado entre login e domínio SSO | `auditoria-para-02-bugs-funcionais.md` |
| 10 | Consentimento LGPD pré-marcado (opt-in inválido) | `02-para-21-validacao-consentimento-lgpd.md` |
| 11 | "20+ agentes" vs KPI "24 + Supervisor" — números divergentes | `auditoria-para-02-verdade-no-copy.md` |
| 12 | Superfícies de debug em produção (`?mode=luxury`, `?variant=C`) | `auditoria-para-02-bugs-funcionais.md` |
| 13 | ~2.000+ linhas de código morto (8 arquivos + 2 CSS) | `auditoria-para-02-limpeza-deadcode.md` |
| 14 | 11 imports lucide não usados | `auditoria-para-02-limpeza-deadcode.md` |
| 15 | Peso da página: ~8.5k linhas CSS, FX contínuos, custom cursor | `auditoria-para-02-limpeza-deadcode.md` |
| 16 | Mobile sem navegação (topnav some <720px, sem hamburger) | `auditoria-para-02-ux-mobile-a11y.md` |
| 17 | Ícones do Command Center são glifos unicode (risco de tofu) | `auditoria-para-02-ux-mobile-a11y.md` |
| 18 | Footer sem link para `/terms`; colunas com spans mortos | `auditoria-para-02-ux-mobile-a11y.md` |
| 19 | Medidor de força de senha visível também no modo signin | `auditoria-para-02-bugs-funcionais.md` |
| 20 | Claims sem lastro: 3.8x, "15 min", "5 min setup", "50ms", "SOC-2/ISO READY" | `auditoria-para-02-verdade-no-copy.md` |
| 21 | Scroll-reveal re-executa ao alternar viewMode (flicker) | `auditoria-para-02-bugs-funcionais.md` |
| 22 | Emojis em UI premium (🔥 urgency, 🧪 dock A/B, ✓, 🔒) | `auditoria-para-02-ux-mobile-a11y.md` |

## Dependências

- Item 1 depende do endpoint do Agente 01 (`02-para-01-endpoint-captura-lead.md`) —
  o 02 pode implementar a UI com fallback, mas a captura real só fecha com o endpoint.
- Item 10 depende de validação do Agente 21 antes do merge.
- ~~Itens 3, 4, 5, 11, 20 dependem de decisão de produto~~ — **DECIDIDO
  (2026-11-11)**: fallback aprovado é rotular como ilustrativo. Ver seção
  "Decisão" em `auditoria-para-02-verdade-no-copy.md`. Resta apenas confirmação
  pontual do número oficial de agentes e certificações.
- Revisão final obrigatória: Agente 24 após a integração.

## Status da onda

EM_EXECUCAO — decisão de negócio registrada (rotular como ilustrativo);
aguardando despacho dos handoffs pelo Coordenador (00).
