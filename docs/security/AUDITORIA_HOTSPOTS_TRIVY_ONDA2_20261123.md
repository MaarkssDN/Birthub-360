# AUDITORIA DE SEGURANÇA E ARQUITETURA — ONDA 2
## 11 HOTSPOTS ARQUITETURAIS & 36 WAIVERS TRIVY COM VENCIMENTO EM 29–30/11/2026

**Data:** 2026-11-23  
**Agente Responsável:** Agente 99 — Vito (AppSec, SAST e Secret Scanning)  
**Squad:** Squad 90 (Infraestrutura, SRE e Segurança Aplicada)  
**Demanda:** DEM-20261123-001 (Onda 2 — Slot 1)  
**Worktree:** `wt-99-appsec`  
**Branch:** `agente/99-appsec-onda2-dem20261123`  
**Status da Auditoria:** AUDITADO E CLASSIFICADO (RENOVAÇÃO AUTOMÁTICA PROIBIDA)

---

## 1. RESUMO EXECUTIVO E DIRETIVA DE NÃO-RENOVAÇÃO AUTOMÁTICA

Em cumprimento estrito à determinação do Orquestrador Humano e aos princípios P1-P4 do `AGENTS.md`:

> **REGRA FUNDAMENTAL:** É expressamente PROIBIDA a renovação indiscriminada ou automática de prazos de waivers e exceções arquiteturais.  
> Qualquer prorrogação sem análise técnica individual mascara dívida técnica crítica, fragiliza a postura de segurança e adia refatorações necessárias para a sustentabilidade da plataforma.

Esta auditoria inspecionou exaustivamente:
1. **11 Exceções Arquiteturais de Hotspot** (`docs/architecture/HOTSPOT_EXCEPTIONS.md`) com vencimento em **30/11/2026** (alvo do checkpoint semanal do dia 29/11 às 21h BRT).
2. **36 Entradas de Waiver no Trivy** (`.trivyignore.yaml`) e sua correspondência com `docs/security/AUDIT_WAIVERS.md` e o `package-lock.json` em produção.

---

## 2. AUDITORIA INDIVIDUAL DOS 11 HOTSPOTS ARQUITETURAIS

O gate arquitetural `scripts/architecture/check-hotspots.ts` (`npm run check:hotspots`) impõe um teto rígido de 1000 linhas em arquivos `src/**/*.{ts,tsx}`. Quando a data de `Reavaliar até` expira, o gate **falha sumariamente (`exit 1`)**, impedindo merges em CI.

Abaixo, o diagnóstico individualizado dos 11 arquivos sob exceção ativa:

| # | Arquivo | Limite Excepcional | Tamanho Atual Aprox. | Squad Proprietária | Causa Raiz / Dívida Arquitetural | Risco em 30/11 | Plano de Remediação Técnico | Decisão Humana Exigida |
|---|---|---|---|---|---|---|---|---|
| 1 | `src/features/landing/pages/Landing360.tsx` | 3500 | ~3400 | Squad 30 (Produto & UX — Agente 36/31) | Acúmulo de seções visuais, modais, drawer mobile e parallax em um único arquivo de página. | CI BREAK (`check:hotspots`) | Fatiar seções em `src/features/landing/components/sections/` (Hero, Compliance, Pricing, NavigationDrawer). | Aprovar fatiamento na Onda 3 ou prorrogação com escopo fechado. |
| 2 | `src/features/landing/pages/Landing360Impeccable.tsx` | 1050 | 1021 | Squad 30 (Produto & UX — Agente 36/33) | Reformatação do Biome no PR #220 quebrou linhas longas, cruzando 1000 linhas sem alteração de lógica. | CI BREAK (`check:hotspots`) | Extrair blocos visuais estáticos e subcomponentes de apresentação para componentes dedicados. | Priorizar extração cirúrgica de subcomponentes (< 800 linhas). |
| 3 | `src/features/integrations/bitrix/service/extraction.ts` | 1100 | ~1080 | Squad 50 (Integrações — Agente 52 Lino) | Motor monolítico de paginação, streaming de lotes e extração incremental Bitrix24. | CI BREAK (`check:hotspots`) | Separar cursor pagination, buffer streaming e parse de payload em módulos distintos. | Alocar Agente 52 para split modular na Onda 3. |
| 4 | `src/features/commercial-intelligence/domain/CommercialIntelligence.ts` | 1250 | 1193 | Squad 40 (CRM — Agente 49 Malu) | Catálogo de tipos/interfaces DTO sem código executável. Ultrapassou limite com adição de forecast e attribution. | CI BREAK (`check:hotspots`) | Dividir interfaces por subdomínio (`forecast.types.ts`, `attribution.types.ts`) mantendo barrel export. | Aprovada divisão mecânica de tipos sem risco de runtime. |
| 5 | `src/features/prospecting/outbound/server/routes/leads.routes.ts` | 1500 | 1368 | Squad 40 (CRM — Agente 41 Cadu) | Roteador REST de leads com múltiplos sub-recursos inline que demandam controladores dedicados. | CI BREAK (`check:hotspots`) | Extrair handlers para controllers específicos (`leadExport.controller.ts`, `leadImport.controller.ts`). | Alocar Agente 41 para extração de rotas secundárias. |
| 6 | `src/features/voice-hub/components/design-system/index.tsx` | 1200 | ~1150 | Squad 60 (Voz — Agente 65 Lena) | Catálogo e barrel export agregador de múltiplos componentes visuais de telefonia/áudio. | CI BREAK (`check:hotspots`) | Desmembrar barrel em exportações pontuais ou sub-pastas por categoria (áudio, discador, controles). | Alocar Agente 65 para saneamento de componentes. |
| 7 | `src/features/intelligence/routes/intelligence.routes.ts` | 1100 | ~1060 | Squad 70 (IA & Enxame — Agente 76 Dex) | Rotas agregadas de swarms, prompts, automações e telemetria de agentes em um só arquivo. | CI BREAK (`check:hotspots`) | Fatiar em sub-routers: `swarm.routes.ts`, `eval.routes.ts`, `agent.routes.ts` com montagem no router pai. | Alocar Agente 76 para decomposição de rotas de IA. |
| 8 | `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts` | 1020 | 1016 | Squad 70 (IA & Enxame — Agente 74 Luca) | Formatação de linhas longas ultrapassou 1000 linhas por 16 linhas. Código de enriquecimento B2B. | CI BREAK (`check:hotspots`) | Extrair queries auxiliares e parsers de resposta da Receita/CNPJ para helpers específicos. | Alocar Agente 74 para extração cirúrgica de 50 linhas. |
| 9 | `src/lib/voice-hub/services/workflowRuntimeService.ts` | 1500 | ~1480 | Squad 60 (Voz — Agente 61 Nando) | Motor de execução de fluxos de chamada telefônica (IVR/URAs), gerencia eventos de áudio. | CI BREAK (`check:hotspots`) | Decompor lógica de transição de nós e adapters de TTS/STT em classes de execução separadas. | Alocar Agente 61 para refatoração do motor de IVR. |
| 10 | `src/features/crm/components/LeadDetailDrawer.tsx` | 1100 | 1008 | Squad 40 (CRM — Agente 41 Cadu) | Drawer com abas de detalhes da empresa, contatos, enriquecimento e timeline em um único componente. | CI BREAK (`check:hotspots`) | Extrair cada aba (`CompanyTab`, `ContactsTab`, `TimelineTab`) em componentes filhos isolados. | Alocar Agente 41 para modularização das abas. |
| 11 | `src/features/landing/components/pillars/PillarRegistry.tsx` | 1450 | 1402 | Squad 30 (Produto & UX — Agente 33 Célia) | Registro central de pilares visuais; já foi reduzido de 1773 para 1402 linhas com extração de 3 viewers. | CI BREAK (`check:hotspots`) | Concluir a extração dos 5 viewers restantes para `viewers/` levando o arquivo para < 600 linhas. | Alocar Agente 33 na Onda 3 para extração final. |

---

## 3. AUDITORIA E DESMEMBRAMENTO DOS 36 WAIVERS TRIVY

Em `.trivyignore.yaml`, existem 36 registros (muitos dos quais são duplicatas em maiúsculas/minúsculas devido ao case-sensitivity do Trivy em scans locais vs CI).

Ao cruzar com o `package-lock.json` de produção e `AUDIT_WAIVERS.md`, classificamos as vulnerabilidades em 3 grupos técnicos distintos:

### GRUPO A: Vulnerabilidades Reais em Dependências Diretas de Produção (AÇÃO CRÍTICA)
Estas dependências rodam no runtime de produção e processam dados externos. Exigem mitigação ativa e não podem ser prorrogadas indefinidamente.

1. **`better-auth`** (`GHSA-44JH-23M7-HPCF`, `GHSA-R4XP-PRCW-77QF`, `GHSA-965C-763C-88JM` / IDs lower)
   - **Severidade:** CRITICAL / HIGH
   - **Natureza:** Mecanismo de autenticação e sessão. Riscos de session fixation, CSRF e validação de token.
   - **Mitigação Atual:** O backend do Birth Hub 360 implementa validação de sessão em camadas, verificação de RLS por tenant e rotação de tokens.
   - **Recomendação:** Acompanhar release upstream `>=1.1.x` do better-auth. Não desabilitar o waiver antes da release corretiva sob pena de inviabilizar o login da aplicação.

2. **`dompurify`** (`GHSA-CG2G-XH64-V4Q7`, `GHSA-MRV2-3PQR-J5JR`, `GHSA-C6GR-QVV4-5V3F` / IDs lower)
   - **Severidade:** HIGH / CRITICAL (XSS bypass em nesting de tags)
   - **Natureza:** Sanitizador de HTML usado em renderização de mensagens e e-mails.
   - **Mitigação Atual:** `sanitizeHtml` enforceia restrição adicional de tags e atributos permitidos.
   - **Recomendação:** Testar bump de `dompurify` para versão `>=3.2.0` no próximo ciclo de dependências da Squad 90 (Agente 99).

3. **`nodemailer`** (`GHSA-G57G-F23G-4646`, `GHSA-V53P-9FQP-M79J`, `GHSA-PRGH-XP8R-P3M5` / IDs lower)
   - **Severidade:** HIGH (SMTP command injection via CRLF malformado em campos de cabeçalho)
   - **Natureza:** Envio de e-mails transacionais.
   - **Mitigação Atual:** O helper `emailSanitizer` (auditado na Onda 1) já sanitiza cabeçalhos e rejeita entradas com caracteres `\r` ou `\n`.
   - **Recomendação:** Atualizar `nodemailer` para última minor estável no `package.json`.

---

### GRUPO B: Vulnerabilidades Restritas a Ferramentas de Build, CLI e Testes (RISCO DE RUNTIME NULO)
Estas dependências nunca são carregadas nem executadas no runtime da aplicação em produção (`npm run start:prod` / Docker image final).

1. **`deepmerge-ts` / `CVE-2026-40345` / `GHSA-ggr8-5vv4-36mx`**
   - **Cadeia:** `prisma` → `@prisma/config` → `deepmerge-ts` (< 8.0.0).
   - **Risco Real:** Nulo em runtime. Ocorre durante carregamento de `prisma.config.ts` no CLI de migrations. O fix (`npm audit fix --force`) impõe downgrade destrutivo para Prisma 6.
   - **Decisão:** Manter waiver até que a equipe do Prisma publique release 7.x com `deepmerge-ts >= 8.0.0`.

2. **`effect` / `GHSA-7589-6fvf-x4pw`**
   - **Cadeia:** `prisma` → `@prisma/config` → `effect`.
   - **Risco Real:** Nulo em runtime. CLI do Prisma em tempo de build.
   - **Decisão:** Espelhar oficialmente em `.trivyignore.yaml` e `AUDIT_WAIVERS.md` com prazo de 30 dias.

3. **`picomatch` / `GHSA-FC5Q-39XC-VJPF` / `CVE-2026-112366`**
   - **Cadeia:** `vite`, `vitest`, `rollup`, `knip`, `eslint`.
   - **Risco Real:** Nulo em runtime. Avalia globs estáticos em tempo de desenvolvimento. Vencimento em 17/12/2026.

4. **`brace-expansion`** (`GHSA-Q2HR-2G5M-VWHR`, `GHSA-QHR7-859C-M2P7`, `GHSA-6J4F-FJ2G-MC7P` / IDs lower)
   - **Cadeia:** Dependência transitiva de `minimatch` em ferramentas de build.
   - **Risco Real:** Nulo em runtime.

5. **`@vitest/mocker`** (`GHSA-qxg6-89mg-rqv8`, `GHSA-xp26-3454-mjgp`)
   - **Risco Real:** Test harness dev-only.

---

### GRUPO C: Waivers Obsoletos / Já Saneados no Manifesto Oficial (CANDIDATOS À PODA)
Estes registros constavam em `.trivyignore.yaml` para cobrir lockfiles legados secundários ou versões anteriores que já foram corrigidas no `package-lock.json` raiz:

1. **`source-map-js` / `CVE-2026-93749` / `GHSA-7x8w-g892-f33r`:** Resolvido no `package-lock.json` oficial (`>=1.2.2`).
2. **`undici` / `CVE-2026-84961`, `CVE-2026-19534`, `GHSA-xjj6-f33q-929c`, `GHSA-4qv8-2p9j-2685`, `GHSA-f72v-6w45-q472`:** Resolvido com overrides explícitos no `package.json` (`^6.29.1`, `^7.30.1`, `^8.12.3`).
3. **`re2js` / `CVE-2026-116795`:** Pacote restrito a lockfile secundário em subdiretório de agente.

---

## 4. PLANO DE AÇÃO E RECOMENDAÇÃO DO AGENTE 99

1. **Para os 11 Hotspots:**
   - **Ação Imediata (Onda 2):** Não alterar arbitrariamente os limites nem apagar a documentação. Submeter a presente auditoria para que o Coordenador (Agente 00) e o Orquestrador Humano despachem as Squads proprietárias (Squad 30, 40, 50, 60, 70) para as refatorações na Onda 3.
   - **Proposta de Contingência Formal:** Caso o prazo de 30/11 seja atingido antes do merge das refatorações, propor extensão única e justificada de 14 dias (até 14/12/2026) **condicionada à abertura de branches de refatoração para os 5 maiores hotspots** (`Landing360.tsx`, `leads.routes.ts`, `workflowRuntimeService.ts`, `PillarRegistry.tsx`, `extraction.ts`).

2. **Para os 36 Waivers Trivy:**
   - **Poda Segura:** Os waivers de pacotes já corrigidos no `package-lock.json` (Grupo C) poderão ser removidos do `.trivyignore.yaml` após confirmação de scan limpo, reduzindo a dívida aparente de waivers de 36 para ~18.
   - **Isolamento de Risco de Produção:** Para o Grupo B (Prisma CLI / Vitest / Picomatch), manter a classificação estrita de ferramenta de build (sem impacto em produção).
   - **Ação em Produção (Grupo A):** Priorizar PR de bump não-disruptivo de `nodemailer` e `dompurify` na esteira de segurança da Squad 90.

---
**Agente 99 — Vito**  
*Auditoria AppSec concluída em conformidade com o AGENTS.md §2 e §15.*
