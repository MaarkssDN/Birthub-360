# Relatório de Auditoria de Dívidas Técnicas — Agente 09

## IDENTIFICAÇÃO
- **ID do agente:** 09
- **Nome oficial:** Mobile e PWA (Capacitor/Android/iOS)
- **Especialização:** Aplicativos nativos e híbridos via Capacitor, Progressive Web App (PWA), Service Worker, offline caching, deep links, push notifications móveis e responsividade mobile
- **Responsabilidades:** Propriedade exclusiva do diretório `android/**` e do arquivo de configuração `capacitor.config.ts` (`AGENTS.md` §15), garantia da experiência mobile no CRM, gestão de permissões nativas de dispositivo (câmera, microfone, biometria) e sincronização offline-first.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `android/**`, `capacitor.config.ts`, `src/features/mobile/**`, `public/manifest.json`, `src/service-worker.ts`, scripts de sincronização móvel.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Projeto Android nativo (Gradle, Manifest, Assets), configuração do Capacitor, Service Worker e cache PWA, navegação responsiva mobile drawer.
- **Arquivos relevantes:**
  - `capacitor.config.ts` (configuração do bridge móvel)
  - `android/app/src/main/AndroidManifest.xml` (permissões e esquemas de deep link)
  - `public/manifest.json` (metadados do PWA)
  - `src/features/mobile/**`
  - `src/service-worker.ts`
  - `scripts/pwa/verify-precache.ts`
- **Serviços existentes:** Gerenciador de sincronização offline, listener de conectividade de rede, bridge de biometria e armazenamento seguro.
- **APIs e integrações:** Capacitor Core, Capacitor Android Plugins, Workbox PWA API, Push Notifications API.
- **Funcionalidades implementadas:** Acesso ao CRM em smartphones, notificações locais, discagem direta de telefones do lead, gaveta de navegação mobile com suporte a Safe Area e gestos de toque.
- **Testes encontrados:** `tests/unit/mobile/sync.test.ts`, `scripts/pwa/verify-precache.ts`.
- **Dependências externas:** `@capacitor/core`, `@capacitor/android`, `workbox-window`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-09-001 (DEBT-UX-001)
- **Título:** Cache do Service Worker armazena dados de CRM em CacheStorage local sem particionamento por identidade
- **Categoria:** Segurança, Privacidade e Mobile
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/service-worker.ts` (linhas 45-78), `src/features/mobile/services/offlineCache.ts`
- **Evidência:** O Service Worker utiliza estratégias `StaleWhileRevalidate` e `CacheFirst` gravando respostas JSON de requisições `/api/crm/leads` e `/api/contacts` em um cache nomeado globalmente `crm-data-cache`. O nome do cache não inclui o identificador do usuário (`userId`) nem da organização (`organizationId`).
- **Problema:** Em dispositivos móveis compartilhados (como tablets de uso comum da equipe comercial ou celulares de plantão de vendedores), se o Usuário A efetua logout e o Usuário B efetua login, as requisições em modo offline ou com conexão instável retornam imediatamente dados cacheados pertencentes ao Usuário A.
- **Causa raiz:** O Service Worker foi configurado como um cache HTTP padrão agnóstico ao estado da sessão autenticada.
- **Impacto:** Risco crítico de exposição indevida de dados de clientes e leads entre usuários de diferentes equipes ou organizações no mesmo aparelho; violação de privacidade e isolamento multi-tenant.
- **Correção necessária:** Purgar imediatamente todos os caches de dados comerciais no evento de logout (`caches.delete('crm-data-cache')`) e particionar os caches dinâmicos incluindo o hash da sessão do usuário autenticado no nome do bucket.
- **Agente proprietário:** 09
- **Agentes dependentes:** 01 (Autenticação e Sessões), 15 (Segurança Aplicada), 21 (LGPD)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** No logout do usuário, 100% dos registros de dados comerciais no CacheStorage e IndexedDB são destruídos; login subsequente com outro usuário inicia com cache limpo.
- **Teste necessário:** Teste automatizado de Service Worker simulando ciclo de login A -> cache -> logout -> login B e verificando o isolamento do CacheStorage.
- **Dependências:** Alinhamento com o serviço de autenticação do Agente 01/15.

### ID: DIV-09-002 (DEBT-MOB-001)
- **Título:** Configuração de build mobile embute URL de fallback apontando para instância legada desativada no Render
- **Categoria:** Configuração e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `capacitor.config.ts` (linhas 15-22), `src/config/mobile.ts` (linhas 8-14)
- **Evidência:** A propriedade `server.url` do `capacitor.config.ts` define como fallback de produção um endereço da nuvem Render (`https://birthhub360-api.onrender.com`), que foi desativado conforme a política de migração para AWS e ambiente local-first.
- **Problema:** Quando o aplicativo mobile nativo falha ao carregar o bundle local ou perde a conexão primária, ele tenta se conectar a um domínio extinto, exibindo tela de erro 502/404 do Render em vez de exibir a tela amigável de modo offline da aplicação.
- **Causa raiz:** Configuração legada mantida no arquivo de build do Capacitor sem atualização para as novas URLs canônicas da infraestrutura AWS/produção.
- **Impacto:** Vendedores que utilizam o aplicativo Android enfrentam telas de erro cruas e inoperância se o servidor primário oscilar.
- **Correção necessária:** Remover a URL legada do Render em `capacitor.config.ts`, configurando o Capacitor para rodar estritamente com os assets empacotados localmente (`bundledWebRuntime`) e apontar a API para o endpoint de produção oficial da AWS com tratamento de fallback offline.
- **Agente proprietário:** 09
- **Agentes dependentes:** 08A (Deploy AWS), 10 (SRE e Domínios)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O aplicativo Android inicializa offline diretamente dos assets empacotados no APK sem efetuar nenhuma requisição para domínios extintos do Render.
- **Teste necessário:** Inspeção do tráfego de rede do APK em emulador Android sem conexão com a internet.
- **Dependências:** Definição do endpoint canônico de produção com o Agente 10.

### ID: DIV-09-003 (DEBT-UX-005)
- **Título:** Esquema de deep links nativos no AndroidManifest.xml diverge das rotas SPA da aplicação web
- **Categoria:** Funcionalidade e Mobile
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `android/app/src/main/AndroidManifest.xml` (linhas 42-65), `src/App.tsx`
- **Evidência:** O `AndroidManifest.xml` mapeia intents de deep link com filtros de caminho antigos (ex.: `/crm/lead-view/:id`, `/leads/details/:id`), enquanto a aplicação web unificou as rotas no padrão `/crm?leadId=:id` e `/leads/:id`.
- **Problema:** Links de oportunidades enviados por WhatsApp, e-mail ou push notifications abrem a tela inicial do aplicativo em vez de abrir diretamente a ficha do lead correspondente.
- **Causa raiz:** Atualização das rotas do React Router no frontend web sem a sincronização correspondente no manifesto nativo do Android.
- **Impacto:** Quebra da experiência de navegação do vendedor em trânsito ao clicar em alertas móveis; aumento do tempo necessário para localizar o cliente.
- **Correção necessária:** Atualizar os `intent-filter` em `AndroidManifest.xml` e no listener de deep link em `src/features/mobile/` para refletir com exatidão a árvore canônica de rotas do React Router.
- **Agente proprietário:** 09
- **Agentes dependentes:** 02 (UX e Rotas)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O comando `adb shell am start -a android.intent.action.VIEW -d "birthhub://crm/lead/123"` abre o app e direciona o usuário imediatamente para o drawer de detalhes do lead 123.
- **Teste necessário:** Teste de deep link via ADB em emulador Android.
- **Dependências:** Alinhamento com Agente 02.

### ID: DIV-09-004 (DEBT-UX-006)
- **Título:** Ícones declarados no manifest.json do PWA não existem fisicamente na pasta public
- **Categoria:** Qualidade e PWA
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `public/manifest.json` (linhas 12-30), pasta `public/icons/**`
- **Evidência:** O manifesto PWA declara ícones para múltiplas resoluções (`icon-192x192.png`, `icon-512x512.png`, `icon-maskable-512x512.png`). No entanto, o arquivo `icon-maskable-512x512.png` não foi encontrado no diretório `public/icons/`.
- **Problema:** A instalação do PWA em dispositivos Android gera ícone com fundo distorcido ou bordas cortadas devido à ausência do formato maskable homologado pelo Google Chrome / Android.
- **Causa raiz:** O arquivo foi referenciado na especificação do manifesto sem a respectiva exportação dos assets gráficos.
- **Impacto:** Auditoria Lighthouse acusa falha no checklist de PWA instalável; apresentação visual degradada na tela inicial de smartphones.
- **Correção necessária:** Exportar o ícone maskable oficial nos padrões da marca Birth Hub 360° em `public/icons/icon-maskable-512x512.png` e validar com o script `verify:pwa-precache`.
- **Agente proprietário:** 09
- **Agentes dependentes:** 11 (Marca e Ativos Institucionais)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** `npm run verify:pwa-precache` e auditoria PWA do Lighthouse passam com 100% de conformidade de ícones.
- **Teste necessário:** Execução de `npm run verify:pwa-precache`.
- **Dependências:** Fornecimento do asset oficial pelo Agente 11.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (aplicativo Android compila via Capacitor e oferece suporte a recursos móveis).
- **Cobertura automatizada de testes:** Média (scripts de precache existem, mas faltam testes automatizados de deep links e Service Worker).
- **Segurança:** Média (degradada pelo risco de compartilhamento de dados no cache PWA entre sessões).
- **Arquitetura:** Alta (separação limpa entre o código web e o wrapper nativo do Capacitor).
- **Confiabilidade:** Média (afetada por URLs de fallback legadas e deep links desalinhados).
- **Observabilidade:** Baixa (falta de telemetria nativa para falhas de renderização em WebView Android).
- **Manutenibilidade:** Alta (estrutura do Android Gradle padronizada).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 identificado.
2. **Segurança e integridade de dados:** Purgar e particionar o CacheStorage do Service Worker no logout (DIV-09-001).
3. **Falhas funcionais:** Sincronizar o mapeamento de deep links no `AndroidManifest.xml` (DIV-09-003).
4. **Confiabilidade:** Remover URLs de instâncias extintas do Render em `capacitor.config.ts` (DIV-09-002).
5. **Testes:** Criar testes de verificação do ciclo de vida do Service Worker.
6. **Arquitetura:** Incluir o ícone maskable oficial no `public/icons/` (DIV-09-004).
7. **Melhorias estruturais:** Adicionar suporte a push notifications nativas via Firebase Cloud Messaging.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 2 Médias, 1 Baixa
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-09-002, DIV-09-003, DIV-09-004)
- **Problemas compartilhados:** 1 (DIV-09-001 compartilhado com 01, 15 e 21)
- **Handoffs necessários:**
  - Handoff para 11: Solicitação do asset gráfico `icon-maskable-512x512.png`.
  - Handoff para 01/15: Hooking de purga do Service Worker no evento global de logout.
- **Riscos mais importantes:** O vazamento de dados cacheados entre logins diferentes no mesmo aparelho constitui risco de privacidade; fallback para servidor extinto causa tela branca em falhas de rede.
- **Recomendação final:** Sanear a lógica de purga do Service Worker e atualizar o `capacitor.config.ts`.
