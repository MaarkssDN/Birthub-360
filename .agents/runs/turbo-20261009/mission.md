# Missão Turbo 2026-10-09 — Coordenador 00
Base: e32bad52df6d45bad35433878067d13c768cd1ca / main
Onda: turbo-20261009 / integração preparada em integracao/onda-turbo-20261009
Objetivo: executar o pedido Texto colado.txt no motor existente, preservando autenticação e dados reais.
Suposições: execução local; nenhum deploy/push; chamadas pagas apenas dentro de autorização/orçamento explícitos; serviços ausentes ficam bloqueados com evidência.
Plano: descoberta e baseline → contratos/provedores/UI → testes → revisão independente 24 → aplicação de conteúdo aprovado ao checkout do usuário.
Matriz de propriedade (3 especialistas, 4 slots totais):
- 05 backend: worktree C:/Github/birthub-turbo-05; domain, schemas, services, routes de prospecting e seus testes. Exclui componentes e IA.
- 05 UI, especialista de design: C:/Github/birthub-turbo-ui; componentes prospecting e testes UI somente. Subdomínio delegado pelo coordenador, sem editar contratos.
- 07 IA: C:/Github/birthub-turbo-07; src/lib/ai, server/ai, testes de IA; novo serviço de interpretação restrito a src/lib/ai/turboSearch.ts se necessário. Sem rotas prospecting.
- 00: registros, baseline, configuração local segura e coordenação; sem alteração de schema/package/server.ts sem decisão registrada.
- 24: revisão somente; acionado depois de encerrada a escrita dos especialistas, em slot liberado.
Critérios: comportamento de sucesso/falha e filtros testados; typecheck/lint/build com códigos reais; UI inspecionada; nenhuma credencial no diff; aprovação 24 da revisão exata antes de integrar/declarar pronto.
Não há autorização de produção. Bases nacionais completas e serviços opcionais só serão instalados se compatíveis e necessários; não baixar datasets integrais sem estimativa.
