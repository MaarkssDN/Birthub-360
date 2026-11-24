De: 11 — Marca e Ativos Institucionais
Para: 15 — Segurança Aplicada e Rotação de Segredos
Onda: genesis-brand-system
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: identidade-visual/brand-system/09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md (D10)
Sprint destino: próxima

## Problema

Durante a auditoria forense da Operação Genesis (2026-11-19), foi identificado o arquivo
`05_TOKENS_E_TEMAS/Migracao-BirthHub-2026-10-10_rar__.env` dentro da pasta de trabalho
`C:\Users\Marcelo\Desktop\DOCUMENTOS\IDENTIDADE-VISUAL`. O arquivo **não foi aberto**
(protocolo de segredos) e pode conter credenciais reais versionadas fora do git.

Em 2026-11-22, o diretório foi **localizado em novo caminho**: `C:\DOCUMENTOS\IDENTIDADE-VISUAL`
(raiz do drive C:, não mais em Desktop). O arquivo `.env` foi verificado **sem leitura de
valores** (somente nomes de chaves e comprimentos):

- `05_TOKENS_E_TEMAS/Migracao-BirthHub-2026-10-10_rar__.env` — 7.662 bytes, 211 linhas,
  **161 variáveis atribuídas, ~120 com valores não vazios**, zero placeholders.
- Chaves sensíveis com valores populados em comprimento compatível com segredos reais:
  `DATABASE_URL` (75 chars), `BETTER_AUTH_SECRET` (33), `CREDENTIALS_ENCRYPTION_KEY` (35),
  `PII_BLIND_INDEX_KEY` (35), `STORAGE_ACCESS_KEY_ID` (20), `STORAGE_SECRET_ACCESS_KEY` (40),
  `GOOGLE_MAPS_API_KEY` (39), `APOLLO_API_KEY` (22), `GROQ_API_KEY` (56), `OLLAMA_API_KEY` (32),
  `LITELLM_MASTER_KEY` (15) — e ~100 outras (OPENAI_API_KEY, HUNTER_API_KEY, TAVILY_API_KEY,
  SERPER_API_KEY, CHATWOOT_*, FLOWISE_*, SUPerset_*, VAULT_*, MINIO_*, QDRANT_API_KEY,
  TYPESENSE_API_KEY, SMTP_PASS, BITRIX24_WEBHOOK_URL, BIRTH_VOICES_API_KEY, etc.).

**Conclusão preliminar:** trata-se quase certamente de um export real de ambiente
(produção/staging) guardado em pasta solta fora do git. Risco: se essa pasta for
compartilhada, sincronizada (OneDrive/Drive) ou commitada acidentalmente, ~40+ segredos
vazariam. A verificação de valores e eventual rotação cabem ao Agente 15.

## Arquivo(s) envolvido(s)

- `C:\Users\Marcelo\Desktop\DOCUMENTOS\IDENTIDADE-VISUAL\05_TOKENS_E_TEMAS\Migracao-BirthHub-2026-10-10_rar__.env` (caminho original, hoje inacessível)
- Contexto: `identidade-visual/brand-system/00-GOVERNANCA/inventario-de-fontes.md`, `00-GOVERNANCA/relatorio-forense.md`

## Evidência

- Inventário da Fonte A (445 arquivos) catalogou o `.env` por nome/extensão, sem leitura de conteúdo.
- `find C:/Users/Marcelo -maxdepth 5 -iname "IDENTIDADE-VISUAL"` (2026-11-22) retornou apenas
  `identidade-visual` dentro de repos — a pasta de trabalho externa não foi encontrada.

## Alteração necessária

1. ~~Localizar a pasta~~ — **localizada**: `C:\DOCUMENTOS\IDENTIDADE-VISUAL` (2026-11-22).
2. Confirmar se os valores do `.env` são credenciais reais (comparar com `.env` do repo / Infisical
   sem copiar valores para logs).
3. Se reais: rotacionar as credenciais expostas (prioridade: DATABASE_URL, BETTER_AUTH_SECRET,
   CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, STORAGE_*, APIs de IA, webhooks Bitrix/Chatwoot)
   e higienizar/mover o arquivo para local seguro fora de sincronização.
4. Verificar se `C:\DOCUMENTOS` está sob sincronização (OneDrive/Drive) ou versionamento.
5. Registrar parecer em `.agents/reviews/` ou `.agents/handoffs/` conforme protocolo.

## Teste esperado

- Confirmação (com evidência sanitizada) de que nenhum segredo real permanece em disco ou histórico.
- Nenhum valor de segredo copiado para documentos ou logs.

## Contexto adicional

O restante da biblioteca `identidade-visual/brand-system/` está íntegra no repo e não depende
desse diretório externo — apenas a verificação de segurança fica bloqueada pela ausência do caminho.
