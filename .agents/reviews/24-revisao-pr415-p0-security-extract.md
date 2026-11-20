# Parecer Agente 24 — PR #415

- **Missão/Onda:** extração cirúrgica dos fixes P0 do PR #310 (substituído pelo #368 como fonte canônica da paleta).
- **Autor:** Agente 00 (`agente/00-p0-security-extract-310` → `main`).
- **Auditor:** Agente 24 — Revisão Independente.
- **Revisão auditada:** head `a9b45efcd1b3ac11d799fe361d61f2e64e618d95` (branch `agente/00-p0-security-extract-310`).
- **Data:** 2026-11-19.

## Arquivos do diff (5)

| Arquivo | Mudança |
|---|---|
| `src/bootstrap/frontend.ts` | +35: predicado puro `isBlockedDesignLabPath` + middleware guarda anti-bypass no topo de `mountFrontend` |
| `src/components/ErrorBoundary.tsx` | remove `error.message`/`error.stack` da UI; adiciona botão "Recarregar página" |
| `src/components/ui/sign-in-page.tsx` | remove `console.log` de `formData` (credenciais) |
| `tests/unit/bootstrap/frontend.test.ts` | novo, 104 linhas — testes do predicado e do middleware via supertest |
| `tests/unit/components/ErrorBoundary.app.test.tsx` | novo, 69 linhas — contrato do fallback sem vazamento |

## Verificações realizadas

1. **Diff completo lido** (`gh pr diff 415`): escopo corresponde ao título. O `Landing360.tsx` (deep-link) citado no corpo do PR **não está no diff** — verificado que o fix já entrou em main via commits `b0548734a`/`8b70d65e0`; corpo do PR desatualizado, sem impacto no código. Registro como observação, não achado.
2. **Posicionamento da guarda:** o `app.use` de bloqueio é o primeiro middleware dentro de `mountFrontend` (`server.ts:100`), executando antes de `express.static(public|dist/tools)`, `express.static(public|dist/design-lab)`, `vite.middlewares` e `express.static(distPath)`/SPA fallback. Não existe `express.static`/`sendFile` anterior a `mountFrontend` na cadeia (`grep` em `src/bootstrap/**`, `server.ts`). Correto: cobre dev (Vite `/@fs`, `/public`) e produção (`express.static(distPath)` decodifica `%2F`).
3. **Lógica do predicado:** fail-closed — qualquer segmento `design-lab` (após decode único, case-insensitive) que não seja o prefixo legítimo `/design-lab/` no path cru nem `/src/features/design-lab/` → 404. Encoding malformado mantém raw (downstream rejeita). Casos-limite verificados mentalmente: `/design-lab%2F…`, `/%64esign-lab/…`, double-encoding `/%252F…`, `/DESIGN-LAB/` (match case-insensitive do mount Express → segue para auth, não é bypass), `/design-labfoo` (não toca o asset). Sem falso-negativo identificado; falsos positivos possíveis apenas em paths exóticos que falham fechado (404) — aceitável para P0.
4. **ErrorBoundary:** `componentDidCatch` continua logando via `clientLogger.error` (observabilidade preservada); o estado `error` permanece em memória para debug, só não vaza para a UI. Correto para o achado (vazamento de stack/mensagem em tela).
5. **sign-in-page.tsx:** é componente demo/preview não roteado (header do arquivo); `formData` segue usado pelos inputs controlados — nenhuma variável órfã. `handleSubmit` já era stub; remoção do `console.log` é a mudança inteira. OK.
6. **Testes — não tautológicos:**
   - `frontend.test.ts`: `@vitest-environment node` justificado no comentário (esbuild/jsdom realm). Mocka `vite.createServer` e `authenticateToken`, mas exercita o middleware real de guarda via supertest: verifica 404 para 4 aliases e pass-through (200) para `/design-lab/…` e paths comuns. O mock de `authenticateToken` é declarado e aceitável — a propriedade testada é a guarda, não a auth.
   - `ErrorBoundary.app.test.tsx`: renderiza `Bomb` que lança `Error('segredo-interno-xyz')`, afirma ausência da string na UI, ausência de `<pre>` e presença do botão/reload mockado. Contrato real do fix P0.
   - Lacuna menor (não bloqueante): o branch de produção (`useStaticDist`) não é exercitado — a guarda é branch-independente por estar antes do `if`, então o risco residual é baixo.
7. **Propriedade (§15):** `src/bootstrap/frontend.ts` e `src/components/ErrorBoundary.tsx` (raiz, sem dono explícito → escalável ao 00, que é o autor) OK. `src/components/ui/sign-in-page.tsx` pertence ao domínio do Agente 03 (`ui/`), mas a alteração é remoção de um `console.log` de credenciais — fix de segurança P0 orquestrado pelo 00; mudança de 1 linha, sem tocar estilo/tokens. Aceito como exceção de segurança; registro para ciência do 03.
8. **Tenancy/LGPD:** sem queries, sem dados de tenant. A guarda reduz exposição de assets internos — positivo. Remoção de stack trace reduz vazamento de informação interna. Positivo.
9. **Gates CI (head a9b45ef):** SonarQube PASS, CodeQL (js/ts + python) PASS, Trivy bloqueante PASS, dependency review PASS, secret scan PASS, RLS PASS, Visual Regression PASS, bundle budget PASS. **Único FAIL:** `application gate` → `biome format src` acusa exatamente os 4 arquivos de `src/features/integrations/bitrix/service/` introduzidos pelo PR #432 (quebrou main); o job `build` falha apenas por agregar `APPLICATION_GATE_RESULT=failure`. Falha **pré-existente da base, fora do diff** — evidência: log do job 135894307949 lista somente os 4 arquivos do #432.
10. **Código morto:** nenhum import/variável órfã introduzido. `isBlockedDesignLabPath` é exportado para teste — uso legítimo.

## Achados

- **[ALTO — follow-up, não bloqueia este PR]** A mesma classe de bypass existe para `/tools` (`/public/tools/…`, `/@fs/…tools…`, encoding) — os mounts `/tools` têm o mesmo desenho. O P0 auditado (DEM-20261114-001/003) cobria design-lab; recomendo ao 00 abrir handoff para estender a guarda ou confirmar que `/tools` não contém ativos sensíveis equivalentes. Proprietário sugerido: 00/01.
- **[BAIXO]** Corpo do PR menciona `Landing360.tsx` que não está no diff (já mergeado). Atualizar descrição para evitar confusão em auditorias futuras.
- **[BAIXO]** `sign-in-page.tsx` é demo não roteado com estilo fora da constituição de marca — dívida pré-existente, fora de escopo (P3).

## Veredito

**APROVADO** — para merge em `main`, condicionado a:
1. Merge do PR #454 primeiro (ou rebase + gate verde), pois o `application gate` falhará por formatação da main até lá — falha não causada por este diff.
2. Registro do follow-up sobre `/tools` (achado ALTO acima).

O conteúdo do diff está correto, cirúrgico, testado com evidência real e sem violação de propriedade, tenancy ou LGPD. A aprovação cobre exatamente o head `a9b45ef`; qualquer push novo exige reauditoria.
