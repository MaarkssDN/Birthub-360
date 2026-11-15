# Auditoria 11/12 — Marca e Ativos Institucionais / Voz e Telefonia

- **Demanda:** DEM-20261115-001 (auditoria geral orquestrada pelo Agente 00)
- **Agentes:** 11 (Marca e Ativos Institucionais) + 12 (Voz e Telefonia)
- **Data:** 2026-11-15
- **Escopo:** somente leitura. Única escrita: este relatório.
- **Domínios cobertos:** `identidade-visual/**`, `documentacao-aplicacao/**`, `public/brand/**`, `birthub-360-assets/`, `DESIGN.md`, HTMLs de marca na raiz; código de voz/telefonia em `src/features/integrations/birth-voice/`, `src/features/integrations/threecx/`, `src/features/voice*/`, `src/lib/voice-runtime/`, `src/lib/voice-hub/`, `src/lib/queue/coldCall.worker.ts`, `src/features/ai-voice/`, `server.ts` (busca), e streaming de áudio/WebSocket/SSE.

---

## 1. ELOGIOS (com evidência)

### Voz e telefonia — caminhos já endurecidos por auditorias anteriores

1. **Webhook `voice-result` é fail-closed e resistente a replay/forja** — segredo sem fallback hardcoded (responde 503 sem `BIRTH_VOICES_WEBHOOK_SECRET`/`BIRTHHUB360_WEBHOOK_SECRET`), comparação em tempo constante via hash+`timingSafeEqual`, e guarda de replay com timestamp (`voiceResult.webhook.ts:113-149`, `birthVoice.webhook.ts:266-359`). O comentário de cabeçalho documenta os 4 defeitos históricos corrigidos — excelente rastreabilidade.
2. **Sanitização de `recording_url` externo** — `asHttpUrl()` rejeita esquemas não-HTTP(S) antes de persistir/renderizar link clicável, mitigando `javascript:` injection (`voiceResult.webhook.ts:80-92,163`).
3. **Discagem 3CX agora faz chamada HTTP real** com timeout (`AbortController`, 10s), revalidação SSRF imediatamente antes da rede (`assertSafeExternalUrl`) e checagem de opt-out unificado antes de discar (`threecx.service.ts:258-340`). Comentários explicam honestamente que o contrato exato da API do PABX ainda não foi validado contra servidor real — postura correta de "não afirmar sem provar".
4. **Click-to-Call respeita a mesma lista de supressão do SDR de voz** — `isSuppressed` casa por telefone mesmo sem `leadId`, e `email` reforça o casamento do opt-out unificado (`threecx.service.ts:300-320`). "Um número suprimido nunca é discado, por nenhum caminho" está implementado.
5. **Worker de cold call com concorrência 1, dead-letter e agendamento idempotente** — evita discagem dupla por corrida e acúmulo de jobs a cada deploy (`coldCall.worker.ts:24-30, 44-53`).
6. **Ponte SIP↔WebRTC sanitiza transcrição com `redactResidualPii` antes de persistir** e registra retenção LGPD (90 dias) no audit log (`sip-webrtc-bridge.service.ts:221-223, 287`). Divulgação obrigatória de IA + gravação + opt-out está centralizada em `MANDATORY_VOICE_AI_DISCLOSURE` (`sip-webrtc-bridge.service.ts:29-30`).
7. **SSE com drain gracioso** — `gracefulDrain()` envia `server_shutdown` antes de encerrar sockets para reconexão silenciosa em deploys, com fallback local quando Redis está indisponível (`sse.service.ts:136-141` e publicação com fallback em `notifyVoiceQualified`).
8. **Cliente LiveSupervisor trata reconexão honestamente** — estados `connecting/reconnecting/disconnected` explícitos, comentário reconhecendo que a enforcement real deve ser server-side (handoff registrado), nunca confia só no cliente (`LiveSupervisor.tsx:65,124-143,285,476`).

### Marca e ativos

9. **`identidade-visual/README.md` é exemplar** — define ordem de precedência das fontes oficiais (Brandbook → Manual Visual → Manual Produto → Catálogo), lista artefatos, explica como servir localmente e **declara abertamente** que os SVGs mestres contêm cores históricas que divergem dos tokens Neon atuais ("preservados por determinação do usuário") — divergência documentada, não silenciosa.
10. **Espelhamento `identidade-visual/birthhub360/logos/` ↔ `public/brand/` é byte-idêntico** — verificado por `cmp` nos 3 SVGs; não há divergência entre fonte e ativo servido. Existe apenas UMA pasta `birthhub360` (a duplicidade `birthhub360`/`birthhub360` temida no prompt **não existe**).
11. **`index.html` referencia o favicon correto com justificativa** — usa `birthhub360-icone.svg` (não o símbolo completo) abaixo de ~96px porque "a coroa de traços do emblema vira ruído", com comentário apontando para o README de identidade (`index.html`, comentário do `<link rel="icon">`).
12. **`DESIGN.md` é normativo e preciso** — paleta Neon oficial tabulada (dark/light), gradientes de assinatura, trinca tipográfica (Sora/Inter/IBM Plex Mono) e os 4 estados obrigatórios de módulo, com autoridade declarada (`DESIGN.md:1-60`).
13. **Tokens de marca em 3 formatos consistentes** — `birthhub360.css/.json/.ts` + variantes de personagens, consumíveis por qualquer stack (`identidade-visual/birthhub360/tokens/`).

---

## 2. PROPOSTAS DE MELHORORIAS

### Marca
- **P2 — Consolidar versão canônica dos documentos mestres.** Manter um único `DOCUMENTO_MESTRE` vigente na raiz (ou mover versões históricas para `docs/archive/`), com o nome do arquivo indicando explicitamente a versão vigente. Hoje coexistem V4, V4.1, V4.10 e V4_CINEMATIC (~1,4 MB) sem indicação de qual prevalece.
- **P2 — Resolver a divergência de paleta "dourado".** `DESIGN.md` declara Dourado Neon `#FFC107`, mas `src/styles/globals.css:205` documenta "Antique Gold: #D4AF37" e `official-identity.css:71-74` usa `#D4AF37` como `--brand`. Definir com o 03/00 qual é o dourado oficial e alinhar DESIGN.md ↔ CSS ↔ `birthub-360-assets/README.md` (que usa `#2563EB`/`#D4AF37`, paleta pré-Neon).
- **P2 — Auditar e remover fontes órfãs.** `public/fonts/brand/` contém Nunito, Outfit e Plus Jakarta Sans; a tipografia oficial é Sora/Inter/IBM Plex Mono. Verificar referências em `globals.css`/componentes e remover o que for legado (handoff ao 03 se houver consumo).
- **P3 — Avaliar Git LFS para mídia.** `.gitattributes` não cobre `*.mp4`/`*.png`; `documentacao-aplicacao/videos/apresentacao-completa.mp4` (362 KB) e ~2,1 MB de screenshots estão no histórico git. Pequeno hoje, mas o padrão deve preceder o crescimento.
- **P3 — Verificação visual de PII nos screenshots.** `documentacao-aplicacao/imagens/**` contém ~19 PNGs de telas do produto. Não foi possível inspecionar conteúdo visual nesta auditoria — recomendo ao 11 uma passada manual (ou delegar ao 22) confirmando que nenhum print expõe dado real de cliente/credencial, conforme exige o AGENTS.md local.
- **P3 — Limpar HTMLs soltos na raiz.** `blueprint.html`, `agentes-birthhub-360.html`, `input.html` ("Technical Debt Remediation Control Center"), `raw_login.html` (encoding quebrado/mojibake) e `AUDITORIA-COMPLETA-BIRTH-HUB-360.html` são artefatos avulsos; `preview-29.html` é órfão dentro de `identidade-visual/birthhub360/`. Mover para `docs/` ou remover.

### Voz e telefonia
- **P1 — Implementar (ou remover) o servidor socket.io do LiveSupervisor.** O cliente emite `watch_session` e escuta `telemetry_stream`/`intervention_triggered`, mas **não existe nenhum `new Server`/emissor socket.io no backend** (busca em `server.ts` e `src/` não retorna implementação). Hoje a tela fica em "reconnecting" para sempre ou depende de backend inexistente. Decidir: implementar telemetria real (com tenant/RBAC server-side, conforme handoff já citado) ou esconder a feature.
- **P1 — Substituir `InMemoryCallRecordRepository` por persistência real ou remover o serviço.** `PrismaCallRecordRepository extends InMemoryCallRecordRepository` sem override — o nome induz durabilidade que não existe; telemetria/transcrição de chamadas morre no restart. Além disso `CallRecordService` não é referenciado por nenhum consumidor de produção.
- **P1 — Dar resiliência ao `StreamingEngine`.** Adicionar heartbeat/ping-pong, detecção de `ws.readyState` antes de `enqueue`/`send`, tratamento de erro em `ws.send` (hoje pode lançar em buffer cheio — sem backpressure), e não marcar `isSpeech: true` incondicionalmente. Ver `.agents/skills/websocket-stream-debugger`.
- **P1 — Implementar o `TwilioProvider` de verdade ou declará-lo indisponível.** `process()` retorna texto fixo "Conexão SIP/WebRTC via Twilio estabelecida", `checkHealth()` retorna `true` sempre, e `connectStream()` apenas loga o tamanho da mensagem sem decodificar áudio (`TwilioProvider.ts:24-47`). É um stub com cara de provider — risco de falso sucesso se algum `ProviderManager` o selecionar.
- **P1 — Eliminar placeholders fabricados no bridge SIP↔WebRTC.** `recordingUrl` fixo `https://storage.internal.birthub.local/recordings/{id}.opus` (`sip-webrtc-bridge.service.ts:314`), token LiveKit fallback `livekit-jwt-<uuid>` que não é JWT (`:69`), `serverUrl` default `wss://livekit.internal.birthub.local` inventado (`:107`), e `organizationId` default `'default-org'` em `webrtc-channel.service.ts:28`. Sessões em `Map` em memória também se perdem no restart — avaliar persistência/TTL.
- **P1 — `BimodalLiveVoiceService` reporta métricas fabricadas.** Latências hardcoded (TTFA 240ms, p50 380ms, p95 680ms) e `transport: 'webrtc'` declarado sem implementação de transporte real (`bimodalLiveVoice.service.ts:26-33`). Métricas inventadas violam a regra de "sem falso sucesso" — ou medir de verdade, ou marcar como estimativa.
- **P2 — Definir política de gravação/criptografia de chamadas.** O áudio fica na Bland (URL externa) e a transcrição sanitizada vai em texto claro para `Activity.observations`. Não há evidência de criptografia em repouso, controle de acesso dedicado a gravações, ou aplicação efetiva do `audioRetentionDays: 90` citado no audit log. Alinhar com 01/01A (schema/storage) e 21 (LGPD).
- **P2 — Adicionar heartbeat ao SSE.** `sseService.addClient` não envia `: ping` periódico; conexões idle podem ser derrubadas por proxies/LB. O `gracefulDrain` já existe — falta o keepalive.
- **P3 — Testar resiliência real do LiveSupervisor contra backend.** Os testes mockam `socket` — adicionar teste de integração que prove o comportamento quando o servidor não implementa os eventos (hoje o mock esconde a ausência do servidor).

---

## 3. ERROS, FALHAS E DÍVIDAS

### P0
*Nenhum identificado.* Os caminhos críticos de voz (webhooks, discagem, supressão) já foram corrigidos em ondas anteriores com evidência de fail-closed.

### P1
| # | Falha | Evidência |
|---|---|---|
| 1 | **LiveSupervisor sem backend socket.io** — cliente emite `watch_session`, escuta `telemetry_stream`/`intervention_triggered`, mas não há servidor socket.io em lugar nenhum; UI fica eternamente em "reconnecting"/sem dados reais | `src/features/voice-hub/components/LiveSupervisor/LiveSupervisor.tsx:118-143`; ausência de `new Server`/`socket.io` em `server.ts` e `src/` |
| 2 | **`PrismaCallRecordRepository` é in-memory disfarçado** — `extends InMemoryCallRecordRepository` sem persistência; telemetria e transcrição de chamadas perdidas a cada restart; serviço sem consumidor de produção | `src/features/voice-hub/infra/PrismaCallRecordRepository.ts:45`; `src/features/voice-hub/services/callRecord.service.ts:10` |
| 3 | **`StreamingEngine` sem resiliência de stream** — sem heartbeat/reconexão, `isSpeech` hardcoded `true`, payload Twilio não é parseado (todo frame vira áudio), `ws.send` sem proteção de backpressure/erro | `src/lib/voice-runtime/StreamingEngine.ts:17-26, 74-79` |
| 4 | **`TwilioProvider` é stub com falso sucesso** — `process()` retorna "Conexão estabelecida" sem fazer nada, `checkHealth()` sempre `true`, `connectStream()` não decodifica áudio | `src/lib/voice-runtime/providers/TwilioProvider.ts:24-47` |
| 5 | **Placeholders fabricados no bridge SIP↔WebRTC** — `recordingUrl` apontando para domínio interno inexistente, token LiveKit falso, URL de servidor LiveKit inventada, tenant default `'default-org'` | `src/features/voice/sip-webrtc-bridge.service.ts:69,107,314`; `src/features/ai-voice/webrtc-channel.service.ts:28` |
| 6 | **Métricas de voz fabricadas** — latências hardcoded publicadas como telemetria real em `BimodalLiveVoiceService` | `src/features/ai-voice/server/bimodalLiveVoice.service.ts:26-33` |
| 7 | **Sessões de voz 100% em memória** — `activeSessions` (bridge) e `sessions` (bimodal) em `Map`; restart do servidor abandona chamadas ativas sem rastro | `sip-webrtc-bridge.service.ts:55`; `bimodalLiveVoice.service.ts:10` |

### P2
| # | Falha | Evidência |
|---|---|---|
| 8 | **Divergência de paleta de marca** — `DESIGN.md` declara Dourado Neon `#FFC107`, mas `globals.css:205` usa "Antique Gold `#D4AF37`" e `official-identity.css:71-74` o torna `--brand`; `birthub-360-assets/README.md` especifica paleta pré-Neon (`#2563EB`/`#D4AF37`) | `DESIGN.md` (tabela de paleta); `src/styles/globals.css:205`; `src/styles/official-identity.css:71-74`; `birthub-360-assets/README.md` |
| 9 | **Pasta `birthub-360-assets/` órfã e com typo** — nome diverge da marca ("birthub" ≠ "birthhub"), catálogo de cores desatualizado, referenciada apenas em docs internos (`.agents/VISUAL_ARCHITECTURE_INVENTORY.md`, `docs/REMOVED-DOCS.md`), nenhum consumo em código | `birthub-360-assets/`; grep sem referências em `src/`/`public/` |
| 10 | **Fontes órfãs em `public/fonts/brand/`** — Nunito, Outfit, Plus Jakarta Sans servidas sem evidência de uso; tipografia oficial é Sora/Inter/IBM Plex Mono | `public/fonts/brand/`; `DESIGN.md:41-43`; `identidade-visual/MANUAL-DE-IDENTIDADE-VISUAL.html:8` |
| 11 | **Versionamento caótico de documentos mestres** — 4 variantes do DOCUMENTO_MESTRE na raiz (~1,4 MB) sem versão canônica declarada; `DESIGN_SYSTEM_AUDIT_README.md`, `blueprint.html`, `agentes-birthhub-360.html` soltos | raiz do repo (`ls *.html`) |
| 12 | **Transcrição de voz em texto claro em `Activity.observations`** — sanitizada por `redactResidualPii`, mas sem criptografia em repouso nem controle de acesso dedicado; política de retenção de 90 dias existe só como campo de audit log | `sip-webrtc-bridge.service.ts:248-265, 287`; `voiceResult.webhook.ts:244,285` |
| 13 | **SSE sem heartbeat/keepalive** — risco de queda por proxy/LB em conexões idle | `src/features/notifications/sse.service.ts:63-70` (ausência de ping periódico) |

### P3
| # | Falha | Evidência |
|---|---|---|
| 14 | **HTMLs/artefatos avulsos na raiz** — `input.html` (dashboard de tech debt), `raw_login.html` com encoding quebrado (mojibake), `preview-29.html` órfão em `identidade-visual/birthhub360/` | raiz; `identidade-visual/birthhub360/preview-29.html` |
| 15 | **Segunda fonte de logo** — `public/landing/assets/birthhub-logo.svg` fora do pipeline `public/brand/` | `public/landing/assets/birthhub-logo.svg` |
| 16 | **Mídia versionada sem Git LFS** — `.gitattributes` não cobre `*.mp4`/`*.png`; vídeo de apresentação (362 KB) e ~2,1 MB de screenshots no histórico | `.gitattributes`; `documentacao-aplicacao/videos/apresentacao-completa.mp4`; `documentacao-aplicacao/imagens/**` |
| 17 | **PII potencial em screenshots não verificada** — 19 PNGs de telas do produto podem conter dados reais; inspeção visual fora do alcance desta auditoria | `documentacao-aplicacao/imagens/**` |
| 18 | **`public/design-lab/` exposto em produção?** — feature `src/features/design-lab/` referenciada por `src/App.tsx`; confirmar se a rota de design lab deve estar acessível em build de produção | `src/App.tsx`; `src/features/design-lab/DesignLabPage.tsx` |

---

## Notas de escopo e limitações

- Nenhum arquivo de código foi modificado; somente este relatório foi escrito.
- Não foi possível inspecionar visualmente os PNGs de `documentacao-aplicacao/imagens/` (sem OCR/viewer) — item 17 requer verificação manual ou delegação ao Agente 22.
- O contrato real da API de Call Control do 3CX permanece não validado contra PABX real (já documentado em `threecx.service.ts:268-274` e handoff `onda-1/06-para-01-persistencia-3cx.md`).
- Handoffs sugeridos: **para 00** (itens 1, 5, 8, 9 — decisões de produto/arquitetura), **para 01/01A** (itens 2, 12 — persistência/criptografia de telemetria e gravações), **para 03** (itens 8, 10, 15 — tokens/fontes/logo), **para 07** (itens 3, 6 — motor de voz/métricas), **para 16** (item 7 — estado de sessões em memória), **para 21** (item 12 — retenção LGPD de transcrições).
