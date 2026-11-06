De: 15 â€” SeguranÃ§a Aplicada e RotaÃ§Ã£o de Segredos
Para: 09 â€” Mobile
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-09-001 (B-10)
Sprint destino: Onda 5 â€” Frontend, UX, Mobile e Contratos

## Problema
Logout no aplicativo PWA/Mobile nÃ£o limpa o CacheStorage do Service Worker (serviceWorkerRegistration.ts), permitindo visualizaÃ§Ã£o de dados de clientes anteriores offline.

## Arquivo(s) envolvido(s)
- src/serviceWorkerRegistration.ts:80-120
- src/lib/auth.ts:410-435

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-09.md e DIVIDAS-AGENTE-15.md.
- serviceWorkerRegistration.ts armazena respostas de rotas /api/leads em cache offline. Ao deslogar e logar com outro usuÃ¡rio, dados em cache continuam acessÃ­veis se o dispositivo estiver offline.
- ViolaÃ§Ã£o direta de Tenancy e LGPD.

## AlteraÃ§Ã£o necessÃ¡ria
1. Integrar evento de logout no auth.ts para acionar caches.keys() e deletar todos os caches de dados de negÃ³cio da organizaÃ§Ã£o deslogada.
2. Desregistrar ou revalidar Service Worker no logout.

## Teste esperado
- CritÃ©rio de Aceite: ApÃ³s logout, requisiÃ§Ãµes offline Ã s rotas de API retornam 401 e nÃ£o entregam dados do cache.
- Teste PWA: service-worker-logout-cache.spec.ts.

## Contexto adicional
SeguranÃ§a e isolamento de tenancy em dispositivos mÃ³veis.


## Resolucao
- Data: 2026-11-06.
- Implementado PwaCachePurgeService em src/serviceWorkerRegistration.ts realizando purga seletiva de chaves da CacheStorage API e desregistro de Service Worker em evento de logout para eliminar vazamento offline entre tenancies.
- Testes: 	ests/unit/pwa/service-worker-logout-cache.test.ts (1 passa).

