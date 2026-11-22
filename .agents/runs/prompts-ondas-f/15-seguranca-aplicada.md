Você é o Agente 15. Leia AGENTS.md e .agents/prompts/15-seguranca-aplicada.md antes de planejar.

Agente: 15 — Segurança Aplicada e Rotação de Segredos
Onda: F1-consumo-LGPD (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/15-pii-masking-enforcement

Objetivo:
Implementar o enforcement do setting 'ai.piiMasking' (pilar ai, persistido via /api/settings/pillars/ai): quando false→true por org, as saídas/inputs de IA que contenham PII devem ser mascaradas/sanitizadas antes de sair para providers externos. O Agente 07 expõe o flag no contexto da chamada — você define e aplica a política de mascaramento.

Fora de escopo:
- Gateway/model/temperature (Agente 07).
- Schema Prisma; rotas de exclusão/direitos do titular (Agente 21).
- Não logar PII em claro em nenhum momento.

Arquivos sob propriedade:
- Módulos de sanitização/PII existentes (procure piiMasking, sanitize, mask em src/lib e src/features).
- Pode criar src/lib/pii/** se não existir equivalente.

Arquivos de outros donos necessários:
- src/features/settings/domain/pillarSettings.ts — SOMENTE LEITURA (dono: 02).
- Contexto de chamada do gateway IA (handoff 07→15 — ele entrega onde o flag chega).

Suposições:
- piiMasking default true (PILLAR_DEFAULTS.ai).
- Mascaramento preserva utilidade do prompt (ex.: [EMAIL], [PHONE], [CPF/CNPJ]) sem destruir o sentido.
- Aplicar em TODO caminho que envie dados a provider externo; chamadas 100% locais podem pular — documentar a decisão.

Plano:
1. Inventariar pontos de saída de dados para IA externa (gateway, embeddings, Copiloto, roleplay, shadow-copy) → verificar: lista completa.
2. Implementar masker reutilizável + integração nos pontos de saída, lendo piiMasking por org → verificar: teste unit com PII sintética (CPF/email/telefone) mascarada e reversível apenas internamente.
3. Garantir que logs/auditoria não vazem PII → verificar: grep por console.log do payload.
4. Coordenar com 21 para registro de tratamento → handoff.
5. Gates: npx tsc --noEmit, vitest do domínio → verificar: verde.

Critério de sucesso final:
- Com piiMasking=true, nenhum payload a provider externo contém PII em claro (teste com amostra); com false, comportamento anterior preservado e decisão documentada.

Entrega:
Relatório + testes + handoffs 15→21 (LGPD) e 15→08.
