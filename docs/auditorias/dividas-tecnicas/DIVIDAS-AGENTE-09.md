# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 09
- **Nome oficial:** Mobile (Capacitor/Android) Specialist
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável pelo empacotamento mobile da plataforma via Capacitor e pela paridade funcional entre o app Android e a aplicação web, sem duplicar lógica de negócio.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Domínio abrangente definido no prompt

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** Domínio abrangente definido no prompt
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-UX-001
**Título:** Cache PWA de CRM não é particionado por identidade autenticada
- **Categoria:** Mobile e PWA
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** vite.config.ts (linhas 61-66), src/contexts/AuthContext.tsx (linhas 118-128)
- **Evidência:** vite.config.ts (linhas 61-66), src/contexts/AuthContext.tsx (linhas 118-128)
- **Problema:** Configuração StaleWhileRevalidate guarda respostas CRM por origem/URL no mesmo cache; logout não remove o conteúdo.
- **Causa raiz:** Cache de respostas autenticadas tratado como cache público de assets.
- **Impacto:** Em navegador compartilhado, resposta antiga pode ser servida antes da resposta da nova sessão; risco de confidencialidade e de mostrar informação obsoleta.
- **Correção necessária:** Evitar cache SW de dados autenticados ou particionar e invalidar explicitamente por sessão/tenant.
- **Agente proprietário:** 09
- **Agentes dependentes:** 02, 09 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P1
- **Critério de aceite:** Usuário B não recebe dados de A ao trocar sessão online/offline; estado stale é explícito.
- **Teste necessário:** Duas contas e organizações sintéticas; mesma URL; logout/login; offline; verificar CacheStorage e corpo retornado.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento

### ID: DEBT-MOB-001
**Título:** Build mobile padrão embute URL fallback do Render documentado como desativado
- **Categoria:** Configuração
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** capacitor.config.ts (linhas 38-46), .github/workflows/android-build.yml (linhas 65-75), .github/work
- **Evidência:** capacitor.config.ts (linhas 38-46), .github/workflows/android-build.yml (linhas 65-75), .github/workflows/ios-build.yml (linhas 58-66)
- **Problema:** Em capacitor.config.ts:41, a constante PRODUCTION_URL utiliza como fallback o endereço antigo do Render, que o próprio comentário e docs/deploy/README.md:16 declaram desativado. Os workflows android-build.yml e ios-build.yml executam 'npx cap sync' sem injetar CAPACITOR_SERVER_URL.
- **Causa raiz:** Transição para arquitetura Local-First sem atualização do fallback mobile e das variáveis de CI Android/iOS.
- **Impacto:** Artefatos APK/IPA gerados pelos workflows padrão tentarão conectar a um backend desativado caso distribuídos.
- **Correção necessária:** Exigir CAPACITOR_SERVER_URL explícita nos workflows de build mobile (falhando fast se ausente em release) e atualizar capacitor.config.ts após decisão de endpoint.
- **Agente proprietário:** 09
- **Agentes dependentes:** 09, 08, 10, 00 Definição do endpoint HTTPS definitivo pelo Agente 00 e Agente 10
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Workflow mobile falha se CAPACITOR_SERVER_URL não for fornecida ou sincroniza com o endpoint HTTPS ativo validado.
- **Teste necessário:** Validação estática da configuração gerada pelo cap sync com variável de ambiente controlada
- **Dependências:** Definição do endpoint HTTPS definitivo pelo Agente 00 e Agente 10

### ID: DEBT-UX-005
**Título:** Deep links nativos Android divergem do catálogo de rotas web
- **Categoria:** Mobile e PWA
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java (linhas 55-65), src/App.ts
- **Evidência:** android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java (linhas 55-65), src/App.tsx (linhas 460-460), src/lib/navigationBus.ts (linhas 67-67)
- **Problema:** Comparação executada de listas: nativeOnly sdr-diagnostic-joao; webOnly inclui sdr-diagnostic, forecast, metas, signals-risks e outros destinos existentes.
- **Causa raiz:** Espelho manual desatualizado sem gate de paridade.
- **Impacto:** Link válido do diagnóstico é rejeitado nativamente; link com nome antigo é aceito mas rota web redireciona ao dashboard. Outros destinos web ativos não abrem via esquema custom.
- **Correção necessária:** Sincronizar catálogo nativo com os destinos suportados e criar verificação automática de paridade, explicitando módulos desabilitados.
- **Agente proprietário:** 09
- **Agentes dependentes:** 02, 09 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P2
- **Critério de aceite:** Deep link diagnóstico válido abre tela; inválido mostra erro; catálogo de destinos ativos coincide.
- **Teste necessário:** Comparação de sets; dispositivo/emulador para diagnóstico/forecast; destino inválido e usuário sem permissão.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento

### ID: DEBT-UX-006
**Título:** Ícones declarados no manifest PWA não existem em public
- **Categoria:** Mobile e PWA
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** vite.config.ts (linhas 30-40)
- **Evidência:** vite.config.ts (linhas 30-40)
- **Problema:** Inventário executado: public/icons/icon-192.png e icon-512.png ausentes; também favicon.ico/apple-touch-icon.png incluídos em includeAssets ausentes. Há ícone SVG de marca, mas não os PNG referenciados no manifest.
- **Causa raiz:** Manifest não acompanhado por assets versionados ou etapa explícita de geração no script build.
- **Impacto:** Manifest fornece URLs sem artefato correspondente; identidade/instalabilidade do PWA fica comprometida em clientes que exigem esses ícones.
- **Correção necessária:** Gerar/reutilizar os ícones oficiais nos caminhos manifest e verificar existência/tamanho no gate de PWA.
- **Agente proprietário:** 09
- **Agentes dependentes:** 02, 09 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P2
- **Critério de aceite:** Todas URLs do manifest e atalhos resolvem arquivo real com dimensão declarada.
- **Teste necessário:** Existência de public e dist; dimensões192/512; instalação Chromium em origemHTTPS isolada.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento


## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Validada por inferência do número de débitos (relativo ao tamanho do sistema).
- **Cobertura automatizada de testes:** Conforme débitos reportados na plataforma.
- **Segurança:** Riscos levantados nas análises gitleaks e dependency cruiser.
- **Arquitetura:** Complexidade analisada estruturalmente.
- **Confiabilidade:** Otimizações listadas no REMEDIATION_PLAN.

## PLANO DE SANEAMENTO
1. Resolver bloqueadores classificados como Críticos ou P0.
2. Endereçar dívidas relacionadas à exposição de dados.
3. Consertar funcionalidades quebradas/simuladas (P1).
4. Saneamento e Testes adicionais em dívidas médias.

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade confirmada:** 4
- **Riscos mais importantes:** Cache PWA de CRM não é particionado por identidade autenticada; Build mobile padrão embute URL fallback do Render documentado como desativado; Deep links nativos Android divergem do catálogo de rotas web; Ícones declarados no manifest PWA não existem em public
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
