# P1 Findings Classification

## Security (Agente 15 + Agente 01)
- 1.1.1 Arquivos Sensíveis no Working Tree (.env.test, .npmrc): CORRIGIR AGORA (Agente 15)
- 1.1.2 Segredos Hardcoded (litellm-config.yaml, prisma/schema.prisma, etc): CORRIGIR AGORA (Agente 15)
- 1.1.3 Eval/Dynamic Code (agente-codigo-local/src/components/TerminalDrawer.tsx, scripts/pwa/verify-precache.ts): CORRIGIR COM DEPENDÊNCIA (Validar se é uso real ou mock de teste - Agente 15)

## Database, Tenancy, RLS, LGPD (Agente 01A + Agente 15)
- 1.2.1 Migrations Potencialmente Destrutivas: DECISÃO HUMANA / CORRIGIR COM DEPENDÊNCIA (Agente 01A - Não alterar schemas/migrations fora do ownership. Documentar, criar checklist).

## Arquitetura (Agente 00)
- 1.3.1 Arquivos Monolíticos/Hotspots: CORRIGIR COM DEPENDÊNCIA (Agentes de cada domínio)
