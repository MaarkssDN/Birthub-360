- De: Agente 09 (Mobile — Capacitor/Android/iOS)
- Para: Agente 02 (Produto e UX)
- Onda: 8
- Status: resolvido (postponed por decisão do Coordenador sob regra de Scope Freeze do Release RC1)
- Prioridade: alto

## Problema

Vários componentes exportam arquivo gerado no cliente (CSV/XLSX/texto) via `URL.createObjectURL`
de um `Blob` + um `<a download>` sintético (padrão comum de "exportar" no navegador):
`src/components/CrmBoard.tsx`, `src/features/intelligence/components/AutomationGuide.tsx`,
`src/features/intelligence/components/RobustScriptGenerator.tsx`,
`src/features/intelligence/components/SuperagentCreator.tsx`,
`src/features/prospecting/components/ProspectingHub.tsx`.

Verifiquei o código-fonte do `BridgeWebViewClient`/`Bridge` do Capacitor Android
(`node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/`) — nenhum
`WebView.setDownloadListener(...)` é configurado por padrão. Isso tem duas consequências:

1. Para downloads via URL http(s) normal, o WebView chamaria `DownloadListener.onDownloadStart`,
   mas sem um listener registrado, **o clique simplesmente não faz nada visível** (nem erro, nem
   download).
2. Para o padrão usado neste projeto (`blob:` URL gerada inteiramente no JS, sem round-trip de
   rede), a situação é pior: um `DownloadListener` nativo nem teria acesso ao conteúdo do blob —
   ele vive só na realm JS do WebView. Não existe caminho nativo simples de interceptar isso sem
   uma ponte JS↔nativo explícita.

Ou seja: hoje, tocar em "Exportar CSV"/"Exportar" nessas telas dentro do app Android/iOS
empacotado muito provavelmente não produz nenhum arquivo e não mostra nenhum erro ao usuário — o
botão parece funcionar (não trava, não quebra a tela) mas silenciosamente não entrega o arquivo.
Não confirmei isso num dispositivo real (ambiente sem SDK Android/Xcode disponível nesta sessão —
ver relatório da onda), mas o comportamento é bem documentado para Capacitor/WebView em geral e a
ausência de `DownloadListener` no bridge confirma a lacuna estruturalmente.

## Arquivo(s) envolvido(s)

- `src/components/CrmBoard.tsx`
- `src/features/intelligence/components/AutomationGuide.tsx`
- `src/features/intelligence/components/RobustScriptGenerator.tsx`
- `src/features/intelligence/components/SuperagentCreator.tsx`
- `src/features/prospecting/components/ProspectingHub.tsx`
- `package.json` (plugins novos precisariam de aprovação do Coordenador)

## Alteração necessária

Não implementável dentro do escopo do Agente 09 sozinho — a geração do Blob e o gatilho de download
moram em `src/**`. Caminho recomendado (padrão oficial Capacitor para esse cenário):

1. Instalar `@capacitor/filesystem` (grava o conteúdo do Blob, convertido para base64, num
   diretório acessível do app) + `@capacitor/share` (abre a folha de compartilhamento nativa, que
   no Android/iOS inclui "salvar em Arquivos"/"salvar no Drive"/etc.) — ambos exigem aprovação do
   Coordenador para `package.json`.
2. Nos componentes listados acima, detectar `Capacitor.isNativePlatform()` e, nesse caso, usar
   `Filesystem.writeFile` + `Share.share` em vez do padrão `URL.createObjectURL` + `<a download>`
   — sem duplicar a lógica de geração do CSV/XLSX em si (a função que monta o conteúdo continua
   igual), só o mecanismo de entrega ao usuário.
3. Dentro do escopo do Agente 09: uma vez que esse plugin for aprovado e o código em `src/**`
   existir, adiciono a configuração nativa necessária (permissões de storage se aplicável — no
   Android moderno, `@capacitor/filesystem` usando o diretório do próprio app normalmente não
   precisa de `WRITE_EXTERNAL_STORAGE`, mas isso deve ser confirmado na implementação real).

## Teste esperado

Dentro do app Android/iOS empacotado, tocar em "Exportar" nessas telas deve produzir um arquivo
real acessível pelo usuário (via folha de compartilhamento nativa ou app de arquivos) — hoje, o
clique não produz nada visível.

## Contexto adicional

Achado durante o inventário de paridade web × mobile da Onda 8, ao ler o código-fonte do bridge
Android do Capacitor (`@capacitor/android@8.5.0`, instalado via `npm ci` nesta sessão) em busca de
tratamento de download. Documentado aqui em vez de implementado às pressas com uma ponte
JS↔nativo improvisada, que eu não teria como validar num dispositivo real nesta sessão (sem SDK
Android/Xcode disponíveis) — risco de "parecer que funciona" sem funcionar de fato, o que o prompt
do Agente 09 proíbe explicitamente.

## Resolução
(Coordenador): O comportamento está documentado e avaliado. Devido à regra de 'Freeze de escopo' em vigor na Sprint 00, a inclusão de três plugins novos no app (Filesystem e Share) se enquadra como Feature Nova/Paridade e não será feita no release RC1. Fica marcado como resolvido (postponed para Sprint pós-13).

## Resolução — implementação (Agente 02 — 2026-11-14)

A decisão de "postponed para Sprint pós-13" registrada acima foi superada
por autorização explícita do usuário nesta missão (Onda 2), com aprovação
do Agente 00 para as dependências de `package.json`/lockfile.

Implementado:
- Novo helper compartilhado `src/lib/nativeDownload.ts` —
  `downloadBlob(blob, filename)`:
  - Nativo (`Capacitor.isNativePlatform()`): Blob → base64 via `FileReader`
    → `Filesystem.writeFile` em `Directory.Cache` (filename sanitizado,
    sem separadores de caminho/controle — nunca path absoluto) →
    `Share.share({ files: [written.uri] })` usando o `uri` retornado pelo
    `writeFile`. Falhas nativas propagam erro para o chamador (toast).
  - Web: fallback preservado `URL.createObjectURL` + `<a download>` +
    `revokeObjectURL`.
- Dependências adicionadas via `npm install` (versões publicadas >7 dias
  antes, verificado via `npm view`): `@capacitor/filesystem@^8.1.5` e
  `@capacitor/share@^8.0.3`.
- Migração dos pontos de download Blob encontrados (somente o mecanismo de
  entrega; a geração do conteúdo CSV/XLSX não foi duplicada nem alterada):
  - `src/components/CrmBoard.tsx` (export CSV de leads)
  - `src/features/intelligence/components/AutomationGuide.tsx`
  - `src/features/intelligence/components/RobustScriptGenerator.tsx`
  - `src/features/intelligence/components/SuperagentCreator.tsx`
  - `src/features/intelligence/components/UniversalEcosystemPanel.tsx`
    (export do ecossistema)
  - `src/features/prospecting/components/ProspectingHub.tsx` (export de
    prospects CSV/XLSX)

Testes: `src/lib/__tests__/nativeDownload.unit.test.ts` — 4 testes (fallback
web, caminho nativo writeFile+share, sanitização de filename, propagação de
erro). `npx vitest run -c vitest.unit.config.ts` nos dois arquivos novos:
10/10 passando.

Gates: `npx tsc --noEmit` limpo; `npx biome check` nos arquivos tocados sem
erros.

Pendências honestas:
- NÃO validado em dispositivo/emulador real (sem SDK Android/iOS nesta
  sessão). O caminho nativo segue a API documentada dos plugins; recomenda-se
  smoke test no app empacotado — propriedade do Agente 09.
- `Directory.Cache` usa storage interno do app: no Android não requer
  `WRITE_EXTERNAL_STORAGE`; `@capacitor/share` usa intents/folha nativa
  padrão. Nenhuma alteração em `android/` foi necessária nesta entrega —
  se o build nativo exigir merge/registro de permissões, abrir handoff para
  o Agente 09.
- Outros usos de `URL.createObjectURL` avaliados e NÃO migrados por não serem
  "download de arquivo gerado" (pré-visualização de áudio/imagem, abertura de
  URL, CohortAnalysis, commercial intelligence, UnifiedTimelineWidget,
  outbound app): fora do escopo deste handoff, ficam como avaliação futura.
