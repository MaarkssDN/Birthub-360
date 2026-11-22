---
name: capacitor-offline-sync
description: Padrões de desenvolvimento mobile e offline-first com Capacitor e PWA no Birth Hub 360 (Agente 09 - Mobile). Cobre armazenamento local (IndexedDB/RxDB), sincronização em segundo plano, precaching de assets e resiliência offline.
---

# Capacitor & Offline Sync — Agente 09 (Mobile)

## Objetivo
Garantir que os profissionais e consultores que utilizam o aplicativo mobile (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`) ou PWA possam visualizar dados essenciais do CRM, registrar notas e preencher formulários mesmo em locais com conexão instável ou inexistente, com reconciliação transparente ao reconectar.

## Princípios de Arquitetura Offline-First

### 1. Camada de Cache Local (Local State Store)
- Utilize as bibliotecas já instaladas no `package.json`: `rxdb` (`^17.5.0`) e `@tanstack/react-query` (`^5.103.1`) persistido no IndexedDB.
- **Governança de Dependências (`AGENTS.md` §15 e P2):** Não adicione `zustand`, `@capacitor-community/sqlite` ou `@capacitor/network` sem necessidade comprovada e aprovação explícita do Agente 00 para alterar `package.json`.
- Leituras sempre consultam o cache local primeiro (*cache-first* ou *stale-while-revalidate*) para renderização instantânea da interface.

### 2. Fila de Mutações Offline (Outbox Pattern)
- Ações disparadas offline (ex: "Criar Lead", "Atualizar Status", "Adicionar Nota") devem ser salvas em uma coleção local persistente (`outbox_queue` no RxDB/IndexedDB) com um ID local temporário (UUID v4) e timestamp ISO.
- A interface exibe a mutação com indicador visual ("Sincronização pendente").

### 3. Protocolo de Sincronização ao Reconectar
- Ouça eventos nativos de rede do navegador/WebView (`window.addEventListener('online', ...)` / `window.addEventListener('offline', ...)` e `navigator.onLine`).
- Ao detectar internet ativa:
  1. Itere a `outbox_queue` em ordem cronológica.
  2. Envie as requisições com header de idempotência (`X-Idempotency-Key: <local_id>`).
  3. O backend processa e retorna o ID definitivo do banco.
  4. O cliente substitui o ID temporário pelo ID definitivo no cache local e remove o item da fila.

### 4. Tratamento de Conflitos
- Para dados simples: estratégia de "Última escrita vence" (*Last-Write-Wins*) baseada no timestamp do servidor.
- Para registros editados concorrentemente por múltiplos usuários: marque como `CONFLICT` e apresente tela de resolução de conflito para o usuário decidir qual versão manter.

### 5. PWA Precache e Assets
- Valide o script `npm run verify:pwa-precache` antes de cada release.
- Nunca adicione endpoints de API com dados voláteis no precache do Service Worker.
