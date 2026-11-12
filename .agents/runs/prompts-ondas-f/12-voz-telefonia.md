Você é o Agente 12. Leia AGENTS.md e .agents/prompts/12-voz-telefonia.md antes de planejar.

Agente: 12 — Voz e Telefonia
Onda: F2 (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/12-voicehub-isolamento-e-settings

Objetivo:
Duas frentes: (a) F2 — concluir o isolamento por organização das rotas de voz (/api/voice-hub/*, /api/outbound/*, /api/dialer-3cx/*) que hoje retornam 503 MODULE_NOT_READY via legacyModuleGate, conforme handoff .agents/handoffs/00-para-12-17-voicehub-reactivacao.md; (b) consumir os settings persistidos do pilar 'engagement' (clickToCall, recordCalls, workingHoursOnly) nas rotinas de voz.

Fora de escopo:
- Reescrever voice-hub; mexer em Capacitor/M10.
- Reabrir o gate sem isolamento por tenant comprovado (handoff 01 valida RLS).
- Nav/destinos no painel P08 (Agente 02 reexpõe depois do backend responder 200).

Arquivos sob propriedade:
- src/features/voice-hub/** e rotas /api/voice-hub/*, /api/outbound/*, /api/dialer-3cx/*.

Arquivos de outros donos necessários:
- src/features/settings/domain/pillarSettings.ts + infrastructure/PillarSettingsSettingRepository.ts — SOMENTE LEITURA (dono: 02).
- legacyModuleGate / NAV_HIDDEN_TABS — NÃO editar (dono: 02); reportar prontidão via handoff 12→00.

Suposições:
- Recordings mantêm retenção 90d criptografada do Documento Mestre; workingHoursOnly respeita fuso da org.
- Isolamento = toda query/filtro por organizationId + teste cross-tenant.

Plano:
1. Auditar rotas de voz: quais queries já filtram org, quais não → verificar: lista de pontos sem tenant.
2. Corrigir isolamento + testes cross-tenant → verificar: tenant A não lê dados do tenant B.
3. Consumir settings.pilar.engagement nas ações (clickToCall habilita/desabilita click-to-call; recordCalls controla gravação; workingHoursOnly bloqueia fora do horário) → verificar: teste unit por campo.
4. Reportar ao 00 prontidão para reabrir gate → verificar: handoff 12→00 com evidência.
5. Gates: npx tsc --noEmit, vitest voice-hub, test:architecture → verificar: verde.

Critério de sucesso final:
- Endpoints de voz isolados por tenant com teste; settings de engagement aplicados; parecer do 01/00 sobre reabertura do gate emitido. NÃO reabra o gate sozinho — aguarde autorização.

Entrega:
Relatório de isolamento + settings + handoffs 12→01 (validação RLS), 12→02 (nav), 12→00 (gate).
