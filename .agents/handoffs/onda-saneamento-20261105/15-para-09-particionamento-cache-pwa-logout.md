De: 15 — Segurança Aplicada e Rotação de Segredos
Para: 09 — Mobile
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-09-001 (B-10)
Sprint destino: Onda 5 — Frontend, UX, Mobile e Contratos

## Problema
Logout no aplicativo PWA/Mobile não limpa o CacheStorage do Service Worker (serviceWorkerRegistration.ts), permitindo visualização de dados de clientes anteriores offline.

## Arquivo(s) envolvido(s)
- src/serviceWorkerRegistration.ts:80-120
- src/lib/auth.ts:410-435

## Evidência
Base de auditoria: DIVIDAS-AGENTE-09.md e DIVIDAS-AGENTE-15.md.
- serviceWorkerRegistration.ts armazena respostas de rotas /api/leads em cache offline. Ao deslogar e logar com outro usuário, dados em cache continuam acessíveis se o dispositivo estiver offline.
- Violação direta de Tenancy e LGPD.

## Alteração necessária
1. Integrar evento de logout no auth.ts para acionar caches.keys() e deletar todos os caches de dados de negócio da organização deslogada.
2. Desregistrar ou revalidar Service Worker no logout.

## Teste esperado
- Critério de Aceite: Após logout, requisições offline às rotas de API retornam 401 e não entregam dados do cache.
- Teste PWA: service-worker-logout-cache.spec.ts.

## Contexto adicional
Segurança e isolamento de tenancy em dispositivos móveis.
